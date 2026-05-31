/**
 * Translator Store — manages live translation session state.
 */

import { create } from "zustand";
import type { SignDetectionResult, CameraState, DetectableSign } from "@/lib/ml/types";

interface TranslatorState {
  // Camera
  cameraState: CameraState;
  setCameraState: (state: CameraState) => void;

  // Detection
  isDetecting: boolean;
  setIsDetecting: (detecting: boolean) => void;
  currentSign: DetectableSign;
  setCurrentSign: (sign: DetectableSign) => void;
  confidence: number;
  setConfidence: (confidence: number) => void;
  detections: SignDetectionResult[];
  addDetection: (detection: SignDetectionResult) => void;
  clearDetections: () => void;

  // Model
  selectedModel: string;
  setSelectedModel: (model: string) => void;

  // FPS
  fps: number;
  setFps: (fps: number) => void;

  // Session
  sessionStartTime: number | null;
  startSession: () => void;
  endSession: () => void;
}

export const useTranslatorStore = create<TranslatorState>((set) => ({
  cameraState: "idle",
  setCameraState: (cameraState) => set({ cameraState }),

  isDetecting: true,
  setIsDetecting: (isDetecting) => set({ isDetecting }),
  currentSign: "Unknown",
  setCurrentSign: (currentSign) => set({ currentSign }),
  confidence: 0,
  setConfidence: (confidence) => set({ confidence }),
  detections: [],
  addDetection: (detection) =>
    set((state) => ({
      detections: [...state.detections, detection].slice(-100),
    })),
  clearDetections: () => set({ detections: [], currentSign: "Unknown", confidence: 0 }),

  selectedModel: "alphabet-nn",
  setSelectedModel: (selectedModel) => set({ selectedModel }),

  fps: 0,
  setFps: (fps) => set({ fps }),

  sessionStartTime: null,
  startSession: () => set({ sessionStartTime: Date.now(), detections: [] }),
  endSession: () => set({ sessionStartTime: null }),
}));
