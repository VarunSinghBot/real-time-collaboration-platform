import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@repo/auth";
import { Tldraw, Editor } from "tldraw";
import type { TLRecord } from "tldraw";
import "tldraw/tldraw.css";
import InviteMemberModal from "./InviteMemberModal";
import WhiteboardTemplates from "./WhiteboardTemplates";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const WS_URL = (import.meta.env.VITE_WS_URL || "ws://localhost:4000").replace(/\/$/, "");

interface PresenceUser {
    userId: string;
    email: string;
    permission: string;
}

interface WSMessage {
    type: string;
    payload: any;
    userId?: string;
    email?: string;
}

export default function CollabWhiteboard() {
    const { roomId } = useParams<{ roomId: string }>();
    const { user, logout, isAuthenticated, loading, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const editorRef = useRef<Editor | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const [whiteboardData, setWhiteboardData] = useState<any>(null);
    const [permission, setPermission] = useState<string>("view");
    const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const isApplyingRemote = useRef(false);
    const [tokensProcessed, setTokensProcessed] = useState(false);

    // Handle authentication from URL params (cross-origin token sharing)
    useEffect(() => {
        const handleTokensFromUrl = async () => {
            const accessToken = searchParams.get("accessToken");
            const refreshToken = searchParams.get("refreshToken");
            const expiresIn = searchParams.get("expiresIn");
            const issuedAtParam = searchParams.get("issuedAt");

            if (accessToken && refreshToken && expiresIn) {
                console.log("🔐 [CollabWhiteboard] Received tokens from URL:", {
                    accessToken: accessToken.substring(0, 20) + "...",
                    refreshToken: refreshToken.substring(0, 20) + "...",
                    expiresIn,
                    issuedAt: issuedAtParam
                });
                
                // Store tokens from URL params preserving the original issuedAt so
                // the auto-refresh timer fires at the correct remaining lifetime,
                // not a full 15-min window from now.
                if (typeof window !== "undefined") {
                    const tokens = {
                        accessToken,
                        refreshToken,
                        expiresIn: parseInt(expiresIn, 10),
                        issuedAt: issuedAtParam ? parseInt(issuedAtParam, 10) : Date.now()
                    };
                    localStorage.setItem("auth_tokens", JSON.stringify(tokens));
                    console.log("✅ [CollabWhiteboard] Tokens stored in localStorage");
                    
                    // Reinitialize auth service to schedule token refresh
                    try {
                        const { authService } = await import("../lib/auth");
                        authService.initialize();
                        console.log("✅ [CollabWhiteboard] AuthService initialized");
                    } catch (initErr) {
                        console.error("❌ [CollabWhiteboard] Failed to initialize authService:", initErr);
                    }
                    
                    // Fetch and store user info
                    try {
                        console.log("🔍 [CollabWhiteboard] Fetching user info from:", `${API_URL}/api/auth/me`);
                        const response = await fetch(`${API_URL}/api/auth/me`, {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`
                            }
                        });
                        
                        console.log("📡 [CollabWhiteboard] /api/auth/me response status:", response.status);
                        
                        if (response.ok) {
                            const userData = await response.json();
                            localStorage.setItem("auth_user", JSON.stringify(userData));
                            console.log("✅ [CollabWhiteboard] User info stored:", userData);
                        } else {
                            const errorText = await response.text();
                            console.error("❌ [CollabWhiteboard] Failed to fetch user info:", response.status, errorText);
                        }
                    } catch (err) {
                        console.error("❌ [CollabWhiteboard] Exception fetching user info:", err);
                    }
                    
                    // Remove tokens from URL for security
                    setSearchParams({}, { replace: true });
                    
                    // Refresh the user in the auth context
                    try {
                        console.log("🔄 [CollabWhiteboard] Refreshing auth context...");
                        await refreshUser();
                        console.log("✅ [CollabWhiteboard] Auth context refreshed successfully");
                    } catch (err) {
                        console.error("❌ [CollabWhiteboard] Failed to refresh user context:", err);
                    }
                }
            }
            
            setTokensProcessed(true);
        };

        if (!tokensProcessed) {
            handleTokensFromUrl();
        }
    }, [searchParams, tokensProcessed, refreshUser, setSearchParams]);

    // Redirect if not authenticated (only after tokens are processed)
    useEffect(() => {
        if (tokensProcessed && !loading) {
            // Check both AuthContext AND localStorage to avoid race condition
            const hasStoredTokens = typeof window !== "undefined" && localStorage.getItem("auth_tokens");
            console.log("🔐 [CollabWhiteboard] Auth check:", {
                tokensProcessed,
                loading,
                isAuthenticated,
                hasStoredTokens: !!hasStoredTokens,
                user: user?.email
            });
            if (!isAuthenticated && !hasStoredTokens) {
                console.log("❌ [CollabWhiteboard] Not authenticated, redirecting to login");
                navigate("/login");
            }
        }
    }, [tokensProcessed, loading, isAuthenticated, navigate, user]);

    // Fetch whiteboard data via REST API
    useEffect(() => {
        const fetchWhiteboard = async () => {
            if (!tokensProcessed || !roomId) return;
            
            // Check if we have tokens (either in context or localStorage)
            const hasStoredTokens = typeof window !== "undefined" && localStorage.getItem("auth_tokens");
            if (!isAuthenticated && !hasStoredTokens) return;

            try {
                const authTokens = localStorage.getItem("auth_tokens");
                console.log("🔍 [CollabWhiteboard] Fetching whiteboard, has tokens:", !!authTokens);
                if (!authTokens) {
                    console.error("❌ [CollabWhiteboard] No tokens found in localStorage");
                    navigate("/login");
                    return;
                }
                const { accessToken } = JSON.parse(authTokens);
                console.log("🔐 [CollabWhiteboard] Using token:", accessToken.substring(0, 20) + "...");

                console.log("📡 [CollabWhiteboard] Fetching whiteboard data from:", `${API_URL}/api/collab-whiteboard/${roomId}`);
                const res = await fetch(`${API_URL}/api/collab-whiteboard/${roomId}`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                console.log("📡 [CollabWhiteboard] Response status:", res.status);

                if (res.ok) {
                    const data = await res.json();
                    setWhiteboardData(data);
                    // Determine permission
                    if (data.ownerId === user?.id) {
                        setPermission("owner");
                    } else {
                        // Fetch member permission
                        const membersRes = await fetch(
                            `${API_URL}/api/collab-whiteboard/${roomId}/members`,
                            { headers: { Authorization: `Bearer ${accessToken}` } }
                        );
                        if (membersRes.ok) {
                            const members = await membersRes.json();
                            const me = members.find((m: any) => m.userId === user?.id);
                            setPermission(me?.permission || "view");
                        }
                    }
                } else if (res.status === 403) {
                    setError("You don't have access to this whiteboard.");
                } else if (res.status === 404) {
                    setError("Whiteboard not found.");
                } else {
                    const errorText = await res.text();
                    console.error("❌ [CollabWhiteboard] Failed to load whiteboard:", res.status, errorText);
                    setError("Failed to load whiteboard.");
                }
            } catch (err) {
                console.error("❌ [CollabWhiteboard] Exception fetching whiteboard:", err);
                setError("Failed to connect to server.");
            }
        };

        fetchWhiteboard();
    }, [tokensProcessed, isAuthenticated, roomId, user, navigate]);

    // Connect WebSocket
    useEffect(() => {
        if (!isAuthenticated || !roomId || !whiteboardData) return;

        const authTokens = localStorage.getItem("auth_tokens");
        if (!authTokens) return;
        const { accessToken } = JSON.parse(authTokens);

        const wsUrl = `${WS_URL}/ws/collab/${roomId}?token=${encodeURIComponent(accessToken)}&permission=${permission}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("WebSocket connected to room:", roomId);
        };

        ws.onmessage = (event) => {
            try {
                const msg: WSMessage = JSON.parse(event.data);

                switch (msg.type) {
                    case "presence":
                        if (msg.payload?.users) {
                            setOnlineUsers(msg.payload.users);
                        }
                        break;

                    case "draw":
                        // Apply remote drawing changes
                        if (editorRef.current && msg.payload) {
                            isApplyingRemote.current = true;
                            try {
                                const { added, updated, removed } = msg.payload;
                                if (added && added.length > 0) {
                                    editorRef.current.store.put(added);
                                }
                                if (updated && updated.length > 0) {
                                    editorRef.current.store.put(updated);
                                }
                                if (removed && removed.length > 0) {
                                    const ids = removed.map((r: TLRecord) => r.id);
                                    editorRef.current.store.remove(ids);
                                }
                            } catch (err) {
                                console.error("Failed to apply remote changes:", err);
                            }
                            isApplyingRemote.current = false;
                        }
                        break;

                    case "sync":
                        // Full sync from another user
                        if (editorRef.current && msg.payload?.records) {
                            isApplyingRemote.current = true;
                            try {
                                editorRef.current.store.put(msg.payload.records);
                            } catch (err) {
                                console.error("Failed to apply sync:", err);
                            }
                            isApplyingRemote.current = false;
                        }
                        break;

                    case "error":
                        console.error("WebSocket error:", msg.payload?.message);
                        break;
                }
            } catch (err) {
                console.error("Failed to parse WebSocket message:", err);
            }
        };

        ws.onclose = () => {
            console.log("WebSocket disconnected from room:", roomId);
        };

        ws.onerror = (err) => {
            console.error("WebSocket error:", err);
        };

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, [isAuthenticated, roomId, whiteboardData, permission]);

    // Send local drawing changes via WebSocket
    const sendDrawChanges = useCallback(
        (added: TLRecord[], updated: TLRecord[], removed: TLRecord[]) => {
            if (
                wsRef.current?.readyState === WebSocket.OPEN &&
                !isApplyingRemote.current
            ) {
                const msg: WSMessage = {
                    type: "draw",
                    payload: { added, updated, removed },
                };
                wsRef.current.send(JSON.stringify(msg));
            }
        },
        []
    );

    // Handle Tldraw editor mount
    const handleMount = useCallback(
        (editor: Editor) => {
            editorRef.current = editor;

            // Load existing whiteboard data
            if (whiteboardData?.data && whiteboardData.data !== "{}") {
                try {
                    const snapshot = JSON.parse(whiteboardData.data);
                    if (snapshot.store) {
                        const records: TLRecord[] = Object.values(snapshot.store);
                        editor.store.put(records);
                    }
                } catch (err) {
                    console.error("Failed to load whiteboard data:", err);
                }
            }
            setIsLoaded(true);

            // Listen for local store changes and broadcast
            const unsub = editor.store.listen(
                (entry) => {
                    if (isApplyingRemote.current) return;
                    if (permission === "view") return;

                    const added: TLRecord[] = [];
                    const updated: TLRecord[] = [];
                    const removed: TLRecord[] = [];

                    for (const record of Object.values(entry.changes.added)) {
                        added.push(record);
                    }
                    for (const [, to] of Object.values(entry.changes.updated)) {
                        updated.push(to);
                    }
                    for (const record of Object.values(entry.changes.removed)) {
                        removed.push(record);
                    }

                    if (added.length || updated.length || removed.length) {
                        sendDrawChanges(added, updated, removed);
                    }
                },
                { source: "user", scope: "document" }
            );

            return () => unsub();
        },
        [whiteboardData, sendDrawChanges, permission]
    );

    // Auto-save whiteboard data periodically
    useEffect(() => {
        if (!isAuthenticated || !isLoaded || !roomId) return;
        if (permission === "view") return;

        const saveInterval = setInterval(async () => {
            await saveWhiteboard();
        }, 15000);

        return () => clearInterval(saveInterval);
    }, [isAuthenticated, isLoaded, roomId, permission]);

    const saveWhiteboard = async () => {
        if (!editorRef.current || !roomId) return;

        setIsSaving(true);
        try {
            const authTokens = localStorage.getItem("auth_tokens");
            if (!authTokens) return;
            const { accessToken } = JSON.parse(authTokens);

            const records = editorRef.current.store.allRecords();
            const snapshot = {
                store: records.reduce(
                    (acc: Record<string, TLRecord>, record: TLRecord) => {
                        acc[record.id] = record;
                        return acc;
                    },
                    {}
                ),
            };

            const res = await fetch(
                `${API_URL}/api/collab-whiteboard/${roomId}/save`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({ data: JSON.stringify(snapshot) }),
                }
            );

            if (res.ok) {
                setLastSaved(new Date());
            }
        } catch (err) {
            console.error("Failed to save whiteboard:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getUserColor = (userId: string) => {
        const colors = [
            "from-blue-500 to-blue-700",
            "from-green-500 to-green-700",
            "from-orange-500 to-orange-700",
            "from-pink-500 to-pink-700",
            "from-teal-500 to-teal-700",
            "from-indigo-500 to-indigo-700",
        ];
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    if (!tokensProcessed || loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-blue-50">
                <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-violet-100 border border-violet-200">
                        <div className="w-7 h-7 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-gray-700 text-sm font-medium">Loading whiteboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
                <div className="text-center rounded-2xl p-8 max-w-md bg-white/80 backdrop-blur-md border border-gray-200 shadow-xl">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl bg-red-100 border border-red-200">😕</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate("/")}
                        className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all shadow-md"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !whiteboardData) {
        return null;
    }

    const canEdit = permission === "owner" || permission === "edit";

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
            {/* Header */}
            <div className="z-50 relative bg-white shadow-sm border-b border-gray-200">
                <div className="px-4 py-2 flex items-center justify-between">
                    {/* Left: Logo + Title */}
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-lg bg-gradient-to-br from-violet-600 to-violet-700">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-gray-900 leading-tight">{whiteboardData.title}</h1>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-gray-600 font-mono px-1.5 py-0.5 rounded-md bg-gray-100 border border-gray-200">
                                    {whiteboardData.roomCode}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                    permission === "owner"
                                        ? "text-violet-700 bg-violet-100 border border-violet-200"
                                        : permission === "edit"
                                            ? "text-emerald-700 bg-emerald-100 border border-emerald-200"
                                            : "text-gray-600 bg-gray-100 border border-gray-200"
                                }`}>
                                    {permission === "owner" ? "Owner" : permission === "edit" ? "Editor" : "Viewer"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Center: Online Users */}
                    <div className="flex items-center gap-1">
                        {onlineUsers.map((u, _) => (
                            <div
                                key={u.userId}
                                className={`w-7 h-7 rounded-full bg-gradient-to-br ${getUserColor(u.userId)} flex items-center justify-center text-white text-xs font-semibold -ml-1 first:ml-0 cursor-default transition-transform hover:scale-110 hover:z-10 border-2 border-white shadow-md`}
                                title={`${u.email} (${u.permission})`}
                            >
                                {u.email.charAt(0).toUpperCase()}
                            </div>
                        ))}
                        {onlineUsers.length > 0 && (
                            <span className="text-[11px] text-gray-600 ml-2 font-medium">{onlineUsers.length} online</span>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        {permission === "owner" && (
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 hover:text-violet-800 bg-violet-100 hover:bg-violet-200 border border-violet-300 rounded-lg transition-all"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                                Invite
                            </button>
                        )}
                        {canEdit && (
                            <>
                                {lastSaved && (
                                    <span className="text-[10px] text-gray-600">
                                        Saved {lastSaved.toLocaleTimeString()}
                                    </span>
                                )}
                                <button
                                    onClick={saveWhiteboard}
                                    disabled={isSaving}
                                    className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 border border-violet-600 rounded-lg shadow-md transition-all disabled:opacity-50"
                                >
                                    {isSaving ? "Saving..." : "Save"}
                                </button>
                            </>
                        )}
                        {/* User chip */}
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-100 border border-gray-200">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-semibold text-[10px] bg-gradient-to-br from-violet-600 to-violet-700 shadow-md">
                                {user?.name ? getInitials(user.name) : user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-gray-900 hidden sm:block">
                                {user?.name || user?.email?.split("@")[0]}
                            </span>
                            <button
                                onClick={logout}
                                className="p-1 rounded transition-all text-gray-500 hover:text-red-600 hover:bg-red-50"
                                title="Logout"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tldraw Canvas */}
            <div className="flex-1 relative">
                <Tldraw
                    onMount={handleMount}
                    options={canEdit ? undefined : { maxPages: 1 }}
                />

                {/* Read-only overlay */}
                {!canEdit && (
                    <div className="absolute bottom-6 right-6 z-50">
                        <div className="text-gray-700 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Only
                        </div>
                    </div>
                )}

                {/* Auto-save indicator for editors */}
                {canEdit && (
                    <div className="absolute bottom-6 right-6 z-50">
                        <div
                            className={`text-gray-700 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 bg-white/90 backdrop-blur-sm shadow-lg ${
                                isSaving ? "border border-yellow-300" : "border border-gray-200"
                            }`}
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Auto-save on
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Templates Panel */}
                {canEdit && <WhiteboardTemplates editor={editorRef.current} />}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <InviteMemberModal
                    whiteboardId={roomId!}
                    onClose={() => setShowInviteModal(false)}
                />
            )}
        </div>
    );
}
