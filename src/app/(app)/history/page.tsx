"use client";

import { useReducer, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, Download, Trash2, Eye, Clock, Clipboard, Check, Filter, AlertCircle } from "lucide-react";
import { historyService } from "@/lib/services/history-service";
import type { HistoryEntry } from "@/lib/ml/types";
import { exportService } from "@/lib/services/export-service";
import { useAuthStore } from "@/store/auth-store";
import { asyncReducer, initialAsyncState } from "@/lib/async-state";

export default function HistoryPage() {
  const { user } = useAuthStore();
  const [state, dispatch] = useReducer(
    asyncReducer<HistoryEntry[]>,
    initialAsyncState<HistoryEntry[]>()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Derived view of the async surface state.
  const entries = state.data ?? [];
  const isLoading = state.phase === "loading";
  const errorMessage = state.phase === "error" ? state.message : null;

  // Dialog State
  const [activeEntry, setActiveEntry] = useState<HistoryEntry | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadHistory();
    }
  }, [searchQuery, selectedType, user?.id]);

  const loadHistory = async () => {
    if (!user?.id) return;
    dispatch({ type: "load" });
    try {
      let data = await historyService.getAll(user.id);

      if (searchQuery) {
        data = await historyService.search(user.id, searchQuery);
      }

      if (selectedType !== "all") {
        data = data.filter(e => e.type === selectedType);
      }

      dispatch({ type: "success", data });
    } catch (error) {
      dispatch({
        type: "failure",
        message:
          error instanceof Error
            ? error.message
            : "Unable to load translation logs. Please try again.",
      });
    }
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

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getTypeBadge = (type: HistoryEntry["type"]) => {
    switch (type) {
      case "sign-to-text":
        return <Badge variant="primary" className="text-[10px] uppercase font-bold px-2.5">Sign to Text</Badge>;
      case "text-to-sign":
        return <Badge variant="outline" className="text-[10px] uppercase font-bold px-2.5 text-success border-success/30 bg-success/5">Text to Sign</Badge>;
      case "voice-to-sign":
        return <Badge variant="outline" className="text-[10px] uppercase font-bold px-2.5 text-info border-info/30 bg-info/5">Voice to Sign</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col overflow-y-auto pr-1 pb-6 scrollbar-thin select-none">
      
      {/* Header telemetry section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--fg)]">Translation Logs</h1>
          <p className="text-xs md:text-sm text-[var(--fg-secondary)] mt-0.5">
            Audit, inspect, and export your previous SignBridge translation sessions.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border-[var(--border)] shadow-2xs flex-1 flex flex-col min-h-0 bg-[var(--bg)]">
        {/* Modernized dense Toolbar */}
        <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row gap-4 items-center justify-between bg-[var(--bg-secondary)]/60 shrink-0">
          <div className="flex-1 w-full sm:max-w-md flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-tertiary)]" />
              <input
                type="text"
                placeholder="Search transcripts..."
                className="w-full pl-9 pr-4 py-1.5 bg-[var(--bg)] border border-[var(--input-border)] rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-[var(--fg)] placeholder:text-[var(--fg-tertiary)] transition-shadow duration-150"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[140px] bg-[var(--bg)] border-[var(--input-border)] text-xs h-[30px] rounded-md font-medium text-[var(--fg-secondary)]">
                <SelectValue placeholder="All Tools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Tools</SelectItem>
                <SelectItem value="sign-to-text" className="text-xs">Sign to Text</SelectItem>
                <SelectItem value="text-to-sign" className="text-xs">Text to Sign</SelectItem>
                <SelectItem value="voice-to-sign" className="text-xs">Voice to Sign</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto p-1.5 bg-brand-50 dark:bg-brand-900/10 rounded-lg border border-brand-100 dark:border-brand-900/50">
              <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 px-2 uppercase tracking-wide">
                {selectedItems.size} Selected
              </span>
              <Button variant="outline" size="sm" onClick={handleExportSelected} className="bg-[var(--bg)] border-[var(--border)] text-xs h-7 px-2.5 font-semibold text-[var(--fg-secondary)]">
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteSelected} className="text-xs h-7 px-2.5 font-semibold">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
              </Button>
            </div>
          )}
        </div>

        {/* Labeled error banner — retains previously loaded content (Req 8.6) */}
        {errorMessage && entries.length > 0 && (
          <div
            role="alert"
            className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-error/5 shrink-0"
          >
            <AlertCircle className="w-4 h-4 text-error shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--fg)]">
                Failed to refresh translation logs
              </p>
              <p className="text-[11px] text-[var(--fg-secondary)] truncate">{errorMessage}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadHistory}
              className="text-[10px] h-7 px-2.5 font-semibold border-[var(--border)] text-[var(--fg-secondary)] shrink-0"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Notion/Linear tabular view */}
        <div className="flex-1 overflow-auto scrollbar-thin min-h-[300px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="text-[10px] font-bold text-[var(--fg-tertiary)] uppercase tracking-wider bg-[var(--bg-secondary)]/30 border-b border-[var(--border)] sticky top-0 backdrop-blur-md">
              <tr>
                <th scope="col" className="p-4 w-4">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded border-[var(--input-border)] text-brand-500 focus:ring-brand-500/50 focus:ring-offset-0 bg-[var(--bg)] cursor-pointer"
                      onChange={handleSelectAll}
                      checked={entries.length > 0 && selectedItems.size === entries.length}
                    />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3.5 font-bold">Session Date</th>
                <th scope="col" className="px-6 py-3.5 font-bold">Method</th>
                <th scope="col" className="px-6 py-3.5 font-bold">Duration</th>
                <th scope="col" className="px-6 py-3.5 font-bold text-center">Phrases</th>
                <th scope="col" className="px-6 py-3.5 font-bold min-w-[220px]">Transcription log</th>
                <th scope="col" className="px-6 py-3.5 font-bold text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} aria-hidden="true">
                    <td className="p-4">
                      <div className="flex items-center justify-center">
                        <Skeleton className="w-3.5 h-3.5 rounded" />
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-3.5">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="px-6 py-3.5">
                      <Skeleton className="h-4 w-12" />
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-center">
                        <Skeleton className="h-4 w-6" />
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <Skeleton className="h-4 w-48" />
                    </td>
                    <td className="px-6 py-3.5 pr-6">
                      <div className="flex justify-end gap-1.5">
                        <Skeleton className="w-7 h-7 rounded-md" />
                        <Skeleton className="w-7 h-7 rounded-md" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : errorMessage && entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div
                      role="alert"
                      className="flex flex-col items-center justify-center gap-3"
                    >
                      <AlertCircle className="w-10 h-10 text-error" />
                      <div className="space-y-1">
                        <p className="font-semibold text-sm text-[var(--fg)]">
                          Failed to load translation logs
                        </p>
                        <p className="text-xs text-[var(--fg-secondary)]">{errorMessage}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadHistory}
                        className="text-xs h-8 font-semibold border-[var(--border)] text-[var(--fg-secondary)]"
                      >
                        Try again
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-[var(--fg-secondary)]">
                    <div className="flex flex-col items-center justify-center">
                      <Clock className="w-10 h-10 mb-3 text-[var(--fg-muted)] opacity-50" />
                      <p className="font-semibold text-sm text-[var(--fg)]">No translation logs found</p>
                      <p className="text-[10px] text-[var(--fg-tertiary)] mt-0.5">Start communicating using our tools to see your logs here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors duration-150 group">
                    <td className="p-4">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded border-[var(--input-border)] text-brand-500 focus:ring-brand-500/50 focus:ring-offset-0 bg-[var(--bg)] cursor-pointer"
                          checked={selectedItems.has(entry.id)}
                          onChange={(e) => handleSelectItem(entry.id, e.target.checked)}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-[var(--fg)] font-semibold font-mono">
                      {new Date(entry.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {getTypeBadge(entry.type)}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-[var(--fg-secondary)] font-mono font-medium">
                      {formatDuration(entry.duration)}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-center text-[var(--fg)] font-bold font-mono">
                      {entry.phraseCount}
                    </td>
                    <td className="px-6 py-3.5 text-[var(--fg-secondary)] truncate max-w-[280px] font-medium">
                      &ldquo;{entry.transcript}&rdquo;
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-1.5 whitespace-nowrap pr-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-7 h-7 p-0 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--fg-secondary)] group-hover:text-brand-500 group-hover:bg-brand-500/[0.05] transition-all"
                        title="View details"
                        onClick={() => setActiveEntry(entry)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-7 h-7 p-0 rounded-md text-[var(--fg-tertiary)] hover:bg-error/10 hover:text-error transition-all"
                        onClick={async () => {
                          if (user?.id && confirm("Delete this translation log?")) {
                            await historyService.remove(user.id, entry.id);
                            loadHistory();
                          }
                        }}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination bar */}
        {entries.length > 0 && (
          <div className="p-4 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--fg-tertiary)] shrink-0 font-medium bg-[var(--bg-secondary)]/20">
            <span>Showing 1 to {entries.length} of {entries.length} log records</span>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" disabled className="h-7 px-2.5 text-[10px] font-bold">Previous</Button>
              <Button variant="outline" size="sm" disabled className="h-7 px-2.5 text-[10px] font-bold">Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Structured Details popover dialog */}
      <Dialog open={!!activeEntry} onOpenChange={(open) => !open && setActiveEntry(null)}>
        {activeEntry && (
          <DialogContent className="max-w-md rounded-xl p-5 border-[var(--border)] bg-[var(--bg-elevated)] shadow-lg animate-in fade-in-0 duration-200">
            <DialogHeader className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest bg-brand-500/10 px-2 py-0.5 rounded">Log Details</span>
                {getTypeBadge(activeEntry.type)}
              </div>
              <DialogTitle className="text-base font-bold text-[var(--fg)] mt-2">
                Session Record Details
              </DialogTitle>
              <DialogDescription className="text-[10px] text-[var(--fg-tertiary)] font-mono">
                Logged at {new Date(activeEntry.date).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 space-y-4 text-xs">
              {/* Detailed metrics box */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-[var(--bg-secondary)]/70 border border-[var(--border)] rounded-lg font-medium text-[var(--fg-secondary)]">
                <div className="space-y-1 text-center border-r border-[var(--border)]/70">
                  <span className="text-[9px] font-bold text-[var(--fg-tertiary)] uppercase tracking-wider block">Duration</span>
                  <span className="font-mono text-sm font-bold text-[var(--fg)]">{activeEntry.duration}s</span>
                </div>
                <div className="space-y-1 text-center border-r border-[var(--border)]/70">
                  <span className="text-[9px] font-bold text-[var(--fg-tertiary)] uppercase tracking-wider block">Words</span>
                  <span className="font-mono text-sm font-bold text-[var(--fg)]">{activeEntry.phraseCount}</span>
                </div>
                <div className="space-y-1 text-center">
                  <span className="text-[9px] font-bold text-[var(--fg-tertiary)] uppercase tracking-wider block">Accuracy</span>
                  <span className="font-mono text-sm font-bold text-[var(--fg)]">
                    {activeEntry.averageConfidence > 0 ? `${Math.round(activeEntry.averageConfidence * 100)}%` : "N/A"}
                  </span>
                </div>
              </div>

              {/* Match accuracy bar */}
              {activeEntry.averageConfidence > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-[var(--fg-secondary)] font-semibold">
                    <span>Model Confidence Rating</span>
                    <span>{Math.round(activeEntry.averageConfidence * 100)}%</span>
                  </div>
                  <Progress value={activeEntry.averageConfidence * 100} className="h-1.5 bg-[var(--bg-tertiary)] rounded-full" />
                </div>
              )}

              {/* Clean translation content box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-[var(--fg-tertiary)] uppercase tracking-wider font-bold">
                  <span>Translation Transcript</span>
                  <button
                    onClick={() => handleCopyToClipboard(activeEntry.transcript)}
                    className="flex items-center gap-1 text-[9px] text-brand-500 hover:underline hover:text-brand-600 transition"
                  >
                    {isCopied ? (
                      <><Check className="w-3 h-3" /> Copied!</>
                    ) : (
                      <><Clipboard className="w-3 h-3" /> Copy transcript</>
                    )}
                  </button>
                </div>
                <div className="p-3.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg leading-relaxed text-[var(--fg)] text-xs font-semibold select-text break-words">
                  &ldquo;{activeEntry.transcript}&rdquo;
                </div>
              </div>
            </div>

            <DialogFooter className="flex sm:justify-end gap-2 border-t border-[var(--border)]/40 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exportService.exportHistoryAsCsv([activeEntry]);
                  setActiveEntry(null);
                }}
                className="text-xs h-8 font-semibold border-[var(--border)] text-[var(--fg-secondary)]"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveEntry(null)}
                className="text-xs h-8 font-semibold"
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
