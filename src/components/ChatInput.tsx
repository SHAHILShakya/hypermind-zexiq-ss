import { useState, useRef, useEffect, memo, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Image, X, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface ChatInputProps {
  onSend: (message: string, image?: File) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export interface ChatInputHandle {
  focus: () => void;
}

export const ChatInput = memo(forwardRef<ChatInputHandle, ChatInputProps>(
  ({ onSend, isLoading, disabled }, ref) => {
    const [input, setInput] = useState("");
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { isListening, isSupported, toggleListening, transcript } = useVoiceInput({
      onTranscript: (text) => {
        setInput((prev) => prev + (prev ? " " : "") + text);
      },
    });

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
    }));

    // Update input when voice transcript changes
    useEffect(() => {
      if (transcript && isListening) {
        // Show interim results
      }
    }, [transcript, isListening]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if ((input.trim() || selectedImage) && !isLoading && !disabled) {
        onSend(input.trim(), selectedImage || undefined);
        setInput("");
        setSelectedImage(null);
        setImagePreview(null);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error("Image must be less than 5MB");
          return;
        }
        if (!file.type.startsWith("image/")) {
          toast.error("Please select an image file");
          return;
        }
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    const removeImage = () => {
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    // Auto-resize textarea with strict limits
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "44px";
        const scrollHeight = textareaRef.current.scrollHeight;
        // Min 44px, Max 120px - strict limits
        textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 44), 120)}px`;
      }
    }, [input]);

    return (
      <form
        onSubmit={handleSubmit}
        className="relative"
      >
        {/* Image Preview */}
        <AnimatePresence>
          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-2 relative inline-block"
            >
              <img
                src={imagePreview}
                alt="Selected"
                className="h-20 w-20 object-cover rounded-xl border border-border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={removeImage}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              >
                <X className="w-3 h-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="glass-card rounded-2xl p-1.5 flex items-end gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || disabled}
            className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 flex-shrink-0"
          >
            <Image className="w-4 h-4" />
          </Button>

          {isSupported && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleListening}
              disabled={isLoading || disabled}
              className={`h-9 w-9 rounded-lg flex-shrink-0 transition-colors ${
                isListening 
                  ? "text-red-500 bg-red-500/10 hover:bg-red-500/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 animate-pulse" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Message ZEX•IQ..."}
            disabled={isLoading || disabled}
            rows={1}
            className="
              flex-1 bg-transparent border-none outline-none resize-none
              text-foreground placeholder:text-muted-foreground/60
              px-3 py-2.5 text-sm leading-relaxed
              min-h-[44px] max-h-[120px]
            "
            style={{ height: '44px' }}
          />
          <Button
            type="submit"
            disabled={(!input.trim() && !selectedImage) || isLoading || disabled}
            className="
              h-9 w-9 rounded-lg flex-shrink-0
              bg-primary hover:bg-primary/90
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-all duration-150
            "
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    );
  }
));

ChatInput.displayName = "ChatInput";
