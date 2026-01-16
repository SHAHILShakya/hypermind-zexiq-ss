import { useState, useCallback, useEffect } from "react";
import type { MoodState, PersonaDrift } from "./useAISettings";

// ==================== TYPES ====================

export interface MoodHistoryEntry {
  timestamp: number;
  mood: MoodState;
  messageCount: number;
}

export interface PersonaDriftEntry {
  timestamp: number;
  drift: PersonaDrift;
}

export interface ConversationStats {
  totalMessages: number;
  totalSessions: number;
  averageSessionLength: number;
  mostFrequentMood: MoodState;
  moodDistribution: Record<MoodState, number>;
}

export interface ConversationAnalytics {
  moodHistory: MoodHistoryEntry[];
  personaDriftHistory: PersonaDriftEntry[];
  stats: ConversationStats;
  lastUpdated: number;
}

const ANALYTICS_KEY = "zexiq-conversation-analytics";
const MAX_HISTORY_ENTRIES = 100;

const DEFAULT_ANALYTICS: ConversationAnalytics = {
  moodHistory: [],
  personaDriftHistory: [],
  stats: {
    totalMessages: 0,
    totalSessions: 0,
    averageSessionLength: 0,
    mostFrequentMood: "neutral",
    moodDistribution: {
      calm: 0,
      focused: 0,
      stressed: 0,
      curious: 0,
      reflective: 0,
      neutral: 0,
    },
  },
  lastUpdated: Date.now(),
};

function loadAnalytics(): ConversationAnalytics {
  try {
    const stored = localStorage.getItem(ANALYTICS_KEY);
    if (stored) {
      return { ...DEFAULT_ANALYTICS, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore
  }
  return DEFAULT_ANALYTICS;
}

function saveAnalytics(analytics: ConversationAnalytics) {
  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
  } catch {
    // Ignore
  }
}

// ==================== HOOK ====================

export function useConversationAnalytics() {
  const [analytics, setAnalytics] = useState<ConversationAnalytics>(loadAnalytics);

  // Save on change
  useEffect(() => {
    saveAnalytics(analytics);
  }, [analytics]);

  // Record mood
  const recordMood = useCallback((mood: MoodState, messageCount: number) => {
    setAnalytics((prev) => {
      const newEntry: MoodHistoryEntry = {
        timestamp: Date.now(),
        mood,
        messageCount,
      };

      // Keep only last MAX_HISTORY_ENTRIES
      const newHistory = [...prev.moodHistory, newEntry].slice(-MAX_HISTORY_ENTRIES);

      // Update mood distribution
      const newDistribution = { ...prev.stats.moodDistribution };
      newDistribution[mood] = (newDistribution[mood] || 0) + 1;

      // Find most frequent mood
      const mostFrequentMood = Object.entries(newDistribution).reduce((a, b) =>
        a[1] > b[1] ? a : b
      )[0] as MoodState;

      return {
        ...prev,
        moodHistory: newHistory,
        stats: {
          ...prev.stats,
          totalMessages: prev.stats.totalMessages + 1,
          moodDistribution: newDistribution,
          mostFrequentMood,
        },
        lastUpdated: Date.now(),
      };
    });
  }, []);

  // Record persona drift
  const recordPersonaDrift = useCallback((drift: PersonaDrift) => {
    setAnalytics((prev) => {
      const newEntry: PersonaDriftEntry = {
        timestamp: Date.now(),
        drift: { ...drift },
      };

      // Keep only last MAX_HISTORY_ENTRIES
      const newHistory = [...prev.personaDriftHistory, newEntry].slice(-MAX_HISTORY_ENTRIES);

      return {
        ...prev,
        personaDriftHistory: newHistory,
        lastUpdated: Date.now(),
      };
    });
  }, []);

  // Record new session
  const recordNewSession = useCallback(() => {
    setAnalytics((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        totalSessions: prev.stats.totalSessions + 1,
      },
      lastUpdated: Date.now(),
    }));
  }, []);

  // Update average session length
  const updateSessionLength = useCallback((messageCount: number) => {
    setAnalytics((prev) => {
      const totalSessions = prev.stats.totalSessions || 1;
      const currentAvg = prev.stats.averageSessionLength;
      const newAvg = ((currentAvg * (totalSessions - 1)) + messageCount) / totalSessions;

      return {
        ...prev,
        stats: {
          ...prev.stats,
          averageSessionLength: Math.round(newAvg * 10) / 10,
        },
        lastUpdated: Date.now(),
      };
    });
  }, []);

  // Clear analytics
  const clearAnalytics = useCallback(() => {
    setAnalytics(DEFAULT_ANALYTICS);
  }, []);

  // Get mood data for chart (last 24 hours by default)
  const getMoodChartData = useCallback((hoursBack: number = 24) => {
    const cutoff = Date.now() - hoursBack * 60 * 60 * 1000;
    return analytics.moodHistory
      .filter((entry) => entry.timestamp >= cutoff)
      .map((entry) => ({
        time: new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        timestamp: entry.timestamp,
        mood: entry.mood,
        moodValue: getMoodValue(entry.mood),
        messages: entry.messageCount,
      }));
  }, [analytics.moodHistory]);

  // Get persona drift chart data
  const getPersonaDriftChartData = useCallback(() => {
    return analytics.personaDriftHistory.slice(-20).map((entry, index) => ({
      index: index + 1,
      ...entry.drift,
      timestamp: entry.timestamp,
    }));
  }, [analytics.personaDriftHistory]);

  // Get mood distribution for pie chart
  const getMoodDistributionData = useCallback(() => {
    return Object.entries(analytics.stats.moodDistribution)
      .filter(([_, count]) => count > 0)
      .map(([mood, count]) => ({
        name: mood.charAt(0).toUpperCase() + mood.slice(1),
        value: count,
        mood: mood as MoodState,
      }));
  }, [analytics.stats.moodDistribution]);

  return {
    analytics,
    recordMood,
    recordPersonaDrift,
    recordNewSession,
    updateSessionLength,
    clearAnalytics,
    getMoodChartData,
    getPersonaDriftChartData,
    getMoodDistributionData,
  };
}

// Helper function to convert mood to numeric value for charting
function getMoodValue(mood: MoodState): number {
  const values: Record<MoodState, number> = {
    stressed: 1,
    neutral: 2,
    calm: 3,
    curious: 4,
    focused: 5,
    reflective: 6,
  };
  return values[mood] || 2;
}
