"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Theme = "dark" | "light";
export type BoardLayout = "cards" | "list" | "compact";
export type SidebarPosition = "left" | "right";
export type AccentColor = "violet" | "blue" | "emerald" | "rose" | "orange";

export interface Preferences {
  theme: Theme;
  boardLayout: BoardLayout;
  sidebarOpen: boolean;
  accentColor: AccentColor;
}

interface PreferencesContextValue {
  prefs: Preferences;
  setTheme: (t: Theme) => void;
  setBoardLayout: (l: BoardLayout) => void;
  setSidebarOpen: (v: boolean) => void;
  setAccentColor: (c: AccentColor) => void;
}

// ─── Accent palettes ──────────────────────────────────────────────────────────

export const ACCENT_PALETTES: Record<
  AccentColor,
  { bg: string; hover: string; text: string; ring: string; light: string; glow: string }
> = {
  violet: { bg: "#7c3aed", hover: "#6d28d9", text: "#c4b5fd", ring: "rgba(124,58,237,0.4)", light: "rgba(124,58,237,0.12)", glow: "rgba(124,58,237,0.3)" },
  blue:   { bg: "#2563eb", hover: "#1d4ed8", text: "#93c5fd", ring: "rgba(37,99,235,0.4)",  light: "rgba(37,99,235,0.12)",  glow: "rgba(37,99,235,0.3)" },
  emerald:{ bg: "#059669", hover: "#047857", text: "#6ee7b7", ring: "rgba(5,150,105,0.4)",  light: "rgba(5,150,105,0.12)",  glow: "rgba(5,150,105,0.3)" },
  rose:   { bg: "#e11d48", hover: "#be123c", text: "#fda4af", ring: "rgba(225,29,72,0.4)",  light: "rgba(225,29,72,0.12)",  glow: "rgba(225,29,72,0.3)" },
  orange: { bg: "#ea580c", hover: "#c2410c", text: "#fdba74", ring: "rgba(234,88,12,0.4)",  light: "rgba(234,88,12,0.12)",  glow: "rgba(234,88,12,0.3)" },
};

// ─── Theme tokens ─────────────────────────────────────────────────────────────

export const THEME_TOKENS = {
  dark: {
    bg:          "#0f0f1a",
    bgAlt:       "#13131f",
    bgCard:      "#17172a",
    border:      "rgba(255,255,255,0.06)",
    borderMuted: "rgba(255,255,255,0.05)",
    text:        "#ffffff",
    textMuted:   "#a1a1aa",
    textFaint:   "#52525b",
    inputBg:     "rgba(255,255,255,0.05)",
  },
  light: {
    bg:          "#f8f7ff",
    bgAlt:       "#ffffff",
    bgCard:      "#ffffff",
    border:      "rgba(0,0,0,0.08)",
    borderMuted: "rgba(0,0,0,0.06)",
    text:        "#0f0f1a",
    textMuted:   "#52525b",
    textFaint:   "#a1a1aa",
    inputBg:     "rgba(0,0,0,0.04)",
  },
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS: Preferences = {
  theme: "dark",
  boardLayout: "cards",
  sidebarOpen: true,
  accentColor: "violet",
};

const STORAGE_KEY = "collab_prefs";

// ─── Context ──────────────────────────────────────────────────────────────────

const PreferencesContext = createContext<PreferencesContextValue>({
  prefs: DEFAULTS,
  setTheme: () => {},
  setBoardLayout: () => {},
  setSidebarOpen: () => {},
  setAccentColor: () => {},
});

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setPrefs({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch { /* ignore */ }
  }, []);

  const update = useCallback((patch: Partial<Preferences>) => {
    setPrefs(prev => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return (
    <PreferencesContext.Provider value={{
      prefs,
      setTheme:       t => update({ theme: t }),
      setBoardLayout: l => update({ boardLayout: l }),
      setSidebarOpen: v => update({ sidebarOpen: v }),
      setAccentColor: c => update({ accentColor: c }),
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
