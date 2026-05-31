import type { HistoryEntry } from "@/lib/ml/types";

const LOCAL_STORAGE_KEY = "signbridge_history";

function generateSeedHistory(): HistoryEntry[] {
  const seeds: HistoryEntry[] = [];
  const now = new Date();

  const phrases = [
    { text: "HELLO", type: "sign-to-text" as const, duration: 8, confidence: 0.95 },
    { text: "NICE TO MEET YOU", type: "voice-to-sign" as const, duration: 12, confidence: 0.91 },
    { text: "HOW ARE YOU", type: "sign-to-text" as const, duration: 14, confidence: 0.93 },
    { text: "PLEASE HELP ME", type: "sign-to-text" as const, duration: 10, confidence: 0.91 },
    { text: "MY NAME IS YASH", type: "text-to-sign" as const, duration: 15, confidence: 0.96 },
    { text: "THANK YOU", type: "sign-to-text" as const, duration: 6, confidence: 0.97 },
    { text: "WHERE IS THE STATION", type: "voice-to-sign" as const, duration: 18, confidence: 0.88 },
    { text: "I NEED ASSISTANCE", type: "sign-to-text" as const, duration: 25, confidence: 0.90 },
    { text: "DO YOU SPEAK ENGLISH", type: "sign-to-text" as const, duration: 16, confidence: 0.94 },
    { text: "GOOD MORNING", type: "text-to-sign" as const, duration: 9, confidence: 0.92 },
    { text: "CAN I HAVE SOME WATER", type: "voice-to-sign" as const, duration: 11, confidence: 0.89 },
    { text: "HAVE A GREAT DAY", type: "sign-to-text" as const, duration: 10, confidence: 0.96 },
    { text: "WELCOME", type: "text-to-sign" as const, duration: 7, confidence: 0.95 },
    { text: "EXCUSE ME", type: "sign-to-text" as const, duration: 8, confidence: 0.92 },
    { text: "I AM LEARNING SIGN LANGUAGE", type: "voice-to-sign" as const, duration: 22, confidence: 0.94 },
    { text: "THIS IS AMAZING", type: "sign-to-text" as const, duration: 12, confidence: 0.98 },
    { text: "WE ARE ALMOST DONE WITH THE BUILD", type: "sign-to-text" as const, duration: 15, confidence: 0.99 },
    { text: "THE UI LOOKS PREMIUM", type: "voice-to-sign" as const, duration: 10, confidence: 0.97 }
  ];

  phrases.forEach((phrase, idx) => {
    const entryDate = new Date();
    const daysAgo = idx % 7;
    entryDate.setDate(now.getDate() - daysAgo);
    entryDate.setHours(9 + (idx % 9), 10 * (idx % 6), 0, 0);

    seeds.push({
      id: Math.random().toString(36).substring(2, 9),
      date: entryDate.toISOString().split("T")[0], // Keep it clean date string (YYYY-MM-DD) for analytics matching
      duration: phrase.duration,
      type: phrase.type,
      phraseCount: phrase.text.split(/\s+/).length,
      averageConfidence: phrase.confidence,
      transcript: phrase.text,
      saved: true
    });
  });

  return seeds.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function getLocalHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) {
      const seedData = generateSeedHistory();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seedData));
      return seedData;
    }
    return JSON.parse(data);
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
