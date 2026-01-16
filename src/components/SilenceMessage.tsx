import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SilenceMessageProps {
  message: string | null;
  onDismiss: () => void;
}

export const SilenceMessage = memo(({ message, onDismiss }: SilenceMessageProps) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%]"
        >
          <div className="glass-strong rounded-2xl p-4 flex items-start gap-3 shadow-lg">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Pause className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground font-medium">{message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Silence acknowledged
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground -mt-1 -mr-1"
              onClick={onDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

SilenceMessage.displayName = "SilenceMessage";
