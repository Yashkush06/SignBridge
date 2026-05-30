"use client";

/**
 * useSignDetection — orchestrates the ML detection loop.
 * Manages model initialization, frame-by-frame detection,
 * prediction smoothing, and FPS tracking.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import type {
  SignDetectionProvider,
  SignDetectionResult,
  CameraState,
  DetectableSign,
} from "@/lib/ml/types";
import { PredictionSmoother } from "@/lib/ml/gesture-classifier";

interface UseSignDetectionOptions {
  provider: SignDetectionProvider | null;
  videoElement: HTMLVideoElement | null;
  cameraState: CameraState;
  confidenceThreshold?: number;
  enabled?: boolean;
  onFrame?: (result: SignDetectionResult | null) => void;
}

interface UseSignDetectionReturn {
  currentSign: DetectableSign;
  confidence: number;
  detections: SignDetectionResult[];
  fps: number;
  isModelReady: boolean;
  modelError: string | null;
  clearDetections: () => void;
}

export function useSignDetection(
  options: UseSignDetectionOptions
): UseSignDetectionReturn {
  const {
    provider,
    videoElement,
    cameraState,
    confidenceThreshold = 0.6,
    enabled = true,
    onFrame,
  } = options;

  const [currentSign, setCurrentSign] = useState<DetectableSign>("Unknown");
  const [confidence, setConfidence] = useState(0);
  const [detections, setDetections] = useState<SignDetectionResult[]>([]);
  const [fps, setFps] = useState(0);
  const [isModelReady, setIsModelReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const animationFrameRef = useRef<number>(0);
  const smootherRef = useRef(new PredictionSmoother(8));
  const fpsCounterRef = useRef({ frames: 0, lastTime: performance.now() });
  const lastDetectionTimeRef = useRef(0);

  // Initialize model
  useEffect(() => {
    if (!provider) return;

    let cancelled = false;

    async function init() {
      try {
        setModelError(null);
        await provider!.initialize();
        if (!cancelled) {
          setIsModelReady(true);
        }
      } catch (err: any) {
        if (!cancelled) {
          setModelError(err.message || "Failed to initialize model");
          setIsModelReady(false);
        }
      }
    }

    if (!provider.isInitialized) {
      init();
    } else {
      setIsModelReady(true);
    }

    return () => {
      cancelled = true;
    };
  }, [provider]);

  // Detection loop
  useEffect(() => {
    if (
      !provider ||
      !videoElement ||
      !isModelReady ||
      !enabled ||
      cameraState !== "active"
    ) {
      return;
    }

    let running = true;

    const detectFrame = async () => {
      if (!running || !provider || !videoElement) return;

      const now = performance.now();

      // Throttle to ~20fps for detection (every 50ms)
      if (now - lastDetectionTimeRef.current > 50) {
        lastDetectionTimeRef.current = now;

        const result = await provider.detect(videoElement, now);

        if (onFrame) {
          onFrame(result);
        }

        if (result && result.confidence >= confidenceThreshold) {
          const smoothed = smootherRef.current.add({
            sign: result.sign as DetectableSign,
            confidence: result.confidence,
          });

          setCurrentSign(smoothed.sign);
          setConfidence(smoothed.confidence);

          // Only add to history if sign changed
          setDetections((prev) => {
            const last = prev[prev.length - 1];
            if (!last || last.sign !== result.sign) {
              const next = [...prev, result];
              // Keep last 100 detections
              return next.slice(-100);
            }
            return prev;
          });
        }
      }

      // FPS counter
      fpsCounterRef.current.frames++;
      if (now - fpsCounterRef.current.lastTime >= 1000) {
        setFps(fpsCounterRef.current.frames);
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastTime = now;
      }

      if (running) {
        animationFrameRef.current = requestAnimationFrame(detectFrame);
      }
    };

    animationFrameRef.current = requestAnimationFrame(detectFrame);

    return () => {
      running = false;
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [provider, videoElement, isModelReady, enabled, cameraState, confidenceThreshold]);

  const clearDetections = useCallback(() => {
    setDetections([]);
    setCurrentSign("Unknown");
    setConfidence(0);
    smootherRef.current.clear();
  }, []);

  return {
    currentSign,
    confidence,
    detections,
    fps,
    isModelReady,
    modelError,
    clearDetections,
  };
}
