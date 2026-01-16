import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Brain,
  Shield,
  Clock,
  Sparkles,
  Eye,
  Heart,
  Zap,
  Target,
  Palette,
  Volume2,
  Plus,
  X,
  Check,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type AISettings, type TruthMode, type PersonaDrift } from "@/hooks/useAISettings";
import { Volume2 as Volume2Icon, Mic } from "lucide-react";

interface AISettingsPanelProps {
  settings: AISettings;
  onToggleMirrorMode: () => void;
  onSetTruthMode: (mode: TruthMode) => void;
  onAddIdentityRule: (rule: string) => void;
  onRemoveIdentityRule: (id: string) => void;
  onToggleIdentityRule: (id: string) => void;
  onToggleTimePerspective: () => void;
  onToggleMoodSync: () => void;
  onToggleSilenceAware: () => void;
  onToggleThemeBoundPersonality: () => void;
  onToggleAutoRead: () => void;
}

const TRUTH_MODES: { id: TruthMode; name: string; icon: typeof Heart; description: string }[] = [
  { id: "comfort", name: "Comfort", icon: Heart, description: "Supportive & gentle" },
  { id: "honest", name: "Honest", icon: Target, description: "Balanced realism" },
  { id: "brutal", name: "Brutal", icon: Zap, description: "Unfiltered truth" },
];

const SettingRow = memo(({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
  children,
}: {
  icon: typeof Brain;
  title: string;
  description: string;
  enabled?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
}) => (
  <div className="flex items-start gap-4 p-4 rounded-xl glass-subtle">
    <div className="w-10 h-10 rounded-lg glass flex items-center justify-center flex-shrink-0">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-medium text-sm">{title}</h4>
        {onToggle && (
          <Switch checked={enabled} onCheckedChange={onToggle} />
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      {children}
    </div>
  </div>
));

SettingRow.displayName = "SettingRow";

export const AISettingsPanel = memo(({
  settings,
  onToggleMirrorMode,
  onSetTruthMode,
  onAddIdentityRule,
  onRemoveIdentityRule,
  onToggleIdentityRule,
  onToggleTimePerspective,
  onToggleMoodSync,
  onToggleSilenceAware,
  onToggleThemeBoundPersonality,
  onToggleAutoRead,
}: AISettingsPanelProps) => {
  const [newRule, setNewRule] = useState("");
  const [isAddingRule, setIsAddingRule] = useState(false);

  const handleAddRule = () => {
    if (newRule.trim()) {
      onAddIdentityRule(newRule.trim());
      setNewRule("");
      setIsAddingRule(false);
    }
  };

  return (
    <Sheet>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent>AI Intelligence Settings</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <SheetContent className="glass-strong border-border w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-gradient font-display flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Intelligence Settings
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Current Mood Display */}
          <div className="p-4 rounded-xl glass text-center">
            <p className="text-xs text-muted-foreground mb-1">Detected Mood</p>
            <p className="font-display text-lg capitalize text-gradient">
              {settings.currentMood}
            </p>
          </div>

          {/* Truth Permission System */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              <h3 className="font-display text-sm font-semibold">Truth Permission</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TRUTH_MODES.map(({ id, name, icon: ModeIcon, description }) => (
                <button
                  key={id}
                  onClick={() => onSetTruthMode(id)}
                  className={`
                    p-3 rounded-xl text-center transition-all duration-200
                    ${settings.truthMode === id 
                      ? "glass-strong ring-2 ring-primary" 
                      : "glass-subtle hover:bg-muted/30"}
                  `}
                >
                  <ModeIcon className={`w-5 h-5 mx-auto mb-1 ${settings.truthMode === id ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="text-xs font-medium">{name}</p>
                  <p className="text-[10px] text-muted-foreground">{description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Mirror Mode */}
          <SettingRow
            icon={Eye}
            title="Mirror Mode"
            description="AI reflects your intent with deep, clarifying questions instead of direct answers"
            enabled={settings.mirrorModeEnabled}
            onToggle={onToggleMirrorMode}
          />

          {/* Auto-Read Mode */}
          <SettingRow
            icon={Mic}
            title="Auto-Read Mode"
            description="Automatically speak AI responses aloud when enabled"
            enabled={settings.autoReadEnabled}
            onToggle={onToggleAutoRead}
          />

          {/* Silence Aware */}
          <SettingRow
            icon={Volume2}
            title="Silence Aware"
            description="AI understands intentional pauses and responds thoughtfully"
            enabled={settings.silenceAwareEnabled}
            onToggle={onToggleSilenceAware}
          />

          {/* Time Perspective */}
          <SettingRow
            icon={Clock}
            title="Time Perspectives"
            description="View responses from Now, 6 Months, and 5 Years perspectives"
            enabled={settings.timePerspectiveEnabled}
            onToggle={onToggleTimePerspective}
          />

          {/* Mood Sync */}
          <SettingRow
            icon={Sparkles}
            title="Mood Sync"
            description="Auto-adjust theme based on detected emotional patterns"
            enabled={settings.moodSyncEnabled}
            onToggle={onToggleMoodSync}
          />

          {/* Theme-Bound Personality */}
          <SettingRow
            icon={Palette}
            title="Theme Personality"
            description="AI tone and style changes based on selected theme"
            enabled={settings.themeBoundPersonality}
            onToggle={onToggleThemeBoundPersonality}
          />

          {/* Identity Lock System */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="font-display text-sm font-semibold">Identity Lock Rules</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Define personal rules that permanently guide AI behavior
            </p>
            
            <div className="space-y-2">
              <AnimatePresence>
                {settings.identityRules.map(rule => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg glass-subtle"
                  >
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => onToggleIdentityRule(rule.id)}
                      className="flex-shrink-0"
                    />
                    <p className={`flex-1 text-xs ${rule.enabled ? "text-foreground" : "text-muted-foreground line-through"}`}>
                      {rule.rule}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveIdentityRule(rule.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isAddingRule ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2"
                >
                  <Input
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="e.g., Always prioritize long-term truth"
                    className="flex-1 glass text-xs"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleAddRule()}
                  />
                  <Button size="icon" className="h-9 w-9" onClick={handleAddRule}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={() => {
                      setNewRule("");
                      setIsAddingRule(false);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full glass"
                  onClick={() => setIsAddingRule(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              )}
            </div>
          </div>

          {/* Persona Drift Display */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <h3 className="font-display text-sm font-semibold">Persona Evolution</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              AI personality naturally evolves based on your usage patterns
            </p>
            <div className="grid grid-cols-5 gap-2">
              {(Object.entries(settings.personaDrift) as [keyof PersonaDrift, number][]).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div 
                    className="h-16 rounded-lg glass-subtle mb-1 flex items-end justify-center pb-1"
                    style={{ 
                      background: `linear-gradient(to top, hsl(var(--primary) / ${value / 100}) 0%, transparent ${value}%)` 
                    }}
                  >
                    <span className="text-[10px] font-mono">{value}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground capitalize">{key}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});

AISettingsPanel.displayName = "AISettingsPanel";
