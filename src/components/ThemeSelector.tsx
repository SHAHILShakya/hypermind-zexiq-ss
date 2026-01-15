import { memo } from "react";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { themes, type ThemeId, type Theme } from "@/hooks/useTheme";

interface ThemeSelectorProps {
  currentTheme: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

const ThemePreview = memo(({ theme, isActive }: { theme: Theme; isActive: boolean }) => (
  <div className="flex items-center gap-3 w-full">
    {/* Color dots preview */}
    <div className="flex gap-1">
      <div 
        className="w-3 h-3 rounded-full" 
        style={{ backgroundColor: `hsl(${theme.colors.primary})` }} 
      />
      <div 
        className="w-3 h-3 rounded-full" 
        style={{ backgroundColor: `hsl(${theme.colors.secondary})` }} 
      />
      <div 
        className="w-3 h-3 rounded-full" 
        style={{ backgroundColor: `hsl(${theme.colors.accent})` }} 
      />
    </div>
    
    <div className="flex-1 text-left">
      <p className="text-sm font-medium">{theme.name}</p>
      <p className="text-xs text-muted-foreground">{theme.description}</p>
    </div>
    
    {isActive && <Check className="w-4 h-4 text-primary" />}
  </div>
));

ThemePreview.displayName = "ThemePreview";

export const ThemeSelector = memo(({ currentTheme, onSelectTheme }: ThemeSelectorProps) => {
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
      <DropdownMenuContent align="end" className="w-64 glass-strong border-border">
        <div className="px-2 py-1.5 mb-1">
          <p className="text-xs font-display text-gradient tracking-wider">SELECT THEME</p>
        </div>
        {themes.map(theme => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => onSelectTheme(theme.id)}
            className="cursor-pointer py-2"
          >
            <ThemePreview theme={theme} isActive={theme.id === currentTheme} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

ThemeSelector.displayName = "ThemeSelector";
