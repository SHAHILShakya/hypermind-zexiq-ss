import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-4"
    >
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary to-secondary"
        style={{ boxShadow: "0 4px 16px hsl(var(--primary) / 0.2)" }}
      >
        <Sparkles className="w-5 h-5 text-primary-foreground" />
      </div>

      {/* Typing bubble */}
      <div className="glass-card rounded-2xl px-5 py-4 flex items-center gap-1.5">
        <motion.span
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.4, 1, 0.4]
          }}
          transition={{ 
            duration: 1.4,
            repeat: Infinity,
            delay: 0
          }}
          className="w-2 h-2 rounded-full bg-primary"
        />
        <motion.span
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.4, 1, 0.4]
          }}
          transition={{ 
            duration: 1.4,
            repeat: Infinity,
            delay: 0.2
          }}
          className="w-2 h-2 rounded-full bg-primary"
        />
        <motion.span
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.4, 1, 0.4]
          }}
          transition={{ 
            duration: 1.4,
            repeat: Infinity,
            delay: 0.4
          }}
          className="w-2 h-2 rounded-full bg-primary"
        />
      </div>
    </motion.div>
  );
}
