import { useState, useRef, useEffect, memo, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Brain, MessageCircle, Trash2, Download, Image, Keyboard, Mic, Volume2 } from "lucide-react";
import { NexusOrb } from "@/components/NexusOrb";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput, ChatInputHandle } from "@/components/ChatInput";
import { ParticleBackground } from "@/components/ParticleBackground";
import { SessionSidebar } from "@/components/SessionSidebar";
import { ThemeSelector } from "@/components/ThemeSelector";
import { useNexusChat } from "@/hooks/useNexusChat";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useTheme } from "@/hooks/useTheme";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const FeatureCard = memo(({ icon: Icon, title, desc }: { icon: typeof Brain; title: string; desc: string }) => (
  <div className="glass-card rounded-2xl p-6 text-center hover:scale-[1.02] transition-all duration-300">
    <div className="w-12 h-12 rounded-xl glass-subtle mx-auto mb-4 flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <h3 className="font-display text-sm font-medium tracking-wide text-foreground mb-2">
      {title}
    </h3>
    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
  </div>
));

FeatureCard.displayName = "FeatureCard";

const ShortcutsDialog = memo(() => (
  <Dialog>
    <DialogTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
      >
        <Keyboard className="w-4 h-4" />
      </Button>
    </DialogTrigger>
    <DialogContent className="glass-strong border-border">
      <DialogHeader>
        <DialogTitle className="text-gradient font-display">Keyboard Shortcuts</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 mt-4">
        {[
          { keys: "/", desc: "Focus input" },
          { keys: "Ctrl + K", desc: "Clear chat" },
          { keys: "Ctrl + E", desc: "Export chat" },
          { keys: "Ctrl + N", desc: "New session" },
          { keys: "Escape", desc: "Unfocus input" },
          { keys: "Enter", desc: "Send message" },
          { keys: "Shift + Enter", desc: "New line" },
        ].map(({ keys, desc }) => (
          <div key={keys} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{desc}</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">{keys}</kbd>
          </div>
        ))}
      </div>
    </DialogContent>
  </Dialog>
));

ShortcutsDialog.displayName = "ShortcutsDialog";

