"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@repo/auth";
import { usePreferences, ACCENT_PALETTES, THEME_TOKENS, type Theme, type BoardLayout, type AccentColor } from "@/lib/preferences";
import { motion } from "framer-motion";
import { authService } from "@/lib/auth";

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  const { prefs } = usePreferences();
  const T = THEME_TOKENS[prefs.theme];
  return (
    <div className="rounded-2xl p-6 border" style={{ background: T.bgCard, borderColor: T.border }}>
      <div className="mb-5">
        <h2 className="text-base font-semibold" style={{ color: T.text }}>{title}</h2>
        {description && <p className="text-sm mt-0.5" style={{ color: T.textMuted }}>{description}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, accent }: { checked: boolean; onChange: (v: boolean) => void; accent: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative inline-flex w-11 h-6 rounded-full transition-colors duration-300 shrink-0"
      style={{ background: checked ? accent : "rgba(100,100,120,0.3)" }}
    >
      <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300"
        style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }} />
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter();
  const { user, logout: contextLogout } = useAuth();
  const { prefs, setTheme, setBoardLayout, setAccentColor } = usePreferences();
  const T = THEME_TOKENS[prefs.theme];
  const A = ACCENT_PALETTES[prefs.accentColor];

  const initials = (s: string) => s?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const navItems = [
    { id: "boards",   label: "Boards",   icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" /></svg> },
    { id: "recent",   label: "Recent",   icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: "starred",  label: "Starred",  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg> },
    { id: "people",   label: "Team",     icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-300" style={{ background: T.bg, color: T.text }}>

      {/* ─── LEFT SIDEBAR ─────────────────────────────────────── */}
      <aside className="w-16 flex flex-col items-center py-5 gap-2 shrink-0 border-r z-20"
        style={{ background: T.bgAlt, borderColor: T.borderMuted }}>
        {/* Logo */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 shadow-lg shrink-0"
          style={{ background: A.bg, boxShadow: `0 8px 24px ${A.glow}` }}>
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>

        {/* Nav icons */}
        <div className="flex flex-col items-center gap-1 flex-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => router.push("/dashboard")}
              title={item.label}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group relative"
              style={{ color: T.textFaint }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.textMuted; (e.currentTarget as HTMLElement).style.background = T.inputBg; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.textFaint; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {item.icon}
              <span className="absolute left-full ml-2.5 px-2.5 py-1 text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-xl"
                style={{ background: T.bgCard, border: `1px solid ${T.border}`, color: T.text }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col items-center gap-2 mt-auto">
          {/* Settings (active) */}
          <button
            title="Settings"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{ background: A.light, color: A.text }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
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
          </button>

          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg mt-1 shrink-0 select-none"
            style={{ background: `linear-gradient(135deg, ${A.bg}, ${A.bg}99)` }}>
            {user?.name ? initials(user.name) : user?.email?.charAt(0).toUpperCase() ?? "?"}
          </div>
        </div>
      </aside>

      {/* ─── CONTENT ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="h-14 shrink-0 flex items-center justify-between px-8 border-b sticky top-0 z-10"
          style={{ background: T.bg, borderColor: T.borderMuted }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: T.textMuted }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.text}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.textMuted}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </button>
            <span style={{ color: T.textFaint }}>/</span>
            <span className="text-sm font-semibold" style={{ color: T.text }}>Settings</span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">

          {/* ── APPEARANCE ─────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <Section title="Appearance" description="Choose how the dashboard looks and feels">

              {/* Theme */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.textFaint }}>Theme</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["dark", "light"] as Theme[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className="relative overflow-hidden rounded-xl p-4 border-2 transition-all text-left"
                      style={{
                        borderColor: prefs.theme === t ? A.bg : T.border,
                        background: prefs.theme === t ? A.light : T.inputBg,
                      }}
                    >
                      {/* Mini preview */}
                      <div className="w-full h-16 rounded-lg mb-3 overflow-hidden border"
                        style={{ borderColor: T.border, background: t === "dark" ? "#0f0f1a" : "#f8f7ff" }}>
                        <div className="w-full h-2.5" style={{ background: t === "dark" ? "#13131f" : "#ffffff", borderBottom: `1px solid ${t === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}` }} />
                        <div className="flex gap-1.5 p-2">
                          {[1, 2].map(i => (
                            <div key={i} className="flex-1 h-6 rounded-lg" style={{ background: t === "dark" ? "#17172a" : "#ffffff", border: `1px solid ${t === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}` }} />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold capitalize" style={{ color: T.text }}>{t}</span>
                        {prefs.theme === t && (
                          <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: A.bg }}>
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent color */}
              <div className="mt-6 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.textFaint }}>Accent Color</p>
                <div className="flex items-center gap-3">
                  {(Object.entries(ACCENT_PALETTES) as [AccentColor, typeof ACCENT_PALETTES[AccentColor]][]).map(([key, pal]) => (
                    <button
                      key={key}
                      onClick={() => setAccentColor(key)}
                      title={key}
                      className="w-8 h-8 rounded-full transition-all duration-200"
                      style={{
                        background: pal.bg,
                        transform: prefs.accentColor === key ? "scale(1.2)" : "scale(1)",
                        boxShadow: prefs.accentColor === key ? `0 0 0 3px ${T.bg}, 0 0 0 5px ${pal.bg}` : "none",
                      }}
                    />
                  ))}
                </div>
              </div>
            </Section>
          </motion.div>

          {/* ── LAYOUT ─────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.06 }}>
            <Section title="Board Layout" description="Choose how your boards are displayed on the dashboard">
              <div className="grid grid-cols-3 gap-3">
                {([
                  {
                    id: "cards", label: "Cards", desc: "Rich cards with thumbnails",
                    preview: (
                      <div className="grid grid-cols-2 gap-1 p-2">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="h-8 rounded-lg" style={{ background: T.inputBg, border: `1px solid ${T.border}` }} />
                        ))}
                      </div>
                    ),
                  },
                  {
                    id: "list", label: "List", desc: "Compact rows with details",
                    preview: (
                      <div className="flex flex-col gap-1 p-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="h-4 rounded-md flex items-center gap-1.5 px-2" style={{ background: T.inputBg, border: `1px solid ${T.border}` }}>
                            <div className="w-3 h-3 rounded-md shrink-0" style={{ background: `${A.bg}40` }} />
                          </div>
                        ))}
                      </div>
                    ),
                  },
                  {
                    id: "compact", label: "Compact", desc: "Dense grid, more boards visible",
                    preview: (
                      <div className="grid grid-cols-3 gap-1 p-2">
                        {[1,2,3,4,5,6].map(i => (
                          <div key={i} className="h-5 rounded-md" style={{ background: T.inputBg, border: `1px solid ${T.border}` }} />
                        ))}
                      </div>
                    ),
                  },
                ] as const).map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setBoardLayout(opt.id as BoardLayout)}
                    className="relative overflow-hidden rounded-xl border-2 text-left transition-all"
                    style={{
                      borderColor: prefs.boardLayout === opt.id ? A.bg : T.border,
                      background: prefs.boardLayout === opt.id ? A.light : T.inputBg,
                    }}
                  >
                    <div className="h-20 border-b" style={{ borderColor: T.border }}>
                      {opt.preview}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold" style={{ color: T.text }}>{opt.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: T.textFaint }}>{opt.desc}</p>
                    </div>
                    {prefs.boardLayout === opt.id && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: A.bg }}>
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Section>
          </motion.div>

          {/* ── ACCOUNT ────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.12 }}>
            <Section title="Account" description="Your profile information">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${A.bg}, ${A.bg}aa)`, boxShadow: `0 8px 24px ${A.glow}` }}>
                  {user?.name ? (user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)) : user?.email?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate" style={{ color: T.text }}>{user?.name || "—"}</p>
                  <p className="text-sm truncate" style={{ color: T.textMuted }}>{user?.email}</p>
                  <span className="inline-block mt-1.5 text-xs px-2.5 py-0.5 rounded-full font-semibold"
                    style={{ background: A.light, color: A.text }}>Free plan</span>
                </div>
              </div>
            </Section>
          </motion.div>

          {/* ── DANGER ─────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.18 }}>
            <div className="rounded-2xl p-6 border" style={{ background: T.bgCard, borderColor: "rgba(239,68,68,0.18)" }}>
              <div className="mb-5">
                <h2 className="text-base font-semibold" style={{ color: T.text }}>Danger Zone</h2>
                <p className="text-sm mt-0.5" style={{ color: T.textMuted }}>Irreversible actions</p>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: "rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.04)" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: T.text }}>Sign out of all devices</p>
                  <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>This will invalidate your current session</p>
                </div>
                <button
                  onClick={async () => { await contextLogout(); router.push("/login"); }}
                  className="px-4 py-2 text-sm font-semibold rounded-xl transition-all"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.2)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.12)"}
                >
                  Sign out
                </button>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
