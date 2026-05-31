"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { asyncReducer, initialAsyncState } from "@/lib/async-state";
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
import { Activity, Target, Clock, BookOpen, TrendingUp, Sparkles, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import type { AnalyticsData } from "@/lib/ml/types";

/**
 * Design-token custom properties consumed by the Recharts visuals. Recharts
 * renders to SVG presentation attributes (`stroke`, `fill`, `stopColor`, tick
 * `fill`) where CSS `var()` is NOT resolved by the browser, so the token values
 * must be read from the document root at runtime and passed as concrete colors.
 */
const CHART_TOKENS = [
  "--color-brand-500",
  "--color-success",
  "--border",
  "--fg",
  "--fg-tertiary",
  "--bg-elevated",
  "--bg-secondary",
] as const;

type ChartToken = (typeof CHART_TOKENS)[number];
type ChartColors = Record<ChartToken, string>;

/**
 * Resolves the design-token CSS custom properties to concrete color strings for
 * Recharts. The source stays token-only (Req 1.2): no literal hex is authored;
 * the concrete values are read from the live `--token` definitions. Re-resolves
 * whenever the active theme changes so theme-dependent tokens stay correct.
 */
function useChartColors(): ChartColors {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState<ChartColors>(() => {
    // Pre-resolution / SSR fallback: the `var(--token)` reference itself, which
    // resolves correctly inside CSS `style` objects and is swapped for the
    // concrete value on mount for the SVG-attribute consumers.
    const fallback = {} as ChartColors;
    for (const token of CHART_TOKENS) fallback[token] = `var(${token})`;
    return fallback;
  });

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const next = {} as ChartColors;
    for (const token of CHART_TOKENS) {
      next[token] = styles.getPropertyValue(token).trim() || `var(${token})`;
    }
    setColors(next);
  }, [resolvedTheme]);

  return colors;
}

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const chart = useChartColors();
  // Loading-first async state (Req 8.2): the skeleton is eligible immediately on mount.
  const [state, dispatch] = useReducer(
    asyncReducer<AnalyticsData>,
    undefined,
    initialAsyncState<AnalyticsData>
  );

  const loadStats = useCallback(async () => {
    if (!user?.id) return;
    dispatch({ type: "load" });
    try {
      const stats = await analyticsService.getDashboardStats(user.id);
      dispatch({ type: "success", data: stats });
    } catch (e) {
      // Surface the failure instead of swallowing it (Req 8.6).
      console.error("Failed to load analytics:", e);
      dispatch({
        type: "failure",
        message: e instanceof Error ? e.message : "Unable to load analytics data",
      });
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadStats();
    }
  }, [user?.id, loadStats]);

  const data = state.data;

  // Concrete colors resolved from design tokens (Req 1.2). SVG presentation
  // attributes ignore CSS `var()`, so charts consume these resolved values;
  // CSS `style` objects (tooltip/cursor) can keep `var(--…)` directly.
  const tickStyle = { fontSize: 10, fill: chart["--fg-tertiary"] } as const;
  const gridStroke = chart["--border"];
  const tooltipContentStyle = {
    backgroundColor: "var(--bg-elevated)",
    borderColor: "var(--border)",
    borderRadius: "var(--radius-lg)",
    fontSize: "11px",
    color: "var(--fg)",
  } as const;
  // No data yet: show the shared skeleton while loading, or a labeled error
  // block on failure (Req 8.2, 8.6).
  if (data === null) {
    if (state.phase === "error") {
      return (
        <div className="flex-1 flex flex-col justify-center items-center h-full min-h-[300px] p-6">
          <Card className="border-[var(--border)] shadow-2xs max-w-md w-full">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[var(--fg)]">Unable to load analytics</p>
                <p className="text-xs text-[var(--fg-secondary)]">{state.message}</p>
              </div>
              <Button variant="outline" size="sm" onClick={loadStats} className="text-xs h-8 font-semibold border-[var(--border)] text-[var(--fg-secondary)]">
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return <AnalyticsSkeleton />;
  }

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1 pb-6 scrollbar-thin max-w-6xl mx-auto h-full select-none">

      {/* Inline failure banner when a refresh fails but prior data is retained (Req 8.6) */}
      {state.phase === "error" && (
        <div className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-4 py-2.5 text-xs font-semibold text-error shrink-0" role="alert">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Couldn&apos;t refresh analytics &mdash; showing the last loaded data. {state.message}</span>
        </div>
      )}

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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={tickStyle}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={tickStyle}
                />
                <Tooltip
                  contentStyle={tooltipContentStyle}
                  itemStyle={{ color: "var(--color-brand-500)" }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={chart["--color-brand-500"]}
                  strokeWidth={3}
                  dot={{ r: 3, stroke: chart["--bg-elevated"], strokeWidth: 1.5, fill: chart["--color-brand-500"] }}
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
                    <stop offset="5%" stopColor={chart["--color-success"]} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={chart["--color-success"]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={tickStyle}
                />
                <YAxis
                  domain={[0.5, 1]}
                  tickFormatter={(val) => `${Math.round(val * 100)}%`}
                  tickLine={false}
                  axisLine={false}
                  tick={tickStyle}
                />
                <Tooltip
                  contentStyle={tooltipContentStyle}
                  formatter={(value) => [`${Math.round(Number(value) * 100)}%`, "Confidence"]}
                />
                <Area
                  type="monotone"
                  dataKey="confidence"
                  stroke={chart["--color-success"]}
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={tickStyle}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={tickStyle}
                />
                <Tooltip
                  cursor={{ fill: chart["--bg-secondary"], opacity: 0.4 }}
                  contentStyle={tooltipContentStyle}
                />
                <Bar
                  dataKey="value"
                  fill={chart["--color-brand-500"]}
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

/**
 * Loading skeleton mirroring the analytics dashboard layout. Shown from the
 * initial loading phase so it is visible immediately (Req 8.2).
 */
function AnalyticsSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1 pb-6 scrollbar-thin max-w-6xl mx-auto h-full select-none" aria-busy="true">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-6 w-40 rounded-full" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-[var(--border)] shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-12" />
              </div>
              <Skeleton className="w-9 h-9 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="flex flex-col border-[var(--border)] shadow-2xs">
            <CardHeader className="p-4 border-b border-[var(--border)] shrink-0 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-52" />
            </CardHeader>
            <CardContent className="p-4 flex-1 min-h-[220px]">
              <Skeleton className="h-full w-full min-h-[180px]" />
            </CardContent>
          </Card>
        ))}

        <Card className="lg:col-span-2 flex flex-col border-[var(--border)] shadow-2xs">
          <CardHeader className="p-4 border-b border-[var(--border)] shrink-0 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
          </CardHeader>
          <CardContent className="p-4 flex-1 min-h-[220px]">
            <Skeleton className="h-full w-full min-h-[180px]" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
