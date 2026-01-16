import { memo } from "react";
import { motion } from "framer-motion";
import { Brain, Zap, Heart, HelpCircle, Eye, Minus } from "lucide-react";
import { type MoodState } from "@/hooks/useAISettings";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MoodIndicatorProps {
  mood: MoodState;
  className?: string;
}

const MOOD_CONFIG: Record<MoodState, { 
  icon: typeof Brain; 
  color: string; 
  label: string;
  bgColor: string;
}> = {
  calm: {
    icon: Heart,
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    label: "Calm",
  },
  focused: {
    icon: Zap,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    label: "Focused",
  },
  stressed: {
    icon: Brain,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    label: "Stressed",
  },
  curious: {
    icon: HelpCircle,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    label: "Curious",
  },
  reflective: {
    icon: Eye,
    color: "text-indigo-400",
    bgColor: "bg-indigo-400/10",
    label: "Reflective",
  },
  neutral: {
    icon: Minus,
    color: "text-muted-foreground",
    bgColor: "bg-muted/30",
    label: "Neutral",
  },
};

export const MoodIndicator = memo(({ mood, className = "" }: MoodIndicatorProps) => {
  const config = MOOD_CONFIG[mood];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            key={mood}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-full
              ${config.bgColor} ${className}
            `}
          >
            <Icon className={`w-3 h-3 ${config.color}`} />
            <span className={`text-[10px] font-medium ${config.color}`}>
              {config.label}
            </span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Detected mood: {config.label}</p>
          <p className="text-xs text-muted-foreground">AI adapts to your emotional state</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

MoodIndicator.displayName = "MoodIndicator";
