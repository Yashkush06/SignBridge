"use client";

/**
 * useSpeechRecognition — speech-to-text using the Web Speech API.
 * Used in the Voice-to-Sign feature.
 *
 * Handles network errors with auto-retry (up to 3 attempts),
 * and auto-restarts on unexpected `onend` events when the user
 * hasn't explicitly stopped listening.
 */

import { useState, useCallback, useRef, useEffect } from "react";

interface UseSpeechRecognitionReturn {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Track whether user explicitly wants to be listening
  const wantsListeningRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_RETRIES = 3;

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript((prev) => prev + final);
      }
      setInterimTranscript(interim);

      // Successful result means connection is good — reset retry counter
      retryCountRef.current = 0;
    };

    recognition.onerror = (event: any) => {
      const errorType = event.error;

      if (errorType === "not-allowed") {
        setError(
          "Microphone access denied. Please allow microphone access in your browser settings."
        );
        wantsListeningRef.current = false;
        setIsListening(false);
      } else if (errorType === "no-speech") {
        // Don't show error for no-speech, just let it restart via onend
        return;
      } else if (errorType === "network") {
        // Network error — auto-retry with backoff
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          const delay = retryCountRef.current * 1000; // 1s, 2s, 3s
          setError(
            `Network issue — retrying in ${retryCountRef.current}s... (attempt ${retryCountRef.current}/${MAX_RETRIES})`
          );

          retryTimerRef.current = setTimeout(() => {
            if (wantsListeningRef.current) {
              try {
                recognition.start();
              } catch {
                // already running
              }
            }
          }, delay);
        } else {
          setError(
            "Network error: Chrome's speech recognition requires an internet connection. Please check your connection and try again."
          );
          wantsListeningRef.current = false;
          setIsListening(false);
        }
      } else if (errorType === "aborted") {
        // User or system aborted — don't show error
        return;
      } else {
        setError(`Speech recognition error: ${errorType}`);
        wantsListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Chrome sometimes stops recognition unexpectedly (e.g., silence timeout).
      // If the user still wants to listen, auto-restart.
      if (wantsListeningRef.current) {
        try {
          recognition.start();
        } catch {
          // Already running or can't restart
          setIsListening(false);
          wantsListeningRef.current = false;
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      wantsListeningRef.current = false;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      recognition.abort();
    };
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    retryCountRef.current = 0;
    wantsListeningRef.current = true;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // Already started
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    wantsListeningRef.current = false;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    recognitionRef.current.stop();
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
