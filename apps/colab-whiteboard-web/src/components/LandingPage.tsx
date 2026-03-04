import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useSpring, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@repo/auth";

const DASHBOARD_URL: string = (import.meta as any).env?.VITE_DASHBOARD_URL ?? "http://localhost:3000/dashboard";

const ease = [0.22, 1, 0.36, 1] as const;

const PARTICLES = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  duration: Math.random() * 20 + 10,
  delay: Math.random() * 5,
}));

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const mx = useMotionValue(typeof window !== "undefined" ? window.innerWidth / 2 : 0);
  const my = useMotionValue(typeof window !== "undefined" ? window.innerHeight / 2 : 0);
  const glowX = useSpring(mx, { stiffness: 30, damping: 20 });
  const glowY = useSpring(my, { stiffness: 30, damping: 20 });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    const handleMouse = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY); };
    
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouse);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, [mx, my]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    // Draw flowing shapes
    const shapes = [
      { x: 60, y: 80, r: 40, color: "rgba(139,92,246,0.15)" },
      { x: 160, y: 120, r: 60, color: "rgba(236,72,153,0.12)" },
      { x: 100, y: 160, r: 35, color: "rgba(59,130,246,0.13)" },
    ];

    shapes.forEach(({ x, y, r, color }) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Curved lines
    ctx.strokeStyle = "rgba(139,92,246,0.3)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(40, 60);
    ctx.bezierCurveTo(80, 40, 120, 100, 160, 80);
    ctx.stroke();
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        {/* Gradient mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        
        {/* Floating particles */}
        <svg className="absolute inset-0 w-full h-full">
          {PARTICLES.map((p) => (
            <motion.circle
              key={p.id}
              cx={`${p.x}%`}
              cy={`${p.y}%`}
              r={p.size}
              fill="rgba(139,92,246,0.4)"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.6, 0],
                y: [0, -30, 0],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: "easeInOut",
              }}
            />
          ))}
        </svg>

        {/* Cursor glow effect */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            x: glowX,
            y: glowY,
            translateX: "-50%",
            translateY: "-50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-xl" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div 
              className="flex items-center gap-3 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate("/")}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl blur-sm opacity-75" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                CollabBoard
              </span>
            </motion.div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {["Features", "Pricing", "About"].map((link) => (
                <motion.button
                  key={link}
                  whileHover={{ scale: 1.05 }}
                  className="text-sm text-slate-400 hover:text-white transition-colors font-medium"
                >
                  {link}
                </motion.button>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {!loading && isAuthenticated ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/whiteboard")}
                    className="hidden sm:block text-sm px-4 py-2 text-slate-300 hover:text-white transition-colors"
                  >
                    Whiteboard
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(139,92,246,0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => (window.location.href = DASHBOARD_URL)}
                    className="relative overflow-hidden px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-semibold text-white shadow-lg shadow-violet-900/40"
                  >
                    <span className="relative z-10">Dashboard</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-0 hover:opacity-100 transition-opacity" />
                  </motion.button>
                </>
              ) : !loading ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/login")}
                    className="text-sm px-4 py-2 text-slate-300 hover:text-white transition-colors"
                  >
                    Sign in
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(139,92,246,0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/signup")}
                    className="relative overflow-hidden px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-semibold text-white shadow-lg shadow-violet-900/40"
                  >
                    <span className="relative z-10">Get Started</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-0 hover:opacity-100 transition-opacity" />
                  </motion.button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 backdrop-blur-sm mb-8"
            >
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-pulse" />
              <span className="text-sm font-medium bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Real-time collaboration made simple
              </span>
              <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight mb-6"
            >
              <span className="block text-white">Create together.</span>
              <span className="block mt-2 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent animate-gradient">
                Anywhere.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
            >
              The most powerful collaborative whiteboard for teams who think visually.
              <br className="hidden sm:block" />
              <span className="text-slate-500">Draw, design, and brainstorm in real-time with zero lag.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {!loading && isAuthenticated ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/whiteboard")}
                    className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold shadow-2xl shadow-violet-900/50 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 flex items-center gap-2">
                      Open Whiteboard
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => (window.location.href = DASHBOARD_URL)}
                    className="px-8 py-4 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-violet-500/50 text-white font-bold backdrop-blur-sm transition-all"
                  >
                    Dashboard
                  </motion.button>
                </>
              ) : !loading ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/signup")}
                    className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold shadow-2xl shadow-violet-900/50 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 flex items-center gap-2">
                      Start Free
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/login")}
                    className="px-8 py-4 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-violet-500/50 text-white font-bold backdrop-blur-sm transition-all"
                  >
                    Sign In
                  </motion.button>
                </>
              ) : null}
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-12 flex items-center justify-center gap-6 text-sm text-slate-500"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>Trusted by 1,000+ teams</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-slate-700" />
              <div className="hidden sm:flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Free forever plan</span>
              </div>
            </motion.div>
          </div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-20 relative"
          >
            {/* Glow effects */}
            <div className="absolute inset-0 bg-gradient-to-t from-violet-600/20 via-transparent to-transparent blur-3xl -z-10" />
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-3/4 h-40 bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 blur-3xl -z-10" />

            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-slate-900/50 to-slate-950/50 backdrop-blur-xl shadow-2xl">
              {/* Window Controls */}
              <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5 bg-slate-900/50">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors cursor-pointer" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors cursor-pointer" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="px-4 py-1 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400 font-mono">
                    collaborative-board · 4 members online
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {[
                    "bg-gradient-to-br from-violet-500 to-violet-600",
                    "bg-gradient-to-br from-fuchsia-500 to-fuchsia-600",
                    "bg-gradient-to-br from-blue-500 to-blue-600",
                    "bg-gradient-to-br from-emerald-500 to-emerald-600",
                  ].map((bg, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                      className={`w-7 h-7 rounded-full ${bg} ring-2 ring-slate-900 flex items-center justify-center text-white text-xs font-bold`}
                    >
                      {String.fromCharCode(65 + i)}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Canvas Area */}
              <div className="relative bg-slate-950 aspect-video">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />

                {/* Animated Cursors */}
                {[
                  { name: "Alex", color: "violet", x: [20, 45, 30], y: [20, 35, 25], delay: 0 },
                  { name: "Maya", color: "fuchsia", x: [60, 40, 55], y: [40, 30, 45], delay: 1 },
                  { name: "Sam", color: "blue", x: [70, 80, 75], y: [60, 50, 55], delay: 2 },
                ].map((cursor, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{ left: `${cursor.x[0]}%`, top: `${cursor.y[0]}%` }}
                    animate={{
                      x: [`${cursor.x[0]}%`, `${cursor.x[1]}%`, `${cursor.x[2]}%`, `${cursor.x[0]}%`],
                      y: [`${cursor.y[0]}%`, `${cursor.y[1]}%`, `${cursor.y[2]}%`, `${cursor.y[0]}%`],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: cursor.delay,
                    }}
                  >
                    <div className="flex items-start gap-1.5">
                      <motion.svg
                        className="w-5 h-5 drop-shadow-lg"
                        viewBox="0 0 16 16"
                        fill={cursor.color === "violet" ? "#8b5cf6" : cursor.color === "fuchsia" ? "#d946ef" : "#3b82f6"}
                        animate={{ rotate: [0, 10, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <path d="M0 0l4 16 3-5 5-3L0 0z" />
                      </motion.svg>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md shadow-lg whitespace-nowrap bg-${cursor.color}-600 text-white`}>
                        {cursor.name}
                      </span>
                    </div>
                  </motion.div>
                ))}

                {/* Floating Shapes */}
                <motion.div
                  className="absolute top-12 left-16 w-32 h-24 rounded-2xl border-2 border-violet-500/40 bg-violet-500/5 backdrop-blur-sm"
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 2, 0],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute bottom-16 right-20 w-24 h-24 rounded-full border-2 border-fuchsia-500/40 bg-fuchsia-500/5 backdrop-blur-sm"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.2, 0.5, 0.2],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />

                {/* Sticky Note */}
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 3 }}
                  transition={{ delay: 1.2, type: "spring" }}
                  className="absolute bottom-10 left-20 w-28 p-3 rounded-lg bg-amber-400 text-amber-900 shadow-xl text-xs font-medium leading-tight rotate-3"
                >
                  💡 Great idea for the new feature!
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <div className="relative py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Powerful features for
              <span className="block mt-2 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                seamless collaboration
              </span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Everything you need to brainstorm, design, and collaborate in real-time with your team.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                ),
                title: "⚡ Lightning Fast Sync",
                description: "Experience zero-latency collaboration with WebSocket technology. Every stroke syncs instantly across all devices.",
                color: "from-violet-500 to-purple-600",
              },
              {
                icon: (
                  <>
                    <circle cx="12" cy="12" r="3" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M19.78 4.22l1.42 1.42" />
                  </>
                ),
                title: "👁️ Live Cursors",
                description: "See exactly where your teammates are working with real-time cursor tracking and user presence indicators.",
                color: "from-fuchsia-500 to-pink-600",
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                ),
                title: "🔒 Smart Permissions",
                description: "Control access with owner, editor, and viewer roles. Your content stays secure with enterprise-grade encryption.",
                color: "from-blue-500 to-cyan-600",
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                ),
                title: "☁️ Auto-Save & Sync",
                description: "Never lose your work with automatic cloud backup. Access your boards from any device, anywhere.",
                color: "from-emerald-500 to-green-600",
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                ),
                title: "👥 Team Management",
                description: "Invite unlimited collaborators, manage permissions, and track activity from your central dashboard.",
                color: "from-amber-500 to-orange-600",
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                ),
                title: "📊 Rich Drawing Tools",
                description: "Access powerful drawing tools, shapes, text, sticky notes, and more. Built on tldraw's incredible engine.",
                color: "from-rose-500 to-red-600",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl -z-10" 
                  style={{ background: `linear-gradient(to bottom right, ${feature.color})` }} />
                
                <div className="relative h-full p-8 rounded-2xl bg-slate-900/50 border border-slate-800 group-hover:border-slate-700 backdrop-blur-sm transition-all">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {feature.icon}
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!isAuthenticated && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative py-24"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl overflow-hidden">
              {/* Glow effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 blur-3xl" />
              
              <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl border border-white/10 p-12 sm:p-16 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
                  className="inline-block p-4 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 mb-6"
                >
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </motion.div>

                <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
                  Ready to collaborate?
                </h2>
                <p className="text-lg sm:text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
                  Join thousands of teams already using CollabBoard to bring their ideas to life.
                </p>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/signup")}
                  className="group relative px-10 py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-lg font-bold shadow-2xl shadow-violet-900/50 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 flex items-center gap-2">
                    Start for Free
                    <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </motion.button>

                <p className="mt-6 text-sm text-slate-500">
                  No credit card required · Free forever plan · Cancel anytime
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                CollabBoard
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <button className="hover:text-white transition-colors">Privacy</button>
              <button className="hover:text-white transition-colors">Terms</button>
              <button className="hover:text-white transition-colors">Contact</button>
            </div>

            {/* Copyright */}
            <div className="text-sm text-slate-500">
              © 2026 CollabBoard. Built with ❤️ using Go, React & Tldraw
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
