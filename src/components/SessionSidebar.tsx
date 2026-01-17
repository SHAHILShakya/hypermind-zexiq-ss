import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  X,
  Pencil,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatSession } from "@/hooks/useChatSessions";

interface SessionSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onCreateSession: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, name: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const SessionItem = memo(({ 
  session, 
  isActive, 
  onSelect, 
  onDelete, 
  onRename 
}: {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(session.name);

  const handleSave = () => {
    if (editName.trim()) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(session.name);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`
        group flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all mb-1
        ${isActive 
          ? "bg-primary/15 border border-primary/20" 
          : "hover:bg-muted/40 border border-transparent"
        }
      `}
      onClick={() => !isEditing && onSelect()}
    >
      <MessageSquare className="w-4 h-4 text-primary flex-shrink-0" />
      
      {isEditing ? (
        <div className="flex-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            className="h-6 text-xs bg-background"
            autoFocus
            onKeyDown={e => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
          />
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSave}>
            <Check className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancel}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate font-medium">{session.name}</p>
            <p className="text-xs text-muted-foreground">
              {session.messages.length} messages
            </p>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={e => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              <Pencil className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={e => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );
});

SessionItem.displayName = "SessionItem";

export const SessionSidebar = memo(({
  sessions,
  activeSessionId,
  onCreateSession,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  isOpen,
  onClose,
}: SessionSidebarProps) => {
  return (
    <>
      {/* Backdrop overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-0 top-0 bottom-0 w-[280px] glass-strong border-r border-border/30 flex flex-col z-50"
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-border/30">
              <h2 className="font-display text-sm text-gradient tracking-wider font-medium">
                SESSIONS
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* New Chat Button */}
            <div className="p-3">
              <Button
                onClick={() => {
                  onCreateSession();
                  onClose();
                }}
                className="w-full justify-start gap-2 glass-card hover:bg-primary/10 border-none"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
            </div>

            {/* Sessions List */}
            <ScrollArea className="flex-1 px-3">
              <AnimatePresence mode="popLayout">
                {sessions.map(session => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={session.id === activeSessionId}
                    onSelect={() => {
                      onSelectSession(session.id);
                      onClose();
                    }}
                    onDelete={() => onDeleteSession(session.id)}
                    onRename={(name) => onRenameSession(session.id, name)}
                  />
                ))}
              </AnimatePresence>
              
              {sessions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No sessions yet
                </p>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

SessionSidebar.displayName = "SessionSidebar";