import { memo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Palette, Plus, Save, X, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface CustomTheme {
  id: string;
  name: string;
  style: "glass" | "neon" | "minimal";
  colors: {
    background: string;
    foreground: string;
    card: string;
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
  };
  personality: {
    tone: string;
    style: string;
    traits: string[];
  };
}

interface CustomThemeCreatorProps {
  onSaveTheme: (theme: CustomTheme) => void;
  existingThemes: CustomTheme[];
  onDeleteTheme: (id: string) => void;
}

const TONE_PRESETS = [
  "warm, approachable, and supportive",
  "calm, professional, and thoughtful",
  "precise, futuristic, and efficient",
  "authoritative, confident, and wise",
  "poetic, abstract, and creative",
  "passionate, bold, and energetic",
  "cold, precise, and hacker-style",
  "elegant, refined, and sophisticated",
];

const STYLE_PRESETS = [
  "gentle, human-like communication with emotional awareness",
  "balanced communication with depth and clarity",
  "direct, data-driven responses with technical precision",
  "commanding presence with deep insights",
  "imaginative language with metaphorical depth",
  "vibrant communication with enthusiasm",
  "minimal, code-like responses with technical focus",
  "graceful communication with aesthetic awareness",
];

const TRAIT_OPTIONS = [
  "empathetic", "nurturing", "patient", "composed", "insightful", "reliable",
  "cheerful", "supportive", "motivating", "analytical", "cutting-edge", "minimalist",
  "decisive", "strategic", "experienced", "artistic", "visionary", "ethereal",
  "dynamic", "inspiring", "warm", "logical", "efficient", "technical",
  "stylish", "thoughtful", "graceful", "direct", "honest", "unadorned",
];

function hslToString(h: number, s: number, l: number): string {
  return `${h} ${s}% ${l}%`;
}

function parseHsl(hsl: string): [number, number, number] {
  const parts = hsl.split(" ").map(p => parseFloat(p.replace("%", "")));
  return [parts[0] || 220, parts[1] || 50, parts[2] || 50];
}

const ColorPicker = memo(({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void;
}) => {
  const [h, s, l] = parseHsl(value);

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 rounded-lg border border-border flex-shrink-0"
          style={{ backgroundColor: `hsl(${value})` }}
        />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] w-6 text-muted-foreground">H</span>
            <Slider
              value={[h]}
              onValueChange={([v]) => onChange(hslToString(v, s, l))}
              max={360}
              step={1}
              className="flex-1"
            />
            <span className="text-[10px] w-8 text-right">{Math.round(h)}°</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] w-6 text-muted-foreground">S</span>
            <Slider
              value={[s]}
              onValueChange={([v]) => onChange(hslToString(h, v, l))}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-[10px] w-8 text-right">{Math.round(s)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] w-6 text-muted-foreground">L</span>
            <Slider
              value={[l]}
              onValueChange={([v]) => onChange(hslToString(h, s, v))}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-[10px] w-8 text-right">{Math.round(l)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
});

ColorPicker.displayName = "ColorPicker";

