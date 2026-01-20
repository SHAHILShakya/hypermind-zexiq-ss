import { motion, AnimatePresence } from "framer-motion";
import { User, Sparkles, Pencil, X, Check } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { MessageActions } from "./MessageActions";
import { memo, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  messageId: string;
  isStreaming?: boolean;
  isSpeaking?: boolean;
  isLastAssistant?: boolean;
  isHighlighted?: boolean;
  onSpeak?: (text: string, messageId: string) => void;
  onRegenerate?: () => void;
  onEdit?: (messageId: string, newContent: string) => void;
}

export const ChatMessage = memo(({ 
  role, 
  content, 
  messageId,
  isStreaming, 
  isSpeaking,
  isLastAssistant = false,
  isHighlighted = false,
  onSpeak,
  onRegenerate,
  onEdit
}: ChatMessageProps) => {
  const isUser = role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditContent(content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== content) {
      onEdit?.(messageId, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const handleSpeak = () => {
    onSpeak?.(content, messageId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        backgroundColor: isHighlighted ? "hsl(var(--primary) / 0.1)" : "transparent"
      }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={`group flex gap-4 rounded-xl p-2 -mx-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      id={`message-${messageId}`}
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
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  <Textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="min-h-[60px] text-sm resize-none glass-subtle border-primary/30"
                    placeholder="Edit your message..."
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="h-7 px-2 text-xs"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      className="h-7 px-2 text-xs"
                      disabled={!editContent.trim()}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Save & Resend
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="content">
                  {/* Parse and display file attachments if present */}
                  {content.includes("[Attached files:") && (
                    <div className="mb-2 p-2 rounded-lg bg-muted/30 border border-border/30">
                      <p className="text-xs text-muted-foreground mb-1">📎 Files attached</p>
                      <div className="text-xs text-muted-foreground/80">
                        {content
                          .match(/--- (.+?) ---/g)
                          ?.map((match, i) => (
                            <span key={i} className="inline-block bg-muted/50 px-2 py-0.5 rounded mr-1 mb-1">
                              {match.replace(/---/g, "").trim()}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {content.includes("[Attached files:")
                      ? content.split("[Attached files:")[0].trim()
                      : content}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
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
        {content && !isStreaming && !isEditing && (
          <div className={`
            mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200
            ${isUser ? "flex justify-end" : ""}
          `}>
            <div className="flex items-center gap-0.5">
              {isUser && onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleStartEdit}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              )}
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
          </div>
        )}
      </div>
    </motion.div>
  );
});

ChatMessage.displayName = "ChatMessage";
