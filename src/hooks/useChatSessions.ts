import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  timestamp: number;
};

export type ChatSession = {
  id: string;
  name: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};

const SESSIONS_KEY = "zexiq-chat-sessions";
const ACTIVE_SESSION_KEY = "zexiq-active-session";

function loadSessions(): ChatSession[] {
  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load sessions:", e);
  }
  return [];
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error("Failed to save sessions:", e);
  }
}

function loadActiveSessionId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_SESSION_KEY);
  } catch {
    return null;
  }
}

function saveActiveSessionId(id: string | null) {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_SESSION_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  } catch (e) {
    console.error("Failed to save active session:", e);
  }
}

function generateSessionName(messages: Message[]): string {
  if (messages.length === 0) return "New Chat";
  const firstUserMessage = messages.find(m => m.role === "user");
  if (firstUserMessage) {
    const truncated = firstUserMessage.content.slice(0, 30);
    return truncated + (firstUserMessage.content.length > 30 ? "..." : "");
  }
  return "New Chat";
}

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const loaded = loadSessions();
    // Migrate from old single-chat format
    if (loaded.length === 0) {
      try {
        const oldHistory = localStorage.getItem("zexiq-chat-history");
        if (oldHistory) {
          const oldMessages = JSON.parse(oldHistory) as Message[];
          if (oldMessages.length > 0) {
            const migratedSession: ChatSession = {
              id: crypto.randomUUID(),
              name: generateSessionName(oldMessages),
              messages: oldMessages,
              createdAt: oldMessages[0]?.timestamp || Date.now(),
              updatedAt: Date.now(),
            };
            localStorage.removeItem("zexiq-chat-history");
            return [migratedSession];
          }
        }
      } catch {
        // Ignore migration errors
      }
    }
    return loaded;
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    const storedId = loadActiveSessionId();
    const loaded = loadSessions();
    if (storedId && loaded.some(s => s.id === storedId)) {
      return storedId;
    }
    return loaded[0]?.id || null;
  });

  // Persist sessions
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  // Persist active session
  useEffect(() => {
    saveActiveSessionId(activeSessionId);
  }, [activeSessionId]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  const createSession = useCallback(() => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      name: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    return newSession.id;
  }, []);

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      // If we're deleting the active session, switch to another
      if (sessionId === activeSessionId) {
        setActiveSessionId(filtered[0]?.id || null);
      }
      return filtered;
    });
    toast.success("Session deleted");
  }, [activeSessionId]);

  const renameSession = useCallback((sessionId: string, newName: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, name: newName, updatedAt: Date.now() } : s
    ));
  }, []);

  const updateSessionMessages = useCallback((sessionId: string, messages: Message[]) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const autoName = s.messages.length === 0 && messages.length > 0 
          ? generateSessionName(messages) 
          : s.name;
        return { ...s, messages, name: autoName, updatedAt: Date.now() };
      }
      return s;
    }));
  }, []);

  const clearSessionMessages = useCallback((sessionId: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, messages: [], name: "New Chat", updatedAt: Date.now() } : s
    ));
    toast.success("Chat cleared");
  }, []);

  return {
    sessions,
    activeSession,
    activeSessionId,
    createSession,
    selectSession,
    deleteSession,
    renameSession,
    updateSessionMessages,
    clearSessionMessages,
  };
}
