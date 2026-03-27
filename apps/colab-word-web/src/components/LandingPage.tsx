import { Link } from 'react-router-dom';
import { Users, Lock, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1 } }),
};

const FEATURES = [
  {
    icon: <Users className="w-6 h-6 text-white" />,
    bg: 'from-violet-500 to-indigo-600',
    title: 'Real-Time Collaboration',
    desc: 'See every keystroke as it happens. Multiple teammates edit simultaneously with live cursors.',
  },
  {
    icon: (
      <svg viewBox="0 0 38 48" className="w-5 h-6">
        <path d="M0 6C0 2.7 2.7 0 6 0H24L38 14V42C38 45.3 35.3 48 32 48H6C2.7 48 0 45.3 0 42V6Z" fill="white" />
        <rect x="8" y="22" width="22" height="3" rx="1.5" fill="#4285F4" />
        <rect x="8" y="29" width="22" height="3" rx="1.5" fill="#4285F4" />
        <rect x="8" y="36" width="14" height="3" rx="1.5" fill="#4285F4" />
      </svg>
    ),
    bg: 'from-cyan-500 to-blue-600',
    title: 'Rich Text Editing',
    desc: 'Headings, lists, bold/italic, highlights, text color, and more — all in a clean Google-Docs-style editor.',
  },
  {
    icon: <Lock className="w-6 h-6 text-white" />,
    bg: 'from-emerald-500 to-teal-600',
    title: 'Secure & Private',
    desc: 'Granular view / edit permissions per document. JWT-authenticated WebSocket connections.',
  },
  {
    icon: <Zap className="w-6 h-6 text-white" />,
    bg: 'from-orange-500 to-rose-600',
    title: 'Lightning Fast',
    desc: 'Powered by Yjs CRDTs and y-websocket for conflict-free, instant sync across all clients.',
  },
];