export const CustomThemeCreator = memo(({ 
  onSaveTheme, 
  existingThemes,
  onDeleteTheme 
}: CustomThemeCreatorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [style, setStyle] = useState<"glass" | "neon" | "minimal">("glass");
  const [colors, setColors] = useState({
    background: "230 25% 9%",
    foreground: "220 20% 98%",
    card: "230 25% 14%",
    primary: "220 90% 60%",
    secondary: "280 70% 65%",
    accent: "220 90% 55%",
    muted: "230 20% 18%",
  });
  const [tone, setTone] = useState(TONE_PRESETS[0]);
  const [personalityStyle, setPersonalityStyle] = useState(STYLE_PRESETS[0]);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([ "empathetic", "patient", "supportive"]);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      toast.error("Please enter a theme name");
      return;
    }

    const newTheme: CustomTheme = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      style,
      colors,
      personality: {
        tone,
        style: personalityStyle,
        traits: selectedTraits,
      },
    };

    onSaveTheme(newTheme);
    toast.success(`Theme "${name}" created!`);
    setIsOpen(false);
    setName("");
  }, [name, style, colors, tone, personalityStyle, selectedTraits, onSaveTheme]);

  const toggleTrait = useCallback((trait: string) => {
    setSelectedTraits(prev => 
      prev.includes(trait) 
        ? prev.filter(t => t !== trait)
        : prev.length < 5 ? [...prev, trait] : prev
    );
  }, []);

  const updateColor = useCallback((key: keyof typeof colors, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="glass gap-2">
          <Plus className="w-4 h-4" />
          Create Theme
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gradient font-display flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Create Custom Theme
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Theme Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Custom Theme"
                className="glass"
              />
            </div>
            <div className="space-y-2">
              <Label>Theme Style</Label>
              <Select value={style} onValueChange={(v) => setStyle(v as typeof style)}>
                <SelectTrigger className="glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong">
                  <SelectItem value="glass">Glass (iOS Style)</SelectItem>
                  <SelectItem value="neon">Neon (Cyberpunk)</SelectItem>
                  <SelectItem value="minimal">Minimal (Clean)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              <h3 className="font-display text-sm font-semibold">Colors</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ColorPicker label="Background" value={colors.background} onChange={(v) => updateColor("background", v)} />
              <ColorPicker label="Foreground" value={colors.foreground} onChange={(v) => updateColor("foreground", v)} />
              <ColorPicker label="Card" value={colors.card} onChange={(v) => updateColor("card", v)} />
              <ColorPicker label="Primary" value={colors.primary} onChange={(v) => updateColor("primary", v)} />
              <ColorPicker label="Secondary" value={colors.secondary} onChange={(v) => updateColor("secondary", v)} />
              <ColorPicker label="Accent" value={colors.accent} onChange={(v) => updateColor("accent", v)} />
            </div>
          </div>

          {/* Preview */}
          <div 
            className="p-4 rounded-xl border"
            style={{ 
              backgroundColor: `hsl(${colors.background})`,
              borderColor: `hsl(${colors.muted})`,
            }}
          >
            <p className="text-sm font-medium" style={{ color: `hsl(${colors.foreground})` }}>
              Theme Preview
            </p>
            <div className="flex gap-2 mt-2">
              <div className="px-3 py-1 rounded-lg text-xs" style={{ backgroundColor: `hsl(${colors.primary})`, color: `hsl(${colors.background})` }}>
                Primary
              </div>
              <div className="px-3 py-1 rounded-lg text-xs" style={{ backgroundColor: `hsl(${colors.secondary})`, color: `hsl(${colors.foreground})` }}>
                Secondary
              </div>
              <div className="px-3 py-1 rounded-lg text-xs" style={{ backgroundColor: `hsl(${colors.card})`, color: `hsl(${colors.foreground})` }}>
                Card
              </div>
            </div>
          </div>

          {/* AI Personality */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-display text-sm font-semibold">AI Personality</h3>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="glass text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong">
                  {TONE_PRESETS.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Communication Style</Label>
              <Select value={personalityStyle} onValueChange={setPersonalityStyle}>
                <SelectTrigger className="glass text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong">
                  {STYLE_PRESETS.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Personality Traits (Select up to 5)</Label>
              <div className="flex flex-wrap gap-1.5">
                {TRAIT_OPTIONS.map((trait) => (
                  <button
                    key={trait}
                    onClick={() => toggleTrait(trait)}
                    className={`
                      px-2 py-0.5 rounded-full text-[10px] transition-all
                      ${selectedTraits.includes(trait) 
                        ? "bg-primary text-primary-foreground" 
                        : "glass-subtle hover:bg-muted/50"}
                    `}
                  >
                    {trait}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Existing Custom Themes */}
          {existingThemes.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-display text-sm font-semibold">Your Custom Themes</h3>
              <div className="space-y-2">
                {existingThemes.map((theme) => (
                  <div key={theme.id} className="flex items-center justify-between p-3 rounded-lg glass-subtle">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${theme.colors.primary})` }} />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${theme.colors.secondary})` }} />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${theme.colors.background})` }} />
                      </div>
                      <span className="text-sm font-medium">{theme.name}</span>
                      <span className="text-[10px] text-muted-foreground capitalize">({theme.style})</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => onDeleteTheme(theme.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Theme
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

CustomThemeCreator.displayName = "CustomThemeCreator";
