import { useState, useRef, useEffect, memo } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ChatInputProps {
  onSend: (message: string, image?: File) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const ChatInput = memo(({ onSend, isLoading, disabled }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="relative"
    >
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-2 relative inline-block">
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
        </div>
      )}

      <div className="glass-strong glow-border rounded-2xl p-2 flex items-end gap-2">
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
          className="h-12 w-12 rounded-xl text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <Image className="w-5 h-5" />
        </Button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask NEXUS anything..."
          disabled={isLoading || disabled}
          rows={1}
          className="
            flex-1 bg-transparent border-none outline-none resize-none
            text-foreground placeholder:text-muted-foreground
            px-2 py-3 text-sm leading-relaxed
            min-h-[48px] max-h-[200px]
          "
        />
        <Button
          type="submit"
          disabled={(!input.trim() && !selectedImage) || isLoading || disabled}
          className="
            h-12 w-12 rounded-xl flex-shrink-0
            bg-gradient-to-r from-primary to-accent
            hover:from-primary/90 hover:to-accent/90
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            glow-border
          "
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
      
      <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
        NEXUS can analyze images and generate code with syntax highlighting
      </p>
    </motion.form>
  );
});

ChatInput.displayName = "ChatInput";
