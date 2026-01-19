import { memo } from "react";
import { Volume2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface VoiceSelectorProps {
  value: VoiceId;
  onChange: (voice: VoiceId) => void;
}

const VOICES: { id: VoiceId; name: string; description: string }[] = [
  { id: "alloy", name: "Alloy", description: "Neutral & balanced" },
  { id: "echo", name: "Echo", description: "Warm & conversational" },
  { id: "fable", name: "Fable", description: "British & expressive" },
  { id: "onyx", name: "Onyx", description: "Deep & authoritative" },
  { id: "nova", name: "Nova", description: "Friendly & upbeat" },
  { id: "shimmer", name: "Shimmer", description: "Clear & melodic" },
  { id: "coral", name: "Coral", description: "Soft & gentle" },
  { id: "sage", name: "Sage", description: "Wise & calm" },
  { id: "ash", name: "Ash", description: "Smooth & professional" },
  { id: "ballad", name: "Ballad", description: "Expressive & lyrical" },
  { id: "verse", name: "Verse", description: "Poetic & refined" },
  { id: "juniper", name: "Juniper", description: "Fresh & energetic" },
];

export const VoiceSelector = memo(({ value, onChange }: VoiceSelectorProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Volume2 className="w-4 h-4" />
        <span>Voice</span>
      </div>
      <Select value={value} onValueChange={(v) => onChange(v as VoiceId)}>
        <SelectTrigger className="glass-subtle h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="glass-strong max-h-64">
          {VOICES.map((voice) => (
            <SelectItem
              key={voice.id}
              value={voice.id}
              className="cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-medium">{voice.name}</span>
                <span className="text-xs text-muted-foreground">{voice.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

VoiceSelector.displayName = "VoiceSelector";
