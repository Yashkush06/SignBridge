/**
 * Export Service — export translation sessions as TXT, CSV, or JSON.
 */

import type { SignDetectionResult, HistoryEntry } from "@/lib/ml/types";

function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const exportService = {
  /** Export detections from a live session as plain text */
  exportAsText(
    detections: SignDetectionResult[],
    sessionName = "SignBridge Session"
  ): void {
    const lines = [
      `SignBridge Translation Export`,
      `Session: ${sessionName}`,
      `Date: ${new Date().toLocaleString()}`,
      `Total Signs: ${detections.length}`,
      `---`,
      "",
    ];

    for (const d of detections) {
      const time = new Date(d.timestamp).toLocaleTimeString();
      lines.push(
        `[${time}] ${d.sign} (${Math.round(d.confidence * 100)}% confidence)`
      );
    }

    const transcript = detections.map((d) => d.sign).join(" ");
    lines.push("", "--- Transcript ---", transcript);

    downloadFile(lines.join("\n"), `signbridge-export-${Date.now()}.txt`, "text/plain");
  },

  /** Export detections as CSV */
  exportAsCsv(detections: SignDetectionResult[]): void {
    const headers = "Timestamp,Sign,Confidence,Hands Detected\n";
    const rows = detections
      .map((d) => {
        const time = new Date(d.timestamp).toISOString();
        return `${time},${d.sign},${d.confidence},${d.hands.length}`;
      })
      .join("\n");

    downloadFile(headers + rows, `signbridge-export-${Date.now()}.csv`, "text/csv");
  },

  /** Export detections as JSON */
  exportAsJson(detections: SignDetectionResult[]): void {
    const data = {
      exportedAt: new Date().toISOString(),
      totalDetections: detections.length,
      detections: detections.map((d) => ({
        sign: d.sign,
        confidence: d.confidence,
        timestamp: d.timestamp,
        handsDetected: d.hands.length,
      })),
    };

    downloadFile(
      JSON.stringify(data, null, 2),
      `signbridge-export-${Date.now()}.json`,
      "application/json"
    );
  },

  /** Export history entries as CSV */
  exportHistoryAsCsv(entries: HistoryEntry[]): void {
    const headers = "Date,Duration (s),Type,Phrases,Confidence,Transcript\n";
    const rows = entries
      .map((e) => {
        const escapedTranscript = `"${e.transcript.replace(/"/g, '""')}"`;
        return `${e.date},${e.duration},${e.type},${e.phraseCount},${e.averageConfidence},${escapedTranscript}`;
      })
      .join("\n");

    downloadFile(
      headers + rows,
      `signbridge-history-${Date.now()}.csv`,
      "text/csv"
    );
  },
};
