import { useState, useRef, useEffect, memo, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, MessageCircle, Trash2, Keyboard, Heart, Clock, Eye, Menu, Search } from "lucide-react";
import { NexusOrb } from "@/components/NexusOrb";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput, ChatInputHandle } from "@/components/ChatInput";
import { ParticleBackground } from "@/components/ParticleBackground";
import { SessionSidebar } from "@/components/SessionSidebar";
import { ThemeSelector } from "@/components/ThemeSelector";
import { AISettingsPanel } from "@/components/AISettingsPanel";
import { MoodIndicator } from "@/components/MoodIndicator";
import { SilenceMessage } from "@/components/SilenceMessage";
import { TypingIndicator } from "@/components/TypingIndicator";
import { SuggestedPrompts } from "@/components/SuggestedPrompts";
import { ConversationSearch } from "@/components/ConversationSearch";
import { ExportDialog } from "@/components/ExportDialog";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { useNexusChat } from "@/hooks/useNexusChat";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useTheme } from "@/hooks/useTheme";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAISettings } from "@/hooks/useAISettings";
import { useSilenceAware } from "@/hooks/useSilenceAware";
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
import type { UploadedFile } from "@/components/FileUploadButton";

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
        className="text-muted-foreground hover:text-foreground hover:bg-muted/50 h-8 w-8"
      >
        <Keyboard className="w-4 h-4" />
      </Button>
    </DialogTrigger>
    <DialogContent className="glass-strong border-border/30">
      <DialogHeader>
        <DialogTitle className="text-gradient font-display">Keyboard Shortcuts</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 mt-4">
        {[
          { keys: "/", desc: "Focus input" },
          { keys: "Ctrl + K", desc: "Clear chat" },
          { keys: "Ctrl + F", desc: "Search" },
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
    const stored = localStorage.getItem("zexiq-chat-sessions");
    if (stored) {
      const sessions = JSON.parse(stored);
      return sessions.some((s: { messages: unknown[] }) => s.messages.length > 0);
    }
    const legacyStored = localStorage.getItem("zexiq-chat-history");
    return legacyStored ? JSON.parse(legacyStored).length > 0 : false;
  });
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

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
  const { speak, stop, isSpeaking, speakingMessageId, selectedVoice, setVoice } = useTextToSpeech();
  
  const {
    settings: aiSettings,
    updateMoodFromText,
    recordKeystroke,
    toggleMirrorMode,
    setTruthMode,
    addIdentityRule,
    removeIdentityRule,
    toggleIdentityRule,
    toggleTimePerspective,
    toggleMoodSync,
    toggleSilenceAware,
    toggleThemeBoundPersonality,
    toggleAutoRead,
    buildDynamicPrompt,
  } = useAISettings();

  const { silenceMessage, recordActivity, dismissSilenceMessage } = useSilenceAware(aiSettings.silenceAwareEnabled);

  const handleMessagesChange = useCallback((messages: typeof activeSession.messages) => {
    if (activeSessionId) {
      updateSessionMessages(activeSessionId, messages);
    }
  }, [activeSessionId, updateSessionMessages]);

  const { 
    messages, 
    isLoading, 
    sendMessage: baseSendMessage, 
    regenerateResponse,
    editAndResend,
    clearMessages, 
    setInitialMessages,
    messageCount 
  } = useNexusChat(activeSession?.messages || [], handleMessagesChange);

  const sendMessage = useCallback(async (content: string, image?: File, files?: UploadedFile[]) => {
    updateMoodFromText(content);
    recordActivity();
    
    const dynamicPrompt = buildDynamicPrompt(themeId);
    
    // Build file context for the message
    let fileContext = "";
    if (files && files.length > 0) {
      fileContext = "\n\n[Attached files:\n";
      for (const f of files) {
        if (f.content) {
          fileContext += `--- ${f.file.name} ---\n${f.content}\n\n`;
        } else {
          fileContext += `--- ${f.file.name} (${f.type}) ---\n`;
        }
      }
      fileContext += "]";
    }
    
    await baseSendMessage(content + fileContext, image, dynamicPrompt);
  }, [baseSendMessage, updateMoodFromText, recordActivity, buildDynamicPrompt, themeId]);

  useEffect(() => {
    if (activeSession) {
      setInitialMessages(activeSession.messages);
    } else {
      setInitialMessages([]);
    }
  }, [activeSessionId, activeSession, setInitialMessages]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
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

  const shortcuts = useMemo(() => [
    { key: "k", ctrl: true, action: handleClearMessages, description: "Clear chat" },
    { key: "n", ctrl: true, action: handleNewSession, description: "New session" },
    { key: "f", ctrl: true, action: () => setIsSearchOpen(true), description: "Search" },
    { key: "/", action: () => chatInputRef.current?.focus(), description: "Focus input" },
  ], [handleClearMessages, handleNewSession]);

  useKeyboardShortcuts(shortcuts);

  const handleEditMessage = useCallback((messageId: string, newContent: string) => {
    const dynamicPrompt = buildDynamicPrompt(themeId);
    editAndResend(messageId, newContent, dynamicPrompt);
  }, [editAndResend, buildDynamicPrompt, themeId]);

  const handleScrollToMessage = useCallback((messageId: string) => {
    setHighlightedMessageId(messageId);
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setTimeout(() => setHighlightedMessageId(null), 2000);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  useEffect(() => {
    if (isStarted && sessions.length === 0) {
      createSession();
    }
  }, [isStarted, sessions.length, createSession]);

  const features = [
    { icon: Brain, title: "Mood-Reactive", desc: "Adapts to your emotional patterns" },
    { icon: Eye, title: "Mirror Mode", desc: "Reflects your intent with deep questions" },
    { icon: Clock, title: "Time Perspectives", desc: "View decisions across time horizons" },
    { icon: Heart, title: "Truth Modes", desc: "Choose comfort, honest, or brutal honesty" },
  ];

  return (
    <div className="h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background layers */}
      <div className="fixed inset-0 bg-mesh-gradient pointer-events-none z-0" />
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-0" />
      <div className="fixed inset-0 bg-radial-glow pointer-events-none z-0" />
      
      {theme.style === "neon" && <ParticleBackground />}

      <AnimatePresence mode="wait">
        {!isStarted ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 overflow-auto"
          >
            {/* Hero Section */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center"
            >
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-8"
              >
                <NexusOrb isActive size="lg" />
              </motion.div>

              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="font-display text-5xl sm:text-6xl md:text-8xl font-bold text-glow-strong mb-4"
              >
                <span className="text-gradient">ZEX•IQ</span>
              </motion.h1>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-2 font-display tracking-wider"
              >
                THE MOST ADVANCED AI IN THE WORLD
              </motion.p>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-xs sm:text-sm md:text-base text-muted-foreground/60 mb-12 max-w-md mx-auto px-4"
              >
                Powered by next-gen neural architectures. Code generation. Image analysis. 
                Voice I/O. Multiple themes. Limitless knowledge.
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <Button
                  onClick={() => setIsStarted(true)}
                  className="
                    group relative px-8 sm:px-10 py-5 sm:py-6 rounded-2xl
                    bg-primary hover:bg-primary/90
                    font-display text-base sm:text-lg tracking-wide font-medium
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
              className="mt-16 sm:mt-20 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl px-4"
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
            className="absolute inset-0 z-10 flex flex-col"
          >
            {/* Session Sidebar */}
            <SessionSidebar
              sessions={sessions}
              activeSessionId={activeSessionId}
              onCreateSession={createSession}
              onSelectSession={selectSession}
              onDeleteSession={deleteSession}
              onRenameSession={renameSession}
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
            />

            {/* Header - Minimal & Clean */}
            <header className="flex-shrink-0 glass-strong border-b border-border/10 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <NexusOrb isActive isThinking={isLoading} size="sm" />
                <div className="hidden sm:block">
                  <h1 className="font-display text-base sm:text-lg font-bold text-gradient leading-none">ZEX•IQ</h1>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                    {isLoading ? "Thinking..." : "Ready"}
                  </p>
                </div>
                <MoodIndicator mood={aiSettings.currentMood} />
              </div>
              
              <TooltipProvider>
                <div className="flex items-center gap-0.5">
                  <AISettingsPanel
                    settings={aiSettings}
                    onToggleMirrorMode={toggleMirrorMode}
                    onSetTruthMode={setTruthMode}
                    onAddIdentityRule={addIdentityRule}
                    onRemoveIdentityRule={removeIdentityRule}
                    onToggleIdentityRule={toggleIdentityRule}
                    onToggleTimePerspective={toggleTimePerspective}
                    onToggleMoodSync={toggleMoodSync}
                    onToggleSilenceAware={toggleSilenceAware}
                    onToggleThemeBoundPersonality={toggleThemeBoundPersonality}
                    onToggleAutoRead={toggleAutoRead}
                    selectedVoice={selectedVoice}
                    onVoiceChange={setVoice}
                  />
                  <ThemeSelector currentTheme={themeId} onSelectTheme={setTheme} />
                  
                  <div className="hidden sm:flex items-center">
                    <ShortcutsDialog />
                  </div>
                  
                  {messageCount > 0 && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSearchOpen(true)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Search className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Search (Ctrl+F)</TooltipContent>
                      </Tooltip>
                      
                      <ExportDialog messages={messages} />
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClearMessages}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Clear Chat</TooltipContent>
                      </Tooltip>
                    </>
                  )}
                  
                  <UserProfileDropdown />
                </div>
              </TooltipProvider>
            </header>

            {/* Search Bar */}
            <ConversationSearch
              messages={messages}
              onScrollToMessage={handleScrollToMessage}
              isOpen={isSearchOpen}
              onClose={() => setIsSearchOpen(false)}
            />

            {/* Messages Area */}
            <div 
              ref={scrollAreaRef}
              className="flex-1 overflow-y-auto overscroll-contain"
            >
              <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-12 sm:py-16 md:py-24"
                  >
                    <NexusOrb isActive size="md" />
                    <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-gradient mt-6 mb-2">
                      How can I help you today?
                    </h2>
                    <p className="text-muted-foreground text-xs sm:text-sm max-w-sm mx-auto mb-6 sm:mb-8 px-4">
                      Ask me anything. I'm here to help with reasoning, code, analysis, and more.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto px-4">
                      {["Write code", "Analyze images", "Explain concepts", "Generate ideas"].map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          size="sm"
                          className="glass text-xs h-8"
                          onClick={() => sendMessage(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                )}

                <div className="space-y-3 sm:space-y-4">
                  {messages.map((message, index) => {
                    const isLastAssistant = message.role === "assistant" && 
                      index === messages.length - 1;
                    return (
                      <ChatMessage
                        key={message.id}
                        messageId={message.id}
                        role={message.role}
                        content={message.content}
                        isStreaming={isLoading && index === messages.length - 1 && message.role === "assistant"}
                        isSpeaking={speakingMessageId === message.id}
                        isLastAssistant={isLastAssistant && !isLoading}
                        isHighlighted={highlightedMessageId === message.id}
                        onSpeak={speak}
                        onRegenerate={() => regenerateResponse(buildDynamicPrompt(themeId))}
                        onEdit={handleEditMessage}
                      />
                    );
                  })}
                  
                  <AnimatePresence>
                    {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
                      <TypingIndicator />
                    )}
                  </AnimatePresence>
                  
                  {!isLoading && messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
                    <SuggestedPrompts 
                      onSelect={sendMessage}
                      lastMessage={messages[messages.length - 1].content}
                    />
                  )}
                </div>
                
                <div ref={messagesEndRef} className="h-px" />
              </div>
            </div>

            {/* Input Area - Clean & Minimal */}
            <div className="flex-shrink-0 border-t border-border/10 glass-subtle">
              <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-2.5 sm:py-3">
                <ChatInput 
                  ref={chatInputRef} 
                  onSend={sendMessage} 
                  isLoading={isLoading}
                  selectedVoice={selectedVoice}
                  onVoiceChange={setVoice}
                />
              </div>
            </div>
            
            <SilenceMessage message={silenceMessage} onDismiss={dismissSilenceMessage} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;