const PERKS = [
  'No installation — entirely browser-based',
  'Offline-resilient: local edits sync when reconnected',
  'Live presence avatars for everyone in the room',
  'Cross-origin token handoff from the main dashboard',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f1117' }}>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/8 backdrop-blur-md" style={{ background: 'rgba(15,17,23,0.85)' }}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 38 48" className="w-6 h-7">
              <path d="M0 6C0 2.7 2.7 0 6 0H24L38 14V42C38 45.3 35.3 48 32 48H6C2.7 48 0 45.3 0 42V6Z" fill="#4285F4" />
              <path d="M24 0L38 14H27C25.3 14 24 12.7 24 11V0Z" fill="#A8C7FA" />
              <rect x="8" y="22" width="22" height="3" rx="1.5" fill="white" />
              <rect x="8" y="29" width="22" height="3" rx="1.5" fill="white" />
              <rect x="8" y="36" width="16" height="3" rx="1.5" fill="white" />
            </svg>
            <span className="text-white font-semibold text-lg tracking-tight">CollabDocs</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-300 hover:text-white transition-colors px-3 py-1.5">
              Log in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-medium text-white px-4 py-1.5 rounded-full transition-colors"
              style={{ background: '#1a73e8' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1557b0')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1a73e8')}
            >
              Sign up free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-5 pt-24 pb-20">
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-blue-500/30 text-blue-400 text-xs font-medium"
          style={{ background: 'rgba(26,115,232,0.12)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Live collaboration, powered by Yjs CRDTs
        </motion.div>

        <motion.h1
          custom={1}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight max-w-3xl"
        >
          Documents that
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg,#4285F4,#a855f7)' }}> write themselves</span>
          <br />together.
        </motion.h1>

        <motion.p
          custom={2}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mt-6 text-gray-400 text-lg max-w-2xl leading-relaxed"
        >
          Create, edit, and share documents with your team in real time.
          Rich formatting, live cursors, and offline resilience — all in a familiar Google-Docs-style interface.
        </motion.p>

        <motion.div
          custom={3}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mt-8 flex flex-wrap gap-3 justify-center"
        >
          <Link
            to="/signup"
            className="flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium text-sm transition-all shadow-lg shadow-blue-900/40"
            style={{ background: 'linear-gradient(135deg,#1a73e8,#7c3aed)' }}
          >
            Get started free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 px-6 py-3 rounded-full text-gray-300 font-medium text-sm border border-white/15 hover:border-white/30 hover:text-white transition-all"
          >
            Log in to your workspace
          </Link>
        </motion.div>

        {/* preview card */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mt-16 w-full max-w-3xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50"
        >
          {/* fake editor chrome */}
          <div className="bg-white px-4 pt-3 pb-0 flex flex-col">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 38 48" className="w-5 h-6">
                  <path d="M0 6C0 2.7 2.7 0 6 0H24L38 14V42C38 45.3 35.3 48 32 48H6C2.7 48 0 45.3 0 42V6Z" fill="#4285F4" />
                  <path d="M24 0L38 14H27C25.3 14 24 12.7 24 11V0Z" fill="#A8C7FA" />
                  <rect x="8" y="22" width="22" height="3" rx="1.5" fill="white" />
                  <rect x="8" y="29" width="22" height="3" rx="1.5" fill="white" />
                  <rect x="8" y="36" width="16" height="3" rx="1.5" fill="white" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Q4 Strategy Doc</span>
                <span className="ml-2 text-xs text-gray-400">Saved</span>
              </div>
              <div className="flex items-center gap-1.5">
                {['#4285F4','#0f9d58','#f4b400'].map(c => (
                  <div key={c} className="w-6 h-6 rounded-full border-2 border-white shadow-sm text-white text-[9px] font-bold flex items-center justify-center" style={{ background: c }}>
                    {c === '#4285F4' ? 'JD' : c === '#0f9d58' ? 'AK' : 'RB'}
                  </div>
                ))}
                <div className="ml-1 px-3 py-1 rounded-full text-xs font-medium text-white" style={{ background: '#1a73e8' }}>Share</div>
              </div>
            </div>
            {/* fake toolbar strip */}
            <div className="flex items-center gap-1 py-1.5 bg-[#f8f9fa]">
              {['B','I','U','S'].map(b => (
                <div key={b} className="w-6 h-6 rounded text-xs font-bold text-gray-600 flex items-center justify-center hover:bg-gray-200">{b}</div>
              ))}
              <div className="w-px h-4 bg-gray-300 mx-1" />
              {['≡','≡','≡'].map((x,i) => <div key={i} className="w-6 h-6 rounded text-xs text-gray-500 flex items-center justify-center">{x}</div>)}
            </div>
          </div>
          {/* fake page */}
          <div className="bg-[#f0f4f9] px-6 py-5">
            <div className="bg-white rounded shadow p-8 space-y-3">
              <div className="h-5 rounded bg-gray-800 w-64" />
              <div className="h-3 rounded bg-gray-200 w-full" />
              <div className="h-3 rounded bg-gray-200 w-5/6" />
              <div className="h-3 rounded bg-gray-200 w-4/6" />
              <div className="h-3 rounded bg-gray-100 w-full mt-4" />
              <div className="h-3 rounded bg-gray-100 w-3/4" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 py-20 w-full">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-2xl sm:text-3xl font-bold text-white text-center mb-12"
        >
          Everything you need to write together
        </motion.h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-2xl p-5 border border-white/8 flex flex-col gap-4"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${f.bg} flex items-center justify-center shrink-0`}>
                {f.icon}
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1.5">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Perks strip ──────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-5 pb-20 w-full">
        <div className="rounded-2xl border border-white/8 p-8 grid sm:grid-cols-2 gap-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {PERKS.map((p, i) => (
            <motion.div
              key={p}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex items-start gap-3 text-sm text-gray-300"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              {p}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-5 pb-24 text-center w-full">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to collaborate?</h2>
        <p className="text-gray-400 mb-8">Create a free account and open your first shared document in under a minute.</p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold transition-all shadow-lg shadow-blue-900/40"
          style={{ background: 'linear-gradient(135deg,#1a73e8,#7c3aed)' }}
        >
          Start for free <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-white/8 py-6">
        <p className="text-center text-gray-600 text-sm">
          © 2026 CollabDocs · Built with React, Tiptap, and Yjs
        </p>
      </footer>
    </div>
  );
}
