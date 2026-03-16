import { memo, useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  ThumbsUp, 
  ThumbsDown,
  MoreHorizontal,
  Share2,
  LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

// Wrapper button that properly forwards refs for Tooltip compatibility
const ActionButton = forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button> & { icon: LucideIcon; iconClassName?: string }
>(({ icon: Icon, iconClassName, ...props }, ref) => (
  <Button ref={ref} {...props}>
    <Icon className={iconClassName || "w-3.5 h-3.5"} />
  </Button>
));

interface MessageActionsProps {
  content: string;
  messageId: string;
  isUser?: boolean;
  isSpeaking?: boolean;
  onSpeak?: () => void;
  onRegenerate?: () => void;
  showRegenerate?: boolean;
}

export const MessageActions = memo(({
  content,
  messageId,
  isUser = false,
  isSpeaking = false,
  onSpeak,
  onRegenerate,
  showRegenerate = false,
}: MessageActionsProps) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    setLiked(liked === true ? null : true);
    if (liked !== true) {
      toast.success("Thanks for your feedback!");
    }
  };

  const handleDislike = () => {
    setLiked(liked === false ? null : false);
    if (liked !== false) {
      toast("We'll improve based on your feedback", { icon: "📝" });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ZEX•IQ Response",
          text: content,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      handleCopy();
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5">
        {/* Copy button - available for all messages */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.5 }}
                  >
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.5 }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {copied ? "Copied!" : "Copy"}
          </TooltipContent>
        </Tooltip>

        {/* Assistant-only actions */}
        {!isUser && (
          <>
            {/* Speak button */}
            {onSpeak && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <ActionButton
                    variant="ghost"
                    size="icon"
                    onClick={onSpeak}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    icon={isSpeaking ? VolumeX : Volume2}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {isSpeaking ? "Stop" : "Read aloud"}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Regenerate button */}
            {showRegenerate && onRegenerate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <ActionButton
                    variant="ghost"
                    size="icon"
                    onClick={onRegenerate}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    icon={RefreshCw}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Regenerate
                </TooltipContent>
              </Tooltip>
            )}

            {/* Like button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <ActionButton
                  variant="ghost"
                  size="icon"
                  onClick={handleLike}
                  className={`h-7 w-7 hover:bg-muted/50 transition-colors ${
                    liked === true 
                      ? "text-green-500" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  icon={ThumbsUp}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Good response
              </TooltipContent>
            </Tooltip>

            {/* Dislike button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <ActionButton
                  variant="ghost"
                  size="icon"
                  onClick={handleDislike}
                  className={`h-7 w-7 hover:bg-muted/50 transition-colors ${
                    liked === false 
                      ? "text-red-500" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  icon={ThumbsDown}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Bad response
              </TooltipContent>
            </Tooltip>

            {/* Share button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <ActionButton
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  icon={Share2}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Share
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
});

MessageActions.displayName = "MessageActions";
