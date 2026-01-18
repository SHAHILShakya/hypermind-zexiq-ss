import { memo, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ConversationSearchProps {
  messages: Message[];
  onScrollToMessage: (messageId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ConversationSearch = memo(({
  messages,
  onScrollToMessage,
  isOpen,
  onClose,
}: ConversationSearchProps) => {
  const [query, setQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return messages.filter(m => 
      m.content.toLowerCase().includes(lowerQuery)
    );
  }, [messages, query]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setCurrentMatchIndex(0);
  }, []);

  const goToMatch = useCallback((index: number) => {
    if (matches.length === 0) return;
    const safeIndex = ((index % matches.length) + matches.length) % matches.length;
    setCurrentMatchIndex(safeIndex);
    onScrollToMessage(matches[safeIndex].id);
  }, [matches, onScrollToMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        goToMatch(currentMatchIndex - 1);
      } else {
        goToMatch(currentMatchIndex + 1);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  }, [goToMatch, currentMatchIndex, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-0 left-0 right-0 z-20 p-3 glass-strong border-b border-border/20"
      >
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search in conversation..."
              className="pl-10 pr-4 h-9 glass-subtle"
              autoFocus
            />
          </div>
          
          {matches.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {currentMatchIndex + 1} of {matches.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => goToMatch(currentMatchIndex - 1)}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => goToMatch(currentMatchIndex + 1)}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {query && matches.length === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            No matches found
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
});

ConversationSearch.displayName = "ConversationSearch";
