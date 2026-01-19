import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  name: string; // Changed from 'title' to match useChatSessions interface
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export function useDatabaseSessions() {
  const { user, isAuthenticated } = useAuthContext();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load sessions from database
  const loadSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      if (!sessionsData || sessionsData.length === 0) {
        setSessions([]);
        setIsLoading(false);
        return;
      }

      // Load messages for all sessions
      const { data: messagesData, error: messagesError } = await supabase
        .from("chat_messages")
        .select("*")
        .in("session_id", sessionsData.map(s => s.id))
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      const formattedSessions: ChatSession[] = sessionsData.map(session => ({
        id: session.id,
        name: session.title, // Map 'title' from DB to 'name' for interface compatibility
        createdAt: new Date(session.created_at).getTime(),
        updatedAt: new Date(session.updated_at).getTime(),
        messages: (messagesData || [])
          .filter(m => m.session_id === session.id)
          .map(m => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            image: m.image_url || undefined,
            timestamp: new Date(m.created_at).getTime(),
          })),
      }));

      setSessions(formattedSessions);
      
      // Set active session to the most recent one if none selected
      if (!activeSessionId && formattedSessions.length > 0) {
        setActiveSessionId(formattedSessions[0].id);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Failed to load chat history");
    } finally {
      setIsLoading(false);
    }
  }, [user, activeSessionId]);

  useEffect(() => {
    if (isAuthenticated) {
      loadSessions();
    } else {
      setSessions([]);
      setActiveSessionId(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, loadSessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  const createSession = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          title: "New Chat",
        })
        .select()
        .single();

      if (error) throw error;

      const newSession: ChatSession = {
        id: data.id,
        name: data.title,
        messages: [],
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: new Date(data.updated_at).getTime(),
      };

      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      return newSession;
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create new chat");
      return null;
    }
  }, [user]);

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;

      setSessions(prev => {
        const updated = prev.filter(s => s.id !== sessionId);
        if (activeSessionId === sessionId) {
          setActiveSessionId(updated[0]?.id || null);
        }
        return updated;
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete chat");
    }
  }, [activeSessionId]);

  const renameSession = useCallback(async (sessionId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from("chat_sessions")
        .update({ title: newName })
        .eq("id", sessionId);

      if (error) throw error;

      setSessions(prev =>
        prev.map(s => (s.id === sessionId ? { ...s, name: newName } : s))
      );
    } catch (error) {
      console.error("Error renaming session:", error);
      toast.error("Failed to rename chat");
    }
  }, []);

  const addMessage = useCallback(async (
    sessionId: string,
    message: Omit<ChatMessage, "id" | "timestamp">
  ) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          session_id: sessionId,
          role: message.role,
          content: message.content,
          image_url: message.image || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newMessage: ChatMessage = {
        id: data.id,
        role: data.role as "user" | "assistant",
        content: data.content,
        image: data.image_url || undefined,
        timestamp: Date.now(),
      };

      setSessions(prev =>
        prev.map(s =>
          s.id === sessionId
            ? { ...s, messages: [...s.messages, newMessage], updatedAt: Date.now() }
            : s
        )
      );

      // Auto-generate title from first user message
      const session = sessions.find(s => s.id === sessionId);
      if (session && session.messages.length === 0 && message.role === "user") {
        const title = message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "");
        await renameSession(sessionId, title);
      }

      return newMessage;
    } catch (error) {
      console.error("Error adding message:", error);
      toast.error("Failed to save message");
      return null;
    }
  }, [sessions, renameSession]);

  const updateMessage = useCallback(async (
    sessionId: string,
    messageId: string,
    content: string
  ) => {
    setSessions(prev =>
      prev.map(s =>
        s.id === sessionId
          ? {
              ...s,
              messages: s.messages.map(m =>
                m.id === messageId ? { ...m, content } : m
              ),
            }
          : s
      )
    );
  }, []);

  const clearSessionMessages = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("session_id", sessionId);

      if (error) throw error;

      setSessions(prev =>
        prev.map(s =>
          s.id === sessionId ? { ...s, messages: [], updatedAt: Date.now() } : s
        )
      );
    } catch (error) {
      console.error("Error clearing messages:", error);
      toast.error("Failed to clear chat");
    }
  }, []);

  return {
    sessions,
    activeSession,
    activeSessionId,
    isLoading,
    createSession,
    selectSession,
    deleteSession,
    renameSession,
    addMessage,
    updateMessage,
    clearSessionMessages,
    refreshSessions: loadSessions,
  };
}
