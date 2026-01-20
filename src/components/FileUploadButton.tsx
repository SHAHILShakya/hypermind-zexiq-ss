import { memo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, X, FileText, FileImage, File, Loader2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Supported file types with categories - comprehensive support
const FILE_TYPES = {
  images: [
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
    "image/bmp", "image/tiff", "image/heic", "image/heif", "image/avif"
  ],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/rtf",
    "application/epub+zip",
    "text/plain",
    "text/csv",
    "text/markdown",
    "text/rtf",
    "application/json",
    "application/xml",
    "text/xml",
    "application/yaml",
    "text/yaml",
  ],
  code: [
    "text/javascript",
    "application/javascript",
    "text/typescript",
    "text/html",
    "text/css",
    "text/x-python",
    "application/x-python",
    "text/x-java",
    "text/x-c",
    "text/x-cpp",
    "text/x-csharp",
    "text/x-go",
    "text/x-rust",
    "text/x-swift",
    "text/x-kotlin",
    "text/x-php",
    "text/x-ruby",
    "text/x-sql",
    "text/x-sh",
    "text/x-shellscript",
    "application/sql",
  ],
  archives: [
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/gzip",
    "application/x-tar",
  ],
};

const ALL_TYPES = [...FILE_TYPES.images, ...FILE_TYPES.documents, ...FILE_TYPES.code, ...FILE_TYPES.archives];

export interface UploadedFile {
  id: string;
  file: File;
  type: "image" | "document" | "code" | "archive";
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

  const getFileType = (mimeType: string): "image" | "document" | "code" | "archive" => {
    if (FILE_TYPES.images.includes(mimeType)) return "image";
    if (FILE_TYPES.code.includes(mimeType)) return "code";
    if (FILE_TYPES.archives.includes(mimeType)) return "archive";
    return "document";
  };

  const getFileIcon = (type: "image" | "document" | "code" | "archive") => {
    switch (type) {
      case "image":
        return FileImage;
      case "document":
        return FileText;
      case "archive":
        return Archive;
      case "code":
        return File;
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
    // Prevent any default behavior
    e.preventDefault();
    e.stopPropagation();
    
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    
    const files = Array.from(fileList);

    // Check max files
    if (selectedFiles.length + files.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
        onClick={(e) => e.stopPropagation()}
        className="hidden"
      />
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
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
