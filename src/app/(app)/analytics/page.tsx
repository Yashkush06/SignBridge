"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { analyticsService } from "@/lib/services/analytics-service";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity, Target, Clock, BookOpen, TrendingUp, Sparkles } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import type { AnalyticsData } from "@/lib/ml/types";

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadStats();
    }
  }, [user?.id]);

  const loadStats = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const stats = await analyticsService.getDashboardStats(user.id);
      setData(stats);
    } catch (e) {
      console.error("Failed to load analytics:", e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <span className="text-xs text-[var(--fg-secondary)] font-medium">Analyzing translation data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1 pb-6 scrollbar-thin max-w-6xl mx-auto h-full select-none">
      
      {/* Header and Telemetry */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)]">Analytics Insights</h1>
          <p className="text-xs md:text-sm text-[var(--fg-secondary)] mt-0.5">
            Deep insights into your learning timeline, sign accuracy metrics, and tool engagements.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-brand-500/10 text-brand-500 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Active Session Metrics
        </div>
      </div>

      {/* Structured Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <Card className="border-[var(--border)] shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[var(--fg-tertiary)] uppercase tracking-wider">Total Translations</span>
              <p className="text-2xl font-bold text-[var(--fg)] leading-none">{data.totalTranslations}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
              <Activity className="w-4.5 h-4.5 text-brand-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--border)] shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[var(--fg-tertiary)] uppercase tracking-wider">Avg. Confidence</span>
              <p className="text-2xl font-bold text-[var(--fg)] leading-none">{Math.round(data.averageConfidence * 100)}%</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <Target className="w-4.5 h-4.5 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--border)] shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[var(--fg-tertiary)] uppercase tracking-wider">Minutes Active</span>
              <p className="text-2xl font-bold text-[var(--fg)] leading-none">{data.minutesActive}m</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
              <Clock className="w-4.5 h-4.5 text-info" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--border)] shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[var(--fg-tertiary)] uppercase tracking-wider">Vocabulary size</span>
              <p className="text-2xl font-bold text-[var(--fg)] leading-none">{data.vocabularySize}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-4.5 h-4.5 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Elegant Recharts Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* Translation Volume Line Chart */}
        <Card className="flex flex-col border-[var(--border)] shadow-2xs">
          <CardHeader className="p-4 border-b border-[var(--border)] shrink-0 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-[var(--fg)]">Daily Translations Volume</CardTitle>
              <p className="text-[10px] text-[var(--fg-secondary)] mt-0.5">Successful dictation loads per day</p>
            </div>
            <Badge variant="outline" className="text-[9px] py-0.5 font-bold border-[var(--border)] bg-[var(--bg-secondary)]/50">Volume</Badge>
          </CardHeader>
          <CardContent className="p-4 flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.recentActivity} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "var(--fg-tertiary)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "var(--fg-tertiary)" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--bg-elevated)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "var(--fg)"
                  }}
                  itemStyle={{ color: "var(--color-brand-500)" }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-brand-500)"
                  strokeWidth={3}
                  dot={{ r: 3, stroke: "var(--bg-elevated)", strokeWidth: 1.5, fill: "var(--color-brand-500)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Confidence Area Chart */}
        <Card className="flex flex-col border-[var(--border)] shadow-2xs">
          <CardHeader className="p-4 border-b border-[var(--border)] shrink-0 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-[var(--fg)]">Accuracy Rating Trend</CardTitle>
              <p className="text-[10px] text-[var(--fg-secondary)] mt-0.5">Average machine learning model confidence scores</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-success">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Stable</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.confidenceHistory} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "var(--fg-tertiary)" }}
                />
                <YAxis
                  domain={[0.5, 1]}
                  tickFormatter={(val) => `${Math.round(val * 100)}%`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "var(--fg-tertiary)" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--bg-elevated)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "var(--fg)"
                  }}
                  formatter={(value: any) => [`${Math.round((value as number) * 100)}%`, "Confidence"]}
                />
                <Area
                  type="monotone"
                  dataKey="confidence"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAccuracy)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Usage by Type Bar Chart */}
        <Card className="lg:col-span-2 flex flex-col border-[var(--border)] shadow-2xs">
          <CardHeader className="p-4 border-b border-[var(--border)] shrink-0">
            <CardTitle className="text-sm font-bold text-[var(--fg)]">Tool Utilization Distribution</CardTitle>
            <p className="text-[10px] text-[var(--fg-secondary)] mt-0.5">Translation session counts categorized by interface method</p>
          </CardHeader>
          <CardContent className="p-4 flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.usageByType} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "var(--fg-tertiary)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "var(--fg-tertiary)" }}
                />
                <Tooltip
                  cursor={{ fill: "var(--bg-secondary)", opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: "var(--bg-elevated)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "var(--fg)"
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="var(--color-brand-500)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
