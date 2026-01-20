import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  X,
  Pencil,
  Check,
  MoreHorizontal,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}

function SessionItem({ 
  session, 
  isActive, 
  onSelect, 
  onDelete, 
  onRename 
}: SessionItemProps) {
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
    <div
      className={`
        group flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all duration-150 relative
        ${isActive 
          ? "bg-muted/60" 
          : "hover:bg-muted/30"
        }
      `}
      onClick={() => !isEditing && onSelect()}
    >
      <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      
      {isEditing ? (
        <div className="flex-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            className="h-7 text-sm bg-background border-border/50"
            autoFocus
            onKeyDown={e => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
          />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSave}>
            <Check className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancel}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0 pr-6">
            <p className="text-sm truncate">{session.name}</p>
          </div>
          
          {/* Action menu - appears on hover */}
          <div 
            className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={e => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-muted"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </div>
  );
}

// Group sessions by date
function groupSessionsByDate(sessions: ChatSession[]) {
  const groups: { label: string; sessions: ChatSession[] }[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const todaySessions: ChatSession[] = [];
  const yesterdaySessions: ChatSession[] = [];
  const weekSessions: ChatSession[] = [];
  const monthSessions: ChatSession[] = [];
  const olderSessions: ChatSession[] = [];

  sessions.forEach(session => {
    const sessionDate = new Date(session.createdAt);
    if (sessionDate >= today) {
      todaySessions.push(session);
    } else if (sessionDate >= yesterday) {
      yesterdaySessions.push(session);
    } else if (sessionDate >= weekAgo) {
      weekSessions.push(session);
    } else if (sessionDate >= monthAgo) {
      monthSessions.push(session);
    } else {
      olderSessions.push(session);
    }
  });

  if (todaySessions.length > 0) groups.push({ label: "Today", sessions: todaySessions });
  if (yesterdaySessions.length > 0) groups.push({ label: "Yesterday", sessions: yesterdaySessions });
  if (weekSessions.length > 0) groups.push({ label: "Previous 7 Days", sessions: weekSessions });
  if (monthSessions.length > 0) groups.push({ label: "Previous 30 Days", sessions: monthSessions });
  if (olderSessions.length > 0) groups.push({ label: "Older", sessions: olderSessions });

  return groups;
}

export const SessionSidebar = memo(function SessionSidebar({
  sessions,
  activeSessionId,
  onCreateSession,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  isOpen,
  onClose,
}: SessionSidebarProps) {
  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <>
      {/* Backdrop overlay - mobile only */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 z-40 md:bg-black/30"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-0 top-0 bottom-0 w-[260px] bg-card/95 backdrop-blur-xl border-r border-border/20 flex flex-col z-50"
          >
            {/* Header with New Chat */}
            <div className="flex-shrink-0 p-2">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    onCreateSession();
                    onClose();
                  }}
                  variant="outline"
                  className="flex-1 justify-start gap-2 h-10 bg-transparent border-border/30 hover:bg-muted/50"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">New chat</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 hover:bg-muted/50"
                  onClick={onClose}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Sessions List */}
            <ScrollArea className="flex-1 px-2">
              <div className="space-y-4 pb-4">
                {groupedSessions.map(group => (
                  <div key={group.label}>
                    <h3 className="px-3 py-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                      {group.label}
                    </h3>
                    <div className="space-y-0.5">
                      {group.sessions.map(session => (
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
                    </div>
                  </div>
                ))}
                
                {sessions.length === 0 && (
                  <div className="px-3 py-8 text-center">
                    <p className="text-sm text-muted-foreground">No conversations yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Start a new chat to begin</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="flex-shrink-0 p-3 border-t border-border/20">
              <p className="text-[10px] text-muted-foreground/50 text-center">
                ZEX•IQ — Your AI companion
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
