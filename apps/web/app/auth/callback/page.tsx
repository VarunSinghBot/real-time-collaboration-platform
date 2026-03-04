"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthService } from "@/lib/auth";

const PenIcon = () => (
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

function LoadingScreen() {
  const steps = ["Verifying identity", "Securing session", "Loading your workspace"];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 800);
    const t2 = setTimeout(() => setStep(2), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#0f0f1a" }}>
      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(139,92,246,0.045) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.045) 1px,transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      {/* Ambient glow blobs */}
      <div className="absolute pointer-events-none" style={{
        top: "20%", left: "50%", transform: "translate(-50%,-50%)",
        width: 520, height: 520, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.13) 0%, transparent 70%)",
        filter: "blur(48px)",
      }} />
      <div className="absolute pointer-events-none" style={{
        bottom: "15%", right: "20%",
        width: 320, height: 320, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(217,70,239,0.08) 0%, transparent 70%)",
        filter: "blur(40px)",
      }} />

      {/* Card */}
      <div className="relative flex flex-col items-center text-center px-12 py-12 rounded-3xl w-full max-w-sm mx-4" style={{
        background: "linear-gradient(135deg, rgba(139,92,246,0.07) 0%, rgba(15,15,26,0.6) 50%, rgba(88,28,235,0.05) 100%)",
        backdropFilter: "blur(32px) saturate(160%)",
        WebkitBackdropFilter: "blur(32px) saturate(160%)",
        border: "1px solid rgba(139,92,246,0.18)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.03) inset, 0 24px 64px rgba(0,0,0,0.5)",
      }}>
        {/* Top shimmer line */}
        <div className="absolute top-0 left-8 right-8 h-px rounded-full" style={{
          background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.6), rgba(217,70,239,0.4), transparent)",
        }} />

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            boxShadow: "0 0 24px rgba(124,58,237,0.5), 0 0 48px rgba(124,58,237,0.2)",
          }}>
            <PenIcon />
          </div>
          <span className="text-sm font-bold tracking-tight" style={{
            background: "linear-gradient(135deg, #a78bfa, #f0abfc)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>CollabBoard</span>
        </div>

        {/* Spinner */}
        <div className="relative w-16 h-16 mb-8">
          {/* Static track */}
          <div className="absolute inset-0 rounded-full" style={{ border: "2px solid rgba(139,92,246,0.15)" }} />
          {/* Outer spinning arc */}
          <div className="absolute inset-0 rounded-full animate-spin" style={{
            border: "2px solid transparent",
            borderTopColor: "#8b5cf6",
            borderRightColor: "rgba(139,92,246,0.3)",
            animationDuration: "1s",
          }} />
          {/* Inner reverse arc */}
          <div className="absolute inset-1.5 rounded-full animate-spin" style={{
            border: "2px solid transparent",
            borderTopColor: "#d946ef",
            animationDuration: "0.75s",
            animationDirection: "reverse",
          }} />
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full" style={{ background: "#8b5cf6", boxShadow: "0 0 8px #8b5cf6" }} />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-xl font-bold text-white mb-1 tracking-tight">Signing you in</h1>
        <p className="text-sm text-zinc-400 mb-8">One moment while we set up your session</p>

        {/* Step indicators */}
        <div className="w-full flex flex-col gap-2.5">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-3 text-left" style={{ opacity: i <= step ? 1 : 0.3, transition: "opacity 0.4s ease" }}>
              <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{
                background: i < step ? "rgba(52,211,153,0.15)" : i === step ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.05)",
                border: i < step ? "1px solid rgba(52,211,153,0.35)" : i === step ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
                transition: "all 0.4s ease",
              }}>
                {i < step ? (
                  <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : i === step ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                ) : null}
              </div>
              <span className="text-xs font-medium" style={{ color: i < step ? "#6ee7b7" : i === step ? "#c4b5fd" : "#71717a" }}>
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#0f0f1a" }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(139,92,246,0.045) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.045) 1px,transparent 1px)",
        backgroundSize: "48px 48px",
      }} />
      <div className="relative flex flex-col items-center text-center px-10 py-10 rounded-3xl w-full max-w-sm mx-4" style={{
        background: "rgba(239,68,68,0.04)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(239,68,68,0.18)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      }}>
        <div className="absolute top-0 left-8 right-8 h-px rounded-full" style={{
          background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.5), transparent)",
        }} />
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 text-xl" style={{
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
        }}>⚠️</div>
        <h1 className="text-lg font-bold text-white mb-2">Authentication failed</h1>
        <p className="text-sm text-zinc-400 mb-6">{message}</p>
        <div className="flex items-center gap-2 text-zinc-500 text-xs">
          <div className="w-3 h-3 border border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
          Redirecting to login...
        </div>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authService = useAuthService();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const accessToken = searchParams.get("accessToken");
        const refreshToken = searchParams.get("refreshToken");
        const expiresIn = searchParams.get("expiresIn");

        if (!accessToken || !refreshToken || !expiresIn) {
          setError("Invalid OAuth callback");
          return;
        }

        if (typeof window !== "undefined") {
          authService.storeOAuthSession({
            accessToken,
            refreshToken,
            expiresIn: parseInt(expiresIn, 10),
          });

          try {
            await authService.getCurrentUser();
          } catch {
            // non-fatal — proceed to dashboard anyway
          }

          window.location.href = "/dashboard";
        }
      } catch (err: any) {
        setError(err.message || "OAuth authentication failed");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleCallback();
  }, [searchParams, authService, router]);

  if (error) return <ErrorScreen message={error} />;
  return <LoadingScreen />;
}
