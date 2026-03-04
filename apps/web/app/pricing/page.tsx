"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

const ease = [0.22, 1, 0.36, 1] as const;
const up = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease },
});

const PLANS = [
  {
    name: "Free",
    description: "Perfect for individuals and small teams getting started",
    price: "$0",
    period: "forever",
    features: [
      "Up to 3 whiteboards",
      "Real-time collaboration",
      "Basic templates",
      "5 GB storage",
      "Basic support",
      "Export to PNG/PDF",
    ],
    cta: "Get Started",
    highlighted: false,
    gradient: "from-zinc-700 to-zinc-800",
  },
  {
    name: "Pro",
    description: "For professional teams that need more power",
    price: "$12",
    period: "per user/month",
    features: [
      "Unlimited whiteboards",
      "Advanced collaboration",
      "All premium templates",
      "Unlimited storage",
      "Priority support",
      "Advanced export options",
      "Custom branding",
      "Version history",
      "Team analytics",
    ],
    cta: "Start Free Trial",
    highlighted: true,
    gradient: "from-violet-600 to-purple-700",
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    description: "For large organizations with custom needs",
    price: "Custom",
    period: "contact sales",
    features: [
      "Everything in Pro",
      "Dedicated account manager",
      "Custom integrations",
      "SSO & advanced security",
      "SLA guarantee",
      "On-premise deployment",
      "Unlimited API access",
      "Custom training",
      "24/7 phone support",
    ],
    cta: "Contact Sales",
    highlighted: false,
    gradient: "from-emerald-600 to-teal-700",
  },
];

