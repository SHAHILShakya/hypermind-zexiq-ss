import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Cpu, Zap, Globe, Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type ModelId =
  | "perplexity/sonar"
  | "perplexity/sonar-pro"
  | "perplexity/sonar-reasoning"
  | "groq/llama-3.3-70b-versatile"
  | "groq/llama-3.1-8b-instant"
  | "lovable/gemini-2.5-flash"
  | "lovable/gemini-2.5-pro"
  | "lovable/gemini-3-flash-preview"
  | "lovable/gpt-5"
  | "lovable/gpt-5-mini"
  | "deepseek/deepseek-chat"
  | "deepseek/deepseek-reasoner";

export interface AIModel {
  id: ModelId;
  name: string;
  provider: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  icon: "perplexity" | "groq" | "google" | "openai" | "deepseek";
  supportsVision: boolean;
}

export const AI_MODELS: AIModel[] = [
  // Perplexity — search-grounded
  {
    id: "perplexity/sonar",
    name: "Sonar",
    provider: "Perplexity",
    description: "Fast web-search grounded responses",
    badge: "Search",
    badgeColor: "bg-blue-500/20 text-blue-400",
    icon: "perplexity",
    supportsVision: false,
  },
  {
    id: "perplexity/sonar-pro",
    name: "Sonar Pro",
    provider: "Perplexity",
    description: "Multi-step reasoning with 2× citations",
    badge: "Smart",
    badgeColor: "bg-blue-500/20 text-blue-400",
    icon: "perplexity",
    supportsVision: false,
  },
  {
    id: "perplexity/sonar-reasoning",
    name: "Sonar Reasoning",
    provider: "Perplexity",
    description: "Chain-of-thought with real-time search",
    badge: "Reason",
    badgeColor: "bg-blue-500/20 text-blue-400",
    icon: "perplexity",
    supportsVision: false,
  },
  // Google Gemini
  {
    id: "lovable/gemini-3-flash-preview",
    name: "Gemini Flash",
    provider: "Google",
    description: "Fast, balanced, next-gen Google model",
    badge: "Fast",
    badgeColor: "bg-green-500/20 text-green-400",
    icon: "google",
    supportsVision: true,
  },
  {
    id: "lovable/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    description: "Speed + multimodal reasoning",
    badge: "Balanced",
    badgeColor: "bg-green-500/20 text-green-400",
    icon: "google",
    supportsVision: true,
  },
  {
    id: "lovable/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    description: "Top-tier vision + complex reasoning",
    badge: "Pro",
    badgeColor: "bg-emerald-500/20 text-emerald-400",
    icon: "google",
    supportsVision: true,
  },
  // OpenAI
  {
    id: "lovable/gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "OpenAI",
    description: "Efficient, smart reasoning at lower cost",
    badge: "Fast",
    badgeColor: "bg-violet-500/20 text-violet-400",
    icon: "openai",
    supportsVision: true,
  },
  {
    id: "lovable/gpt-5",
    name: "GPT-5",
    provider: "OpenAI",
    description: "Powerful all-rounder with top accuracy",
    badge: "Pro",
    badgeColor: "bg-violet-500/20 text-violet-400",
    icon: "openai",
    supportsVision: true,
  },
  // DeepSeek
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek Chat",
    provider: "DeepSeek",
    description: "Advanced conversational AI",
    badge: "Chat",
    badgeColor: "bg-cyan-500/20 text-cyan-400",
    icon: "deepseek",
    supportsVision: false,
  },
  {
    id: "deepseek/deepseek-reasoner",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    description: "Deep multi-step reasoning powerhouse",
    badge: "Reason",
    badgeColor: "bg-cyan-500/20 text-cyan-400",
    icon: "deepseek",
    supportsVision: false,
  },
  // Groq — speed
  {
    id: "groq/llama-3.3-70b-versatile",
    name: "LLaMA 3.3 70B",
    provider: "Groq",
    description: "Ultra-fast open-source powerhouse",
    badge: "Speed",
    badgeColor: "bg-orange-500/20 text-orange-400",
    icon: "groq",
    supportsVision: false,
  },
  {
    id: "groq/llama-3.1-8b-instant",
    name: "LLaMA 3.1 8B",
    provider: "Groq",
    description: "Instant responses, lightweight tasks",
    badge: "Instant",
    badgeColor: "bg-orange-500/20 text-orange-400",
    icon: "groq",
    supportsVision: false,
  },
];

