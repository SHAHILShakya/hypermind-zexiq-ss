import { useState, useCallback, useEffect } from "react";

// ==================== TYPES ====================

export type TruthMode = "comfort" | "honest" | "brutal";
export type MoodState = "calm" | "focused" | "stressed" | "curious" | "reflective" | "neutral";

export interface IdentityRule {
  id: string;
  rule: string;
  enabled: boolean;
  createdAt: number;
}

export interface PersonaDrift {
  strategist: number; // 0-100
  psychologist: number;
  creator: number;
  teacher: number;
  challenger: number;
}

export interface AISettings {
  // Mirror Mode
  mirrorModeEnabled: boolean;
  
  // Truth Permission
  truthMode: TruthMode;
  
  // Identity Lock
  identityRules: IdentityRule[];
  
  // Time Perspective
  timePerspectiveEnabled: boolean;
  
  // Mood Sync (auto-theme based on mood)
  moodSyncEnabled: boolean;
  
  // Silence Aware
  silenceAwareEnabled: boolean;
  
  // Persona weights (evolve based on usage)
  personaDrift: PersonaDrift;
  
  // Detected mood (updated based on user behavior)
  currentMood: MoodState;
  
  // Theme-bound personality enabled
  themeBoundPersonality: boolean;
}

const DEFAULT_SETTINGS: AISettings = {
  mirrorModeEnabled: false,
  truthMode: "honest",
  identityRules: [],
  timePerspectiveEnabled: false,
  moodSyncEnabled: true,
  silenceAwareEnabled: true,
  personaDrift: {
    strategist: 50,
    psychologist: 50,
    creator: 50,
    teacher: 50,
    challenger: 50,
  },
  currentMood: "neutral",
  themeBoundPersonality: true,
};

const SETTINGS_KEY = "zexiq-ai-settings";

function loadSettings(): AISettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AISettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}

// ==================== MOOD DETECTION ====================

interface TypingMetrics {
  lastKeystroke: number;
  typingSpeed: number; // chars per second
  messageLength: number;
  emotionalKeywords: string[];
}

const EMOTIONAL_PATTERNS = {
  stressed: ["urgent", "help", "stuck", "frustrated", "confused", "lost", "overwhelmed", "panic", "stress", "anxiety"],
  curious: ["why", "how", "what if", "curious", "wonder", "explore", "learn", "understand", "explain"],
  focused: ["specifically", "exactly", "precise", "need to", "must", "critical", "important", "deadline"],
  calm: ["thanks", "appreciate", "nice", "good", "great", "relaxed", "easy", "simple"],
  reflective: ["thinking", "consider", "reflect", "ponder", "meaning", "purpose", "life", "decision"],
};

export function detectMood(text: string, metrics: TypingMetrics): MoodState {
  const lowerText = text.toLowerCase();
  
  // Check for emotional keywords
  for (const [mood, keywords] of Object.entries(EMOTIONAL_PATTERNS)) {
    if (keywords.some(k => lowerText.includes(k))) {
      return mood as MoodState;
    }
  }
  
  // Analyze typing patterns
  if (metrics.typingSpeed > 8) {
    return "stressed"; // Fast typing suggests urgency
  }
  if (metrics.messageLength < 20) {
    return "calm"; // Short messages suggest calm or simplicity
  }
  if (metrics.messageLength > 200) {
    return "reflective"; // Long messages suggest deep thinking
  }
  
  return "neutral";
}

// ==================== THEME-MOOD MAPPING ====================

export const MOOD_THEME_MAP: Record<MoodState, string> = {
  calm: "glass",
  focused: "emerald", // Matrix theme for focus
  stressed: "glass-dark", // Calming dark mode
  curious: "aurora", // Exploratory, northern lights
  reflective: "midnight", // Deep, contemplative
  neutral: "glass-dark",
};

// ==================== THEME PERSONALITY MAP ====================

