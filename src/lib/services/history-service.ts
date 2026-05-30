import type { HistoryEntry } from "@/lib/ml/types";

const LOCAL_STORAGE_KEY = "signbridge_history";

function getLocalHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return [];
  }
}

function saveLocalHistory(history: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Error writing to localStorage:", error);
  }
}

export const historyService = {
  async getAll(userId: string): Promise<HistoryEntry[]> {
    return getLocalHistory();
  },

  async getById(userId: string, historyId: string): Promise<HistoryEntry | undefined> {
    const all = getLocalHistory();
    return all.find((e) => e.id === historyId);
  },

  async add(userId: string, entry: Omit<HistoryEntry, "id">): Promise<HistoryEntry | null> {
    try {
      const all = getLocalHistory();
      const newEntry: HistoryEntry = {
        id: Math.random().toString(36).substring(2, 9),
        ...entry,
      };
      all.unshift(newEntry); // Add to the beginning of the list
      saveLocalHistory(all);
      return newEntry;
    } catch (error) {
      console.error("Error adding history entry:", error);
      return null;
    }
  },

  async update(userId: string, historyId: string, updates: Partial<HistoryEntry>): Promise<void> {
    try {
      const all = getLocalHistory();
      const index = all.findIndex((e) => e.id === historyId);
      if (index !== -1) {
        all[index] = { ...all[index], ...updates };
        saveLocalHistory(all);
      }
    } catch (error) {
      console.error("Error updating history entry:", error);
    }
  },

  async remove(userId: string, historyId: string): Promise<void> {
    try {
      const all = getLocalHistory();
      const filtered = all.filter((e) => e.id !== historyId);
      saveLocalHistory(filtered);
    } catch (error) {
      console.error("Error removing history entry:", error);
    }
  },

  async removeMany(userId: string, historyIds: string[]): Promise<void> {
    try {
      const all = getLocalHistory();
      const filtered = all.filter((e) => !historyIds.includes(e.id));
      saveLocalHistory(filtered);
    } catch (error) {
      console.error("Error removing multiple history entries:", error);
    }
  },

  async search(userId: string, searchQuery: string): Promise<HistoryEntry[]> {
    const all = await this.getAll(userId);
    const q = searchQuery.toLowerCase();
    return all.filter(
      (e) =>
        e.transcript.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q)
    );
  },

  async filter(userId: string, options: {
    type?: HistoryEntry["type"];
    dateFrom?: string;
    dateTo?: string;
    minConfidence?: number;
  }): Promise<HistoryEntry[]> {
    let entries = await this.getAll(userId);

    if (options.type) {
      entries = entries.filter((e) => e.type === options.type);
    }
    if (options.dateFrom) {
      entries = entries.filter((e) => e.date >= options.dateFrom!);
    }
    if (options.dateTo) {
      entries = entries.filter((e) => e.date <= options.dateTo!);
    }
    if (options.minConfidence) {
      entries = entries.filter(
        (e) => e.averageConfidence >= options.minConfidence!
      );
    }

    return entries;
  },

  async clear(userId: string): Promise<void> {
    saveLocalHistory([]);
  },
};