const FAQS = [
  {
    question: "Can I change plans later?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges.",
  },
  {
    question: "Is there a free trial for Pro?",
    answer: "Absolutely! We offer a 14-day free trial for the Pro plan with no credit card required. Cancel anytime during the trial.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for Enterprise customers.",
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
  },
  {
    question: "Do you offer discounts for non-profits?",
    answer: "Yes! We offer special pricing for educational institutions, non-profits, and open-source projects. Contact our sales team for details.",
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "Your data is retained for 30 days after cancellation. You can export all your whiteboards during this period before permanent deletion.",
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
        <div className="absolute top-20 left-1/4 w-125 h-125 rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 right-1/4 w-100 h-100 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(217,70,239,0.25) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10">
        {/* NAV */}
        <motion.nav
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto"
        >
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white tracking-tight">CollabBoard</span>
          </Link>
          <div className="flex items-center gap-2">
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

        {/* HERO SECTION */}
        <section className="px-4 pt-16 pb-12 text-center max-w-4xl mx-auto">
          <motion.div {...up(0)}>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
              style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              Simple, transparent pricing
            </span>
          </motion.div>

          <motion.h1 {...up(0.07)}
            className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tighter mb-5">
            Choose the{" "}
            <span style={{
              backgroundImage: "linear-gradient(135deg, #a78bfa 0%, #f0abfc 50%, #818cf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>perfect plan</span>
            <br />for your team
          </motion.h1>

          <motion.p {...up(0.14)}
            className="text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
            Start free, scale as you grow. All plans include our core collaboration features.
          </motion.p>

          {/* Billing toggle */}
          <motion.div {...up(0.21)} className="inline-flex items-center gap-3 px-1 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                billingCycle === "monthly"
                  ? "bg-violet-600 text-white shadow-lg"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                billingCycle === "yearly"
                  ? "bg-violet-600 text-white shadow-lg"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Yearly
              <span className="ml-1.5 text-xs text-emerald-400">(Save 20%)</span>
            </button>
          </motion.div>
        </section>

        {/* PRICING CARDS */}
        <section className="px-4 pb-20 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {PLANS.map((plan, idx) => (
              <motion.div
                key={plan.name}
                {...up(0.28 + idx * 0.07)}
                className={`relative rounded-3xl p-8 border transition-all ${
                  plan.highlighted
                    ? "border-violet-500/50 shadow-2xl shadow-violet-900/30"
                    : "border-white/10"
                }`}
                style={{
                  background: plan.highlighted
                    ? "linear-gradient(to bottom, rgba(124,58,237,0.1), rgba(15,15,26,0.95))"
                    : "rgba(255,255,255,0.03)",
                  backdropFilter: "blur(12px)",
                }}
                whileHover={{ scale: plan.highlighted ? 1.02 : 1.01, y: -4 }}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex px-4 py-1.5 rounded-full text-xs font-bold bg-linear-to-r from-violet-600 to-purple-600 text-white shadow-lg">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white">{plan.price}</span>
                    {plan.period !== "contact sales" && plan.price !== "Custom" && (
                      <span className="text-zinc-500 text-sm">
                        /{billingCycle === "yearly" ? "year" : "month"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{plan.period}</p>
                </div>

                <Link href={plan.name === "Enterprise" ? "/contact" : "/signup"}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all mb-8 ${
                      plan.highlighted
                        ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/50"
                        : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                    }`}
                  >
                    {plan.cta}
                  </motion.button>
                </Link>

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">What's included</p>
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 shrink-0 mt-0.5"
                        style={{ color: plan.highlighted ? "#a78bfa" : "#52525b" }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-zinc-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FEATURES COMPARISON */}
        <section className="px-4 pb-20 max-w-5xl mx-auto">
          <motion.div {...up(0.5)} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">
              Compare all features
            </h2>
            <p className="text-zinc-400 text-lg">See what's included in each plan</p>
          </motion.div>

          <motion.div {...up(0.57)} className="rounded-2xl border border-white/10 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-6 text-zinc-400 font-semibold">Feature</th>
                    <th className="text-center py-4 px-6 text-zinc-400 font-semibold">Free</th>
                    <th className="text-center py-4 px-6 text-violet-400 font-semibold">Pro</th>
                    <th className="text-center py-4 px-6 text-zinc-400 font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { feature: "Whiteboards", free: "3", pro: "Unlimited", enterprise: "Unlimited" },
                    { feature: "Team members", free: "Up to 5", pro: "Unlimited", enterprise: "Unlimited" },
                    { feature: "Storage", free: "5 GB", pro: "Unlimited", enterprise: "Unlimited" },
                    { feature: "Templates", free: "Basic", pro: "All", enterprise: "All + Custom" },
                    { feature: "Export formats", free: "PNG, PDF", pro: "PNG, PDF, SVG", enterprise: "All formats" },
                    { feature: "Version history", free: "7 days", pro: "90 days", enterprise: "Unlimited" },
                    { feature: "Support", free: "Email", pro: "Priority email", enterprise: "24/7 phone + dedicated manager" },
                    { feature: "SSO", free: false, pro: false, enterprise: true },
                    { feature: "API access", free: false, pro: "Standard", enterprise: "Unlimited" },
                    { feature: "Custom branding", free: false, pro: true, enterprise: true },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6 text-white font-medium">{row.feature}</td>
                      <td className="py-4 px-6 text-center text-zinc-400">
                        {typeof row.free === "boolean" ? (
                          row.free ? (
                            <svg className="w-5 h-5 mx-auto text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )
                        ) : (
                          row.free
                        )}
                      </td>
                      <td className="py-4 px-6 text-center text-violet-300">
                        {typeof row.pro === "boolean" ? (
                          row.pro ? (
                            <svg className="w-5 h-5 mx-auto text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )
                        ) : (
                          row.pro
                        )}
                      </td>
                      <td className="py-4 px-6 text-center text-zinc-400">
                        {typeof row.enterprise === "boolean" ? (
                          row.enterprise ? (
                            <svg className="w-5 h-5 mx-auto text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )
                        ) : (
                          row.enterprise
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </section>

        {/* FAQ SECTION */}
        <section className="px-4 pb-20 max-w-3xl mx-auto">
          <motion.div {...up(0.64)} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">
              Frequently asked questions
            </h2>
            <p className="text-zinc-400 text-lg">Everything you need to know about our pricing</p>
          </motion.div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <motion.div
                key={idx}
                {...up(0.71 + idx * 0.04)}
                className="rounded-xl border border-white/10 overflow-hidden"
                style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)" }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold text-white pr-4">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-violet-400 shrink-0 transition-transform ${
                      openFaq === idx ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === idx && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-5 pb-5"
                  >
                    <p className="text-zinc-400 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="px-4 pb-24 text-center">
          <motion.div {...up(0.85)} className="max-w-3xl mx-auto rounded-3xl p-12 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(217,70,239,0.1))",
              border: "1px solid rgba(139,92,246,0.3)",
            }}>
            <div className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(139,92,246,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.1) 1px,transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">
                Ready to get started?
              </h2>
              <p className="text-zinc-300 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of teams already collaborating on CollabBoard. Start for free, no credit card required.
              </p>
              <Link href="/signup">
                <motion.span
                  whileHover={{ scale: 1.05, boxShadow: "0 0 48px rgba(139,92,246,0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold text-base rounded-2xl transition-colors shadow-2xl shadow-violet-900/50 cursor-pointer"
                >
                  Start Free Today
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </motion.span>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/10 py-8 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <span className="font-semibold">CollabBoard</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/" className="hover:text-white transition-colors">Back to Home</Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
