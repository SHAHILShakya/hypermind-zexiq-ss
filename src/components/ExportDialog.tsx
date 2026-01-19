import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, FileCode, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ExportDialogProps {
  messages: Message[];
  disabled?: boolean;
}

export const ExportDialog = memo(({ messages, disabled }: ExportDialogProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [open, setOpen] = useState(false);

  const exportToMarkdown = () => {
    setIsExporting(true);
    try {
      const markdown = messages
        .map((m) => {
          const role = m.role === "user" ? "**You**" : "**ZEX•IQ**";
          const time = new Date(m.timestamp).toLocaleString();
          return `### ${role}\n*${time}*\n\n${m.content}\n\n---\n`;
        })
        .join("\n");

      const header = `# ZEX•IQ Chat Export\n\n*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;
      const fullContent = header + markdown;

      const blob = new Blob([fullContent], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zexiq-chat-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported to Markdown");
      setOpen(false);
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      // Create HTML content for PDF
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ZEX•IQ Chat Export</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #0a0a0f;
      color: #e4e4e7;
    }
    h1 {
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #71717a;
      font-size: 14px;
      margin-bottom: 40px;
    }
    .message {
      margin-bottom: 24px;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .user {
      background: rgba(59, 130, 246, 0.1);
      margin-left: 40px;
    }
    .assistant {
      background: rgba(139, 92, 246, 0.1);
      margin-right: 40px;
    }
    .role {
      font-weight: 600;
      margin-bottom: 8px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .user .role { color: #3b82f6; }
    .assistant .role { color: #8b5cf6; }
    .content {
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .time {
      font-size: 11px;
      color: #52525b;
      margin-top: 12px;
    }
    pre {
      background: rgba(0,0,0,0.3);
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
    }
    code {
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <h1>ZEX•IQ</h1>
  <p class="subtitle">Chat Export • ${new Date().toLocaleString()}</p>
  ${messages
    .map(
      (m) => `
    <div class="message ${m.role}">
      <div class="role">${m.role === "user" ? "You" : "ZEX•IQ"}</div>
      <div class="content">${m.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
      <div class="time">${new Date(m.timestamp).toLocaleString()}</div>
    </div>
  `
    )
    .join("")}
</body>
</html>
      `;

      // Open in new window for printing
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load then print
        setTimeout(() => {
          printWindow.print();
        }, 250);
        
        toast.success("PDF ready - use Print dialog to save");
        setOpen(false);
      } else {
        toast.error("Please allow popups to export PDF");
      }
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled || messages.length === 0}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Download className="w-4 h-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Export Chat</TooltipContent>
      </Tooltip>
      
      <DialogContent className="glass-strong border-border/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gradient font-display flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Chat
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Choose your preferred export format
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={exportToMarkdown}
              disabled={isExporting}
              className="flex flex-col items-center gap-3 p-6 rounded-xl glass-subtle hover:glass transition-all"
            >
              {isExporting ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <FileCode className="w-8 h-8 text-primary" />
              )}
              <div className="text-center">
                <p className="font-medium text-sm">Markdown</p>
                <p className="text-xs text-muted-foreground">.md file</p>
              </div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={exportToPDF}
              disabled={isExporting}
              className="flex flex-col items-center gap-3 p-6 rounded-xl glass-subtle hover:glass transition-all"
            >
              {isExporting ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <FileText className="w-8 h-8 text-primary" />
              )}
              <div className="text-center">
                <p className="font-medium text-sm">PDF</p>
                <p className="text-xs text-muted-foreground">Print to PDF</p>
              </div>
            </motion.button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            {messages.length} message{messages.length !== 1 ? "s" : ""} will be exported
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
});

ExportDialog.displayName = "ExportDialog";
