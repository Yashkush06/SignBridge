"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Info, Volume2, RotateCcw, Check, Sparkles, AlertCircle } from "lucide-react";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { useAuthStore } from "@/store/auth-store";
import { historyService } from "@/lib/services/history-service";
import type { HistoryEntry } from "@/lib/ml/types";
import { cn } from "@/lib/cn";
import { motion, AnimatePresence } from "framer-motion";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function TextToSignPage() {
  const { user } = useAuthStore();
  const [text, setText] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentLetter, setCurrentLetter] = useState<string | null>("A"); // Default to A
  const [words, setWords] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const { speak, stop: stopSpeech, isSpeaking } = useSpeechSynthesis();
  
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Restart video whenever currentLetter changes
  useEffect(() => {
    if (videoRef.current && currentLetter && currentLetter !== " ") {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch((err) => {
        console.log("Auto-play prevented or video missing", err);
      });
    }
  }, [currentLetter]);

  const handleConvert = () => {
    if (!text.trim()) return;
    
    // Stop any ongoing animation/speech
    if (animationRef.current) clearTimeout(animationRef.current);
    stopSpeech();
    
    const wordsArray = text.trim().split(/\s+/);
    setWords(wordsArray);
    setIsAnimating(true);
    
    // Speak the full text
    speak(text);
    
    // Simulate animation loop
    let wordIdx = 0;
    let letterIdx = 0;
    
    const animateNext = () => {
      if (wordIdx >= wordsArray.length) {
        setIsAnimating(false);
        
        if (user?.id) {
          const session: Omit<HistoryEntry, "id"> = {
            date: new Date().toISOString(),
            duration: 1,
            type: "text-to-sign",
            phraseCount: text.trim().split(/\s+/).length,
            averageConfidence: 0,
            transcript: text.trim(),
            saved: true,
          };
          historyService.add(user.id, session).catch(console.error);
        }
        return;
      }
      
      const word = wordsArray[wordIdx];
      
      if (letterIdx < word.length) {
        const char = word[letterIdx].toUpperCase();
        if (ALPHABET.includes(char)) {
          setCurrentLetter(char);
        }
        
        letterIdx++;
        // 1.5 seconds per letter to allow video to play reasonably
        animationRef.current = setTimeout(animateNext, 1500); 
      } else {
        // Space between words
        setCurrentLetter(" ");
        wordIdx++;
        letterIdx = 0;
        animationRef.current = setTimeout(animateNext, 1000); // 1s pause between words
      }
    };
    
    animateNext();
  };

  const handleStop = () => {
    if (animationRef.current) clearTimeout(animationRef.current);
    stopSpeech();
    setIsAnimating(false);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
      stopSpeech();
    };
  }, [stopSpeech]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4 max-w-[1400px] mx-auto h-[calc(100vh-100px)] overflow-hidden"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Text to Sign</h1>
          {isAnimating ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-500 text-xs font-medium animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              Animating
            </div>
          ) : (
            <Badge variant="outline" className="text-[var(--fg-tertiary)] py-0.5">
              Interactive Mode
            </Badge>
          )}
        </div>
      </div>

      {/* Main split viewport workspace */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
        
        {/* Left Side: Video Player & Compact Sentence Builder */}
        <div className="flex-1 flex flex-col gap-4 min-h-0 min-w-0">
          
          {/* Video display frame */}
          <div className="flex-1 bg-[var(--bg-secondary)] rounded-2xl overflow-hidden shadow-lg border border-[var(--border)] flex items-center justify-center relative min-h-[250px] bg-neutral-950/20">
            {currentLetter && currentLetter !== " " ? (
              <video
                ref={videoRef}
                src={`/alphabet/${currentLetter}.mp4`}
                className="w-full h-full object-contain"
                loop={!isAnimating}
                muted
                playsInline
                autoPlay
              />
            ) : (
              <div className="text-xl text-[var(--fg-tertiary)] font-bold tracking-wider opacity-40 uppercase animate-pulse">
                [ Space Pause ]
              </div>
            )}

            {/* Floating indicator tag (Top left) */}
            <div className="absolute top-4 left-4 min-w-[40px] h-10 bg-[var(--bg-elevated)]/85 backdrop-blur-md rounded-xl flex items-center justify-center font-black text-lg shadow-md text-[var(--fg)] border border-[var(--border)]/80 select-none">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentLetter}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {currentLetter === " " ? "_" : currentLetter}
                </motion.span>
              </AnimatePresence>
            </div>
            
            {/* Playing overlay (Top right) */}
            {isAnimating && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-brand-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md animate-pulse">
                <Volume2 className="w-3.5 h-3.5" /> Spelling Out
              </div>
            )}
          </div>

          {/* Compact chat-style sentence builder */}
          <Card className="shrink-0 p-4 border-[var(--border)] shadow-sm bg-[var(--bg)] flex flex-col gap-3">
            <div className="flex items-center gap-1.5 shrink-0">
              <Info className="w-4 h-4 text-brand-500" />
              <h2 className="font-semibold text-xs text-[var(--fg)]">Try out full sentences</h2>
            </div>
            
            <div className="flex items-end gap-3 min-h-[80px]">
              <textarea
                className="flex-1 h-20 bg-[var(--bg-secondary)] rounded-xl p-3 text-sm border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none custom-scrollbar text-[var(--fg)] placeholder:text-[var(--fg-tertiary)]"
                placeholder="Type a word or phrase to see it spelled out in sign language..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isAnimating}
              />
              
              <div className="flex flex-col gap-2 shrink-0">
                <Button 
                  onClick={() => {
                    setText("");
                    handleStop();
                  }}
                  variant="ghost"
                  disabled={!text && !isAnimating}
                  size="sm"
                  className="h-9 px-3 text-xs"
                >
                  Clear
                </Button>
                
                <Button 
                  size="sm" 
                  variant={isAnimating ? "danger" : "primary"}
                  className="rounded-xl h-9 px-4 text-xs shadow-sm shadow-brand-500/10"
                  onClick={isAnimating ? handleStop : handleConvert}
                  disabled={!text.trim() && !isAnimating}
                >
                  {isAnimating ? (
                    <><Pause className="w-3.5 h-3.5 mr-1" /> Stop</>
                  ) : (
                    <><Play className="w-3.5 h-3.5 mr-1" /> Play</>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side: Clean Keyboard grid */}
        <Card className="w-full md:w-80 shrink-0 flex flex-col p-4 border-[var(--border)] shadow-sm overflow-hidden min-h-[200px]">
          <div className="mb-3 shrink-0">
            <p className="text-[10px] font-semibold text-[var(--fg-tertiary)] uppercase tracking-wider">A-Z Keyboard Glossary</p>
            <p className="text-xs text-[var(--fg-secondary)] mt-0.5">Click any letter to play its visual sign instantly.</p>
          </div>

          {/* Keyboard Grid list (Fitted inside the scroll-locked box) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col justify-center">
            {/* Clean compact 4x7 Grid layout */}
            <div className="grid grid-cols-5 gap-2 max-w-[280px] mx-auto">
              {ALPHABET.map((letter) => {
                const isActive = currentLetter === letter;
                return (
                  <Button
                    key={letter}
                    variant={isActive ? "primary" : "outline"}
                    onClick={() => {
                      if (isAnimating) handleStop();
                      setCurrentLetter(letter);
                    }}
                    className={cn(
                      "w-11 h-11 p-0 rounded-xl font-bold text-sm transition-all duration-150 relative overflow-hidden",
                      isActive
                        ? "bg-brand-500 text-white border-brand-500 shadow-md scale-105"
                        : "bg-[var(--bg-secondary)] text-[var(--fg)] border-[var(--border)]/50 hover:border-brand-200"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute inset-0 bg-brand-500 -z-10 rounded-xl"
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      />
                    )}
                    {letter}
                  </Button>
                );
              })}
              
              {/* Space shortcut key */}
              <Button
                variant={currentLetter === " " ? "primary" : "outline"}
                onClick={() => {
                  if (isAnimating) handleStop();
                  setCurrentLetter(" ");
                }}
                className={cn(
                  "col-span-4 h-11 p-0 rounded-xl font-semibold text-xs tracking-wider transition-all duration-150 uppercase",
                  currentLetter === " "
                    ? "bg-brand-500 text-white border-brand-500 shadow-md scale-105"
                    : "bg-[var(--bg-secondary)] text-[var(--fg)] border-[var(--border)]/50 hover:border-brand-200"
                )}
              >
                Space
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
