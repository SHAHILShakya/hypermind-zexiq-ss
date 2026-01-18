import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import type { Message } from "./useChatSessions";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nexus-chat`;

export function useNexusChat(
  initialMessages: Message[],
  onMessagesChange: (messages: Message[]) => void
) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const lastUserMessageRef = useRef<{ content: string; image?: File; dynamicPrompt?: string } | null>(null);

  // Sync with external state
  const updateMessages = useCallback((newMessages: Message[]) => {
    setMessages(newMessages);
    onMessagesChange(newMessages);
  }, [onMessagesChange]);

  const sendMessage = useCallback(async (content: string, image?: File, dynamicPrompt?: string) => {
    // Store for potential regeneration
    lastUserMessageRef.current = { content, image, dynamicPrompt };
    
    let imageBase64: string | undefined;

    // Convert image to base64 if provided
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

    // Prepare messages for API - include image in content if present
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
      return {
        role: m.role,
        content: m.content,
      };
    });

    const assistantId = crypto.randomUUID();

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages, dynamicPrompt }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        
        if (resp.status === 429) {
          throw new Error(errorData.error || "Rate limited. Please try again shortly.");
        }
        if (resp.status === 402) {
          throw new Error(errorData.error || "Resource limit reached.");
        }
        throw new Error(errorData.error || "Failed to get response");
      }

      if (!resp.body) {
        throw new Error("No response body");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      // Add empty assistant message to start streaming into
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
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (deltaContent) {
              assistantContent += deltaContent;
              const updated = withAssistant.map((m) =>
                m.id === assistantId ? { ...m, content: assistantContent } : m
              );
              updateMessages(updated);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (deltaContent) {
              assistantContent += deltaContent;
            }
          } catch {
            /* ignore */
          }
        }
        // Final update
        setMessages(prev => prev.map(m => 
          m.id === assistantId ? { ...m, content: assistantContent } : m
        ));
      }
      
      return assistantId; // Return the assistant message ID
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
      // Remove the user message on error
      updateMessages(messages);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages, updateMessages]);

  // Regenerate last assistant response
  const regenerateResponse = useCallback(async (dynamicPrompt?: string) => {
    if (messages.length < 2) return;
    
    // Find last user message
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserIndex = i;
        break;
      }
    }
    
    if (lastUserIndex === -1) return;
    
    const userMessage = messages[lastUserIndex];
    
    // Remove messages from the last user message onwards
    const messagesBeforeUser = messages.slice(0, lastUserIndex);
    updateMessages(messagesBeforeUser);
    setMessages(messagesBeforeUser);
    
    // Reconstruct File if there was an image (though we can't truly recreate the File)
    // For regeneration, we just use the content
    setIsLoading(true);
    
    const apiMessages = [...messagesBeforeUser, userMessage].map((m) => {
      if (m.image) {
        return {
          role: m.role,
          content: [
            { type: "text", text: m.content || "Analyze this image" },
            { type: "image_url", image_url: { url: m.image } },
          ],
        };
      }
      return {
        role: m.role,
        content: m.content,
      };
    });

    // Add the user message back
    const withUser = [...messagesBeforeUser, userMessage];
    updateMessages(withUser);

    const assistantId = crypto.randomUUID();

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages, dynamicPrompt }),
      });

      if (!resp.ok) {
        throw new Error("Failed to regenerate response");
      }

      if (!resp.body) {
        throw new Error("No response body");
      }

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
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (deltaContent) {
              assistantContent += deltaContent;
              const updated = withAssistant.map((m) =>
                m.id === assistantId ? { ...m, content: assistantContent } : m
              );
              updateMessages(updated);
            }
          } catch {
            break;
          }
        }
      }

      toast.success("Response regenerated");
    } catch (error) {
      console.error("Regenerate error:", error);
      toast.error("Failed to regenerate response");
    } finally {
      setIsLoading(false);
    }
  }, [messages, updateMessages]);

  const clearMessages = useCallback(() => {
    updateMessages([]);
    toast.success("Chat cleared");
  }, [updateMessages]);

  const exportChat = useCallback(() => {
    const exportData = messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp).toISOString(),
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zexiq-chat-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat exported");
  }, [messages]);

  // Reset messages when session changes
  const setInitialMessages = useCallback((newMessages: Message[]) => {
    setMessages(newMessages);
  }, []);

  // Edit and resend a message
  const editAndResend = useCallback(async (messageId: string, newContent: string, dynamicPrompt?: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    // Remove this message and all messages after it
    const messagesBeforeEdit = messages.slice(0, messageIndex);
    updateMessages(messagesBeforeEdit);
    setMessages(messagesBeforeEdit);
    
    // Create the edited user message
    const editedMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: newContent,
      timestamp: Date.now(),
    };
    
    const withEditedMessage = [...messagesBeforeEdit, editedMessage];
    updateMessages(withEditedMessage);
    setIsLoading(true);
    
    const apiMessages = withEditedMessage.map((m) => {
      if (m.image) {
        return {
          role: m.role,
          content: [
            { type: "text", text: m.content || "Analyze this image" },
            { type: "image_url", image_url: { url: m.image } },
          ],
        };
      }
      return {
        role: m.role,
        content: m.content,
      };
    });

    const assistantId = crypto.randomUUID();

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages, dynamicPrompt }),
      });

      if (!resp.ok) {
        throw new Error("Failed to get response");
      }

      if (!resp.body) {
        throw new Error("No response body");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      const withAssistant = [...withEditedMessage, { id: assistantId, role: "assistant" as const, content: "", timestamp: Date.now() }];
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
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (deltaContent) {
              assistantContent += deltaContent;
              const updated = withAssistant.map((m) =>
                m.id === assistantId ? { ...m, content: assistantContent } : m
              );
              updateMessages(updated);
            }
          } catch {
            break;
          }
        }
      }

      toast.success("Message edited and resent");
    } catch (error) {
      console.error("Edit error:", error);
      toast.error("Failed to resend edited message");
    } finally {
      setIsLoading(false);
    }
  }, [messages, updateMessages]);

  return {
    messages,
    isLoading,
    sendMessage,
    regenerateResponse,
    editAndResend,
    clearMessages,
    exportChat,
    setInitialMessages,
    messageCount: messages.length,
  };
}
