"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@repo/auth";
import { motion, AnimatePresence } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: "easeOut" as const },
});

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function SignupPage() {
  const router = useRouter();
  const { signup, loginWithGoogle, isAuthenticated, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) { setError("Passwords do not match"); return; }
    if (!agreedToTerms) { setError("Please accept the terms to continue"); return; }
    setLoading(true);
    try {
      await signup({ name: formData.name, email: formData.email, password: formData.password });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to create account");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    try { await loginWithGoogle(); }
    catch (err: unknown) { setError((err as Error).message || "Google signup failed"); }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f0f1a" }}>
        <div className="w-8 h-8 border-2 border-zinc-800 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#0f0f1a" }}>

      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-120 xl:w-140 flex-col relative overflow-hidden shrink-0"
        style={{ background: "#13131f", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-125 h-125 rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 right-0 w-75 h-75 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, rgba(217,70,239,0.15) 0%, transparent 70%)" }} />
        </div>
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(139,92,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.04) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }} />

        <div className="relative z-10 flex flex-col h-full p-10">
          <div className="flex items-center gap-2.5 mb-auto">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white tracking-tight">CollabBoard</span>
          </div>

          <div className="my-auto">
            <h2 className="text-4xl xl:text-5xl font-black tracking-tighter text-white leading-[1.05] mb-4">
              Start creating<br />
              <span style={{ backgroundImage: "linear-gradient(135deg, #a78bfa, #f0abfc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                for free.
              </span>
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed max-w-xs">
              Join thousands of teams who use CollabBoard to brainstorm, plan, and build together.
            </p>
          </div>

          {/* Social proof */}
          <div className="mt-auto">
            <div className="flex -space-x-2 mb-3">
              {["#7c3aed","#059669","#2563eb","#dc2626","#d97706"].map((bg, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: bg, borderColor: "#13131f" }}>
                  {["A","S","J","M","K"][i]}
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-500">
              <span className="text-violet-400 font-semibold">500+</span> teams collaborating right now
            </p>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white">CollabBoard</span>
          </div>

          <motion.div {...fadeUp(0.05)} className="mb-7">
            <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
            <p className="text-sm text-zinc-500">Free forever &middot; No credit card required</p>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-red-400 px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google */}
          <motion.button
            {...fadeUp(0.1)}
            type="button" onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-200 transition-all duration-200 mb-5"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}

          >
            <GoogleIcon />
            Continue with Google
          </motion.button>

          {/* Divider */}
          <motion.div {...fadeUp(0.15)} className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
            <span className="text-xs text-zinc-600">or continue with email</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <motion.div {...fadeUp(0.2)}>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Full name</label>
              <input type="text" required value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </motion.div>

            <motion.div {...fadeUp(0.23)}>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email address</label>
              <input type="email" required value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </motion.div>

            <motion.div {...fadeUp(0.26)}>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="8+ characters"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all pr-14"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </motion.div>

            <motion.div {...fadeUp(0.29)}>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Confirm password</label>
              <input type="password" required value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm password"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </motion.div>

            <motion.label {...fadeUp(0.32)} className="flex items-start gap-2.5 cursor-pointer pt-0.5">
              <input type="checkbox" checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-3.5 h-3.5 rounded shrink-0 accent-violet-600"
              />
              <span className="text-xs text-zinc-500 leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" className="text-violet-400 hover:text-violet-300 underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-violet-400 hover:text-violet-300 underline">Privacy Policy</Link>
              </span>
            </motion.label>

            <motion.button
              {...fadeUp(0.35)}
              type="submit" disabled={loading || !agreedToTerms}
              whileHover={loading ? {} : { scale: 1.01 }}
              whileTap={loading ? {} : { scale: 0.99 }}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : "Create account"}
            </motion.button>
          </form>

          <motion.p {...fadeUp(0.4)} className="text-center text-xs text-zinc-600 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">Sign in</Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
