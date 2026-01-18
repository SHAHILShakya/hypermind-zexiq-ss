import { motion } from "framer-motion";
import { User, Sparkles } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { MessageActions } from "./MessageActions";
import { memo } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  messageId: string;
  isStreaming?: boolean;
  isSpeaking?: boolean;
  isLastAssistant?: boolean;
  onSpeak?: (text: string, messageId: string) => void;
  onRegenerate?: () => void;
}

export const ChatMessage = memo(({ 
  role, 
  content, 
  messageId,
  isStreaming, 
  isSpeaking,
  isLastAssistant = false,
  onSpeak,
  onRegenerate
}: ChatMessageProps) => {
  const isUser = role === "user";

  const handleSpeak = () => {
    onSpeak?.(content, messageId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
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
      <div className="flex-1 max-w-[80%]">
        <div
          className={`
            rounded-2xl px-5 py-3
            ${isUser 
              ? "glass-subtle ml-auto w-fit" 
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
        </div>

        {/* Action buttons - show below message */}
        {content && !isStreaming && (
          <div className={`
            mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200
            ${isUser ? "flex justify-end" : ""}
          `}>
            <MessageActions
              content={content}
              messageId={messageId}
              isUser={isUser}
              isSpeaking={isSpeaking}
              onSpeak={handleSpeak}
              onRegenerate={onRegenerate}
              showRegenerate={isLastAssistant}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
});

ChatMessage.displayName = "ChatMessage";
