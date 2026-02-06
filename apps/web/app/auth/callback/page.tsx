"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthService } from "@/lib/auth";

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

        // Store tokens directly in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_tokens", JSON.stringify({
            accessToken,
            refreshToken,
            expiresIn: parseInt(expiresIn, 10)
          }));

          // Fetch and store user info
          const user = await authService.getCurrentUser();
          localStorage.setItem("auth_user", JSON.stringify(user));

          // Do a full page redirect to reinitialize auth state
          window.location.href = "/dashboard";
        }
      } catch (err: any) {
        setError(err.message || "OAuth authentication failed");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleCallback();
  }, [searchParams, authService, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/96 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(#6b21a8_1px,transparent_1px)] bg-size-[16px_16px] opacity-20" />
        
        <div className="relative bg-gradient-to-br from-red-900/20 to-red-950/40 backdrop-blur-xl border border-red-500/30 p-10 rounded-2xl shadow-2xl max-w-md text-center">
          <div className="text-red-400 text-6xl mb-6 animate-pulse">⚠️</div>
          <h1 className="text-3xl font-bold text-white mb-3">Oops! Something Went Wrong</h1>
          <p className="text-red-200 mb-6 text-lg">{error}</p>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            <p className="text-sm">Taking you back to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/96 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(#6b21a8_1px,transparent_1px)] bg-size-[16px_16px] opacity-20" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="relative bg-gradient-to-br from-purple-900/20 to-purple-950/40 backdrop-blur-xl border border-purple-500/30 p-12 rounded-2xl shadow-2xl max-w-md text-center">
        {/* Custom animated loader */}
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-pink-500 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">🔐</span>
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-purple-200 to-pink-200 mb-3">
          Almost There!
        </h1>
        <p className="text-gray-300 text-lg mb-4">Securing your session...</p>
        
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}
