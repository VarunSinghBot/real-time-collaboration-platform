"use client";

import Link from "next/link";
import { Spotlight } from "@/components/ui/spotlight";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { MovingBorderButton } from "@/components/ui/moving-border";
import { motion } from "framer-motion";

export default function Home() {
  const features = [
    {
      title: "Draw Together, Anywhere",
      description:
        "Sketch out ideas with your team like you're all in the same room. No more 'can you see my screen?' moments.",
      icon: "✨",
    },
    {
      title: "Your Ideas Stay Safe",
      description:
        "We've got your back with solid security. Think of it as a vault for your brilliant brainstorms.",
      icon: "🛡️",
    },
    {
      title: "One Login, Everywhere",
      description:
        "Sign in once and you're good to go. Access all your boards from any device without the hassle.",
      icon: "🚀",
    },
    {
      title: "Stay Organized, Effortlessly",
      description:
        "Keep your projects neat without even trying. Everything just works the way you'd expect it to.",
      icon: "🎯",
    },
  ];

  return (
    <main className="min-h-screen w-full bg-black/96 antialiased bg-grid-white/[0.02] relative overflow-hidden">
      {/* Spotlight Effects */}
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="rgba(168, 85, 247, 0.4)"
      />
      <Spotlight
        className="top-10 left-full h-[80vh] w-[50vw]"
        fill="rgba(147, 51, 234, 0.3)"
      />
      <Spotlight
        className="top-28 left-80 h-[80vh] w-[50vw]"
        fill="rgba(126, 34, 206, 0.2)"
      />

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center px-4 pt-20 pb-10 md:pt-32 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-7xl font-bold bg-clip-text text-transparent bg-linear-to-b from-purple-200 to-purple-600 pb-4">
              Your Ideas Deserve Better
            </h1>
            <TextGenerateEffect
              words="A whiteboard that actually gets your team on the same page. Simple, fast, and dare we say... fun?"
              className="text-lg md:text-2xl text-gray-300 max-w-3xl mx-auto"
            />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-6 mt-12"
          >
            <Link href="/signup">
              <MovingBorderButton
                borderRadius="2rem"
                className="bg-black text-white border-purple-500/50 hover:bg-purple-900/20 transition-all font-semibold"
                containerClassName="h-14 w-48"
                borderClassName="bg-[radial-gradient(var(--purple-500)_40%,transparent_60%)]"
              >
                Try It Free
              </MovingBorderButton>
            </Link>
            <Link href="/login">
              <button className="h-14 w-48 rounded-full border border-purple-500/50 bg-purple-900/10 text-white font-semibold hover:bg-purple-900/30 transition-all backdrop-blur-sm">
                I Have an Account
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="max-w-7xl mx-auto px-4 py-20"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-center bg-clip-text text-transparent bg-linear-to-b from-purple-200 to-purple-500 mb-4">
            What Makes Us Different?
          </h2>
          <p className="text-center text-gray-400 text-lg mb-16 max-w-2xl mx-auto">
            We built this because we were tired of clunky collaboration tools. Here's what we got right:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-linear-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity" />
                <div className="relative h-full bg-black/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition-all">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="max-w-5xl mx-auto px-4 py-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="backdrop-blur-sm bg-purple-900/10 border border-purple-500/20 rounded-xl p-8 hover:scale-105 transition-transform">
              <div className="text-6xl mb-3">⏰</div>
              <div className="text-2xl font-semibold text-purple-300 mb-2">Always On</div>
              <div className="text-gray-400">We're up when you need us (which is basically always)</div>
            </div>
            <div className="backdrop-blur-sm bg-purple-900/10 border border-purple-500/20 rounded-xl p-8 hover:scale-105 transition-transform">
              <div className="text-6xl mb-3">⚡</div>
              <div className="text-2xl font-semibold text-purple-300 mb-2">Crazy Fast</div>
              <div className="text-gray-400">Your ideas flow at the speed of thought</div>
            </div>
            <div className="backdrop-blur-sm bg-purple-900/10 border border-purple-500/20 rounded-xl p-8 hover:scale-105 transition-transform">
              <div className="text-6xl mb-3">🤝</div>
              <div className="text-2xl font-semibold text-purple-300 mb-2">Made for Humans</div>
              <div className="text-gray-400">Not another tool that needs a manual</div>
            </div>
          </div>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="text-center py-20 px-4"
        >
          <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-b from-purple-200 to-purple-500 mb-6">
            Let's Make Something Great!
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            No credit card needed. No complicated setup. Just you, your team, and a blank canvas full of possibilities.
          </p>
          <Link href="/signup">
            <MovingBorderButton
              borderRadius="2rem"
              className="bg-black text-white border-purple-500/50 hover:bg-purple-900/20 transition-all font-semibold text-lg"
              containerClassName="h-16 w-56"
              borderClassName="bg-[radial-gradient(var(--purple-500)_40%,transparent_60%)]"
            >
              Let's Create Together
            </MovingBorderButton>
          </Link>
        </motion.div>
      </div>

      {/* Background grid effect */}
      <div className="absolute inset-0 h-full w-full bg-black bg-[radial-gradient(#6b21a8_1px,transparent_1px)] bg-size-[16px_16px] opacity-20" />
    </main>
  );
}

