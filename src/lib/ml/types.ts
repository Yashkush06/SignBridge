/**
 * Core types for the sign language detection ML pipeline.
 * All model providers implement the SignDetectionProvider interface,
 * enabling runtime model swapping without losing application context.
 */

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface HandDetectionResult {
  landmarks: HandLandmark[];
  worldLandmarks: HandLandmark[];
  handedness: "Left" | "Right";
  score: number;
}

export interface SignDetectionResult {
  sign: string;
  confidence: number;
  hands: HandDetectionResult[];
  timestamp: number;
}

export interface SignDetectionProvider {
  readonly name: string;
  readonly isInitialized: boolean;

  /** Initialize the model. May download assets on first call. */
  initialize(): Promise<void>;

  /** Run detection on a single video frame. */
  detect(
    video: HTMLVideoElement,
    timestamp: number
  ): Promise<SignDetectionResult | null>;

  /** Release resources. */
  dispose(): void;
}

export interface ModelRegistryEntry {
  name: string;
  description: string;
  factory: () => SignDetectionProvider;
}

/** Supported ASL signs for the gesture classifier */
export const ASL_ALPHABET = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
  "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
  "U", "V", "W", "X", "Y", "Z",
] as const;

export type ASLSign = (typeof ASL_ALPHABET)[number];

export const COMMON_SIGNS = [
  "Hello", "Thank You", "Please", "Sorry", "Yes", "No",
  "Help", "Stop", "Love", "Friend",
] as const;

export type CommonSign = (typeof COMMON_SIGNS)[number];

export type DetectableSign = ASLSign | CommonSign | "Unknown";

/** Camera state for the translator */
export type CameraState = "idle" | "starting" | "active" | "paused" | "error";

/** Translation session */
export interface TranslationSession {
  id: string;
  startTime: number;
  endTime?: number;
  detections: SignDetectionResult[];
  transcript: string;
  averageConfidence: number;
  type: "sign-to-text" | "text-to-sign" | "voice-to-sign";
}

/** History entry stored in persistence */
export interface HistoryEntry {
  id: string;
  date: string;
  duration: number;
  type: TranslationSession["type"];
  phraseCount: number;
  averageConfidence: number;
  transcript: string;
  saved: boolean;
}

/** Analytics data point */
export interface AnalyticsDataPoint {
  date: string;
  translations: number;
  confidence: number;
}

/** User profile */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: string;
  cameraDeviceId?: string;
  detectionModel: string;
  confidenceThreshold: number;
  autoSpeak: boolean;
  showLandmarks: boolean;
}

export interface AnalyticsData {
  totalTranslations: number;
  averageConfidence: number;
  vocabularySize: number;
  minutesActive: number;
  recentActivity: { date: string; count: number }[];
  confidenceHistory: { date: string; confidence: number }[];
  usageByType: { name: string; value: number; color: string }[];
}
