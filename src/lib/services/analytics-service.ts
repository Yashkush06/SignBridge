import type { AnalyticsData } from "@/lib/ml/types";
import { historyService } from "./history-service";

export const analyticsService = {
  async getDashboardStats(userId: string): Promise<AnalyticsData> {
    if (!userId) {
      return {
        totalTranslations: 0,
        averageConfidence: 0,
        vocabularySize: 0,
        minutesActive: 0,
        recentActivity: [],
        confidenceHistory: [],
        usageByType: [],
      };
    }

    const entries = await historyService.getAll(userId);
    
    if (entries.length === 0) {
      return {
        totalTranslations: 0,
        averageConfidence: 0,
        vocabularySize: 0,
        minutesActive: 0,
        recentActivity: [],
        confidenceHistory: [],
        usageByType: [],
      };
    }

    const totalTranslations = entries.length;
    
    const totalConfidence = entries.reduce((acc, curr) => acc + curr.averageConfidence, 0);
    const averageConfidence = totalConfidence / entries.length;
    
    const totalDurationSeconds = entries.reduce((acc, curr) => acc + curr.duration, 0);
    const minutesActive = Math.round(totalDurationSeconds / 60);

    // Group by dates for recent activity (last 7 days)
    const recentActivityMap = new Map<string, number>();
    const confidenceHistoryMap = new Map<string, number>();
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      recentActivityMap.set(dateStr, 0);
      confidenceHistoryMap.set(dateStr, 0);
    }

    const typeCount = {
      "sign-to-text": 0,
      "text-to-sign": 0,
      "voice-to-sign": 0,
    };

    let wordsCounted = 0;

    entries.forEach(entry => {
      // Activity
      if (recentActivityMap.has(entry.date)) {
        recentActivityMap.set(entry.date, recentActivityMap.get(entry.date)! + 1);
        
        // Very basic confidence averaging per day
        const currentConf = confidenceHistoryMap.get(entry.date)!;
        confidenceHistoryMap.set(entry.date, currentConf === 0 ? entry.averageConfidence : (currentConf + entry.averageConfidence) / 2);
      }

      // Usage Type
      if (entry.type in typeCount) {
        typeCount[entry.type as keyof typeof typeCount]++;
      }

      // Estimate vocabulary size (unique words in transcript)
      const words = entry.transcript.toLowerCase().split(/\W+/).filter(w => w.length > 0);
      wordsCounted += words.length;
    });

    const recentActivity = Array.from(recentActivityMap.entries()).map(([date, count]) => ({
      date: date.substring(5), // MM-DD
      count
    }));

    const confidenceHistory = Array.from(confidenceHistoryMap.entries()).map(([date, confidence]) => ({
      date: date.substring(5),
      confidence
    }));

    const usageByType = [
      { name: "Camera (Sign to Text)", value: typeCount["sign-to-text"], color: "#3B82F6" },
      { name: "Animation (Text to Sign)", value: typeCount["text-to-sign"], color: "#10B981" },
      { name: "Voice (Voice to Sign)", value: typeCount["voice-to-sign"], color: "#8B5CF6" },
    ];

    return {
      totalTranslations,
      averageConfidence,
      // Rough estimation for demo
      vocabularySize: Math.floor(wordsCounted * 0.4),
      minutesActive,
      recentActivity,
      confidenceHistory,
      usageByType,
    };
  }
};
