import { memo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, PieChart, TrendingUp, Trash2, Brain, Heart, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";
import type { ConversationAnalytics, MoodHistoryEntry, PersonaDriftEntry } from "@/hooks/useConversationAnalytics";
import type { MoodState, PersonaDrift } from "@/hooks/useAISettings";

interface ConversationAnalyticsPanelProps {
  analytics: ConversationAnalytics;
  moodChartData: ReturnType<any>;
  personaDriftChartData: ReturnType<any>;
  moodDistributionData: ReturnType<any>;
  onClearAnalytics: () => void;
}

const MOOD_COLORS: Record<MoodState, string> = {
  calm: "#4ade80",
  focused: "#60a5fa",
  stressed: "#f97316",
  curious: "#a855f7",
  reflective: "#6366f1",
  neutral: "#94a3b8",
};

const PERSONA_COLORS = {
  strategist: "#f59e0b",
  psychologist: "#ec4899",
  creator: "#8b5cf6",
  teacher: "#10b981",
  challenger: "#ef4444",
};

const StatCard = memo(({ 
  icon: Icon, 
  label, 
  value, 
  color = "primary" 
}: { 
  icon: typeof Brain; 
  label: string; 
  value: string | number;
  color?: string;
}) => (
  <div className="glass-subtle rounded-xl p-4 text-center">
    <div className={`w-10 h-10 rounded-lg bg-${color}/10 mx-auto mb-2 flex items-center justify-center`}>
      <Icon className={`w-5 h-5 text-primary`} />
    </div>
    <p className="text-2xl font-bold text-gradient">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
));

StatCard.displayName = "StatCard";

export const ConversationAnalyticsPanel = memo(({
  analytics,
  moodChartData,
  personaDriftChartData,
  moodDistributionData,
  onClearAnalytics,
}: ConversationAnalyticsPanelProps) => {
  const [activeTab, setActiveTab] = useState<"mood" | "persona" | "stats">("mood");

  const radarData = personaDriftChartData.length > 0 
    ? [{
        subject: "Strategist",
        value: personaDriftChartData[personaDriftChartData.length - 1]?.strategist || 50,
      }, {
        subject: "Psychologist",
        value: personaDriftChartData[personaDriftChartData.length - 1]?.psychologist || 50,
      }, {
        subject: "Creator",
        value: personaDriftChartData[personaDriftChartData.length - 1]?.creator || 50,
      }, {
        subject: "Teacher",
        value: personaDriftChartData[personaDriftChartData.length - 1]?.teacher || 50,
      }, {
        subject: "Challenger",
        value: personaDriftChartData[personaDriftChartData.length - 1]?.challenger || 50,
      }]
    : [];

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
                <BarChart3 className="w-4 h-4" />
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent>Conversation Analytics</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <SheetContent className="glass-strong border-border w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-gradient font-display flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Conversation Analytics
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Activity} label="Total Messages" value={analytics.stats.totalMessages} />
            <StatCard icon={Brain} label="Sessions" value={analytics.stats.totalSessions} />
            <StatCard icon={Heart} label="Avg Length" value={analytics.stats.averageSessionLength} />
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 p-1 rounded-xl glass-subtle">
            {[
              { id: "mood", label: "Mood", icon: Heart },
              { id: "persona", label: "Persona", icon: Brain },
              { id: "stats", label: "Stats", icon: PieChart },
            ].map(({ id, label, icon: TabIcon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm transition-all
                  ${activeTab === id 
                    ? "glass-strong text-foreground" 
                    : "text-muted-foreground hover:text-foreground"}
                `}
              >
                <TabIcon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Mood Tab */}
          {activeTab === "mood" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="glass-subtle rounded-xl p-4">
                <h4 className="text-sm font-medium mb-3">Mood Over Time</h4>
                {moodChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={moodChartData}>
                      <defs>
                        <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        tickFormatter={(v) => {
                          const moods = ["", "Stressed", "Neutral", "Calm", "Curious", "Focused", "Reflective"];
                          return moods[v] || "";
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="moodValue"
                        stroke="hsl(var(--primary))"
                        fill="url(#moodGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                    No mood data yet. Start chatting!
                  </div>
                )}
              </div>

              <div className="glass-subtle rounded-xl p-4">
                <h4 className="text-sm font-medium mb-3">Mood Distribution</h4>
                {moodDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsPieChart>
                      <Pie
                        data={moodDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {moodDistributionData.map((entry: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={MOOD_COLORS[entry.mood as MoodState] || "#94a3b8"} 
                          />
                        ))}
                      </Pie>
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => <span className="text-xs">{value}</span>}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                    No distribution data yet
                  </div>
                )}
              </div>

              <div className="glass-subtle rounded-xl p-4">
                <h4 className="text-sm font-medium mb-2">Most Frequent Mood</h4>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${MOOD_COLORS[analytics.stats.mostFrequentMood]}20` }}
                  >
                    <Heart 
                      className="w-6 h-6" 
                      style={{ color: MOOD_COLORS[analytics.stats.mostFrequentMood] }}
                    />
                  </div>
                  <div>
                    <p className="text-lg font-bold capitalize">{analytics.stats.mostFrequentMood}</p>
                    <p className="text-xs text-muted-foreground">Based on {analytics.stats.totalMessages} messages</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Persona Tab */}
          {activeTab === "persona" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="glass-subtle rounded-xl p-4">
                <h4 className="text-sm font-medium mb-3">Current Persona Balance</h4>
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--muted))" />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]} 
                        stroke="hsl(var(--muted))"
                        fontSize={9}
                      />
                      <Radar
                        name="Persona"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                    Persona data will appear as you chat
                  </div>
                )}
              </div>

              <div className="glass-subtle rounded-xl p-4">
                <h4 className="text-sm font-medium mb-3">Persona Evolution Over Time</h4>
                {personaDriftChartData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={personaDriftChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis dataKey="index" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      {Object.entries(PERSONA_COLORS).map(([key, color]) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={color}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => <span className="text-xs capitalize">{value}</span>}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                    Keep chatting to see persona evolution
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Stats Tab */}
          {activeTab === "stats" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="glass-subtle rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-medium">Conversation Summary</h4>
                
                <div className="space-y-2">
                  {[
                    { label: "Total Messages", value: analytics.stats.totalMessages },
                    { label: "Total Sessions", value: analytics.stats.totalSessions },
                    { label: "Average Session Length", value: `${analytics.stats.averageSessionLength} msgs` },
                    { label: "Most Frequent Mood", value: analytics.stats.mostFrequentMood },
                    { label: "Last Updated", value: new Date(analytics.lastUpdated).toLocaleString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="text-sm font-medium capitalize">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full glass text-destructive hover:bg-destructive/10"
                onClick={onClearAnalytics}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Analytics
              </Button>
            </motion.div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
});

ConversationAnalyticsPanel.displayName = "ConversationAnalyticsPanel";
