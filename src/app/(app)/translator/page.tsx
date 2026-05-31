"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useWebcam } from "@/hooks/use-webcam";
import { useSignDetection } from "@/hooks/use-sign-detection";
import "@/lib/ml/register-models"; // registers MediaPipe provider
import { getModelRegistry } from "@/lib/ml/model-registry";
import { useTranslatorStore } from "@/store/translator-store";
import { useAuthStore } from "@/store/auth-store";
import { historyService } from "@/lib/services/history-service";
import type { HistoryEntry } from "@/lib/ml/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exportService } from "@/lib/services/export-service";
import { cn } from "@/lib/cn";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  VideoOff,
  Pause,
  Play,
  Trash2,
  Download,
  AlertCircle,
  Camera,
  Space,
  Delete,
  Eraser,
  Sparkles,
  Copy,
  Check,
  Volume2,
  Hand,
  Type,
} from "lucide-react";

// ─── Autocorrect dictionary (common English words) ───
const DICTIONARY = [
  "hello", "help", "how", "are", "you", "thank", "thanks", "please", "yes", "no",
  "good", "bad", "morning", "night", "afternoon", "evening", "name", "my", "your",
  "what", "where", "when", "why", "who", "which", "the", "this", "that", "these",
  "those", "and", "but", "for", "not", "all", "can", "had", "her", "was", "one",
  "our", "out", "day", "get", "has", "him", "his", "make", "like", "long",
  "look", "many", "some", "time", "very", "come", "could", "people", "than",
  "first", "water", "been", "call", "from", "more", "now", "find", "here",
  "thing", "give", "most", "tell", "boy", "girl", "man", "woman", "child",
  "world", "life", "hand", "high", "keep", "last", "left", "right", "school",
  "never", "start", "city", "earth", "food", "home", "need", "work", "part",
  "take", "place", "live", "back", "only", "year", "came", "show", "every",
  "just", "form", "great", "think", "say", "each", "hear", "know", "about",
  "after", "again", "also", "back", "because", "before", "between", "both",
  "same", "she", "should", "still", "such", "with", "will", "would", "love",
  "apple", "happy", "sorry", "friend", "family", "brother", "sister", "mother",
  "father", "doctor", "teacher", "student", "learn", "sign", "language", "deaf",
  "hear", "speak", "read", "write", "understand", "nice", "meet", "again",
  "today", "tomorrow", "yesterday", "week", "month", "want", "need", "have",
  "eat", "drink", "sleep", "play", "stop", "go", "come", "open", "close",
  "big", "small", "hot", "cold", "new", "old", "fast", "slow",
];

function getAutocorrectSuggestions(word: string, maxResults = 3): string[] {
  if (!word || word.length < 2) return [];
  const lower = word.toLowerCase();

  // Exact match — no suggestions needed
  if (DICTIONARY.includes(lower)) return [];

  // Levenshtein distance
  function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return dp[m][n];
  }

  const scored = DICTIONARY
    .map((w) => ({ word: w, dist: levenshtein(lower, w) }))
    .filter((w) => w.dist <= 2 && w.dist > 0) // within 2 edits
    .sort((a, b) => a.dist - b.dist || a.word.length - b.word.length);

  return scored.slice(0, maxResults).map((s) => s.word);
}

// ─── Stable letter commitment logic ───
const COMMIT_HOLD_MS = 1200; // User must hold the sign for 1.2 seconds
const COMMIT_COOLDOWN_MS = 600; // Cooldown between committing the same letter

