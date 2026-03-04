import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@repo/auth/react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: "easeOut" as const },
});

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (!agreed) { setError("You must agree to the terms"); return; }
    setError("");
    setLoading(true);
    try {
      await signup({ name: form.name, email: form.email, password: form.password });
      navigate("/whiteboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden" style={{ background: "#0f0f1a" }}>
      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(139,92,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.04) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)", filter: "blur(40px)" }} />
      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <motion.div {...fadeUp(0)} className="flex justify-center mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-base font-semibold text-white">CollabBoard</span>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div {...fadeUp(0.05)} className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <motion.div {...fadeUp(0.1)}>
            <h1 className="text-lg font-semibold text-white mb-1">Create an account</h1>
            <p className="text-sm text-zinc-500 mb-5">Start collaborating for free</p>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden"
              >
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div {...fadeUp(0.15)}>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Name</label>
              <input type="text" required value={form.name} onChange={set("name")} placeholder="Your name"
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" />
            </motion.div>

            <motion.div {...fadeUp(0.18)}>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
              <input type="email" required value={form.email} onChange={set("email")} placeholder="you@example.com"
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" />
            </motion.div>

            <motion.div {...fadeUp(0.21)}>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
              <input type="password" required value={form.password} onChange={set("password")} placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" />
            </motion.div>

            <motion.div {...fadeUp(0.24)}>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Confirm password</label>
              <input type="password" required value={form.confirm} onChange={set("confirm")} placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" />
            </motion.div>

            <motion.label {...fadeUp(0.27)} className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 accent-violet-600" />
              <span className="text-xs text-zinc-500">
                I agree to the{" "}
                <span className="text-violet-400 hover:text-violet-300 cursor-pointer">Terms of Service</span>
                {" "}and{" "}
                <span className="text-violet-400 hover:text-violet-300 cursor-pointer">Privacy Policy</span>
              </span>
            </motion.label>

            <motion.div {...fadeUp(0.3)}>
              <motion.button
                type="submit" disabled={loading || !agreed} whileTap={{ scale: 0.98 }}
                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
                ) : "Create account"}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>

        <motion.p {...fadeUp(0.35)} className="text-center text-sm text-zinc-600 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-violet-400 hover:text-violet-300 transition-colors">Sign in</Link>
        </motion.p>
      </div>
    </div>
  );
}
