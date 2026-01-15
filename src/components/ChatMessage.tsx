import { motion } from "framer-motion";
import { User, Sparkles, Copy, Check, Volume2, VolumeX } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Button } from "@/components/ui/button";
import { useState, memo } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  messageId: string;
  isStreaming?: boolean;
  isSpeaking?: boolean;
  onSpeak?: (text: string, messageId: string) => void;
}

export const ChatMessage = memo(({ 
  role, 
  content, 
  messageId,
  isStreaming, 
  isSpeaking,
  onSpeak 
}: ChatMessageProps) => {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    onSpeak?.(content, messageId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`group flex gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`
          flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center
          ${isUser 
            ? "glass-subtle" 
            : "bg-gradient-to-br from-primary to-secondary"
          }
        `}
        style={!isUser ? {
          boxShadow: "0 4px 16px hsl(var(--primary) / 0.2)"
        } : undefined}
      >
        {isUser ? (
          <User className="w-5 h-5 text-muted-foreground" />
        ) : (
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={`
          relative max-w-[80%] rounded-2xl px-5 py-3
          ${isUser 
            ? "glass-subtle" 
            : "glass-card"
          }
        `}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="text-sm leading-relaxed">
            <MarkdownRenderer content={content} />
            {isStreaming && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-2 h-4 ml-1 bg-primary rounded-sm align-middle"
              />
            )}
          </div>
        )}

        {/* Action buttons for assistant messages */}
        {!isUser && content && !isStreaming && (
          <div className="absolute -bottom-8 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSpeak}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3 h-3 mr-1" /> Stop
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3 mr-1" /> Speak
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 mr-1" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" /> Copy
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
});

ChatMessage.displayName = "ChatMessage";