const Index = () => {
  const [isStarted, setIsStarted] = useState(() => {
    // Auto-start if there are sessions with messages
    const stored = localStorage.getItem("zexiq-chat-sessions");
    if (stored) {
      const sessions = JSON.parse(stored);
      return sessions.some((s: { messages: unknown[] }) => s.messages.length > 0);
    }
    // Check legacy storage
    const legacyStored = localStorage.getItem("zexiq-chat-history");
    return legacyStored ? JSON.parse(legacyStored).length > 0 : false;
  });

  // Hooks
  const {
    sessions,
    activeSession,
    activeSessionId,
    createSession,
    selectSession,
    deleteSession,
    renameSession,
    updateSessionMessages,
    clearSessionMessages,
  } = useChatSessions();

  const { theme, themeId, setTheme } = useTheme();
  const { speak, stop, isSpeaking, speakingMessageId } = useTextToSpeech();

  const handleMessagesChange = useCallback((messages: typeof activeSession.messages) => {
    if (activeSessionId) {
      updateSessionMessages(activeSessionId, messages);
    }
  }, [activeSessionId, updateSessionMessages]);

  const { 
    messages, 
    isLoading, 
    sendMessage, 
    clearMessages, 
    exportChat,
    setInitialMessages,
    messageCount 
  } = useNexusChat(activeSession?.messages || [], handleMessagesChange);

  // Sync messages when session changes
  useEffect(() => {
    if (activeSession) {
      setInitialMessages(activeSession.messages);
    } else {
      setInitialMessages([]);
    }
  }, [activeSessionId, activeSession, setInitialMessages]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);

  const handleClearMessages = useCallback(() => {
    if (activeSessionId) {
      clearSessionMessages(activeSessionId);
      clearMessages();
    }
  }, [activeSessionId, clearSessionMessages, clearMessages]);

  const handleNewSession = useCallback(() => {
    createSession();
  }, [createSession]);

  // Keyboard shortcuts
  const shortcuts = useMemo(() => [
    { key: "k", ctrl: true, action: handleClearMessages, description: "Clear chat" },
    { key: "e", ctrl: true, action: exportChat, description: "Export chat" },
    { key: "n", ctrl: true, action: handleNewSession, description: "New session" },
    { key: "/", action: () => chatInputRef.current?.focus(), description: "Focus input" },
  ], [handleClearMessages, exportChat, handleNewSession]);

  useKeyboardShortcuts(shortcuts);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  // Create initial session if none exists when starting
  useEffect(() => {
    if (isStarted && sessions.length === 0) {
      createSession();
    }
  }, [isStarted, sessions.length, createSession]);

  const features = [
    { icon: Brain, title: "Superior Intelligence", desc: "Multi-layered reasoning beyond any previous AI" },
    { icon: Zap, title: "Instant Response", desc: "Lightning-fast streaming with real-time output" },
    { icon: Image, title: "Vision Analysis", desc: "Upload images for intelligent visual understanding" },
    { icon: Volume2, title: "Voice Output", desc: "Listen to responses with text-to-speech" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Mesh gradient background - iOS style */}
      <div className="fixed inset-0 bg-mesh-gradient pointer-events-none z-0" />
      
      {/* Subtle grid pattern */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-0" />
      
      {/* Radial glow effect */}
      <div className="fixed inset-0 bg-radial-glow pointer-events-none z-0" />
      
      {/* Particles only for neon themes */}
      {theme.style === "neon" && <ParticleBackground />}

      <AnimatePresence mode="wait">
        {!isStarted ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6"
          >
            {/* Hero Section */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center"
            >
              {/* Orb */}
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-8"
              >
                <NexusOrb isActive size="lg" />
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="font-display text-6xl md:text-8xl font-bold text-glow-strong mb-4"
              >
                <span className="text-gradient">ZEX•IQ</span>
              </motion.h1>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-xl md:text-2xl text-muted-foreground mb-2 font-display tracking-wider"
              >
                THE MOST ADVANCED AI IN THE WORLD
              </motion.p>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-sm md:text-base text-muted-foreground/60 mb-12 max-w-md mx-auto"
              >
                Powered by next-gen neural architectures. Code generation. Image analysis. 
                Voice I/O. Multiple themes. Limitless knowledge.
              </motion.p>

              {/* CTA Button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <Button
                  onClick={() => setIsStarted(true)}
                  className="
                    group relative px-10 py-6 rounded-2xl
                    bg-primary hover:bg-primary/90
                    font-display text-lg tracking-wide font-medium
                    transition-all duration-300
                  "
                  style={{
                    boxShadow: "0 8px 32px hsl(var(--primary) / 0.3)"
                  }}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <MessageCircle className="w-5 h-5" />
                    Start Chat
                  </span>
                </Button>
              </motion.div>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl"
            >
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 1 + i * 0.1 }}
                >
                  <FeatureCard {...feature} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 min-h-screen flex"
          >
            {/* Session Sidebar */}
            <SessionSidebar
              sessions={sessions}
              activeSessionId={activeSessionId}
              onCreateSession={createSession}
              onSelectSession={selectSession}
              onDeleteSession={deleteSession}
              onRenameSession={renameSession}
            />

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <header className="glass-strong border-b border-border/30 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <NexusOrb isActive isThinking={isLoading} size="sm" />
                  <div>
                    <h1 className="font-display text-xl font-bold text-gradient">ZEX•IQ</h1>
                    <p className="text-xs text-muted-foreground">
                      {isLoading ? "Processing..." : `Ready • ${messageCount} messages`}
                    </p>
                  </div>
                </div>
                
                <TooltipProvider>
                  <div className="flex items-center gap-1">
                    <ThemeSelector currentTheme={themeId} onSelectTheme={setTheme} />
                    <ShortcutsDialog />
                    
                    {messageCount > 0 && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={exportChat}
                              className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Export Chat (Ctrl+E)</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleClearMessages}
                              className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Clear Chat (Ctrl+K)</TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </TooltipProvider>
              </header>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20"
                  >
                    <NexusOrb isActive size="md" />
                    <h2 className="font-display text-2xl font-bold text-gradient mt-8 mb-2">
                      How can I assist you?
                    </h2>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                      Ask me anything. I possess superior reasoning, vast knowledge, 
                      code generation, image analysis, and voice capabilities.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                      {["Write code", "Analyze images", "Explain concepts", "Generate ideas"].map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          size="sm"
                          className="glass text-xs"
                          onClick={() => sendMessage(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    messageId={message.id}
                    role={message.role}
                    content={message.content}
                    isStreaming={isLoading && index === messages.length - 1 && message.role === "assistant"}
                    isSpeaking={speakingMessageId === message.id}
                    onSpeak={speak}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-6 pt-0">
                <ChatInput ref={chatInputRef} onSend={sendMessage} isLoading={isLoading} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