export const THEME_PERSONALITY_MAP: Record<string, { tone: string; style: string; traits: string[] }> = {
  glass: {
    tone: "warm, approachable, and supportive",
    style: "gentle, human-like communication with emotional awareness",
    traits: ["empathetic", "nurturing", "patient"],
  },
  "glass-dark": {
    tone: "calm, professional, and thoughtful",
    style: "balanced communication with depth and clarity",
    traits: ["composed", "insightful", "reliable"],
  },
  "glass-warm": {
    tone: "friendly, encouraging, and optimistic",
    style: "positive reinforcement with warmth",
    traits: ["cheerful", "supportive", "motivating"],
  },
  cyber: {
    tone: "precise, futuristic, and efficient",
    style: "direct, data-driven responses with technical precision",
    traits: ["analytical", "cutting-edge", "minimalist"],
  },
  midnight: {
    tone: "authoritative, confident, and wise",
    style: "commanding presence with deep insights",
    traits: ["decisive", "strategic", "experienced"],
  },
  aurora: {
    tone: "poetic, abstract, and creative",
    style: "imaginative language with metaphorical depth",
    traits: ["artistic", "visionary", "ethereal"],
  },
  sunset: {
    tone: "passionate, bold, and energetic",
    style: "vibrant communication with enthusiasm",
    traits: ["dynamic", "inspiring", "warm"],
  },
  emerald: {
    tone: "cold, precise, and hacker-style",
    style: "minimal, code-like responses with technical focus",
    traits: ["logical", "efficient", "technical"],
  },
  rose: {
    tone: "elegant, refined, and sophisticated",
    style: "graceful communication with aesthetic awareness",
    traits: ["stylish", "thoughtful", "graceful"],
  },
  monochrome: {
    tone: "stark, honest, and minimalist",
    style: "stripped-down, essential communication",
    traits: ["direct", "honest", "unadorned"],
  },
};

// ==================== TRUTH MODE PROMPTS ====================

export const TRUTH_MODE_PROMPTS: Record<TruthMode, string> = {
  comfort: `You are in COMFORT MODE. Be supportive, gentle, and encouraging. Focus on positive aspects while still being helpful. Avoid harsh criticism. Validate the user's feelings and efforts. When giving feedback, sandwich it with encouragement.`,
  
  honest: `You are in HONEST MODE. Be balanced and realistic. Provide truthful assessments while remaining respectful. Don't sugarcoat issues, but don't be unnecessarily harsh either. Give constructive feedback with actionable suggestions.`,
  
  brutal: `You are in BRUTAL TRUTH MODE. The user has explicitly requested unfiltered honesty. Be direct, no-nonsense, and skip pleasantries. Point out flaws immediately. Challenge assumptions aggressively. Don't soften your words. However, remain respectful and never be cruel - brutal honesty serves growth, not destruction.`,
};

// ==================== MIRROR MODE PROMPT ====================

export const MIRROR_MODE_PROMPT = `You are in MIRROR MODE. Instead of answering directly, your primary role is to reflect the user's intent through deep, clarifying questions. Help them think through their own situation by asking:
- "Why does this question matter to you right now?"
- "What outcome are you hoping for?"
- "What would you do if you already knew the answer?"
- "What are you avoiding by asking this?"
- "What would you choose if fear was removed?"

Only provide direct answers after thorough reflection. Prioritize self-awareness and clarity over quick solutions.`;

// ==================== TIME PERSPECTIVE PROMPT ====================

export const TIME_PERSPECTIVE_PROMPT = `For important decisions or questions, structure your response with TIME PERSPECTIVES:

**⏱️ NOW** (Immediate actions)
[What to do right now, immediate steps]

**📅 6 MONTHS** (Medium-term impact)
[How this plays out over the next 6 months, what to expect]

**🌟 5 YEARS** (Long-term consequences)
[Long-term life implications, how this shapes the future]

This helps the user make decisions with future awareness, not just immediate impulse.`;

