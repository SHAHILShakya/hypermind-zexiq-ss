import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Pencil,
  Check,
  X
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
        group flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all
        ${isActive 
          ? "bg-primary/20 border border-primary/30" 
          : "hover:bg-muted/50 border border-transparent"
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
            <p className="text-sm truncate">{session.name}</p>
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
}: SessionSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 56 : 280 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="h-full glass-strong border-r border-border/30 flex flex-col"
    >
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-border/50">
        {!isCollapsed && (
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-display text-sm text-gradient tracking-wider"
          >
            SESSIONS
          </motion.h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 ml-auto"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* New Chat Button */}
      {!isCollapsed && (
        <div className="p-3">
          <Button
            onClick={onCreateSession}
            className="w-full justify-start gap-2 glass-card hover:bg-primary/10 border-none"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>
      )}

      {isCollapsed && (
        <div className="p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCreateSession}
            className="w-full h-10"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Sessions List */}
      {!isCollapsed && (
        <ScrollArea className="flex-1 px-3">
          <AnimatePresence mode="popLayout">
            {sessions.map(session => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={session.id === activeSessionId}
                onSelect={() => onSelectSession(session.id)}
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
      )}
    </motion.div>
  );
});

SessionSidebar.displayName = "SessionSidebar";
