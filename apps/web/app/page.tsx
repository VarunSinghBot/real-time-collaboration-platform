"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;
const up = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease },
});

const FEATURES = [
  {
    title: "Real-time Collaboration",
    description: "Draw and annotate together with your team instantly. Zero lag, fully synchronized.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    gradient: "from-violet-600 to-purple-700",
  },
  {
    title: "Enterprise Security",
    description: "End-to-end encrypted sessions. Your ideas stay private and protected at all times.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    gradient: "from-emerald-600 to-teal-700",
  },
  {
    title: "Smart Organization",
    description: "Boards auto-organize by project. Find anything instantly with powerful search.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    gradient: "from-blue-600 to-indigo-700",
  },
  {
    title: "One-Click Access",
    description: "Sign in with Google and pick up right where you left off. Cross-device, always in sync.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    gradient: "from-orange-600 to-rose-700",
  },
];

const STATS = [
  { value: "99.9%", label: "Uptime SLA", sub: "Always available when you need it" },
  { value: "<50ms", label: "Sync Latency", sub: "Near-instant real-time updates" },
  { value: "Infinity", label: "Canvas Size", sub: "Unlimited space to think big" },
];

export default function Home() {
  return (
    <main className="relative min-h-screen text-white overflow-x-hidden" style={{ background: "#0f0f1a" }}>

      {/* Grid backdrop */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.035) 1px,transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/3 w-150 h-150 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)" }} />
        <div className="absolute top-2/3 right-0 w-100 h-100 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(217,70,239,0.2) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-87.5 h-87.5 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10">

        {/* NAV */}
        <motion.nav
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white tracking-tight">CollabBoard</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/pricing">
              <motion.span whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="inline-flex px-4 py-2 text-sm text-zinc-400 hover:text-white font-medium transition-colors cursor-pointer">
                Pricing
              </motion.span>
            </Link>
            <Link href="/login">
              <motion.span whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="inline-flex px-4 py-2 text-sm text-zinc-400 hover:text-white font-medium transition-colors cursor-pointer">
                Sign in
              </motion.span>
            </Link>
            <Link href="/signup">
              <motion.span
                whileHover={{ scale: 1.04, boxShadow: "0 0 24px rgba(139,92,246,0.4)" }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer">
                Get Started
              </motion.span>
            </Link>
          </div>
        </motion.nav>

        {/* HERO */}
        <section className="flex flex-col items-center justify-center px-4 pt-20 pb-20 md:pt-36 md:pb-28 text-center">
          <motion.div {...up(0)} className="mb-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
              style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Real-time whiteboard collaboration
            </span>
          </motion.div>

          <motion.h1 {...up(0.07)}
            className="text-5xl sm:text-7xl md:text-8xl font-black leading-[1.02] tracking-tighter mb-5 max-w-4xl">
            Think it.{" "}
            <span style={{
              backgroundImage: "linear-gradient(135deg, #a78bfa 0%, #f0abfc 50%, #818cf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>Build it.</span>
            <br />Together.
          </motion.h1>

          <motion.p {...up(0.14)}
            className="text-zinc-400 text-xl sm:text-2xl max-w-lg leading-relaxed mb-10 font-light">
            A collaborative whiteboard that stays out of your way and keeps your team in sync.
          </motion.p>

          <motion.div {...up(0.21)} className="flex flex-col sm:flex-row gap-3 mb-14">
            <Link href="/signup">
              <motion.span
                whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(139,92,246,0.5)" }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl transition-colors shadow-2xl text-sm cursor-pointer">
                Start for Free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </motion.span>
            </Link>
            <Link href="/login">
              <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-8 py-3.5 font-bold rounded-2xl transition-all text-sm cursor-pointer text-zinc-300 hover:text-white"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Sign In
              </motion.span>
            </Link>
          </motion.div>

          {/* Hero preview card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease }}
            className="w-full max-w-3xl rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(139,92,246,0.2)", background: "rgba(255,255,255,0.03)" }}>
            <div className="flex items-center gap-1.5 px-4 py-3"
              style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              <div className="flex-1" />
              <span className="text-xs text-zinc-600 font-mono">collabboard.app/board/team-brainstorm</span>
              <div className="flex-1" />
            </div>
            <div className="relative h-52 sm:h-72 overflow-hidden" style={{ background: "#0a0a14" }}>
              <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="dotgrid" width="32" height="32" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="0.8" fill="#6d28d9" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dotgrid)" />
              </svg>
              <div className="absolute top-8 left-12 px-3 py-2 rounded-xl text-xs font-medium text-violet-200 shadow-lg"
                style={{ background: "rgba(124,58,237,0.25)", border: "1px solid rgba(139,92,246,0.4)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-3 h-3 rounded-full bg-violet-400" />
                  <span className="text-violet-400 text-[10px]">Alex</span>
                </div>
                Marketing flow
              </div>
              <div className="absolute top-16 right-16 px-3 py-2 rounded-xl text-xs font-medium text-emerald-200 shadow-lg"
                style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(52,211,153,0.35)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-emerald-400 text-[10px]">Sam</span>
                </div>
                User journey
              </div>
              <div className="absolute bottom-12 left-1/3 px-3 py-2 rounded-xl text-xs font-medium text-blue-200 shadow-lg"
                style={{ background: "rgba(59,130,246,0.2)", border: "1px solid rgba(96,165,250,0.35)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-3 h-3 rounded-full bg-blue-400" />
                  <span className="text-blue-400 text-[10px]">Jordan</span>
                </div>
                Sprint goals
              </div>
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 700 280" preserveAspectRatio="none">
                <path d="M 180 60 Q 280 130 360 100 T 520 80" stroke="rgba(167,139,250,0.5)" fill="none" strokeWidth="2" strokeLinecap="round" />
                <path d="M 100 180 Q 220 150 320 200 T 600 160" stroke="rgba(52,211,153,0.4)" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="6 4" />
              </svg>
              <div className="absolute bottom-6 right-8 flex -space-x-2">
                {["#7c3aed","#059669","#2563eb","#ea580c"].map((bg, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0a0a14] flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ background: bg }}>
                    {["A","S","J","M"][i]}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* STATS */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STATS.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.6 + i * 0.1, ease }}
                whileHover={{ y: -3, transition: { duration: 0.16 } }}
                className="relative rounded-2xl p-6 text-center overflow-hidden"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="text-3xl font-black mb-1"
                  style={{ backgroundImage: "linear-gradient(135deg, #a78bfa, #f0abfc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {s.value}
                </div>
                <div className="text-sm font-semibold text-white/80 mb-1">{s.label}</div>
                <div className="text-xs text-zinc-500">{s.sub}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="max-w-6xl mx-auto px-4 py-20">
          <motion.div {...up(0.4)} className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#a78bfa" }}>Features</p>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
              Built for teams that{" "}
              <span style={{ backgroundImage: "linear-gradient(135deg, #a78bfa, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                move fast
              </span>
            </h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto leading-relaxed">
              Every feature is designed to reduce friction and amplify creativity.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.5 + i * 0.09, ease }}
                whileHover={{ y: -4, transition: { duration: 0.16 } }}
                className="group relative rounded-2xl p-6 overflow-hidden"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${f.gradient} flex items-center justify-center text-white mb-4 shadow-lg`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.8, ease }}
          className="max-w-4xl mx-auto px-4 pb-32">
          <div className="relative rounded-3xl overflow-hidden p-14 text-center"
            style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
            <div className="absolute inset-0 -z-10 blur-3xl opacity-40"
              style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.3) 0%, transparent 70%)" }} />
            <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#a78bfa" }}>Get Started Today</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
              Your team&apos;s best ideas<br />start here.
            </h2>
            <p className="text-zinc-400 text-base mb-10 max-w-md mx-auto leading-relaxed">
              No credit card required. Free forever for small teams.
              Upgrade when you&apos;re ready to scale.
            </p>
            <Link href="/signup">
              <motion.span
                whileHover={{ scale: 1.04, boxShadow: "0 0 48px rgba(139,92,246,0.55)" }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-10 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl transition-colors text-sm cursor-pointer">
                Create Your First Board
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </motion.span>
            </Link>
            <p className="text-xs text-zinc-600 mt-4">Free plan &middot; No card needed &middot; Upgrade anytime</p>
          </div>
        </motion.section>

      </div>
    </main>
  );
}
