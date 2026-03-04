"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@repo/auth";
import { motion, AnimatePresence } from "framer-motion";
import ManageMembersModal from "@/components/ManageMembersModal";
import { authService } from "@/lib/auth";
import { usePreferences, THEME_TOKENS, ACCENT_PALETTES } from "@/lib/preferences";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const WHITEBOARD_URL = process.env.NEXT_PUBLIC_WHITEBOARD_URL || "http://localhost:5173";

// ─── Gradient palette for board thumbnails ───────────────────────────────────
const BOARD_GRADIENTS = [
  "from-violet-500 via-purple-600 to-indigo-700",
  "from-pink-400 via-rose-500 to-purple-600",
  "from-orange-400 via-red-500 to-rose-600",
  "from-cyan-400 via-blue-500 to-indigo-600",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-yellow-400 via-orange-500 to-red-500",
  "from-fuchsia-400 via-pink-500 to-rose-600",
  "from-sky-400 via-blue-500 to-violet-600",
];

function getBoardGradient(id: string): string {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return BOARD_GRADIENTS[hash % BOARD_GRADIENTS.length];
}

function BoardThumbnail({ board, onClick }: { board: WhiteboardItem; onClick: () => void }) {
  const gradient = getBoardGradient(board.id);
  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative cursor-pointer rounded-2xl overflow-hidden bg-linear-to-br ${gradient} shrink-0 w-32 h-24 sm:w-36 sm:h-28 group`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl sm:text-3xl font-black text-white/25 select-none">{board.title.slice(0, 2).toUpperCase()}</span>
      </div>
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 sm:px-3 sm:py-2 bg-linear-to-t from-black/60 to-transparent">
        <p className="text-white text-[11px] sm:text-xs font-semibold truncate">{board.title}</p>
      </div>
    </motion.div>
  );
}

async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // If the access token is already expired or about to expire, refresh it
  // proactively *before* making the request.  This avoids the expensive and
  // rate-limit-prone  401 → refresh → retry  round-trip.
  if (authService.isAccessTokenExpired()) {
    try { await authService.refreshToken(); } catch { /* will surface as 401 below */ }
  }

  const token = authService.getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  let res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    // Token was rejected even after a proactive refresh (race condition or
    // the refresh itself failed).  Try once more.
    try {
      await authService.refreshToken();
      const newToken = authService.getAccessToken();
      res = await fetch(url, { ...options, headers: { ...headers, ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}) } });
    } catch { /* ignore — handled below */ }

    // If we still get 401 after the retry, the refresh token is revoked or
    // expired.  Wipe the session — this fires 'auth:session-cleared' which
    // AuthProvider catches → setUser(null) → isAuthenticated = false → the
    // dashboard auth guard redirects via router.push("/login").
    // We do NOT use window.location.href here because that causes a full-page
    // reload; with tokens still in localStorage the login page would instantly
    // redirect back to dashboard, creating an infinite loop.
    if (res.status === 401) {
      authService.clearSession();
    }
  }
  return res;
}

interface WhiteboardItem {
  id: string;
  roomCode: string;
  title: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  permission: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  permission: string;
  whiteboardId: string;
  whiteboardTitle: string;
  createdAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, isAuthenticated, logout: contextLogout } = useAuth();
  const { prefs } = usePreferences();
  const T = THEME_TOKENS[prefs.theme];
  const A = ACCENT_PALETTES[prefs.accentColor];
  const [whiteboards, setWhiteboards] = useState<WhiteboardItem[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [managingWhiteboard, setManagingWhiteboard] = useState<WhiteboardItem | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "owned" | "shared">("all");
  const [navActive, setNavActive] = useState<"boards" | "recent" | "starred" | "people">("boards");
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"updated" | "created" | "name">("updated");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"popular" | "latest">("popular");
  const boardsGridRef = useRef<HTMLDivElement>(null);
  const thumbsScrollRef = useRef<HTMLDivElement>(null);
  const [thumbsCanScrollLeft, setThumbsCanScrollLeft] = useState(false);
  const [thumbsCanScrollRight, setThumbsCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileRightSidebarOpen, setMobileRightSidebarOpen] = useState(false);

  const updateThumbsScroll = () => {
    const el = thumbsScrollRef.current;
    if (!el) return;
    setThumbsCanScrollLeft(el.scrollLeft > 4);
    setThumbsCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    
    // Update active dot based on scroll position
    const scrollPercent = el.scrollLeft / (el.scrollWidth - el.clientWidth);
    const totalDots = Math.ceil(el.scrollWidth / el.clientWidth);
    setActiveDotIndex(Math.min(Math.floor(scrollPercent * totalDots), totalDots - 1));
  };

  const scrollThumbs = (dir: "left" | "right") => {
    const el = thumbsScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 200 : -200, behavior: "smooth" });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = thumbsScrollRef.current;
    if (!el) return;
    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeft(el.scrollLeft);
    el.style.cursor = "grabbing";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const el = thumbsScrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 2;
    el.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    const el = thumbsScrollRef.current;
    if (el) el.style.cursor = "grab";
  };

  const scrollToDot = (index: number) => {
    const el = thumbsScrollRef.current;
    if (!el) return;
    const scrollAmount = (el.scrollWidth / Math.ceil(el.scrollWidth / el.clientWidth)) * index;
    el.scrollTo({ left: scrollAmount, behavior: "smooth" });
  };

  const getTotalDots = () => {
    const el = thumbsScrollRef.current;
    if (!el) return 1;
    return Math.ceil(el.scrollWidth / el.clientWidth);
  };

  // Calculate unique member count (same user across multiple boards = 1 member)
  const uniqueMemberCount = () => {
    const uniqueUserIds = new Set(teamMembers.map(m => m.userId));
    return uniqueUserIds.size;
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("recent_whiteboards");
      if (stored) setRecentIds(JSON.parse(stored));
      
      const starredStored = localStorage.getItem("starred_whiteboards");
      if (starredStored) setStarredIds(JSON.parse(starredStored));
    } catch { /* ignore */ }
  }, []);

  const trackRecent = (id: string) => {
    setRecentIds(prev => {
      const next = [id, ...prev.filter(x => x !== id)].slice(0, 5);
      localStorage.setItem("recent_whiteboards", JSON.stringify(next));
      return next;
    });
  };

  const toggleStar = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setStarredIds(prev => {
      const isStarred = prev.includes(id);
      const next = isStarred ? prev.filter(x => x !== id) : [id, ...prev];
      localStorage.setItem("starred_whiteboards", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const fetchWhiteboards = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await apiFetch(`${API_URL}/api/collab-whiteboard`);
        if (res.ok) setWhiteboards(await res.json());
        // Do NOT call contextLogout() here on 401.  A 401 from the boards
        // endpoint means the access token expired and the refresh may have
        // been rate-limited — it does NOT mean the user's session is invalid.
        // The auth guard useEffect handles real session expiry.
      } catch { /* ignore */ }
      finally { setLoadingBoards(false); }
    };
    if (isAuthenticated) fetchWhiteboards();
  }, [isAuthenticated]);

  // Fetch all team members across all whiteboards
  const fetchAllMembers = async () => {
    if (!isAuthenticated || whiteboards.length === 0) return;
    setLoadingMembers(true);
    try {
      const allMembers: TeamMember[] = [];
      const memberFetches = whiteboards.map(async (wb) => {
        try {
          const res = await apiFetch(`${API_URL}/api/collab-whiteboard/${wb.id}/members`);
          if (res.ok) {
            const members = await res.json();
            return members.map((member: any) => ({
              ...member,
              whiteboardId: wb.id,
              whiteboardTitle: wb.title,
            }));
          }
        } catch { /* ignore */ }
        return [];
      });
      
      const results = await Promise.all(memberFetches);
      results.forEach((members) => allMembers.push(...members));
      
      // Sort by user email for consistent grouping
      allMembers.sort((a, b) => a.userEmail.localeCompare(b.userEmail));
      
      setTeamMembers(allMembers);
    } catch { /* ignore */ }
    finally { setLoadingMembers(false); }
  };

  // Fetch team members when switching to people view or when whiteboards change
  useEffect(() => {
    if (navActive === "people" && whiteboards.length > 0) {
      fetchAllMembers();
    }
  }, [navActive, whiteboards]);

  // Update member permission
  const handleUpdateMemberPermission = async (whiteboardId: string, memberId: string, newPermission: string) => {
    try {
      const res = await apiFetch(
        `${API_URL}/api/collab-whiteboard/${whiteboardId}/members/${memberId}`,
        { method: "PUT", body: JSON.stringify({ permission: newPermission }) }
      );
      if (res.ok) {
        // Update local state
        setTeamMembers((prev) => 
          prev.map((m) => 
            m.id === memberId && m.whiteboardId === whiteboardId
              ? { ...m, permission: newPermission }
              : m
          )
        );
      }
    } catch { /* ignore */ }
  };

  // Remove member from whiteboard
  const handleRemoveMember = async (whiteboardId: string, memberId: string) => {
    if (!confirm("Remove this member from the board?")) return;
    try {
      const res = await apiFetch(
        `${API_URL}/api/collab-whiteboard/${whiteboardId}/members/${memberId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setTeamMembers((prev) => 
          prev.filter((m) => !(m.id === memberId && m.whiteboardId === whiteboardId))
        );
      }
    } catch { /* ignore */ }
  };

  // Group members by whiteboard
  const groupedMembers = teamMembers.reduce((acc, member) => {
    if (!acc[member.whiteboardId]) {
      acc[member.whiteboardId] = {
        whiteboardId: member.whiteboardId,
        whiteboardTitle: member.whiteboardTitle,
        members: [],
      };
    }
    acc[member.whiteboardId].members.push(member);
    return acc;
  }, {} as Record<string, { whiteboardId: string; whiteboardTitle: string; members: TeamMember[] }>);

  const handleCreateWhiteboard = async () => {
    setCreating(true);
    try {
      const res = await apiFetch(`${API_URL}/api/collab-whiteboard`, {
        method: "POST",
        body: JSON.stringify({ title: newTitle || "Untitled Whiteboard" }),
      });
      if (res.ok) {
        const data = await res.json();
        const tokensStr = localStorage.getItem("auth_tokens");
        const tokens = tokensStr ? JSON.parse(tokensStr) : {};
        const { accessToken = "", refreshToken = "", expiresIn = 900, issuedAt = Date.now() } = tokens;
        window.open(
          `${WHITEBOARD_URL}/collab/${data.id}?accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}&expiresIn=${expiresIn}&issuedAt=${issuedAt}`,
          "_blank", "noopener,noreferrer"
        );
        setWhiteboards(prev => [{
          ...data, permission: "owner", memberCount: 0,
          ownerName: user?.name || "", ownerEmail: user?.email || "",
        }, ...prev]);
        setShowCreateInput(false);
        setNewTitle("");
      }
      // Do NOT call contextLogout() on 401 here — a single 401 from the
      // create endpoint just means the token needs refreshing; apiFetch
      // already retried once.  Logging out here triggers a logout → 429
      // cascade.  Real session expiry is handled by the auth guard effect.
    } catch { /* ignore */ }
    finally { setCreating(false); }
  };

  const handleOpenWhiteboard = (wb: WhiteboardItem) => {
    trackRecent(wb.id);
    try {
      const tokensStr = localStorage.getItem("auth_tokens");
      const tokens = tokensStr ? JSON.parse(tokensStr) : {};
      const { accessToken = "", refreshToken = "", expiresIn = 900, issuedAt = Date.now() } = tokens;
      window.open(
        `${WHITEBOARD_URL}/collab/${wb.id}?accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}&expiresIn=${expiresIn}&issuedAt=${issuedAt}`,
        "_blank", "noopener,noreferrer"
      );
    } catch { window.open(`${WHITEBOARD_URL}/collab/${wb.id}`, "_blank", "noopener,noreferrer"); }
  };

  const handleDeleteWhiteboard = async (id: string) => {
    if (!confirm("Delete this whiteboard? This cannot be undone.")) return;
    try {
      const res = await apiFetch(`${API_URL}/api/collab-whiteboard/${id}`, { method: "DELETE" });
      if (res.ok) setWhiteboards(prev => prev.filter(wb => wb.id !== id));
    } catch { /* ignore */ }
  };

  const formatDate = (str: string) => {
    const d = new Date(str), now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000), hours = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  useEffect(() => {
    if (!loadingBoards) setTimeout(updateThumbsScroll, 50);
  }, [loadingBoards, whiteboards]);

  const initials = (s: string) => s?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  // Determine which boards to display based on navActive
  const displayedBoards = (() => {
    if (navActive === "recent") {
      return recentIds
        .map(id => whiteboards.find(w => w.id === id))
        .filter(Boolean) as WhiteboardItem[];
    }
    if (navActive === "starred") {
      return starredIds
        .map(id => whiteboards.find(w => w.id === id))
        .filter(Boolean) as WhiteboardItem[];
    }
    // navActive === "boards" or "people"
    return whiteboards
      .filter(wb => {
        if (activeTab === "owned") return wb.permission === "owner";
        if (activeTab === "shared") return wb.permission !== "owner";
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.title.localeCompare(b.title);
        if (sortBy === "created") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  })();

  const recentBoards = recentIds
    .map(id => whiteboards.find(w => w.id === id))
    .filter(Boolean) as WhiteboardItem[];

  const starredBoards = starredIds
    .map(id => whiteboards.find(w => w.id === id))
    .filter(Boolean) as WhiteboardItem[];

  const totalMembers = whiteboards.reduce((s, w) => s + w.memberCount, 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full animate-spin" style={{ border: `2px solid ${T.border}`, borderTopColor: A.bg }} />
        <span className="text-sm" style={{ color: T.textFaint }}>Loading your workspace&hellip;</span>
      </div>
    </div>
  );

  if (!user) return null;

  const navItems = [
    {
      id: "boards", label: "Boards", icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
        </svg>
      ),
    },
    {
      id: "recent", label: "Recent", icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: "starred", label: "Starred", icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
    {
      id: "people", label: "Team", icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-300" style={{ background: T.bg, color: T.text }}>

      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile right sidebar backdrop */}
      {mobileRightSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileRightSidebarOpen(false)}
        />
      )}

      {/* ─── LEFT SIDEBAR ─────────────────────────────────────────── */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-72 md:w-16 flex flex-col py-5 md:py-5 shrink-0 border-r
          transform transition-transform duration-300 md:transform-none
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ background: T.bgAlt, borderColor: T.borderMuted }}
      >
        {/* Mobile: Profile section / Desktop: Logo */}
        <div className="md:hidden px-5 pb-5 border-b mb-4" style={{ borderColor: T.borderMuted }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg shrink-0"
              style={{ background: `linear-gradient(135deg, ${A.bg}, ${A.bg}99)` }}>
              {user.name ? initials(user.name) : user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: T.text }}>
                {user.name || user.email?.split("@")[0]}
              </p>
              <p className="text-xs truncate" style={{ color: T.textFaint }}>
                {user.email}
              </p>
            </div>
            <button
              onClick={async () => { await contextLogout(); router.push("/login"); setMobileMenuOpen(false); }}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0"
              style={{ background: A.bg, color: "#ffffff" }}
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop: Logo (icon only) */}
        <div className="hidden md:flex w-9 h-9 rounded-xl items-center justify-center mb-4 shadow-lg shrink-0 mx-auto" style={{ background: A.bg, boxShadow: `0 8px 24px ${A.glow}` }}>
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>

        {/* Mobile: Section header / Desktop: hidden */}
        <div className="md:hidden px-5 mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.textFaint }}>Workspace</p>
        </div>

        {/* Nav items */}
        <div className="flex flex-col md:items-center gap-1 flex-1 px-3 md:px-0">
          {navItems.map(item => {
            const isActive = navActive === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setNavActive(item.id as typeof navActive); setMobileMenuOpen(false); }}
                title={item.label}
                className={`
                  w-full md:w-10 h-12 md:h-10 rounded-xl flex items-center gap-3 md:justify-center
                  transition-all duration-200 group relative px-4 md:px-0
                  ${isActive ? 'md:bg-transparent' : 'hover:bg-opacity-50'}
                `}
                style={{
                  // Mobile only: light background with left border
                  ...(isActive && {
                    background: A.light,
                    color: prefs.theme === "light" ? A.bg : A.text,
                    borderLeft: `3px solid ${A.bg}`,
                  }),
                  // Inactive state
                  ...(!isActive && {
                    color: T.textFaint,
                    borderLeft: '3px solid transparent',
                  })
                }}
              >
                {/* Icon */}
                <span className={`w-5 h-5 shrink-0 relative z-10 ${isActive ? 'md:text-white' : ''}`}>
                  {item.icon}
                </span>
                
                {/* Mobile label */}
                <span className="md:hidden text-sm font-medium">{item.label}</span>
                
                {/* Desktop tooltip */}
                <span className="hidden md:block absolute left-full ml-2.5 px-2.5 py-1 text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-xl"
                  style={{ background: T.bgCard, border: `1px solid ${T.border}`, color: T.text }}>
                  {item.label}
                </span>
                
                {/* Desktop active glow effect */}
                {isActive && (
                  <span className="hidden md:block absolute inset-0 rounded-xl pointer-events-none" 
                    style={{ 
                      background: A.bg,
                      boxShadow: `0 8px 16px ${A.glow}`,
                      zIndex: 0,
                    }} 
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile: Other section / Desktop: Bottom icons */}
        <div className="md:hidden px-5 pt-4 border-t" style={{ borderColor: T.borderMuted }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textFaint }}>Other</p>
          <div className="space-y-1">
            <button
              onClick={() => { router.push("/settings"); setMobileMenuOpen(false); }}
              className="w-full h-12 rounded-xl flex items-center gap-3 transition-colors px-4"
              style={{ color: T.textMuted }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.inputBg}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium">Settings</span>
            </button>
          </div>
        </div>

        {/* Desktop only: Bottom icons */}
        <div className="hidden md:flex flex-col items-center gap-2 mt-auto">
          <button
            title="Settings"
            onClick={() => router.push("/settings")}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative"
            style={{ color: T.textFaint }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.textMuted; (e.currentTarget as HTMLElement).style.background = T.inputBg; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.textFaint; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="absolute left-full ml-2.5 px-2.5 py-1 text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50"
              style={{ background: T.bgCard, border: `1px solid ${T.border}`, color: T.text }}>Settings</span>
          </button>

          <button
            onClick={async () => { await contextLogout(); router.push("/login"); }}
            title="Logout"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative"
            style={{ color: T.textFaint }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171"; (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.textFaint; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="absolute left-full ml-2.5 px-2.5 py-1 text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50"
              style={{ background: T.bgCard, border: `1px solid ${T.border}`, color: T.text }}>Logout</span>
          </button>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg mt-1 cursor-default select-none shrink-0"
            style={{ background: `linear-gradient(135deg, ${A.bg}, ${A.bg}99)` }}>
            {user.name ? initials(user.name) : user.email?.charAt(0).toUpperCase()}
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ──────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden h-16 shrink-0 flex items-center justify-between px-5 border-b shadow-sm" style={{ background: T.bgAlt, borderColor: T.borderMuted }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors"
            style={{ color: T.text, background: mobileMenuOpen ? T.inputBg : 'transparent' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: A.bg, boxShadow: `0 4px 12px ${A.glow}` }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="font-bold text-base" style={{ color: T.text }}>CollabBoard</span>
          </div>
          <button
            onClick={() => setMobileRightSidebarOpen(!mobileRightSidebarOpen)}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg"
            style={{ background: `linear-gradient(135deg, ${A.bg}, ${A.bg}99)` }}
          >
            {user.name ? initials(user.name) : user.email?.charAt(0).toUpperCase()}
          </button>
        </div>

        {/* Top nav */}
        <header className="hidden md:flex h-14 shrink-0 items-center justify-between px-6 border-b" style={{ background: T.bg, borderColor: T.borderMuted }}>
          <div className="flex items-center gap-1">
            {[
              { key: "all-boards", label: "All Boards", action: () => { setActiveTab("all"); setNavActive("boards"); } },
              { key: "recent", label: "Recent", action: () => setNavActive("recent") },
              { key: "shared", label: "Shared with me", action: () => { setActiveTab("shared"); setNavActive("boards"); } },
            ].map((t, i) => (
              <button
                key={t.key}
                onClick={t.action}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={i === 0 ? { color: T.text, background: T.inputBg } : { color: T.textFaint }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto dash-scroll px-4 md:px-6 py-4 md:py-5 space-y-4 md:space-y-5">
          {/* Section header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
            <div>
              <h1 className="text-lg md:text-xl font-bold" style={{ color: T.text }}>
                {navActive === "starred" ? "Starred Boards" 
                  : navActive === "recent" ? "Recent Boards" 
                  : navActive === "people" ? "Team Members"
                  : "Find your boards"}
              </h1>
              <p className="text-xs md:text-sm mt-0.5" style={{ color: T.textMuted }}>
                {loadingBoards || (navActive === "people" && loadingMembers) ? "Loading\u2026" 
                  : navActive === "starred" 
                    ? `${starredBoards.length} starred board${starredBoards.length !== 1 ? "s" : ""}` 
                    : navActive === "recent"
                      ? `${recentBoards.length} recent board${recentBoards.length !== 1 ? "s" : ""}`
                      : navActive === "people"
                        ? `${uniqueMemberCount()} unique member${uniqueMemberCount() !== 1 ? "s" : ""} across ${whiteboards.length} board${whiteboards.length !== 1 ? "s" : ""}`
                        : `${whiteboards.length} board${whiteboards.length !== 1 ? "s" : ""}`
                }
              </p>
            </div>
            {navActive === "boards" && (
              <button
                className="text-xs md:text-sm font-medium transition-colors hover:underline self-start md:self-auto"
                style={{ color: prefs.theme === "light" ? A.bg : A.text }}
                onClick={() => {
                  setActiveTab("all");
                  boardsGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                See All ({whiteboards.length})
              </button>
            )}
          </div>

          {/* Filter pills - only show for boards view */}
          {navActive === "boards" && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 dash-scroll">
              {(["popular", "latest"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedFilter(f)}
                  className="px-4 md:px-5 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0"
                  style={selectedFilter === f
                    ? { background: T.text, color: T.bg, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }
                    : { background: T.inputBg, color: T.textMuted, border: `1px solid ${T.border}` }}
                >
                  {f === "popular" ? "Populars" : "Latest"}
                </button>
              ))}
            </div>
          )}

          {/* Horizontal colorful thumbnail strip - only show for boards view */}
          {navActive === "boards" && !loadingBoards && whiteboards.length > 0 && (
            <div className="relative space-y-3">
              <div
                ref={thumbsScrollRef}
                onScroll={updateThumbsScroll}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                className="dash-scroll flex gap-3 overflow-x-auto pb-1 px-1 select-none"
                style={{ scrollbarWidth: "none", cursor: isDragging ? "grabbing" : "grab" }}
              >
                {whiteboards.map(wb => (
                  <BoardThumbnail key={wb.id} board={wb} onClick={() => handleOpenWhiteboard(wb)} />
                ))}
              </div>

              {/* Navigation dots */}
              {getTotalDots() > 1 && (
                <div className="flex items-center justify-center gap-1.5">
                  {Array.from({ length: getTotalDots() }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => scrollToDot(i)}
                      className="transition-all duration-300 rounded-full"
                      style={{
                        width: activeDotIndex === i ? "24px" : "8px",
                        height: "8px",
                        background: activeDotIndex === i ? A.bg : T.border,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Filter + sort row - only show for boards view */}
          {navActive === "boards" && (
            <div ref={boardsGridRef} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 dash-scroll w-full md:w-auto">
                {(["all", "owned", "shared"] as const).map(t => {
                const counts = { all: whiteboards.length, owned: whiteboards.filter(w => w.permission === "owner").length, shared: whiteboards.filter(w => w.permission !== "owner").length };
                const labels = { all: "All", owned: "Owned", shared: "Shared" };
                return (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 whitespace-nowrap shrink-0"
                    style={activeTab === t
                      ? { background: A.light, borderColor: A.ring, color: prefs.theme === "light" ? A.bg : A.text }
                      : { background: T.inputBg, borderColor: T.border, color: T.textMuted }}
                  >
                    {labels[t]}
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={activeTab === t ? { background: `${A.bg}40`, color: prefs.theme === "light" ? A.bg : A.text } : { background: T.inputBg, color: T.textMuted }}>
                      {counts[t]}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="relative flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs shrink-0" style={{ color: T.textMuted }}>Sort by:</span>
              <button
                onClick={() => setSortDropdownOpen(o => !o)}
                className="flex items-center gap-2 text-xs rounded-xl px-3 py-1.5 border transition-colors cursor-pointer flex-1 md:flex-initial justify-between"
                style={{
                  background: sortDropdownOpen ? A.light : T.inputBg,
                  borderColor: sortDropdownOpen ? A.ring : T.border,
                  color: T.textMuted,
                }}
              >
                {{ updated: "Most Recent", created: "Date Created", name: "Name (A\u2013Z)" }[sortBy]}
                <svg
                  className="w-3.5 h-3.5 transition-transform"
                  style={{ transform: sortDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", color: T.textMuted }}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {sortDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortDropdownOpen(false)} />
                  <div
                    className="absolute right-0 top-full mt-1.5 z-20 rounded-2xl overflow-hidden w-full md:w-auto"
                    style={{
                      minWidth: 160,
                      background: T.bgCard,
                      backdropFilter: "blur(24px)",
                      WebkitBackdropFilter: "blur(24px)",
                      border: `1px solid ${T.border}`,
                      boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
                    }}
                  >
                    {([
                      { value: "updated", label: "Most Recent" },
                      { value: "created", label: "Date Created" },
                      { value: "name",    label: "Name (A\u2013Z)" },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setSortDropdownOpen(false); }}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs transition-colors"
                        style={{
                          color: sortBy === opt.value ? A.text : T.textMuted,
                          background: sortBy === opt.value ? A.light : "transparent",
                        }}
                        onMouseEnter={e => { if (sortBy !== opt.value) (e.currentTarget as HTMLElement).style.background = T.inputBg; }}
                        onMouseLeave={e => { if (sortBy !== opt.value) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: sortBy === opt.value ? A.bg : "transparent", border: sortBy === opt.value ? "none" : `1px solid ${T.border}` }}
                        />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          )}

          {/* Board cards OR Team members view */}
          <AnimatePresence mode="wait">
            {navActive === "people" ? (
              // Team Members View
              loadingMembers ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-7 h-7 border-2 border-violet-900 border-t-violet-500 rounded-full animate-spin" />
                </div>
              ) : teamMembers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-center py-16 rounded-2xl border border-dashed"
                  style={{ borderColor: T.border }}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border" style={{ background: T.inputBg, borderColor: T.border }}>
                    <svg className="w-7 h-7" style={{ color: T.textFaint }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="font-semibold" style={{ color: T.textMuted }}>
                    No team members yet
                  </p>
                  <p className="text-sm mt-1" style={{ color: T.textFaint }}>
                    Invite collaborators to your boards to see them here
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-4 pb-4">
                  {Object.values(groupedMembers).map((group) => {
                    const gradient = getBoardGradient(group.whiteboardId);
                    return (
                      <motion.div
                        key={group.whiteboardId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border overflow-hidden"
                        style={{ background: T.bgCard, borderColor: T.border }}
                      >
                        {/* Whiteboard header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 md:p-4 border-b" style={{ borderColor: T.border }}>
                          <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
                            <div
                              className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-md`}
                            >
                              <span className="text-white text-xs md:text-sm font-black">
                                {group.whiteboardTitle.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm md:text-base font-bold truncate" style={{ color: T.text }}>
                                {group.whiteboardTitle}
                              </h3>
                              <p className="text-[11px] md:text-xs mt-0.5" style={{ color: T.textMuted }}>
                                {group.members.length} member{group.members.length !== 1 ? "s" : ""} in collaboration
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const wb = whiteboards.find(w => w.id === group.whiteboardId);
                              if (wb) setManagingWhiteboard(wb);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors w-full sm:w-auto"
                            style={{ background: T.inputBg, color: T.textMuted, border: `1px solid ${T.border}` }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = A.light}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = T.inputBg}
                          >
                            Manage
                          </button>
                        </div>

                        {/* Members list */}
                        <div className="divide-y" style={{ borderColor: T.border }}>
                          {group.members.map((member) => {
                            const initials = member.userName
                              ? member.userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                              : member.userEmail.charAt(0).toUpperCase();
                            const isOwner = member.permission === "owner";

                            return (
                              <div
                                key={member.id}
                                className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 md:p-3.5 transition-colors"
                                style={{ background: "transparent" }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.inputBg}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                              >
                                {/* Avatar and info row */}
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 w-full sm:w-auto">
                                  <div
                                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                                    style={{ background: `linear-gradient(135deg, ${A.bg}, ${A.bg}dd)` }}
                                  >
                                    {initials}
                                  </div>

                                  {/* User info */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs md:text-sm font-semibold truncate" style={{ color: T.text }}>
                                      {member.userName || member.userEmail.split("@")[0]}
                                    </p>
                                    <p className="text-[11px] md:text-xs truncate" style={{ color: T.textMuted }}>
                                      {member.userEmail}
                                    </p>
                                  </div>
                                </div>

                                {/* Permission dropdown and remove button */}
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                  <select
                                    value={member.permission}
                                    onChange={(e) => handleUpdateMemberPermission(group.whiteboardId, member.id, e.target.value)}
                                    disabled={isOwner}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed outline-none flex-1 sm:flex-initial"
                                  style={{
                                    background: isOwner ? A.light : T.inputBg,
                                    borderColor: isOwner ? A.ring : T.border,
                                    color: isOwner ? (prefs.theme === "light" ? A.bg : A.text) : T.text,
                                  }}
                                >
                                  <option value="owner" className="bg-gray-800" disabled={!isOwner}>
                                    Owner
                                  </option>
                                  <option value="edit" className="bg-gray-800">
                                    Can Edit
                                  </option>
                                  <option value="view" className="bg-gray-800">
                                    Can View
                                  </option>
                                </select>

                                {/* Remove button (not for owner) */}
                                {!isOwner && (
                                  <button
                                    onClick={() => handleRemoveMember(group.whiteboardId, member.id)}
                                    className="p-1.5 rounded-lg transition-colors text-gray-500 hover:text-red-500 hover:bg-red-500/10 shrink-0"
                                    title="Remove member"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )
            ) : loadingBoards ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-7 h-7 border-2 border-violet-900 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : displayedBoards.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-16 rounded-2xl border border-dashed"
                style={{ borderColor: T.border }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border" style={{ background: T.inputBg, borderColor: T.border }}>
                  <svg className="w-7 h-7" style={{ color: T.textFaint }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {navActive === "starred" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    ) : navActive === "recent" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    )}
                  </svg>
                </div>
                <p className="font-semibold" style={{ color: T.textMuted }}>
                  {navActive === "starred" ? "No starred boards" : navActive === "recent" ? "No recent boards" : "No boards here"}
                </p>
                <p className="text-sm mt-1" style={{ color: T.textFaint }}>
                  {navActive === "starred" ? "Star your favorite boards to see them here" : navActive === "recent" ? "Your recently opened boards will appear here" : "Create a new board to start collaborating"}
                </p>
              </motion.div>
            ) : prefs.boardLayout === "list" ? (
              <div className="flex flex-col gap-2 pb-4">
                {displayedBoards.map((wb, i) => (
                  <motion.div
                    key={wb.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18, delay: i * 0.03 }}
                    className="group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all"
                    style={{ background: T.bgCard, borderColor: T.border }}
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getBoardGradient(wb.id)} flex items-center justify-center shrink-0 shadow-md`}>
                      <span className="text-white text-[10px] font-black">{wb.title.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{wb.title}</p>
                      <p className="text-xs" style={{ color: T.textFaint }}>{wb.roomCode} · {formatDate(wb.updatedAt)}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0"
                      style={wb.permission === "owner" ? { color: A.text, background: A.light, borderColor: A.ring } : { color: T.textFaint, background: T.inputBg, borderColor: T.border }}>
                      {wb.permission === "owner" ? "Owner" : wb.permission === "edit" ? "Editor" : "Viewer"}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={e => toggleStar(wb.id, e)} 
                        className="p-1.5 rounded-lg transition-all" 
                        style={{ color: starredIds.includes(wb.id) ? "#fbbf24" : T.textFaint }}
                        onMouseEnter={e => { 
                          (e.currentTarget as HTMLElement).style.color = starredIds.includes(wb.id) ? "#f59e0b" : "#fbbf24"; 
                          (e.currentTarget as HTMLElement).style.background = "rgba(251,191,36,0.1)"; 
                        }}
                        onMouseLeave={e => { 
                          (e.currentTarget as HTMLElement).style.color = starredIds.includes(wb.id) ? "#fbbf24" : T.textFaint; 
                          (e.currentTarget as HTMLElement).style.background = "transparent"; 
                        }}
                      >
                        <svg className="w-3.5 h-3.5" fill={starredIds.includes(wb.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      {wb.permission === "owner" && (
                        <>
                          <button onClick={e => { e.stopPropagation(); setManagingWhiteboard(wb); }} className="p-1.5 rounded-lg transition-all" style={{ color: T.textFaint }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = A.text; (e.currentTarget as HTMLElement).style.background = A.light; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.textFaint; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDeleteWhiteboard(wb.id); }} className="p-1.5 rounded-lg transition-all" style={{ color: T.textFaint }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171"; (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.textFaint; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </>
                      )}
                      <button onClick={() => handleOpenWhiteboard(wb)} className="px-3 py-1.5 text-white text-xs font-semibold rounded-xl transition-colors shadow-md"
                        style={{ background: A.bg }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = A.hover} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = A.bg}>
                        Open
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : prefs.boardLayout === "compact" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pb-4">
                {displayedBoards.map((wb, i) => (
                  <motion.div
                    key={wb.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.18, delay: i * 0.03 }}
                    className="group border rounded-xl p-3 transition-all cursor-pointer relative"
                    style={{ background: T.bgCard, borderColor: T.border }}
                    onClick={() => handleOpenWhiteboard(wb)}
                  >
                    <button
                      onClick={e => toggleStar(wb.id, e)}
                      className="absolute top-2 right-2 p-1 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      style={{ color: starredIds.includes(wb.id) ? "#fbbf24" : T.textFaint, background: T.bgCard }}
                    >
                      <svg className="w-3 h-3" fill={starredIds.includes(wb.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getBoardGradient(wb.id)} flex items-center justify-center mb-2 shadow-sm`}>
                      <span className="text-white text-[10px] font-black">{wb.title.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <p className="text-xs font-semibold truncate" style={{ color: T.text }}>{wb.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: T.textFaint }}>{formatDate(wb.updatedAt)}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 pb-4">
                {displayedBoards.map((wb, i) => (
                  <motion.div
                    key={wb.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: i * 0.04 }}
                    className="group relative rounded-2xl p-4 border transition-all duration-200"
                    style={{ background: T.bgCard, borderColor: T.border }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Color swatch */}
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getBoardGradient(wb.id)} flex items-center justify-center shrink-0 shadow-md`}>
                        <span className="text-white text-xs font-black">{wb.title.slice(0, 2).toUpperCase()}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold truncate transition-colors" style={{ color: T.text }}>{wb.title}</h3>
                            <p className="text-[11px] font-mono mt-0.5" style={{ color: T.textFaint }}>{wb.roomCode}</p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 mt-0.5"
                            style={wb.permission === "owner"
                              ? { color: A.text, background: A.light, borderColor: A.ring }
                              : wb.permission === "edit"
                                ? { color: "#6ee7b7", background: "rgba(5,150,105,0.1)", borderColor: "rgba(5,150,105,0.2)" }
                                : { color: T.textMuted, background: T.inputBg, borderColor: T.border }}>
                            {wb.permission === "owner" ? "Owner" : wb.permission === "edit" ? "Editor" : "Viewer"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Meta + actions */}
                    <div className="mt-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs" style={{ color: T.textFaint }}>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {wb.memberCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDate(wb.updatedAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={e => toggleStar(wb.id, e)} 
                          className="p-1.5 rounded-lg transition-all" 
                          style={{ color: starredIds.includes(wb.id) ? "#fbbf24" : T.textFaint }}
                          onMouseEnter={e => { 
                            (e.currentTarget as HTMLElement).style.color = starredIds.includes(wb.id) ? "#f59e0b" : "#fbbf24"; 
                            (e.currentTarget as HTMLElement).style.background = "rgba(251,191,36,0.1)"; 
                          }}
                          onMouseLeave={e => { 
                            (e.currentTarget as HTMLElement).style.color = starredIds.includes(wb.id) ? "#fbbf24" : T.textFaint; 
                            (e.currentTarget as HTMLElement).style.background = "transparent"; 
                          }}
                        >
                          <svg className="w-3.5 h-3.5" fill={starredIds.includes(wb.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                        {wb.permission === "owner" && (
                          <>
                            <button
                              onClick={e => { e.stopPropagation(); setManagingWhiteboard(wb); }}
                              className="p-1.5 rounded-lg transition-all"
                              style={{ color: T.textFaint }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = A.text; (e.currentTarget as HTMLElement).style.background = A.light; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.textFaint; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDeleteWhiteboard(wb.id); }}
                              className="p-1.5 rounded-lg transition-all"
                              style={{ color: T.textFaint }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171"; (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.textFaint; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleOpenWhiteboard(wb)}
                          className="px-3.5 py-1.5 text-white text-xs font-semibold rounded-xl transition-colors shadow-md"
                          style={{ background: A.bg }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = A.hover}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = A.bg}
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ─── RIGHT PANEL ─────────────────────────────────────────── */}
      <aside 
        className={`
          fixed md:static inset-y-0 right-0 z-40 w-[280px] md:w-[270px] shrink-0 border-l flex flex-col overflow-y-auto dash-scroll
          transform transition-transform duration-300 md:transform-none
          ${mobileRightSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}
        style={{ background: T.bgAlt, borderColor: T.borderMuted }}
      >
        {/* Mobile close button */}
        <div className="md:hidden flex items-center justify-between p-4 border-b" style={{ borderColor: T.borderMuted }}>
          <span className="text-sm font-semibold" style={{ color: T.text }}>Workspace</span>
          <button
            onClick={() => setMobileRightSidebarOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: T.text, background: T.inputBg }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats gauge */}
        <div className="p-5 border-b" style={{ borderColor: T.borderMuted }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.textFaint }}>Active Boards</span>
          </div>
          <div className="flex items-center justify-center py-3">
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke={T.inputBg} strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={A.bg} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${Math.min((whiteboards.length / Math.max(whiteboards.length + 4, 8)) * 314, 290)} 314`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black leading-none" style={{ color: T.text }}>{whiteboards.length}</span>
                <span className="text-[11px] mt-0.5" style={{ color: T.textFaint }}>boards</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3 text-center border" style={{ background: T.inputBg, borderColor: T.border }}>
              <div className="text-xl font-bold" style={{ color: T.text }}>{whiteboards.filter(w => w.permission === "owner").length}</div>
              <div className="text-[11px] mt-0.5" style={{ color: T.textFaint }}>Owned</div>
            </div>
            <div className="rounded-xl p-3 text-center border" style={{ background: T.inputBg, borderColor: T.border }}>
              <div className="text-xl font-bold" style={{ color: T.text }}>{totalMembers}</div>
              <div className="text-[11px] mt-0.5" style={{ color: T.textFaint }}>Members</div>
            </div>
          </div>
        </div>

        {/* User profile */}
        <div className="p-5 border-b" style={{ borderColor: T.borderMuted }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg shrink-0"
              style={{ background: `linear-gradient(135deg, ${A.bg}, ${A.bg}99)`, boxShadow: `0 8px 20px ${A.glow}` }}>
              {user.name ? initials(user.name) : user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{user.name || user.email?.split("@")[0]}</p>
              <p className="text-[11px] truncate" style={{ color: T.textFaint }}>{user.email}</p>
            </div>
          </div>

          {/* Workspace info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-xs" style={{ color: T.textFaint }}>
              <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5" />
              </svg>
              <span>Workspace active</span>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: T.textFaint }}>
              <svg className="w-3.5 h-3.5 shrink-0" style={{ color: A.text }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Free plan</span>
            </div>
          </div>

          {/* Create button */}
          <AnimatePresence>
            {showCreateInput ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-2 pt-1">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreateWhiteboard()}
                    placeholder="Board title…"
                    autoFocus
                    className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-all"
                  style={{ background: T.inputBg, border: `1px solid ${T.border}`, color: T.text }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateWhiteboard}
                      disabled={creating}
                      className="flex-1 py-2 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                      style={{ background: A.bg }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = A.hover}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = A.bg}
                    >
                      {creating ? "Creating…" : "Create"}
                    </button>
                    <button
                      onClick={() => { setShowCreateInput(false); setNewTitle(""); }}
                      className="px-3 py-2 text-xs rounded-xl transition-all"
                      style={{ background: T.inputBg, color: T.textMuted, border: `1px solid ${T.border}` }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <button
                onClick={() => setShowCreateInput(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-white text-sm font-semibold rounded-xl transition-colors shadow-md"
              style={{ background: A.bg }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = A.hover}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = A.bg}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                New Board
              </button>
            )}
          </AnimatePresence>
        </div>

        {/* Recent boards list */}
        <div className="p-5 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: T.textFaint }}>Recently Visited</p>
          {loadingBoards ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-violet-900 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : recentBoards.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: T.textFaint }}>No recent boards</p>
          ) : (
            <div className="space-y-1.5">
              {recentBoards.map(wb => (
                <motion.button
                  key={wb.id}
                  whileHover={{ x: 3 }}
                  onClick={() => handleOpenWhiteboard(wb)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left group"
                  style={{ color: T.text }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.inputBg}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getBoardGradient(wb.id)} flex items-center justify-center shrink-0 shadow`}>
                    <span className="text-white text-[10px] font-black">{wb.title.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate transition-colors" style={{ color: T.textMuted }}>{wb.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: T.textFaint }}>{formatDate(wb.updatedAt)}</p>
                  </div>
                  <svg className="w-3.5 h-3.5 text-zinc-700 group-hover:text-violet-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {managingWhiteboard && (
        <ManageMembersModal
          whiteboardId={managingWhiteboard.id}
          whiteboardTitle={managingWhiteboard.title}
          onClose={() => setManagingWhiteboard(null)}
        />
      )}
    </div>
  );
}
