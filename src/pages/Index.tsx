import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Brain, MessageCircle, Trash2 } from "lucide-react";
import { NexusOrb } from "@/components/NexusOrb";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ParticleBackground } from "@/components/ParticleBackground";
import { useNexusChat } from "@/hooks/useNexusChat";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [isStarted, setIsStarted] = useState(false);
  const { messages, isLoading, sendMessage, clearMessages } = useNexusChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
                THE NEXT EVOLUTION IN AI
              </motion.p>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-sm md:text-base text-muted-foreground/60 mb-12 max-w-md mx-auto"
              >
                Powered by advanced neural architectures. Limitless knowledge. 
                Unparalleled reasoning.
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
              className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl"
            >
              {[
                { icon: Brain, title: "Superior Intelligence", desc: "Multi-layered reasoning beyond any previous AI" },
                { icon: Zap, title: "Instant Response", desc: "Lightning-fast processing with streaming output" },
                { icon: Sparkles, title: "Creative Genius", desc: "Generate revolutionary ideas and solutions" },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 1 + i * 0.1 }}
                  className="glass rounded-2xl p-6 text-center hover:glow-border transition-all duration-300"
                >
                  <feature.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                  <h3 className="font-display text-sm tracking-wider text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
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
                    {isLoading ? "Processing..." : "Ready"}
                  </p>
                </div>
              </div>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearMessages}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    Ask me anything. I possess superior reasoning, vast knowledge, 
                    and the ability to help you with any challenge.
                  </p>
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
