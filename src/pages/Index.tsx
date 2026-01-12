import { useState, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Brain, MessageCircle, Trash2, Download, Image } from "lucide-react";
import { NexusOrb } from "@/components/NexusOrb";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ParticleBackground } from "@/components/ParticleBackground";
import { useNexusChat } from "@/hooks/useNexusChat";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FeatureCard = memo(({ icon: Icon, title, desc }: { icon: typeof Brain; title: string; desc: string }) => (
  <div className="glass rounded-2xl p-6 text-center hover:glow-border transition-all duration-300">
    <Icon className="w-8 h-8 text-primary mx-auto mb-4" />
    <h3 className="font-display text-sm tracking-wider text-foreground mb-2">
      {title}
    </h3>
    <p className="text-xs text-muted-foreground">{desc}</p>
  </div>
));

FeatureCard.displayName = "FeatureCard";

const Index = () => {
  const [isStarted, setIsStarted] = useState(false);
  const { messages, isLoading, sendMessage, clearMessages, exportChat, messageCount } = useNexusChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom with smooth behavior
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  const features = [
    { icon: Brain, title: "Superior Intelligence", desc: "Multi-layered reasoning beyond any previous AI" },
    { icon: Zap, title: "Instant Response", desc: "Lightning-fast streaming with real-time output" },
    { icon: Sparkles, title: "Creative Genius", desc: "Generate revolutionary ideas and solutions" },
    { icon: Image, title: "Vision Analysis", desc: "Upload images for intelligent visual understanding" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      
      {/* Radial glow effect */}
      <div className="fixed inset-0 bg-radial-glow pointer-events-none z-0" />
      
      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-0" />

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
                <span className="text-gradient">NEXUS</span>
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
                Limitless knowledge. Unparalleled reasoning.
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
                    bg-gradient-to-r from-primary to-accent
                    hover:from-primary/90 hover:to-accent/90
                    font-display text-lg tracking-wider
                    glow-border-strong animate-pulse-glow
                    transition-all duration-300
                  "
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <MessageCircle className="w-5 h-5" />
                    INITIALIZE NEXUS
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
            className="relative z-10 min-h-screen flex flex-col"
          >
            {/* Header */}
            <header className="glass border-b border-border/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <NexusOrb isActive isThinking={isLoading} size="sm" />
                <div>
                  <h1 className="font-display text-xl font-bold text-gradient">NEXUS</h1>
                  <p className="text-xs text-muted-foreground">
                    {isLoading ? "Processing..." : `Ready • ${messageCount} messages`}
                  </p>
                </div>
              </div>
              
              <TooltipProvider>
                <div className="flex items-center gap-2">
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
                        <TooltipContent>Export Chat</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={clearMessages}
                            className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Clear Chat</TooltipContent>
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
                    code generation with syntax highlighting, and image analysis capabilities.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                    {["Write code", "Analyze images", "Explain concepts", "Generate ideas"].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        className="glass text-xs"
                        onClick={() => {}}
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
                  role={message.role}
                  content={message.content}
                  isStreaming={isLoading && index === messages.length - 1 && message.role === "assistant"}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 pt-0">
              <ChatInput onSend={sendMessage} isLoading={isLoading} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