export const DEFAULT_MODEL: ModelId = "perplexity/sonar";

const MODEL_STORAGE_KEY = "zexiq-selected-model";

export function loadSelectedModel(): ModelId {
  try {
    const stored = localStorage.getItem(MODEL_STORAGE_KEY);
    if (stored && AI_MODELS.find(m => m.id === stored)) {
      return stored as ModelId;
    }
  } catch { /* ignore */ }
  return DEFAULT_MODEL;
}

export function saveSelectedModel(id: ModelId) {
  try {
    localStorage.setItem(MODEL_STORAGE_KEY, id);
  } catch { /* ignore */ }
}

// Icon components per provider
const ProviderIcon = ({ icon, className }: { icon: AIModel["icon"]; className?: string }) => {
  switch (icon) {
    case "perplexity":
      return <Globe className={className} />;
    case "groq":
      return <Zap className={className} />;
    case "google":
      return <Sparkles className={className} />;
    case "openai":
      return <Brain className={className} />;
    case "deepseek":
      return <Cpu className={className} />;
  }
};

const PROVIDERS = ["Perplexity", "Google", "OpenAI", "DeepSeek", "Groq"];

interface ModelSelectorProps {
  value: ModelId;
  onChange: (model: ModelId) => void;
  disabled?: boolean;
}

export const ModelSelector = memo(({ value, onChange, disabled }: ModelSelectorProps) => {
  const [open, setOpen] = useState(false);
  const current = AI_MODELS.find(m => m.id === value) ?? AI_MODELS[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-9 px-3 gap-1.5 text-muted-foreground hover:text-foreground glass-subtle rounded-lg max-w-[180px]"
        >
          <ProviderIcon icon={current.icon} className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-xs font-medium truncate hidden sm:inline">
            {current.provider} · {current.name}
          </span>
          <span className="text-xs font-medium truncate sm:hidden">{current.name}</span>
          <ChevronDown className="w-3 h-3 opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-2 glass-strong border-border/30"
        align="start"
        sideOffset={8}
      >
        <div className="mb-2 px-2">
          <p className="text-xs font-medium text-foreground">Select AI Model</p>
          <p className="text-[10px] text-muted-foreground">Choose which AI powers ZEX•IQ</p>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {PROVIDERS.map(provider => {
            const providerModels = AI_MODELS.filter(m => m.provider === provider);
            return (
              <div key={provider}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
                  {provider}
                </p>
                <div className="space-y-0.5">
                  <AnimatePresence>
                    {providerModels.map(model => (
                      <motion.button
                        key={model.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          onChange(model.id);
                          saveSelectedModel(model.id);
                          setOpen(false);
                        }}
                        className={`
                          w-full flex items-center gap-3 p-2.5 rounded-lg text-left
                          transition-all duration-150
                          ${value === model.id
                            ? "glass ring-1 ring-primary"
                            : "hover:glass-subtle"}
                        `}
                      >
                        <div className="w-7 h-7 rounded-md glass-subtle flex items-center justify-center flex-shrink-0">
                          <ProviderIcon icon={model.icon} className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{model.name}</span>
                            {model.badge && (
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${model.badgeColor}`}>
                                {model.badge}
                              </span>
                            )}
                            {value === model.id && (
                              <Check className="w-3 h-3 text-primary ml-auto flex-shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground leading-tight">
                            {model.description}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
});

ModelSelector.displayName = "ModelSelector";
