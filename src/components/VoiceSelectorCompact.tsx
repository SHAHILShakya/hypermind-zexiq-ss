import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type VoiceId =
  | "alloy"
  | "echo"
  | "fable"
  | "onyx"
  | "nova"
  | "shimmer"
  | "coral"
  | "sage"
  | "ash"
  | "ballad"
  | "verse"
  | "juniper";

interface Voice {
  id: VoiceId;
  name: string;
  description: string;
  gender: "neutral" | "male" | "female";
}

const VOICES: Voice[] = [
  { id: "alloy", name: "Alloy", description: "Neutral & balanced", gender: "neutral" },
  { id: "echo", name: "Echo", description: "Warm & conversational", gender: "male" },
  { id: "fable", name: "Fable", description: "British & expressive", gender: "neutral" },
  { id: "onyx", name: "Onyx", description: "Deep & authoritative", gender: "male" },
  { id: "nova", name: "Nova", description: "Friendly & upbeat", gender: "female" },
  { id: "shimmer", name: "Shimmer", description: "Clear & melodic", gender: "female" },
  { id: "coral", name: "Coral", description: "Soft & gentle", gender: "female" },
  { id: "sage", name: "Sage", description: "Wise & calm", gender: "neutral" },
  { id: "ash", name: "Ash", description: "Smooth & professional", gender: "male" },
  { id: "ballad", name: "Ballad", description: "Expressive & lyrical", gender: "neutral" },
  { id: "verse", name: "Verse", description: "Poetic & refined", gender: "female" },
  { id: "juniper", name: "Juniper", description: "Fresh & energetic", gender: "female" },
];

interface VoiceSelectorCompactProps {
  value: VoiceId;
  onChange: (voice: VoiceId) => void;
  disabled?: boolean;
}

export const VoiceSelectorCompact = memo(({
  value,
  onChange,
  disabled,
}: VoiceSelectorCompactProps) => {
  const [open, setOpen] = useState(false);
  const currentVoice = VOICES.find((v) => v.id === value) || VOICES[4]; // Default to Nova

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-9 px-3 gap-2 text-muted-foreground hover:text-foreground glass-subtle rounded-lg"
        >
          <Volume2 className="w-4 h-4" />
          <span className="text-xs font-medium hidden sm:inline">{currentVoice.name}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-72 p-2 glass-strong border-border/30"
        align="start"
        sideOffset={8}
      >
        <div className="mb-2 px-2">
          <p className="text-xs font-medium text-foreground">Select Voice</p>
          <p className="text-[10px] text-muted-foreground">Choose how ZEX•IQ speaks</p>
        </div>
        
        <div className="grid grid-cols-2 gap-1 max-h-64 overflow-y-auto">
          <AnimatePresence>
            {VOICES.map((voice) => (
              <motion.button
                key={voice.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onChange(voice.id);
                  setOpen(false);
                }}
                className={`
                  relative flex flex-col items-start p-2.5 rounded-lg text-left
                  transition-all duration-150
                  ${value === voice.id 
                    ? "glass ring-1 ring-primary" 
                    : "hover:glass-subtle"}
                `}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="text-xs font-medium">{voice.name}</span>
                  {value === voice.id && (
                    <Check className="w-3 h-3 text-primary ml-auto" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  {voice.description}
                </span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </PopoverContent>
    </Popover>
  );
});

VoiceSelectorCompact.displayName = "VoiceSelectorCompact";
