import { useState, useCallback, useEffect } from "react";

export type ThemeId = 
  | "glass" 
  | "glass-dark" 
  | "glass-warm" 
  | "cyber" 
  | "midnight" 
  | "aurora" 
  | "sunset" 
  | "emerald" 
  | "rose"
  | "monochrome"
  | string; // Allow custom theme IDs

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  style: "glass" | "neon" | "minimal";
  colors: {
    background: string;
    foreground: string;
    card: string;
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
  };
  personality?: {
    tone: string;
    style: string;
    traits: string[];
  };
  isCustom?: boolean;
}

export const defaultThemes: Theme[] = [
  // GLASS THEMES (iOS Style)
  {
    id: "glass",
    name: "Glass Light",
    description: "Clean iOS-style frosted glass",
    style: "glass",
    colors: {
      background: "220 20% 97%",
      foreground: "220 20% 10%",
      card: "0 0% 100%",
      primary: "220 90% 56%",
      secondary: "280 70% 60%",
      accent: "220 90% 50%",
      muted: "220 15% 92%",
    },
  },
  {
    id: "glass-dark",
    name: "Glass Dark",
    description: "Dark mode frosted glass",
    style: "glass",
    colors: {
      background: "230 25% 9%",
      foreground: "220 20% 98%",
      card: "230 25% 14%",
      primary: "220 90% 60%",
      secondary: "280 70% 65%",
      accent: "220 90% 55%",
      muted: "230 20% 18%",
    },
  },
  {
    id: "glass-warm",
    name: "Glass Warm",
    description: "Warm tinted frosted glass",
    style: "glass",
    colors: {
      background: "30 30% 96%",
      foreground: "30 20% 10%",
      card: "30 20% 100%",
      primary: "25 95% 55%",
      secondary: "340 70% 55%",
      accent: "25 95% 50%",
      muted: "30 20% 90%",
    },
  },
  // NEON THEMES
  {
    id: "cyber",
    name: "Cyber Neon",
    description: "Electric cyan & purple glow",
    style: "neon",
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
    name: "Midnight Gold",
    description: "Deep blue with gold accents",
    style: "neon",
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
    name: "Aurora",
    description: "Northern lights green & teal",
    style: "neon",
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
    style: "neon",
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
    name: "Matrix",
    description: "Classic hacker aesthetic",
    style: "neon",
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
    style: "neon",
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
  // MINIMAL THEMES
  {
    id: "monochrome",
    name: "Monochrome",
    description: "Clean black & white minimal",
    style: "minimal",
    colors: {
      background: "0 0% 4%",
      foreground: "0 0% 98%",
      card: "0 0% 8%",
      primary: "0 0% 98%",
      secondary: "0 0% 70%",
      accent: "0 0% 90%",
      muted: "0 0% 14%",
    },
  },
];

const THEME_KEY = "zexiq-theme";
const CUSTOM_THEMES_KEY = "zexiq-custom-themes";

function loadTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) {
      return stored as ThemeId;
    }
  } catch {
    // Ignore
  }
  return "glass-dark"; // Default to glass dark theme
}

function loadCustomThemes(): Theme[] {
  try {
    const stored = localStorage.getItem(CUSTOM_THEMES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }
  return [];
}

function saveCustomThemes(themes: Theme[]) {
  try {
    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
  } catch {
    // Ignore
  }
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
  root.style.setProperty("--border", `${theme.colors.muted.split(" ")[0]} 30% 20%`);
  root.style.setProperty("--input", theme.colors.muted);
  root.style.setProperty("--ring", theme.colors.primary);
  root.style.setProperty("--glow-primary", theme.colors.primary);
  root.style.setProperty("--glow-secondary", theme.colors.secondary);
  root.style.setProperty("--text-gradient-start", `${theme.colors.primary.split(" ")[0]} 100% 60%`);
  root.style.setProperty("--text-gradient-end", `${theme.colors.secondary.split(" ")[0]} 80% 65%`);
  
  // Apply theme style class
  root.classList.remove("theme-glass", "theme-neon", "theme-minimal");
  root.classList.add(`theme-${theme.style}`);
  
  // Light/dark mode for glass themes
  if (theme.id === "glass" || theme.id === "glass-warm") {
    root.classList.add("light-mode");
    root.classList.remove("dark-mode");
  } else {
    root.classList.add("dark-mode");
    root.classList.remove("light-mode");
  }
}

export function useTheme() {
  const [themeId, setThemeId] = useState<ThemeId>(loadTheme);
  const [customThemes, setCustomThemes] = useState<Theme[]>(loadCustomThemes);

  // Combine default and custom themes
  const themes = [...defaultThemes, ...customThemes];
  const currentTheme = themes.find(t => t.id === themeId) || defaultThemes[0];

  // Apply theme on mount and change
  useEffect(() => {
    applyTheme(currentTheme);
    localStorage.setItem(THEME_KEY, themeId);
  }, [themeId, currentTheme]);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
  }, []);

  // Add custom theme
  const addCustomTheme = useCallback((theme: Theme) => {
    const themeWithFlag = { ...theme, isCustom: true };
    setCustomThemes(prev => {
      const updated = [...prev, themeWithFlag];
      saveCustomThemes(updated);
      return updated;
    });
  }, []);

  // Delete custom theme
  const deleteCustomTheme = useCallback((id: string) => {
    setCustomThemes(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveCustomThemes(updated);
      // If we deleted the active theme, switch to default
      if (id === themeId) {
        setThemeId("glass-dark");
      }
      return updated;
    });
  }, [themeId]);

  // Get personality for current theme (including custom)
  const getThemePersonality = useCallback(() => {
    if (currentTheme.personality) {
      return currentTheme.personality;
    }
    // Fall back to default personality based on style
    const defaults = {
      glass: { tone: "calm, professional, and thoughtful", style: "balanced communication with depth and clarity", traits: ["composed", "insightful", "reliable"] },
      neon: { tone: "precise, futuristic, and efficient", style: "direct, data-driven responses with technical precision", traits: ["analytical", "cutting-edge", "minimalist"] },
      minimal: { tone: "stark, honest, and minimalist", style: "stripped-down, essential communication", traits: ["direct", "honest", "unadorned"] },
    };
    return defaults[currentTheme.style];
  }, [currentTheme]);

  return {
    theme: currentTheme,
    themeId,
    themes,
    customThemes,
    setTheme,
    addCustomTheme,
    deleteCustomTheme,
    getThemePersonality,
  };
}
