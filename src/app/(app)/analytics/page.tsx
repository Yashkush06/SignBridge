"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyticsService } from "@/lib/services/analytics-service";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Activity, Target, Calendar, BookOpen } from "lucide-react";
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
    const stats = await analyticsService.getDashboardStats(user.id);
    setData(stats);
    setIsLoading(false);
  };

  if (isLoading || !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-[var(--fg-secondary)]">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics Dashboard</h1>
          <p className="text-[var(--fg-secondary)] mt-1">
            Insights into your translation usage and performance.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[var(--fg-secondary)]">Total Translations</span>
              <Activity className="w-4 h-4 text-brand-500" />
            </div>
            <div className="text-3xl font-bold">{data.totalTranslations.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[var(--fg-secondary)]">Avg. Confidence</span>
              <Target className="w-4 h-4 text-success" />
            </div>
            <div className="text-3xl font-bold">{Math.round(data.averageConfidence * 100)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[var(--fg-secondary)]">Minutes Active</span>
              <Calendar className="w-4 h-4 text-info" />
            </div>
            <div className="text-3xl font-bold">{data.minutesActive}m</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[var(--fg-secondary)]">Vocabulary Size</span>
              <BookOpen className="w-4 h-4 text-warning" />
            </div>
            <div className="text-3xl font-bold">{data.vocabularySize}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Translation Volume */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Translation Volume (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.recentActivity} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--fg-tertiary)' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--fg-tertiary)' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--brand-500)' }}
                />
                <Line type="monotone" dataKey="count" stroke="var(--brand-500)" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Confidence Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confidence Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.confidenceHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--fg-tertiary)' }} />
                <YAxis domain={[0, 1]} tickLine={false} axisLine={false} tickFormatter={(val) => `${Math.round(val * 100)}%`} tick={{ fontSize: 12, fill: 'var(--fg-tertiary)' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  formatter={(value: any) => [`${Math.round((value as number) * 100)}%`, 'Confidence']}
                />
                <Area type="monotone" dataKey="confidence" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorConf)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Usage by Type */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Usage By Translation Type</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.usageByType} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--fg-tertiary)' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--fg-tertiary)' }} />
                <Tooltip 
                  cursor={{ fill: 'var(--bg-secondary)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="var(--brand-500)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
