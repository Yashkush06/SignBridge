"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator, type SurfaceStatus } from "@/components/ui/status-indicator";
import {
  Mic,
  MicOff,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Hand,
  Type,
  Trash2,
} from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useAuthStore } from "@/store/auth-store";
import { historyService } from "@/lib/services/history-service";
import type { HistoryEntry } from "@/lib/ml/types";
import { cn } from "@/lib/cn";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function VoiceToSignPage() {
  const { user } = useAuthStore();
  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentLetter, setCurrentLetter] = useState<string | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [animationQueue, setAnimationQueue] = useState<string[]>([]);
  const [completedText, setCompletedText] = useState("");
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Reset video loaded state when letter changes to prevent flicker
  useEffect(() => {
    setIsVideoLoaded(false);
  }, [currentLetter]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const processedTranscriptRef = useRef("");

  // Restart video when letter changes
  useEffect(() => {
    if (videoRef.current && currentLetter && currentLetter !== " ") {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [currentLetter]);

  // Watch for new transcript words and queue them for animation
  useEffect(() => {
    const fullText = (transcript + " " + interimTranscript).trim();
    if (!fullText) return;

    // Find new words that haven't been processed yet
    const alreadyProcessed = processedTranscriptRef.current;
    if (fullText.length > alreadyProcessed.length) {
      const newPart = fullText.slice(alreadyProcessed.length).trim();
      if (newPart) {
        const newWords = newPart.split(/\s+/).filter(Boolean);
        if (newWords.length > 0) {
          setAnimationQueue((prev) => [...prev, ...newWords]);
          processedTranscriptRef.current = fullText;
        }
      }
    }
  }, [transcript, interimTranscript]);

  // Process animation queue
  const processQueue = useCallback(() => {
    setAnimationQueue((queue) => {
      if (queue.length === 0) {
        setIsAnimating(false);
        return queue;
      }

      setIsAnimating(true);
      const word = queue[0];
      const letters = word.toUpperCase().split("");

      let idx = 0;
      const animateLetter = () => {
        if (idx >= letters.length) {
          // Word complete — show space briefly, then move to next word
          setCurrentLetter(" ");
          setCompletedText((prev) =>
            prev ? prev + " " + word : word
          );
          setCurrentWordIndex((i) => i + 1);
          setCurrentLetterIndex(0);

          // Remove the first word from queue and continue
          setAnimationQueue((q) => {
            const next = q.slice(1);
            if (next.length === 0) {
              setIsAnimating(false);
            }
            return next;
          });

          // Small pause between words, then process next
          animationRef.current = setTimeout(() => {
            processQueue();
          }, 800);
          return;
        }

        const char = letters[idx];
        if (ALPHABET.includes(char)) {
          setCurrentLetter(char);
          setCurrentLetterIndex(idx);
        }
        idx++;
        animationRef.current = setTimeout(animateLetter, 1500);
      };

      animateLetter();
      return queue;
    });
  }, []);

  // Auto-start processing when queue gets new items
  useEffect(() => {
    if (animationQueue.length > 0 && !isAnimating) {
      processQueue();
    }
  }, [animationQueue, isAnimating, processQueue]);

  const handleStopListening = () => {
    stopListening();

    const finalTranscript = (transcript + " " + interimTranscript).trim();
    if (finalTranscript && user?.id) {
      const session: Omit<HistoryEntry, "id"> = {
        date: new Date().toISOString(),
        duration: 1,
        type: "voice-to-sign",
        phraseCount: finalTranscript.split(/\s+/).length,
        averageConfidence: 0,
        transcript: finalTranscript,
        saved: true,
      };
      historyService.add(user.id, session).catch(console.error);
    }
  };

  const handlePauseAnimation = () => {
    if (animationRef.current) clearTimeout(animationRef.current);
    setIsAnimating(false);
  };

  const handleResumeAnimation = () => {
    if (animationQueue.length > 0) {
      processQueue();
    }
  };

  const handleClearAll = () => {
    if (animationRef.current) clearTimeout(animationRef.current);
    setIsAnimating(false);
    setAnimationQueue([]);
    setCurrentLetter(null);
    setCurrentWordIndex(0);
    setCurrentLetterIndex(0);
    setCompletedText("");
    processedTranscriptRef.current = "";
    resetTranscript();
  };

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] max-w-lg mx-auto text-center space-y-4">
        <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-semibold">
          Speech Recognition Not Supported
        </h2>
        <p className="text-[var(--fg-secondary)]">
          Your browser doesn&apos;t support the Web Speech API. Please try using
          Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  const fullTranscript = (transcript + " " + interimTranscript).trim();
  const queueWordCount = animationQueue.length;

  // Map the page's live state to a defined SurfaceStatus (Req 8.3):
  // - recording: the microphone is actively listening
  // - processing: signs are being animated out of the queue
  // - idle: neither listening nor animating
  const surfaceStatus: SurfaceStatus = isListening
    ? "recording"
    : isAnimating
      ? "processing"
      : "idle";

  return (
    <div className="flex flex-col h-auto lg:h-[calc(100vh-3.5rem)] max-w-5xl mx-auto p-4 md:p-6 gap-4">
      {/* Header & Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight flex items-center gap-3">
            <span>
              <span className="text-brand-500">Voice</span> to Sign Language
            </span>
            <StatusIndicator status={surfaceStatus} />
          </h1>
          <p className="text-[var(--fg-secondary)] mt-1 text-xs md:text-sm">
            Speak into your microphone to translate words into ASL.
          </p>
        </div>

        {/* Compact Microphone Control */}
        <div className="flex items-center gap-4">
          {error && (
            <span className="hidden md:block text-xs text-error font-medium max-w-[200px] truncate">
              {error}
            </span>
          )}

          {/* Waveform visualization */}
          {isListening && !error && (
            <div className="hidden md:flex items-center gap-1 h-4 mr-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-brand-500 rounded-full"
                  style={{
                    height: `${12 + Math.random() * 88}%`,
                    animation: `pulse ${0.4 + Math.random() * 0.6}s ease-in-out infinite alternate`,
                  }}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider">
              {isListening ? "Listening" : "Tap to Speak"}
            </span>
            <button
              onClick={isListening ? handleStopListening : startListening}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                isListening
                  ? "bg-error text-white hover:bg-error/90 hover:scale-105"
                  : "bg-brand-500 text-white hover:bg-brand-600 hover:scale-105"
              }`}
            >
              {isListening ? (
                <>
                  <div className="absolute inset-0 bg-error rounded-full animate-ping opacity-30"></div>
                  <Mic className="w-5 h-5 relative z-10" />
                </>
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid md:grid-cols-2 gap-4 min-h-0">
        {/* Left: Transcription Panel */}
        <Card className="flex flex-col min-h-0 border-[var(--border)] shadow-sm">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-[var(--fg-tertiary)]" />
              <h3 className="font-medium text-sm">Live Transcription</h3>
            </div>
            <div className="flex items-center gap-2">
              {queueWordCount > 0 && (
                <Badge variant="info" className="text-xs">
                  {queueWordCount} word{queueWordCount !== 1 ? "s" : ""} queued
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={!fullTranscript && !completedText}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {/* Completed (already animated) text */}
            {completedText && (
              <div>
                <p className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider mb-1.5">
                  Translated
                </p>
                <p className="text-base leading-relaxed text-[var(--fg)]">
                  {completedText}
                </p>
              </div>
            )}

            {/* Currently animating word */}
            {isAnimating && animationQueue.length > 0 && (
              <div>
                <p className="text-xs font-medium text-brand-500 uppercase tracking-wider mb-1.5">
                  Now Signing
                </p>
                <p className="text-lg font-semibold text-brand-500">
                  {animationQueue[0]?.split("").map((char, i) => (
                    <span
                      key={i}
                      className={cn(
                        "transition-colors duration-200",
                        i < currentLetterIndex
                          ? "text-brand-300"
                          : i === currentLetterIndex
                            ? "text-brand-500 underline decoration-2 underline-offset-4"
                            : "text-[var(--fg-tertiary)]"
                      )}
                    >
                      {char}
                    </span>
                  ))}
                </p>
              </div>
            )}

            {/* Words waiting in queue */}
            {animationQueue.length > 1 && (
              <div>
                <p className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider mb-1.5">
                  Up Next
                </p>
                <p className="text-sm text-[var(--fg-secondary)]">
                  {animationQueue.slice(1).join(" ")}
                </p>
              </div>
            )}

            {/* Raw transcription */}
            {fullTranscript && (
              <div className="mt-auto pt-4 border-t border-[var(--border)]">
                <p className="text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider mb-1.5">
                  Speech Input
                </p>
                <p className="text-sm leading-relaxed text-[var(--fg-secondary)] font-mono">
                  <span>{transcript}</span>
                  <span className="text-[var(--fg-tertiary)] italic">
                    {interimTranscript}
                  </span>
                </p>
              </div>
            )}

            {/* Empty state */}
            {!fullTranscript && !completedText && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-3">
                  <Mic className="w-5 h-5 text-[var(--fg-tertiary)]" />
                </div>
                <p className="text-sm text-[var(--fg-tertiary)]">
                  Tap the microphone and start speaking.
                  <br />
                  Your words will appear here.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Right: ASL Video Display */}
        <Card className="flex flex-col min-h-[300px] md:min-h-0 bg-black overflow-hidden relative border-[var(--border)] shadow-sm">
          {/* Top badges */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-black/50 text-white border-white/20"
            >
              <Hand className="w-3 h-3 mr-1" />
              ASL Sign
            </Badge>
          </div>

          {isAnimating && (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-brand-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm animate-pulse">
              <Volume2 className="w-3.5 h-3.5" /> Translating
            </div>
          )}

          {/* Video display */}
          <div className="flex-1 flex items-center justify-center relative">
            {/* The video element is ALWAYS mounted to prevent layout shift, flickering, and reload lag */}
            <video
              ref={videoRef}
              src={currentLetter && currentLetter !== " " ? `/alphabet/${currentLetter}.mp4` : undefined}
              className={cn(
                "w-full h-full object-contain aspect-[4/3] transition-opacity duration-150",
                currentLetter && currentLetter !== " " && isVideoLoaded ? "opacity-100" : "opacity-0 absolute pointer-events-none"
              )}
              onLoadedMetadata={() => setIsVideoLoaded(true)}
              loop={!isAnimating}
              muted
              playsInline
              autoPlay
            />

            {/* Letter overlay */}
            {currentLetter && currentLetter !== " " && isVideoLoaded && (
              <div className="absolute top-16 left-4 w-14 h-14 bg-[var(--bg-elevated)] rounded-xl flex items-center justify-center font-bold text-3xl text-[var(--fg)] shadow-md border border-[var(--border)]">
                {currentLetter}
              </div>
            )}

            {/* Space / Pause / Idle display */}
            {(!currentLetter || currentLetter === " " || !isVideoLoaded) && (
              currentLetter === " " ? (
                <div className="text-center">
                  <div className="text-6xl text-white/20 font-bold mb-2">
                    ⎵
                  </div>
                  <p className="text-sm text-white/40 uppercase tracking-widest">
                    Space
                  </p>
                </div>
              ) : (
                <div className="text-center px-6">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Hand className="w-8 h-8 text-white/30" />
                  </div>
                  <p className="text-white/40 text-sm">
                    {currentLetter ? "Loading Sign..." : "ASL signs will appear here as you speak"}
                  </p>
                </div>
              )
            )}
          </div>

          {/* Bottom controls */}
          <div className="p-4 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between">
            <p className="text-white/70 text-sm font-medium truncate max-w-[60%]">
              {isAnimating && animationQueue.length > 0
                ? `Signing: "${animationQueue[0]}"`
                : currentLetter
                  ? `Letter: ${currentLetter === " " ? "SPACE" : currentLetter}`
                  : "Waiting for input..."}
            </p>

            <div className="flex items-center gap-2">
              {isAnimating ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  onClick={handlePauseAnimation}
                >
                  <Pause className="w-4 h-4 mr-1" /> Pause
                </Button>
              ) : animationQueue.length > 0 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  onClick={handleResumeAnimation}
                >
                  <Play className="w-4 h-4 mr-1" /> Resume
                </Button>
              ) : null}

              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={handleClearAll}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
