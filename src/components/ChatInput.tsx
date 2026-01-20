import { useState, useRef, useEffect, memo, forwardRef, useImperativeHandle, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Image, X, Mic, MicOff, Paperclip, FileText, FileImage, File, Archive, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import type { UploadedFile } from "./FileUploadButton";
import { VoiceSelectorCompact, type VoiceId } from "./VoiceSelectorCompact";

// Supported file types
const FILE_TYPES = {
  images: [
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
    "image/bmp", "image/tiff", "image/heic", "image/heif", "image/avif"
  ],
  documents: [
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain", "text/csv", "text/markdown", "application/json", "application/xml", "text/xml",
  ],
  code: [
    "text/javascript", "application/javascript", "text/typescript", "text/html", "text/css",
    "text/x-python", "text/x-java", "text/x-c", "text/x-cpp", "application/sql",
  ],
  archives: ["application/zip", "application/x-rar-compressed", "application/gzip"],
};

const ALL_TYPES = [...FILE_TYPES.images, ...FILE_TYPES.documents, ...FILE_TYPES.code, ...FILE_TYPES.archives];
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES = 10;

interface ChatInputProps {
  onSend: (message: string, image?: File, files?: UploadedFile[]) => void;
  isLoading: boolean;
  disabled?: boolean;
  selectedVoice: VoiceId;
  onVoiceChange: (voice: VoiceId) => void;
}

export interface ChatInputHandle {
  focus: () => void;
}

const getFileIcon = (type: string) => {
  if (FILE_TYPES.images.includes(type)) return FileImage;
  if (FILE_TYPES.archives.includes(type)) return Archive;
  if (FILE_TYPES.code.includes(type)) return File;
  return FileText;
};

const getFileType = (mimeType: string): "image" | "document" | "code" | "archive" => {
  if (FILE_TYPES.images.includes(mimeType)) return "image";
  if (FILE_TYPES.code.includes(mimeType)) return "code";
  if (FILE_TYPES.archives.includes(mimeType)) return "archive";
  return "document";
};

export const ChatInput = memo(forwardRef<ChatInputHandle, ChatInputProps>(
  ({ onSend, isLoading, disabled, selectedVoice, onVoiceChange }, ref) => {
    const [input, setInput] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
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

    useEffect(() => {
      if (transcript && isListening) {
        // Show interim results
      }
    }, [transcript, isListening]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if ((input.trim() || uploadedFiles.length > 0) && !isLoading && !disabled) {
        onSend(input.trim(), undefined, uploadedFiles.length > 0 ? uploadedFiles : undefined);
        setInput("");
        setUploadedFiles([]);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    };

    const readFileContent = async (file: File): Promise<string | undefined> => {
      if (file.type.startsWith("text/") || file.type === "application/json" || file.type === "application/xml") {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve(undefined);
          reader.readAsText(file);
        });
      }
      return undefined;
    };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent any default behavior that could cause navigation
    e.preventDefault();
    e.stopPropagation();
    
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    
    const files = Array.from(fileList);

    if (uploadedFiles.length + files.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const newFiles: UploadedFile[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large (max 20MB)`);
        continue;
      }

      const type = getFileType(file.type);
      const uploadedFile: UploadedFile = {
        id: crypto.randomUUID(),
        file,
        type,
      };

      // Create preview for images
      if (type === "image") {
        try {
          uploadedFile.preview = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        } catch {
          // Skip preview on error
        }
      }

      // Read content for text files
      try {
        uploadedFile.content = await readFileContent(file);
      } catch {
        // Skip content on error
      }

      newFiles.push(uploadedFile);
    }

    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} file(s) added`);
    }

    // Reset file input after processing
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [uploadedFiles.length]);

    const removeFile = (id: string) => {
      setUploadedFiles(prev => prev.filter(f => f.id !== id));
    };

    // Auto-resize textarea
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "24px";
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 24), 200)}px`;
      }
    }, [input]);

    return (
      <div className="w-full max-w-3xl mx-auto px-4">
        {/* File Previews - Above input */}
        <AnimatePresence>
          {uploadedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-wrap gap-2 mb-3"
            >
              {uploadedFiles.map((f) => {
                const Icon = getFileIcon(f.file.type);
                return (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative group"
                  >
                    {f.type === "image" && f.preview ? (
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-border/50 bg-muted/30">
                        <img
                          src={f.preview}
                          alt={f.file.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-24 rounded-lg border border-border/50 bg-muted/30 flex items-center gap-2 px-2">
                        <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs truncate">{f.file.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {(f.file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      onClick={() => removeFile(f.id)}
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Input Container - ChatGPT Style */}
        <form onSubmit={handleSubmit}>
          <div className="relative bg-muted/50 backdrop-blur-sm border border-border/40 rounded-2xl shadow-sm focus-within:border-border/60 transition-colors">
            {/* Hidden file input - outside form to prevent submission */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ALL_TYPES.join(",")}
              multiple
              onChange={handleFileSelect}
              onClick={(e) => e.stopPropagation()}
              className="hidden"
            />

            {/* Top Row: Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening..." : "Message ZEX•IQ..."}
              disabled={isLoading || disabled}
              rows={1}
              className="
                w-full bg-transparent border-none outline-none resize-none
                text-foreground placeholder:text-muted-foreground/50
                px-4 pt-4 pb-2 text-sm leading-relaxed
                min-h-[24px] max-h-[200px]
              "
              style={{ height: "24px" }}
            />

            {/* Bottom Row: Actions */}
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-0.5">
                {/* File Upload */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={isLoading || disabled || uploadedFiles.length >= MAX_FILES}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>

                {/* Voice Input */}
                {isSupported && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={toggleListening}
                    disabled={isLoading || disabled}
                    className={`h-8 w-8 rounded-lg transition-colors ${
                      isListening
                        ? "text-red-500 bg-red-500/10 hover:bg-red-500/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4 animate-pulse" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                )}

                {/* Voice Selector */}
                <VoiceSelectorCompact
                  value={selectedVoice}
                  onChange={onVoiceChange}
                  disabled={isLoading || disabled}
                />
              </div>

              {/* Send Button */}
              <Button
                type="submit"
                disabled={(!input.trim() && uploadedFiles.length === 0) || isLoading || disabled}
                size="icon"
                className="h-8 w-8 rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Footer Text */}
        <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
          ZEX•IQ can make mistakes. Check important info.
        </p>
      </div>
    );
  }
));

ChatInput.displayName = "ChatInput";
