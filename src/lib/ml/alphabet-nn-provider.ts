/**
 * Alphabet Neural Network Provider — uses a trained Dense model to
 * classify ASL alphabet letters (A-Z) from a single frame of
 * MediaPipe hand landmarks.
 *
 * Unlike the LSTM sequence provider, this uses a single-frame classifier:
 *   1. MediaPipe detects hand → 21 landmarks (63 features)
 *   2. Landmarks are normalized (wrist-relative, scaled to [-1,1])
 *   3. Dense model predicts one of 26 alphabet classes
 *
 * Falls back to the rule-based classifier if the model file is not found.
 */

import type {
  SignDetectionProvider,
  SignDetectionResult,
  HandDetectionResult,
  HandLandmark,
} from "./types";
import { classifyGesture, PredictionSmoother } from "./gesture-classifier";

export class AlphabetNNProvider implements SignDetectionProvider {
  readonly name = "alphabet-nn";
  private handLandmarker: any = null;
  private tfjsModel: any = null;
  private labelMap: Record<string, string> = {};
  private _isInitialized = false;
  private modelAvailable = false;
  private smoother = new PredictionSmoother(5); // Smooth over 5 frames

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  async initialize(): Promise<void> {
    if (this._isInitialized) return;

    try {
      // Initialize MediaPipe for hand detection
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

      // Try to load the trained alphabet model
      try {
        const tf = await import("@tensorflow/tfjs");
        this.tfjsModel = await tf.loadLayersModel(
          "/models/asl-alphabet/model.json"
        );
        console.log("[AlphabetNN] ✅ Loaded trained alphabet model");

        const labelResp = await fetch("/models/asl-alphabet/label_map.json");
        if (labelResp.ok) {
          this.labelMap = await labelResp.json();
          console.log(
            `[AlphabetNN] ✅ Label map: ${Object.values(this.labelMap).join(", ")}`
          );
        }
        this.modelAvailable = true;
      } catch (err) {
        console.warn(
          "[AlphabetNN] ⚠️ Trained model not found at /models/asl-alphabet/model.json.",
          "Falling back to rule-based classifier.",
          err
        );
        this.modelAvailable = false;
      }

      this._isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize AlphabetNNProvider:", error);
      throw new Error("AlphabetNNProvider initialization failed.");
    }
  }

  /**
   * Normalize landmarks: wrist-relative, scaled to [-1, 1].
   */
  private normalizeLandmarks(landmarks: HandLandmark[]): number[] {
    const wrist = landmarks[0];
    const coords: number[] = [];

    for (const lm of landmarks) {
      coords.push(lm.x - wrist.x);
      coords.push(lm.y - wrist.y);
      coords.push(lm.z - wrist.z);
    }

    const maxVal = Math.max(...coords.map(Math.abs));
    if (maxVal > 0) {
      return coords.map((v) => v / maxVal);
    }
    return coords;
  }

  async detect(
    video: HTMLVideoElement,
    timestamp: number
  ): Promise<SignDetectionResult | null> {
    if (!this.handLandmarker || !this._isInitialized) return null;

    try {
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

      // Extract landmarks
      const handLandmarks: HandLandmark[] = results.landmarks[0].map(
        (lm: any) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility,
        })
      );

      // Build hands array for visualization
      const hands: HandDetectionResult[] = results.landmarks.map(
        (landmarks: any[], index: number) => {
          const lms: HandLandmark[] = landmarks.map((lm: any) => ({
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

          return { landmarks: lms, worldLandmarks, handedness, score };
        }
      );

      // ── Classify using the trained NN or fall back to rules ──
      if (this.modelAvailable && this.tfjsModel) {
        try {
          const tf = await import("@tensorflow/tfjs");
          const normalized = this.normalizeLandmarks(handLandmarks);
          const inputTensor = tf.tensor2d([normalized], [1, 63]);

          const prediction = this.tfjsModel.predict(inputTensor) as any;
          const probabilities = await prediction.data();

          inputTensor.dispose();
          prediction.dispose();

          let maxProb = 0;
          let maxIdx = 0;
          for (let i = 0; i < probabilities.length; i++) {
            if (probabilities[i] > maxProb) {
              maxProb = probabilities[i];
              maxIdx = i;
            }
          }

          const predictedLetter =
            this.labelMap[String(maxIdx)] || `Class_${maxIdx}`;

          // If confidence is too low, treat as unknown to prevent random firing
          if (maxProb < 0.4) {
            this.smoother.clear();
            return {
              sign: "Unknown",
              confidence: 0,
              hands,
              timestamp,
            };
          }

          const smoothed = this.smoother.add({
            sign: predictedLetter as any,
            confidence: maxProb,
          });

          return {
            sign: smoothed.sign,
            confidence: smoothed.confidence,
            hands,
            timestamp,
          };
        } catch (inferErr) {
          console.error("[AlphabetNN] Inference error:", inferErr);
          // Fall through to rule-based
        }
      }

      // Fallback: rule-based classifier
      const classification = classifyGesture(handLandmarks);
      return {
        sign: classification.sign,
        confidence: classification.confidence,
        hands,
        timestamp,
      };
    } catch (error) {
      return null;
    }
  }

  dispose(): void {
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
    if (this.tfjsModel) {
      this.tfjsModel.dispose();
      this.tfjsModel = null;
    }
    this.smoother.clear();
    this._isInitialized = false;
  }
}
