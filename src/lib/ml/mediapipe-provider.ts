/**
 * MediaPipe Hands detection provider.
 * Implements the SignDetectionProvider interface for model swappability.
 *
 * Uses @mediapipe/tasks-vision HandLandmarker for real-time
 * hand landmark detection from webcam video frames.
 */

import type {
  SignDetectionProvider,
  SignDetectionResult,
  HandDetectionResult,
  HandLandmark,
} from "./types";
import { classifyGesture } from "./gesture-classifier";

export class MediaPipeProvider implements SignDetectionProvider {
  readonly name = "mediapipe";
  private handLandmarker: any = null;
  private _isInitialized = false;

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  async initialize(): Promise<void> {
    if (this._isInitialized) return;

    try {
      const vision = await import("@mediapipe/tasks-vision");
      const { FilesetResolver, HandLandmarker } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        }
      );

      this._isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize MediaPipe:", error);
      throw new Error("MediaPipe initialization failed. Check console for details.");
    }
  }

  async detect(
    video: HTMLVideoElement,
    timestamp: number
  ): Promise<SignDetectionResult | null> {
    if (!this.handLandmarker || !this._isInitialized) return null;

    try {
      // Guard: video must have valid dimensions and be ready
      if (
        video.readyState < 2 ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        return null;
      }

      const results = this.handLandmarker.detectForVideo(video, timestamp);

      if (!results.landmarks || results.landmarks.length === 0) {
        return null;
      }

      const hands: HandDetectionResult[] = results.landmarks.map(
        (landmarks: any[], index: number) => {
          const handLandmarks: HandLandmark[] = landmarks.map((lm: any) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility,
          }));

          const worldLandmarks: HandLandmark[] = (
            results.worldLandmarks?.[index] || []
          ).map((lm: any) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility,
          }));

          const handedness =
            results.handednesses?.[index]?.[0]?.categoryName === "Left"
              ? ("Left" as const)
              : ("Right" as const);

          const score = results.handednesses?.[index]?.[0]?.score ?? 0;

          return {
            landmarks: handLandmarks,
            worldLandmarks,
            handedness,
            score,
          };
        }
      );

      // Classify the gesture using landmarks
      const primaryHand = hands[0];
      const classification = classifyGesture(primaryHand.landmarks);

      return {
        sign: classification.sign,
        confidence: classification.confidence,
        hands,
        timestamp,
      };
    } catch (error) {
      // detectForVideo can throw if called too rapidly or with invalid frames
      return null;
    }
  }

  dispose(): void {
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
    this._isInitialized = false;
  }
}
