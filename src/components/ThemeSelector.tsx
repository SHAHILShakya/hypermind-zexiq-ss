import { memo } from "react";
import { Palette, Check, Sparkles, Layers, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { themes, type ThemeId, type Theme } from "@/hooks/useTheme";

interface ThemeSelectorProps {
  currentTheme: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

const styleIcons = {
  glass: Layers,
  neon: Sparkles,
  minimal: Minus,
};

const ThemePreview = memo(({ theme, isActive }: { theme: Theme; isActive: boolean }) => {
  const StyleIcon = styleIcons[theme.style];
  
  return (
    <div className="flex items-center gap-3 w-full">
      {/* Color dots preview */}
      <div className="flex gap-0.5 p-1 rounded-lg bg-muted/50">
        <div 
          className="w-3 h-3 rounded-full ring-1 ring-black/10" 
          style={{ backgroundColor: `hsl(${theme.colors.primary})` }} 
        />
        <div 
          className="w-3 h-3 rounded-full ring-1 ring-black/10" 
          style={{ backgroundColor: `hsl(${theme.colors.secondary})` }} 
        />
        <div 
          className="w-3 h-3 rounded-full ring-1 ring-black/10" 
          style={{ backgroundColor: `hsl(${theme.colors.background})` }} 
        />
      </div>
      
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-1.5">
          <StyleIcon className="w-3 h-3 text-muted-foreground" />
          <p className="text-sm font-medium truncate">{theme.name}</p>
        </div>
        <p className="text-xs text-muted-foreground truncate">{theme.description}</p>
      </div>
      
      {isActive && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
    </div>
  );
});

ThemePreview.displayName = "ThemePreview";

export const ThemeSelector = memo(({ currentTheme, onSelectTheme }: ThemeSelectorProps) => {
  const glassThemes = themes.filter(t => t.style === "glass");
  const neonThemes = themes.filter(t => t.style === "neon");
  const minimalThemes = themes.filter(t => t.style === "minimal");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <Palette className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 glass-strong border-border z-50">
        <div className="px-3 py-2">
          <p className="text-xs font-display text-gradient tracking-wider font-semibold">SELECT THEME</p>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Glass Themes */}
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <Layers className="w-3 h-3" /> Glass (iOS Style)
        </DropdownMenuLabel>
        {glassThemes.map(theme => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => onSelectTheme(theme.id)}
            className="cursor-pointer py-2.5 focus:bg-muted/50"
          >
            <ThemePreview theme={theme} isActive={theme.id === currentTheme} />
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        {/* Neon Themes */}
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3" /> Neon
        </DropdownMenuLabel>
        {neonThemes.map(theme => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => onSelectTheme(theme.id)}
            className="cursor-pointer py-2.5 focus:bg-muted/50"
          >
            <ThemePreview theme={theme} isActive={theme.id === currentTheme} />
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        {/* Minimal Themes */}
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <Minus className="w-3 h-3" /> Minimal
        </DropdownMenuLabel>
        {minimalThemes.map(theme => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => onSelectTheme(theme.id)}
            className="cursor-pointer py-2.5 focus:bg-muted/50"
          >
            <ThemePreview theme={theme} isActive={theme.id === currentTheme} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

ThemeSelector.displayName = "ThemeSelector";
