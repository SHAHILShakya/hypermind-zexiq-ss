import { memo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, X, FileText, FileImage, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Supported file types with categories
const FILE_TYPES = {
  images: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "text/markdown",
    "application/json",
    "application/xml",
  ],
  code: [
    "text/javascript",
    "text/typescript",
    "text/html",
    "text/css",
    "text/x-python",
    "text/x-java",
    "text/x-c",
    "text/x-cpp",
  ],
};

const ALL_TYPES = [...FILE_TYPES.images, ...FILE_TYPES.documents, ...FILE_TYPES.code];

export interface UploadedFile {
  id: string;
  file: File;
  type: "image" | "document" | "code";
  preview?: string;
  content?: string;
}

interface FileUploadButtonProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  selectedFiles: UploadedFile[];
  onRemoveFile: (id: string) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_FILES = 10;

export const FileUploadButton = memo(({
  onFilesSelected,
  selectedFiles,
  onRemoveFile,
  disabled,
}: FileUploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const getFileType = (mimeType: string): "image" | "document" | "code" => {
    if (FILE_TYPES.images.includes(mimeType)) return "image";
    if (FILE_TYPES.code.includes(mimeType)) return "code";
    return "document";
  };

  const getFileIcon = (type: "image" | "document" | "code") => {
    switch (type) {
      case "image":
        return FileImage;
      case "document":
        return FileText;
      default:
        return File;
    }
  };

  const readFileContent = async (file: File): Promise<string | undefined> => {
    // For text-based files, read content
    if (file.type.startsWith("text/") || 
        file.type === "application/json" || 
        file.type === "application/xml") {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsText(file);
      });
    }
    return undefined;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check max files
    if (selectedFiles.length + files.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    setIsProcessing(true);
    const newFiles: UploadedFile[] = [];

    for (const file of files) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large (max 20MB)`);
        continue;
      }

      // Check file type
      if (!ALL_TYPES.includes(file.type) && !file.type.startsWith("text/")) {
        toast.error(`${file.name} is not a supported file type`);
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
        uploadedFile.preview = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      // Read content for text files
      uploadedFile.content = await readFileContent(file);

      newFiles.push(uploadedFile);
    }

    if (newFiles.length > 0) {
      onFilesSelected(newFiles);
      toast.success(`${newFiles.length} file(s) added`);
    }

    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* File Previews */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {selectedFiles.map((f) => {
              const Icon = getFileIcon(f.type);
              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group"
                >
                  {f.type === "image" && f.preview ? (
                    <img
                      src={f.preview}
                      alt={f.file.name}
                      className="h-16 w-16 object-cover rounded-lg border border-border"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg border border-border glass-subtle flex flex-col items-center justify-center p-1">
                      <Icon className="w-5 h-5 text-muted-foreground mb-1" />
                      <span className="text-[8px] text-muted-foreground truncate max-w-full px-1">
                        {f.file.name.split(".").pop()?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => onRemoveFile(f.id)}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <span className="absolute bottom-0.5 left-0.5 right-0.5 text-[7px] text-center bg-background/80 rounded truncate px-0.5">
                    {f.file.name.length > 10 
                      ? f.file.name.slice(0, 8) + "..." 
                      : f.file.name}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Button */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALL_TYPES.join(",")}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isProcessing || selectedFiles.length >= MAX_FILES}
        className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 flex-shrink-0"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Paperclip className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
});

FileUploadButton.displayName = "FileUploadButton";
