import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  timestamp: number;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nexus-chat`;

async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

interface UseNexusChatDatabaseOptions {
  sessionId: string | null;
  onAddMessage: (sessionId: string, message: Omit<Message, "id" | "timestamp">) => Promise<{ id: string } | null>;
  onUpdateMessage: (sessionId: string, messageId: string, content: string) => void;
  selectedModel?: string;
}

export function useNexusChatDatabase(
  messages: Message[],
  options: UseNexusChatDatabaseOptions
) {
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);
  const [isLoading, setIsLoading] = useState(false);
  const streamingMessageIdRef = useRef<string | null>(null);

  // Sync with external messages
  const setInitialMessages = useCallback((msgs: Message[]) => {
    setLocalMessages(msgs);
  }, []);

  const sendMessage = useCallback(async (content: string, image?: File, dynamicPrompt?: string) => {
    const { sessionId, onAddMessage, onUpdateMessage } = options;
    if (!sessionId) {
      toast.error("No active session");
      return null;
    }

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

    // Add user message to database
    const userMessageResult = await onAddMessage(sessionId, {
      role: "user",
      content,
      image: imageBase64,
    });

    if (!userMessageResult) return null;

    // Update local state with user message
    const userMessage: Message = {
      id: userMessageResult.id,
      role: "user",
      content,
      image: imageBase64,
      timestamp: Date.now(),
    };
    
    const updatedMessages = [...localMessages, userMessage];
    setLocalMessages(updatedMessages);
    setIsLoading(true);

    // Prepare API messages with full conversation history
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

    // Create temporary assistant message
    const tempAssistantId = `temp-${crypto.randomUUID()}`;
    streamingMessageIdRef.current = tempAssistantId;

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          messages: apiMessages, 
          dynamicPrompt,
          selectedModel: options.selectedModel,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to get response";
        if (resp.status === 401) throw new Error("Please sign in to continue");
        if (resp.status === 429 || resp.status === 402 || resp.status === 503) {
          throw new Error(errorMessage);
        }
        throw new Error(errorMessage);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      // Add streaming assistant message to local state
      const withAssistant = [...updatedMessages, { 
        id: tempAssistantId, 
        role: "assistant" as const, 
        content: "", 
        timestamp: Date.now() 
      }];
      setLocalMessages(withAssistant);

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
              setLocalMessages(withAssistant.map((m) => 
                m.id === tempAssistantId ? { ...m, content: assistantContent } : m
              ));
            }
          } catch { 
            // Incomplete JSON, wait for more data
            textBuffer = line + "\n" + textBuffer;
            break; 
          }
        }
      }

      // Save assistant message to database
      const assistantResult = await onAddMessage(sessionId, {
        role: "assistant",
        content: assistantContent,
      });

      if (assistantResult) {
        // Update local state with real message ID
        setLocalMessages(prev => 
          prev.map(m => 
            m.id === tempAssistantId 
              ? { ...m, id: assistantResult.id } 
              : m
          )
        );
      }

      streamingMessageIdRef.current = null;
      return assistantResult?.id || null;
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
      // Remove the streaming assistant message on error
      setLocalMessages(updatedMessages);
      streamingMessageIdRef.current = null;
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [localMessages, options]);

  const regenerateResponse = useCallback(async (dynamicPrompt?: string) => {
    const { sessionId, onAddMessage } = options;
    if (!sessionId || localMessages.length < 2) return;
    
    const token = await getAuthToken();
    if (!token) { 
      toast.error("Please sign in"); 
      return; 
    }

    // Find last user message
    let lastUserIndex = -1;
    for (let i = localMessages.length - 1; i >= 0; i--) {
      if (localMessages[i].role === "user") { 
        lastUserIndex = i; 
        break; 
      }
    }
    if (lastUserIndex === -1) return;

    const userMessage = localMessages[lastUserIndex];
    const messagesUpToUser = localMessages.slice(0, lastUserIndex + 1);
    
    setLocalMessages(messagesUpToUser);
    setIsLoading(true);

    const apiMessages = messagesUpToUser.map((m) => {
      if (m.image) {
        return { 
          role: m.role, 
          content: [
            { type: "text", text: m.content || "Analyze this image" }, 
            { type: "image_url", image_url: { url: m.image } }
          ] 
        };
      }
      return { role: m.role, content: m.content };
    });

    const tempAssistantId = `temp-${crypto.randomUUID()}`;

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: apiMessages, dynamicPrompt, selectedModel: options.selectedModel }),
      });
      if (!resp.ok || !resp.body) throw new Error("Failed to regenerate");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";
      
      const withAssistant = [...messagesUpToUser, { 
        id: tempAssistantId, 
        role: "assistant" as const, 
        content: "", 
        timestamp: Date.now() 
      }];
      setLocalMessages(withAssistant);

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
            if (deltaContent) { 
              assistantContent += deltaContent; 
              setLocalMessages(withAssistant.map((m) => 
                m.id === tempAssistantId ? { ...m, content: assistantContent } : m
              )); 
            }
          } catch { break; }
        }
      }

      // Save to database
      const assistantResult = await onAddMessage(sessionId, {
        role: "assistant",
        content: assistantContent,
      });

      if (assistantResult) {
        setLocalMessages(prev => 
          prev.map(m => 
            m.id === tempAssistantId 
              ? { ...m, id: assistantResult.id } 
              : m
          )
        );
      }

      toast.success("Response regenerated");
    } catch (error) { 
      console.error("Regenerate error:", error); 
      toast.error("Failed to regenerate"); 
    } finally { 
      setIsLoading(false); 
    }
  }, [localMessages, options]);

  const clearMessages = useCallback(() => {
    setLocalMessages([]);
    toast.success("Chat cleared");
  }, []);

  const exportChat = useCallback(() => {
    const blob = new Blob([JSON.stringify(localMessages.map((m) => ({ 
      role: m.role, 
      content: m.content, 
      timestamp: new Date(m.timestamp).toISOString() 
    })), null, 2)], { type: "application/json" });
    const a = document.createElement("a"); 
    a.href = URL.createObjectURL(blob); 
    a.download = `zexiq-chat-${Date.now()}.json`; 
    a.click();
    toast.success("Chat exported");
  }, [localMessages]);

  const editAndResend = useCallback(async (messageId: string, newContent: string, dynamicPrompt?: string) => {
    const { sessionId, onAddMessage } = options;
    if (!sessionId) return;
    
    const token = await getAuthToken();
    if (!token) { 
      toast.error("Please sign in"); 
      return; 
    }
    
    const messageIndex = localMessages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    const messagesBeforeEdit = localMessages.slice(0, messageIndex);
    
    // Add edited user message
    const userResult = await onAddMessage(sessionId, {
      role: "user",
      content: newContent,
    });
    
    if (!userResult) return;

    const editedMessage: Message = { 
      id: userResult.id, 
      role: "user", 
      content: newContent, 
      timestamp: Date.now() 
    };
    const withEditedMessage = [...messagesBeforeEdit, editedMessage];
    setLocalMessages(withEditedMessage);
    setIsLoading(true);
    
    const apiMessages = withEditedMessage.map((m) => 
      m.image 
        ? { role: m.role, content: [{ type: "text", text: m.content || "Analyze" }, { type: "image_url", image_url: { url: m.image } }] } 
        : { role: m.role, content: m.content }
    );
    
    const tempAssistantId = `temp-${crypto.randomUUID()}`;
    
    try {
      const resp = await fetch(CHAT_URL, { 
        method: "POST", 
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, 
        body: JSON.stringify({ messages: apiMessages, dynamicPrompt, selectedModel: options.selectedModel }) 
      });
      if (!resp.ok || !resp.body) throw new Error("Failed");
      
      const reader = resp.body.getReader(); 
      const decoder = new TextDecoder(); 
      let textBuffer = ""; 
      let assistantContent = "";
      
      const withAssistant = [...withEditedMessage, { 
        id: tempAssistantId, 
        role: "assistant" as const, 
        content: "", 
        timestamp: Date.now() 
      }];
      setLocalMessages(withAssistant);
      
      while (true) { 
        const { done, value } = await reader.read(); 
        if (done) break; 
        textBuffer += decoder.decode(value, { stream: true }); 
        let idx; 
        while ((idx = textBuffer.indexOf("\n")) !== -1) { 
          let line = textBuffer.slice(0, idx); 
          textBuffer = textBuffer.slice(idx + 1); 
          if (line.endsWith("\r")) line = line.slice(0, -1); 
          if (!line.startsWith("data: ")) continue; 
          const js = line.slice(6).trim(); 
          if (js === "[DONE]") break; 
          try { 
            const p = JSON.parse(js); 
            const d = p.choices?.[0]?.delta?.content; 
            if (d) { 
              assistantContent += d; 
              setLocalMessages(withAssistant.map((m) => 
                m.id === tempAssistantId ? { ...m, content: assistantContent } : m
              )); 
            } 
          } catch { break; } 
        } 
      }
      
      // Save to database
      const assistantResult = await onAddMessage(sessionId, {
        role: "assistant",
        content: assistantContent,
      });

      if (assistantResult) {
        setLocalMessages(prev => 
          prev.map(m => 
            m.id === tempAssistantId 
              ? { ...m, id: assistantResult.id } 
              : m
          )
        );
      }
      
      toast.success("Message edited");
    } catch (e) { 
      console.error(e); 
      toast.error("Failed"); 
    } finally { 
      setIsLoading(false); 
    }
  }, [localMessages, options]);

  return { 
    messages: localMessages, 
    isLoading, 
    sendMessage, 
    regenerateResponse, 
    editAndResend, 
    clearMessages, 
    exportChat, 
    setInitialMessages, 
    messageCount: localMessages.length 
  };
}