// ==================== HOOK ====================

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(loadSettings);
  const [typingMetrics, setTypingMetrics] = useState<TypingMetrics>({
    lastKeystroke: Date.now(),
    typingSpeed: 0,
    messageLength: 0,
    emotionalKeywords: [],
  });

  // Save on change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Update mood based on typing
  const updateMoodFromText = useCallback((text: string) => {
    const newMood = detectMood(text, typingMetrics);
    if (newMood !== settings.currentMood) {
      setSettings(prev => ({ ...prev, currentMood: newMood }));
    }
    return newMood;
  }, [typingMetrics, settings.currentMood]);

  // Track typing speed
  const recordKeystroke = useCallback(() => {
    const now = Date.now();
    const timeSinceLast = now - typingMetrics.lastKeystroke;
    const speed = timeSinceLast > 0 ? 1000 / timeSinceLast : 0;
    
    setTypingMetrics(prev => ({
      ...prev,
      lastKeystroke: now,
      typingSpeed: (prev.typingSpeed + speed) / 2, // Rolling average
    }));
  }, [typingMetrics.lastKeystroke]);

  // Update message length metric
  const updateMessageLength = useCallback((length: number) => {
    setTypingMetrics(prev => ({ ...prev, messageLength: length }));
  }, []);

  // Toggle mirror mode
  const toggleMirrorMode = useCallback(() => {
    setSettings(prev => ({ ...prev, mirrorModeEnabled: !prev.mirrorModeEnabled }));
  }, []);

  // Set truth mode
  const setTruthMode = useCallback((mode: TruthMode) => {
    setSettings(prev => ({ ...prev, truthMode: mode }));
  }, []);

  // Add identity rule
  const addIdentityRule = useCallback((rule: string) => {
    const newRule: IdentityRule = {
      id: crypto.randomUUID(),
      rule,
      enabled: true,
      createdAt: Date.now(),
    };
    setSettings(prev => ({
      ...prev,
      identityRules: [...prev.identityRules, newRule],
    }));
  }, []);

  // Remove identity rule
  const removeIdentityRule = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      identityRules: prev.identityRules.filter(r => r.id !== id),
    }));
  }, []);

  // Toggle identity rule
  const toggleIdentityRule = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      identityRules: prev.identityRules.map(r =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ),
    }));
  }, []);

  // Toggle time perspective
  const toggleTimePerspective = useCallback(() => {
    setSettings(prev => ({ ...prev, timePerspectiveEnabled: !prev.timePerspectiveEnabled }));
  }, []);

  // Toggle mood sync
  const toggleMoodSync = useCallback(() => {
    setSettings(prev => ({ ...prev, moodSyncEnabled: !prev.moodSyncEnabled }));
  }, []);

  // Toggle silence aware
  const toggleSilenceAware = useCallback(() => {
    setSettings(prev => ({ ...prev, silenceAwareEnabled: !prev.silenceAwareEnabled }));
  }, []);

  // Toggle theme-bound personality
  const toggleThemeBoundPersonality = useCallback(() => {
    setSettings(prev => ({ ...prev, themeBoundPersonality: !prev.themeBoundPersonality }));
  }, []);

  // Update persona drift based on conversation type
  const updatePersonaDrift = useCallback((category: keyof PersonaDrift, delta: number) => {
    setSettings(prev => ({
      ...prev,
      personaDrift: {
        ...prev.personaDrift,
        [category]: Math.max(0, Math.min(100, prev.personaDrift[category] + delta)),
      },
    }));
  }, []);

  // Build system prompt based on settings
  const buildDynamicPrompt = useCallback((themeId: string) => {
    const parts: string[] = [];
    
    // Truth mode
    parts.push(TRUTH_MODE_PROMPTS[settings.truthMode]);
    
    // Mirror mode
    if (settings.mirrorModeEnabled) {
      parts.push(MIRROR_MODE_PROMPT);
    }
    
    // Time perspective
    if (settings.timePerspectiveEnabled) {
      parts.push(TIME_PERSPECTIVE_PROMPT);
    }
    
    // Identity rules
    const activeRules = settings.identityRules.filter(r => r.enabled);
    if (activeRules.length > 0) {
      parts.push(`\n## IDENTITY LOCK RULES (You MUST follow these at all times)\n${activeRules.map(r => `- ${r.rule}`).join("\n")}`);
    }
    
    // Theme-bound personality
    if (settings.themeBoundPersonality) {
      const personality = THEME_PERSONALITY_MAP[themeId] || THEME_PERSONALITY_MAP["glass-dark"];
      parts.push(`\n## CURRENT PERSONALITY (Theme: ${themeId})\nTone: ${personality.tone}\nStyle: ${personality.style}\nKey traits: ${personality.traits.join(", ")}`);
    }
    
    // Mood-aware response
    if (settings.currentMood !== "neutral") {
      parts.push(`\n## DETECTED USER MOOD: ${settings.currentMood.toUpperCase()}\nAdapt your response style to match this emotional state.`);
    }
    
    // Persona drift
    const dominantPersona = Object.entries(settings.personaDrift)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([k]) => k)
      .join(" + ");
    parts.push(`\n## EVOLVED PERSONA BLEND: ${dominantPersona}\nYour personality has naturally evolved based on conversation patterns.`);
    
    return parts.join("\n\n");
  }, [settings]);

  return {
    settings,
    typingMetrics,
    updateMoodFromText,
    recordKeystroke,
    updateMessageLength,
    toggleMirrorMode,
    setTruthMode,
    addIdentityRule,
    removeIdentityRule,
    toggleIdentityRule,
    toggleTimePerspective,
    toggleMoodSync,
    toggleSilenceAware,
    toggleThemeBoundPersonality,
    updatePersonaDrift,
    buildDynamicPrompt,
  };
}
