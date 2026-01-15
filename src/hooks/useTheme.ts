import { useState, useCallback, useEffect } from "react";

export type ThemeId = "cyber" | "midnight" | "aurora" | "sunset" | "emerald" | "rose";

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
  };
}

export const themes: Theme[] = [
  {
    id: "cyber",
    name: "Cyber Nexus",
    description: "Electric cyan & deep purple",
    colors: {
      background: "222 47% 4%",
      foreground: "190 100% 95%",
      card: "222 47% 7%",
      primary: "185 100% 50%",
      secondary: "260 80% 55%",
      accent: "185 100% 40%",
      muted: "222 30% 12%",
    },
  },
  {
    id: "midnight",
    name: "Midnight Blue",
    description: "Deep blue with gold accents",
    colors: {
      background: "230 50% 5%",
      foreground: "45 100% 95%",
      card: "230 50% 8%",
      primary: "45 100% 50%",
      secondary: "230 70% 55%",
      accent: "45 100% 40%",
      muted: "230 30% 15%",
    },
  },
  {
    id: "aurora",
    name: "Aurora Borealis",
    description: "Green & teal northern lights",
    colors: {
      background: "200 50% 4%",
      foreground: "150 100% 95%",
      card: "200 50% 7%",
      primary: "160 100% 45%",
      secondary: "180 70% 50%",
      accent: "140 100% 40%",
      muted: "200 30% 12%",
    },
  },
  {
    id: "sunset",
    name: "Neon Sunset",
    description: "Orange & magenta warmth",
    colors: {
      background: "270 40% 5%",
      foreground: "30 100% 95%",
      card: "270 40% 8%",
      primary: "25 100% 55%",
      secondary: "320 80% 55%",
      accent: "35 100% 50%",
      muted: "270 25% 12%",
    },
  },
  {
    id: "emerald",
    name: "Matrix Green",
    description: "Classic hacker aesthetic",
    colors: {
      background: "120 30% 3%",
      foreground: "120 100% 90%",
      card: "120 30% 6%",
      primary: "120 100% 45%",
      secondary: "150 60% 40%",
      accent: "120 80% 35%",
      muted: "120 20% 10%",
    },
  },
  {
    id: "rose",
    name: "Neon Rose",
    description: "Pink & violet elegance",
    colors: {
      background: "280 40% 4%",
      foreground: "330 100% 95%",
      card: "280 40% 7%",
      primary: "330 100% 60%",
      secondary: "280 80% 55%",
      accent: "340 100% 55%",
      muted: "280 25% 12%",
    },
  },
];

const THEME_KEY = "zexiq-theme";

function loadTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored && themes.some(t => t.id === stored)) {
      return stored as ThemeId;
    }
  } catch {
    // Ignore
  }
  return "cyber";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  
  // Apply color values
  root.style.setProperty("--background", theme.colors.background);
  root.style.setProperty("--foreground", theme.colors.foreground);
  root.style.setProperty("--card", theme.colors.card);
  root.style.setProperty("--card-foreground", theme.colors.foreground);
  root.style.setProperty("--popover", theme.colors.card);
  root.style.setProperty("--popover-foreground", theme.colors.foreground);
  root.style.setProperty("--primary", theme.colors.primary);
  root.style.setProperty("--primary-foreground", theme.colors.background);
  root.style.setProperty("--secondary", theme.colors.secondary);
  root.style.setProperty("--secondary-foreground", theme.colors.foreground);
  root.style.setProperty("--muted", theme.colors.muted);
  root.style.setProperty("--muted-foreground", `${theme.colors.foreground.split(" ")[0]} 20% 55%`);
  root.style.setProperty("--accent", theme.colors.accent);
  root.style.setProperty("--accent-foreground", theme.colors.background);
  root.style.setProperty("--border", `${theme.colors.muted.split(" ")[0]} 30% 15%`);
  root.style.setProperty("--input", theme.colors.muted);
  root.style.setProperty("--ring", theme.colors.primary);
  root.style.setProperty("--glow-primary", theme.colors.primary);
  root.style.setProperty("--glow-secondary", theme.colors.secondary);
  root.style.setProperty("--text-gradient-start", `${theme.colors.primary.split(" ")[0]} 100% 60%`);
  root.style.setProperty("--text-gradient-end", `${theme.colors.secondary.split(" ")[0]} 80% 65%`);
}

export function useTheme() {
  const [themeId, setThemeId] = useState<ThemeId>(loadTheme);

  const currentTheme = themes.find(t => t.id === themeId) || themes[0];

  // Apply theme on mount and change
  useEffect(() => {
    applyTheme(currentTheme);
    localStorage.setItem(THEME_KEY, themeId);
  }, [themeId, currentTheme]);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
  }, []);

  return {
    theme: currentTheme,
    themeId,
    themes,
    setTheme,
  };
}
