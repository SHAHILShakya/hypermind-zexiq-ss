import { memo } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  lastMessage?: string;
}

const SUGGESTION_SETS = [
  ["Explain more", "Give me examples", "What are the alternatives?", "Summarize this"],
  ["How does this work?", "What are the pros and cons?", "Can you simplify?", "Tell me more"],
  ["What should I do next?", "Are there any risks?", "Compare options", "Give me a step-by-step"],
  ["What's the best approach?", "Elaborate on this", "Why is this important?", "What else should I know?"],
];

export const SuggestedPrompts = memo(({ onSelect, lastMessage }: SuggestedPromptsProps) => {
  // Select a random set based on the last message or random
  const setIndex = lastMessage 
    ? Math.abs(lastMessage.length % SUGGESTION_SETS.length)
    : Math.floor(Math.random() * SUGGESTION_SETS.length);
  
  const suggestions = SUGGESTION_SETS[setIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="flex flex-wrap gap-2 mt-4"
    >
      {suggestions.map((prompt, index) => (
        <motion.div
          key={prompt}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.1 * index }}
        >
          <Button
            variant="outline"
            size="sm"
            className="glass text-xs h-8 px-3 hover:bg-primary/10 hover:border-primary/30 transition-all"
            onClick={() => onSelect(prompt)}
          >
            <Sparkles className="w-3 h-3 mr-1.5 text-primary" />
            {prompt}
          </Button>
        </motion.div>
      ))}
    </motion.div>
  );
});

SuggestedPrompts.displayName = "SuggestedPrompts";
