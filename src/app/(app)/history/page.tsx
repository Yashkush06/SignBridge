"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, Trash2, Eye, Filter, Clock } from "lucide-react";
import { historyService } from "@/lib/services/history-service";
import type { HistoryEntry } from "@/lib/ml/types";
import { exportService } from "@/lib/services/export-service";
import { useAuthStore } from "@/store/auth-store";

export default function HistoryPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadHistory();
    }
  }, [searchQuery, selectedType, user?.id]);

  const loadHistory = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    let data = await historyService.getAll(user.id);
    
    if (searchQuery) {
      data = await historyService.search(user.id, searchQuery);
    }
    
    if (selectedType !== "all") {
      data = data.filter(e => e.type === selectedType);
    }
    
    setEntries(data);
    setIsLoading(false);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(new Set(entries.map(e => e.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (!user?.id) return;
    if (confirm("Are you sure you want to delete the selected sessions?")) {
      await historyService.removeMany(user.id, Array.from(selectedItems));
      setSelectedItems(new Set());
      loadHistory();
    }
  };

  const handleExportSelected = () => {
    const selectedEntries = entries.filter(e => selectedItems.has(e.id));
    exportService.exportHistoryAsCsv(selectedEntries);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const getTypeBadge = (type: HistoryEntry["type"]) => {
    switch (type) {
      case "sign-to-text": return <Badge variant="primary">Sign to Text</Badge>;
      case "text-to-sign": return <Badge variant="outline">Text to Sign</Badge>;
      case "voice-to-sign": return <Badge variant="default">Voice to Sign</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Translation History</h1>
          <p className="text-[var(--fg-secondary)] mt-1">
            View and export your previous translation sessions.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row gap-4 items-center justify-between bg-[var(--bg-secondary)]">
          <div className="flex-1 w-full sm:max-w-md flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-tertiary)]" />
              <input
                type="text"
                placeholder="Search transcripts..."
                className="w-full pl-9 pr-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[150px] bg-[var(--bg)]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sign-to-text">Sign to Text</SelectItem>
                <SelectItem value="text-to-sign">Text to Sign</SelectItem>
                <SelectItem value="voice-to-sign">Voice to Sign</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto p-2 bg-brand-50 dark:bg-brand-900/20 rounded-md border border-brand-200 dark:border-brand-800">
              <span className="text-sm font-medium text-brand-700 dark:text-brand-300 px-2">
                {selectedItems.size} selected
              </span>
              <Button variant="outline" size="sm" onClick={handleExportSelected} className="bg-[var(--bg)]">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteSelected}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[var(--fg-secondary)] uppercase bg-[var(--bg-tertiary)] border-b border-[var(--border)]">
              <tr>
                <th scope="col" className="p-4 w-4">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-[var(--border)] focus:ring-brand-500 text-brand-500"
                    onChange={handleSelectAll}
                    checked={entries.length > 0 && selectedItems.size === entries.length}
                  />
                </th>
                <th scope="col" className="px-6 py-3 font-medium">Date</th>
                <th scope="col" className="px-6 py-3 font-medium">Type</th>
                <th scope="col" className="px-6 py-3 font-medium">Duration</th>
                <th scope="col" className="px-6 py-3 font-medium">Phrases</th>
                <th scope="col" className="px-6 py-3 font-medium min-w-[200px]">Transcript Snippet</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[var(--fg-secondary)]">
                    Loading history...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[var(--fg-secondary)]">
                    <div className="flex flex-col items-center justify-center">
                      <Clock className="w-10 h-10 mb-3 text-[var(--fg-tertiary)]" />
                      <p>No history found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-[var(--border)] focus:ring-brand-500 text-brand-500"
                        checked={selectedItems.has(entry.id)}
                        onChange={(e) => handleSelectItem(entry.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[var(--fg)] font-medium">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(entry.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[var(--fg-secondary)]">
                      {formatDuration(entry.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entry.phraseCount}
                    </td>
                    <td className="px-6 py-4 text-[var(--fg-secondary)] truncate max-w-[250px]">
                      {entry.transcript}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0" title="View details">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-error hover:bg-error/10 hover:text-error" onClick={async () => {
                        if (user?.id) {
                          await historyService.remove(user.id, entry.id);
                          loadHistory();
                        }
                      }} title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        {entries.length > 0 && (
          <div className="p-4 border-t border-[var(--border)] flex items-center justify-between text-sm text-[var(--fg-secondary)]">
            <span>Showing 1 to {entries.length} of {entries.length} entries</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
