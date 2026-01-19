import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Message } from "./useChatSessions";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nexus-chat`;

async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export function useNexusChat(
  initialMessages: Message[],
  onMessagesChange: (messages: Message[]) => void
) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const lastUserMessageRef = useRef<{ content: string; image?: File; dynamicPrompt?: string } | null>(null);

  const updateMessages = useCallback((newMessages: Message[]) => {
    setMessages(newMessages);
    onMessagesChange(newMessages);
  }, [onMessagesChange]);

  const sendMessage = useCallback(async (content: string, image?: File, dynamicPrompt?: string) => {
    lastUserMessageRef.current = { content, image, dynamicPrompt };
    
    const token = await getAuthToken();
    if (!token) {
      toast.error("Please sign in to use chat");
      return null;
    }

    let imageBase64: string | undefined;
    if (image) {
      imageBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(image);
      });
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      image: imageBase64,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    updateMessages(updatedMessages);
    setIsLoading(true);

    const apiMessages = updatedMessages.map((m) => {
      if (m.image) {
        return {
          role: m.role,
          content: [
            { type: "text", text: m.content || "Analyze this image" },
            { type: "image_url", image_url: { url: m.image } },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    const assistantId = crypto.randomUUID();

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: apiMessages, dynamicPrompt }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        if (resp.status === 401) throw new Error("Please sign in to continue");
        if (resp.status === 429) throw new Error(errorData.error || "Rate limited");
        if (resp.status === 402) throw new Error(errorData.error || "Quota reached");
        throw new Error(errorData.error || "Failed to get response");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      const withAssistant = [...updatedMessages, { id: assistantId, role: "assistant" as const, content: "", timestamp: Date.now() }];
      updateMessages(withAssistant);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "" || !line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (deltaContent) {
              assistantContent += deltaContent;
              updateMessages(withAssistant.map((m) => m.id === assistantId ? { ...m, content: assistantContent } : m));
            }
          } catch { break; }
        }
      }

      return assistantId;
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
      updateMessages(messages);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages, updateMessages]);

  const regenerateResponse = useCallback(async (dynamicPrompt?: string) => {
    if (messages.length < 2) return;
    const token = await getAuthToken();
    if (!token) { toast.error("Please sign in"); return; }

    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") { lastUserIndex = i; break; }
    }
    if (lastUserIndex === -1) return;

    const userMessage = messages[lastUserIndex];
    const messagesBeforeUser = messages.slice(0, lastUserIndex);
    updateMessages(messagesBeforeUser);
    setMessages(messagesBeforeUser);
    setIsLoading(true);

    const apiMessages = [...messagesBeforeUser, userMessage].map((m) => {
      if (m.image) return { role: m.role, content: [{ type: "text", text: m.content || "Analyze this image" }, { type: "image_url", image_url: { url: m.image } }] };
      return { role: m.role, content: m.content };
    });

    const withUser = [...messagesBeforeUser, userMessage];
    updateMessages(withUser);
    const assistantId = crypto.randomUUID();

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: apiMessages, dynamicPrompt }),
      });
      if (!resp.ok || !resp.body) throw new Error("Failed to regenerate");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";
      const withAssistant = [...withUser, { id: assistantId, role: "assistant" as const, content: "", timestamp: Date.now() }];
      updateMessages(withAssistant);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            if (deltaContent) { assistantContent += deltaContent; updateMessages(withAssistant.map((m) => m.id === assistantId ? { ...m, content: assistantContent } : m)); }
          } catch { break; }
        }
      }
      toast.success("Response regenerated");
    } catch (error) { console.error("Regenerate error:", error); toast.error("Failed to regenerate"); }
    finally { setIsLoading(false); }
  }, [messages, updateMessages]);

  const clearMessages = useCallback(() => { updateMessages([]); toast.success("Chat cleared"); }, [updateMessages]);
  const exportChat = useCallback(() => {
    const blob = new Blob([JSON.stringify(messages.map((m) => ({ role: m.role, content: m.content, timestamp: new Date(m.timestamp).toISOString() })), null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `zexiq-chat-${Date.now()}.json`; a.click();
    toast.success("Chat exported");
  }, [messages]);
  const setInitialMessages = useCallback((newMessages: Message[]) => setMessages(newMessages), []);

  const editAndResend = useCallback(async (messageId: string, newContent: string, dynamicPrompt?: string) => {
    const token = await getAuthToken();
    if (!token) { toast.error("Please sign in"); return; }
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    const messagesBeforeEdit = messages.slice(0, messageIndex);
    updateMessages(messagesBeforeEdit);
    setMessages(messagesBeforeEdit);
    const editedMessage: Message = { id: crypto.randomUUID(), role: "user", content: newContent, timestamp: Date.now() };
    const withEditedMessage = [...messagesBeforeEdit, editedMessage];
    updateMessages(withEditedMessage);
    setIsLoading(true);
    const apiMessages = withEditedMessage.map((m) => m.image ? { role: m.role, content: [{ type: "text", text: m.content || "Analyze" }, { type: "image_url", image_url: { url: m.image } }] } : { role: m.role, content: m.content });
    const assistantId = crypto.randomUUID();
    try {
      const resp = await fetch(CHAT_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ messages: apiMessages, dynamicPrompt }) });
      if (!resp.ok || !resp.body) throw new Error("Failed");
      const reader = resp.body.getReader(); const decoder = new TextDecoder(); let textBuffer = ""; let assistantContent = "";
      const withAssistant = [...withEditedMessage, { id: assistantId, role: "assistant" as const, content: "", timestamp: Date.now() }];
      updateMessages(withAssistant);
      while (true) { const { done, value } = await reader.read(); if (done) break; textBuffer += decoder.decode(value, { stream: true }); let idx; while ((idx = textBuffer.indexOf("\n")) !== -1) { let line = textBuffer.slice(0, idx); textBuffer = textBuffer.slice(idx + 1); if (line.endsWith("\r")) line = line.slice(0, -1); if (!line.startsWith("data: ")) continue; const js = line.slice(6).trim(); if (js === "[DONE]") break; try { const p = JSON.parse(js); const d = p.choices?.[0]?.delta?.content; if (d) { assistantContent += d; updateMessages(withAssistant.map((m) => m.id === assistantId ? { ...m, content: assistantContent } : m)); } } catch { break; } } }
      toast.success("Message edited");
    } catch (e) { console.error(e); toast.error("Failed"); } finally { setIsLoading(false); }
  }, [messages, updateMessages]);

  return { messages, isLoading, sendMessage, regenerateResponse, editAndResend, clearMessages, exportChat, setInitialMessages, messageCount: messages.length };
}
