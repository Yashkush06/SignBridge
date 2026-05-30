"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Activity, Target, ShieldCheck, Server, Database, Globe, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
        <Badge variant="primary" className="uppercase text-[10px] tracking-wider px-2">Superadmin</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[var(--fg-secondary)]">Total Users</span>
              <Users className="w-4 h-4 text-brand-500" />
            </div>
            <div className="text-3xl font-bold">12,847</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[var(--fg-secondary)]">Daily Active Users</span>
              <Activity className="w-4 h-4 text-brand-500" />
            </div>
            <div className="text-3xl font-bold">3,241</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[var(--fg-secondary)]">Translations Today</span>
              <Target className="w-4 h-4 text-brand-500" />
            </div>
            <div className="text-3xl font-bold">47,392</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[var(--fg-secondary)]">System Health</span>
              <ShieldCheck className="w-4 h-4 text-success" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">99.9%</span>
              <Badge variant="success">Healthy</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Server className="w-5 h-5 text-[var(--fg-tertiary)]" />
                  <span className="font-medium text-sm">API Server</span>
                </div>
                <div className="flex items-center gap-1.5 text-success text-sm font-medium">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  Online
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-[var(--fg-tertiary)]" />
                  <span className="font-medium text-sm">ML Pipeline</span>
                </div>
                <div className="flex items-center gap-1.5 text-success text-sm font-medium">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  Online
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-[var(--fg-tertiary)]" />
                  <span className="font-medium text-sm">Database</span>
                </div>
                <div className="flex items-center gap-1.5 text-success text-sm font-medium">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  Online
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-[var(--fg-tertiary)]" />
                  <span className="font-medium text-sm">CDN Edge</span>
                </div>
                <div className="flex items-center gap-1.5 text-success text-sm font-medium">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  Online
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Errors</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[var(--fg-secondary)] uppercase bg-[var(--bg-secondary)] border-y border-[var(--border)]">
                  <tr>
                    <th scope="col" className="px-6 py-3">Timestamp</th>
                    <th scope="col" className="px-6 py-3">Severity</th>
                    <th scope="col" className="px-6 py-3">Message</th>
                    <th scope="col" className="px-6 py-3 text-right">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr>
                    <td className="px-6 py-3 whitespace-nowrap text-[var(--fg-secondary)]">2026-05-29 14:32:11</td>
                    <td className="px-6 py-3"><Badge variant="warning">Warning</Badge></td>
                    <td className="px-6 py-3 font-mono text-xs">MediaPipe initialization timeout on mobile safari</td>
                    <td className="px-6 py-3 text-right">42</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 whitespace-nowrap text-[var(--fg-secondary)]">2026-05-29 11:15:04</td>
                    <td className="px-6 py-3"><Badge variant="error">Critical</Badge></td>
                    <td className="px-6 py-3 font-mono text-xs">AuthService connection refused</td>
                    <td className="px-6 py-3 text-right">3</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 whitespace-nowrap text-[var(--fg-secondary)]">2026-05-28 09:22:10</td>
                    <td className="px-6 py-3"><Badge variant="info">Info</Badge></td>
                    <td className="px-6 py-3 font-mono text-xs">Rate limit exceeded for IP 192.168.1.1</td>
                    <td className="px-6 py-3 text-right">128</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