export default function TranslatorPage() {
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuthStore();

  const {
    cameraState,
    setCameraState,
    isDetecting,
    setIsDetecting,
    currentSign,
    setCurrentSign,
    confidence,
    setConfidence,
    detections,
    addDetection,
    clearDetections,
    selectedModel,
    setSelectedModel,
    fps: storeFps,
    setFps,
  } = useTranslatorStore();

  const {
    videoRef,
    cameraState: webcamState,
    error: webcamError,
    startCamera,
    stopCamera,
  } = useWebcam({ width: 640, height: 480 });

  const modelProvider = useMemo(() => {
    try {
      return getModelRegistry().create(selectedModel);
    } catch {
      return null;
    }
  }, [selectedModel]);

  // Store latest frame result for drawing
  const latestFrameRef = useRef<any>(null);

  const {
    currentSign: mlSign,
    confidence: mlConfidence,
    detections: mlDetections,
    fps: mlFps,
    isModelReady,
    modelError,
    clearDetections: mlClearDetections,
  } = useSignDetection({
    provider: modelProvider,
    videoElement: videoRef.current,
    cameraState: webcamState,
    confidenceThreshold: selectedModel === "tfjs-asl" ? 0.2 : 0.65,
    enabled: isDetecting && webcamState === "active",
    onFrame: (result) => {
      latestFrameRef.current = result;
    },
  });

  // ─── Sentence Builder State ───
  const [sentenceText, setSentenceText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [lastCommittedLetter, setLastCommittedLetter] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0); // 0-100
  const holdStartRef = useRef<number | null>(null);
  const holdLetterRef = useRef<string | null>(null);
  const lastCommitTimeRef = useRef<number>(0);
  const holdTimerRef = useRef<number | null>(null);

  // Sync state
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCameraState(webcamState);
  }, [webcamState, setCameraState]);

  useEffect(() => {
    if (mlSign && mlSign !== "Unknown") {
      setCurrentSign(mlSign);
      setConfidence(mlConfidence);
    } else {
      setCurrentSign("Unknown");
      setConfidence(0);
    }
    setFps(mlFps);
  }, [mlSign, mlConfidence, mlFps, setCurrentSign, setConfidence, setFps]);

  useEffect(() => {
    if (mlDetections.length > detections.length) {
      const newDetections = mlDetections.slice(detections.length);
      newDetections.forEach((d) => addDetection(d));
    }
  }, [mlDetections, detections.length, addDetection]);

  // ─── Letter Hold & Commit Logic ───
  useEffect(() => {
    const letter = currentSign;
    const now = Date.now();

    // If the detected letter changed, reset the hold timer
    if (letter !== holdLetterRef.current) {
      holdLetterRef.current = letter;
      holdStartRef.current = letter !== "Unknown" ? now : null;
      setHoldProgress(0);
    }

    // If we have a valid letter being held, start ticking progress
    if (letter !== "Unknown" && holdStartRef.current) {
      const tick = () => {
        const elapsed = Date.now() - (holdStartRef.current || Date.now());
        const pct = Math.min(100, (elapsed / COMMIT_HOLD_MS) * 100);
        setHoldProgress(pct);

        if (pct >= 100) {
          // Commit the letter if cooldown has passed
          if (Date.now() - lastCommitTimeRef.current > COMMIT_COOLDOWN_MS) {
            const rawLetter = holdLetterRef.current;
            if (rawLetter && rawLetter !== "Unknown") {
              const letterToAdd = rawLetter === "Space" ? " " : rawLetter;
              setSentenceText((prev) => prev + letterToAdd);
              setLastCommittedLetter(rawLetter);
              lastCommitTimeRef.current = Date.now();
            }
          }
          // Reset for next hold
          holdStartRef.current = Date.now();
          setHoldProgress(0);
        } else {
          holdTimerRef.current = window.requestAnimationFrame(tick);
        }
      };
      holdTimerRef.current = window.requestAnimationFrame(tick);
    }

    return () => {
      if (holdTimerRef.current) {
        window.cancelAnimationFrame(holdTimerRef.current);
      }
    };
  }, [currentSign]);

  // ─── Autocorrect suggestions for the last word ───
  useEffect(() => {
    const words = sentenceText.split(" ");
    const lastWord = words[words.length - 1];
    if (lastWord && lastWord.length >= 2) {
      setSuggestions(getAutocorrectSuggestions(lastWord));
    } else {
      setSuggestions([]);
    }
  }, [sentenceText]);

  // ─── Sentence Builder Actions ───
  const handleAddSpace = useCallback(() => {
    setSentenceText((prev) => {
      if (prev.length === 0 || prev.endsWith(" ")) return prev;
      return prev + " ";
    });
  }, []);

  const handleDeleteWord = useCallback(() => {
    setSentenceText((prev) => {
      const trimmed = prev.trimEnd();
      const lastSpaceIdx = trimmed.lastIndexOf(" ");
      if (lastSpaceIdx === -1) return "";
      return trimmed.slice(0, lastSpaceIdx + 1);
    });
  }, []);

  const handleDeleteLetter = useCallback(() => {
    setSentenceText((prev) => prev.slice(0, -1));
  }, []);

  const handleClearSentence = useCallback(() => {
    setSentenceText("");
    setSuggestions([]);
    setLastCommittedLetter(null);
  }, []);

  const handleApplySuggestion = useCallback((suggestion: string) => {
    setSentenceText((prev) => {
      const words = prev.split(" ");
      words[words.length - 1] = suggestion.toUpperCase();
      return words.join(" ");
    });
    setSuggestions([]);
  }, []);

  const handleCopyText = useCallback(() => {
    if (sentenceText.trim()) {
      navigator.clipboard.writeText(sentenceText.trim()).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [sentenceText]);

  const handleSpeak = useCallback(() => {
    if (sentenceText.trim() && typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(sentenceText.trim());
      window.speechSynthesis.speak(utterance);
    }
  }, [sentenceText]);

  const saveSessionToHistory = () => {
    if (detections.length === 0 || !user?.id) return;
    const session: Omit<HistoryEntry, "id"> = {
      date: new Date().toISOString(),
      duration: Math.max(
        1,
        Math.round(
          (detections[detections.length - 1].timestamp - detections[0].timestamp) / 1000
        )
      ),
      type: "sign-to-text",
      phraseCount: detections.length,
      averageConfidence:
        detections.reduce((acc, d) => acc + d.confidence, 0) / detections.length,
      transcript: sentenceText.trim() || detections.map((d) => d.sign).join(" "),
      saved: true,
    };
    historyService.add(user.id, session).catch(console.error);
  };

  const handleToggleCamera = () => {
    if (webcamState === "active") {
      saveSessionToHistory();
      stopCamera();
    } else {
      startCamera();
    }
  };

  const handleToggleDetection = () => {
    setIsDetecting(!isDetecting);
  };

  const handleClear = () => {
    saveSessionToHistory();
    clearDetections();
    mlClearDetections();
  };

  const handleExport = () => {
    if (sentenceText.trim()) {
      const blob = new Blob(
        [`SignBridge — Live Translation\nDate: ${new Date().toLocaleString()}\n\nTranslated Sentence:\n${sentenceText.trim()}\n`],
        { type: "text/plain" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `signbridge-translation-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (detections.length > 0) {
      exportService.exportAsText(detections, "Live Session");
    }
  };

  // Draw landmarks
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current || webcamState !== "active") return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const draw = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const result = latestFrameRef.current;
        if (result && result.hands) {
          ctx.strokeStyle = "#10b981";
          ctx.fillStyle = "#10b981";
          ctx.lineWidth = 2;

          for (const hand of result.hands) {
            const connections = [
              [0, 1], [1, 2], [2, 3], [3, 4],
              [0, 5], [5, 6], [6, 7], [7, 8],
              [5, 9], [9, 10], [10, 11], [11, 12],
              [9, 13], [13, 14], [14, 15], [15, 16],
              [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
            ];

            ctx.beginPath();
            for (const [start, end] of connections) {
              const p1 = hand.landmarks[start];
              const p2 = hand.landmarks[end];
              if (p1 && p2) {
                ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
                ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
              }
            }
            ctx.stroke();

            for (const lm of hand.landmarks) {
              ctx.beginPath();
              ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 3, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [webcamState]);

  if (!mounted) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-4 w-full max-w-[1400px] mx-auto h-full overflow-hidden"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Live Translator</h1>
          {webcamState === "active" && isDetecting ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error/10 text-error text-xs font-medium animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-error" />
              Recording
            </div>
          ) : (
            <Badge variant="outline" className="text-[var(--fg-tertiary)] py-0.5">
              Idle
            </Badge>
          )}
        </div>

        {/* Model Selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="model-select"
            className="text-xs font-medium text-[var(--fg-secondary)] hidden sm:inline"
          >
            Model:
          </label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={webcamState === "active"}
            className="text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50 cursor-pointer"
          >
            <option value="mediapipe">🤖 Rules (Alphabet A-Z)</option>
            <option value="alphabet-nn">✨ Neural Net (Alphabet A-Z)</option>
            <option value="tfjs-asl">🧠 LSTM Neural Net (Words)</option>
          </select>
        </div>
      </div>

      {/* Main Workspace (Strictly non-scrolling split layout) */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
        
        {/* Left Side: Camera & Compact Sentence Builder */}
        <div className="flex-1 flex flex-col gap-4 min-h-0 min-w-0">
          
          {/* Camera Frame (Flexible, Meet-style layout) */}
          <div className="flex-1 relative bg-black rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/10 flex items-center justify-center min-h-[280px]">
            {/* Status Badges Overlay */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              {!isModelReady && webcamState === "active" && (
                <Badge
                  variant="warning"
                  className="bg-warning/90 text-white border-0 shadow-sm backdrop-blur-md px-2.5 py-1 text-xs"
                >
                  Loading Model...
                </Badge>
              )}
              {modelError && (
                <Badge
                  variant="error"
                  className="bg-error/90 text-white border-0 shadow-sm backdrop-blur-md px-2.5 py-1 text-xs"
                >
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Model Error
                </Badge>
              )}
            </div>

            <div className="absolute top-4 right-4 z-10">
              {webcamState === "active" && (
                <Badge
                  variant="outline"
                  className="bg-black/50 text-white border-white/20 backdrop-blur-md text-xs py-0.5"
                >
                  {storeFps} FPS
                </Badge>
              )}
            </div>

            {/* Camera Feed / Idle Frame */}
            {webcamState !== "idle" ? (
              <>
                <video
                  ref={videoRef}
                  className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${webcamState === "active" ? "opacity-100" : "opacity-0"}`}
                  autoPlay
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none transition-opacity duration-300 ${webcamState === "active" ? "opacity-100" : "opacity-0"}`}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                  <Camera className="w-7 h-7 text-white/50" />
                </div>
                <p className="font-semibold text-white text-base mb-1">Camera is Off</p>
                <p className="text-xs text-white/60 mb-6 text-balance">
                  {webcamError || "Turn on your webcam to begin translating American Sign Language in real-time."}
                </p>
                <Button onClick={startCamera} variant="primary" className="rounded-full shadow-md">
                  <Video className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
              </div>
            )}

            {/* Meet-style Floating Action Bar Overlay (Always accessible) */}
            {webcamState === "active" && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 shadow-2xl transition-all hover:bg-black/75">
                <Button
                  variant={webcamState === "active" ? "danger" : "primary"}
                  onClick={handleToggleCamera}
                  size="sm"
                  className="rounded-full h-9 px-4 text-xs transition-transform hover:scale-105 active:scale-95"
                >
                  <VideoOff className="w-3.5 h-3.5 mr-1.5" /> Stop
                </Button>
                <Button
                  variant={!isDetecting ? "primary" : "secondary"}
                  onClick={handleToggleDetection}
                  size="sm"
                  className="rounded-full h-9 px-4 text-xs transition-transform hover:scale-105 active:scale-95"
                >
                  {isDetecting ? (
                    <><Pause className="w-3.5 h-3.5 mr-1.5" /> Pause</>
                  ) : (
                    <><Play className="w-3.5 h-3.5 mr-1.5" /> Resume</>
                  )}
                </Button>
                <div className="h-4 w-px bg-white/20 mx-1" />
                <Button
                  variant="ghost"
                  onClick={handleClear}
                  size="sm"
                  className="rounded-full h-9 w-9 p-0 text-white/70 hover:text-white hover:bg-white/10 transition-transform hover:scale-110 active:scale-95"
                  title="Clear log"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleExport}
                  size="sm"
                  className="rounded-full h-9 w-9 p-0 text-white/70 hover:text-white hover:bg-white/10 transition-transform hover:scale-110 active:scale-95"
                  title="Export session"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Compact Sentence Builder Panel */}
          <Card className="shrink-0 p-0 overflow-hidden border-[var(--border)] shadow-sm bg-[var(--bg)] flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-brand-500" />
                  <span className="font-semibold text-xs text-[var(--fg)]">Current Text</span>
                </div>
                <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/10 border border-brand-200/50 dark:border-brand-500/20 text-[10px] font-medium text-brand-600 dark:text-brand-400">
                  <span className="text-[10px]">🤟</span> 
                  <span>Sign &quot;I Love You&quot; for Space</span>
                </div>
              </div>
              <AnimatePresence mode="wait">
                {lastCommittedLetter && (
                  <motion.div
                    initial={{ opacity: 0, x: 5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1 text-[11px] text-success font-medium"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Added &quot;{lastCommittedLetter}&quot;
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Display screen */}
            <div className="px-4 py-3 min-h-[56px] flex items-center bg-[var(--bg)]">
              {sentenceText ? (
                <p className="text-xl font-bold tracking-wide text-[var(--fg)] break-all leading-tight">
                  {sentenceText}
                  <span className="inline-block w-0.5 h-5 bg-brand-500 ml-1 animate-pulse align-middle" />
                </p>
              ) : (
                <p className="text-xs text-[var(--fg-tertiary)] italic">
                  Signs will be appended here. Try holding a hand sign steady...
                </p>
              )}
            </div>

            {/* Autocorrect Bar */}
            {suggestions.length > 0 && (
              <div className="px-4 py-1.5 bg-brand-50/50 dark:bg-brand-950/10 border-t border-[var(--border)] flex items-center gap-1.5 flex-wrap">
                <Sparkles className="w-3 h-3 text-brand-500 shrink-0" />
                <span className="text-[10px] font-medium text-[var(--fg-secondary)] shrink-0">Suggestions:</span>
                {suggestions.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    onClick={() => handleApplySuggestion(s)}
                    className="h-6 px-2.5 py-0 text-[11px] font-medium rounded-full bg-[var(--bg)] hover:bg-brand-100 dark:hover:bg-brand-950/30 transition-colors text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            )}

            {/* Controls bottom Row */}
            <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleAddSpace} disabled={!sentenceText || sentenceText.endsWith(" ")} className="h-8 text-xs gap-1">
                <Hand className="w-3 h-3" /> Space
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeleteLetter} disabled={!sentenceText} className="h-8 text-xs gap-1">
                <Delete className="w-3 h-3" /> Backspace
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeleteWord} disabled={!sentenceText} className="h-8 text-xs gap-1">
                <Eraser className="w-3 h-3" /> Word
              </Button>
              <div className="h-4 w-px bg-[var(--border)] mx-1" />
              <Button variant="outline" size="sm" onClick={handleCopyText} disabled={!sentenceText.trim()} className="h-8 text-xs gap-1">
                {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleSpeak} disabled={!sentenceText.trim()} className="h-8 text-xs gap-1">
                <Volume2 className="w-3 h-3" /> Speak
              </Button>
              <div className="flex-1" />
              <Button variant="ghost" size="sm" onClick={handleClearSentence} disabled={!sentenceText} className="h-8 text-xs text-error hover:text-error/90 hover:bg-error/5 gap-1">
                <Trash2 className="w-3 h-3" /> Clear
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Side: Detection panel & Log Feed */}
        <Card className="w-full md:w-72 shrink-0 flex flex-col min-h-0 overflow-hidden border-[var(--border)]">
          {/* Top Panel: Detected Sign */}
          <div className="p-4 border-b border-[var(--border)] bg-gradient-to-b from-[var(--bg-secondary)] to-transparent flex flex-col justify-center">
            <p className="text-[10px] font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-1">Detected Sign</p>
            
            <div className="flex items-end justify-between min-h-[64px]">
              {/* Animated scaling letter */}
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentSign}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="text-6xl font-black tracking-tighter leading-none text-brand-500"
                >
                  {currentSign !== "Unknown" ? currentSign : "--"}
                </motion.span>
              </AnimatePresence>
              
              {currentSign !== "Unknown" && (
                <span className="text-sm font-medium text-[var(--fg-secondary)] mb-1 font-mono">
                  {Math.round(confidence * 100)}%
                </span>
              )}
            </div>

            {/* Hold progress bar overlay */}
            {currentSign !== "Unknown" && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[10px] text-[var(--fg-tertiary)]">
                  <span>Commit progress</span>
                  <span>{Math.round(holdProgress)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full transition-all duration-75",
                      holdProgress >= 100 ? "bg-success" : "bg-brand-500"
                    )}
                    style={{ width: `${holdProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Panel: Scrollable detection feed */}
          <div className="flex-1 min-h-0 p-3 flex flex-col">
            <p className="text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider mb-2 shrink-0">Detection Log</p>
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
              <AnimatePresence initial={false}>
                {detections.length === 0 ? (
                  <p className="text-xs text-[var(--fg-tertiary)] text-center py-10 italic">
                    Translations list is empty.
                  </p>
                ) : (
                  [...detections]
                    .reverse()
                    .slice(0, 15)
                    .map((d, idx) => (
                      <motion.div
                        key={d.timestamp + "-" + idx}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]/50 text-xs hover:border-brand-200 transition-colors"
                      >
                        <span className="font-bold text-[var(--fg)]">{d.sign}</span>
                        <span className="text-[10px] text-[var(--fg-tertiary)] font-mono">
                          {Math.round(d.confidence * 100)}%
                        </span>
                      </motion.div>
                    ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
