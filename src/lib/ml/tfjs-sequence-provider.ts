/**
 * TensorFlow.js Sequence Provider — uses a trained LSTM model to
 * recognize ASL words from sequences of MediaPipe hand landmarks.
 *
 * Architecture:
 *   1. MediaPipe HandLandmarker detects hands and extracts 21 3D landmarks.
 *   2. Landmarks are normalized (wrist-relative) and pushed into a frame buffer.
 *   3. Once the buffer reaches SEQ_LEN frames, the entire sequence is fed
 *      into the custom LSTM model for word classification.
 *   4. The predicted word (with confidence) is returned to the UI.
 */

import type {
  SignDetectionProvider,
  SignDetectionResult,
  HandDetectionResult,
  HandLandmark,
} from "./types";

const SEQ_LEN = 30;
const NUM_LANDMARKS = 21;
const NUM_FEATURES = NUM_LANDMARKS * 3; // 63

export class TFJSSequenceProvider implements SignDetectionProvider {
  readonly name = "tfjs-asl";
  private handLandmarker: any = null;
  private tfjsModel: any = null;
  private labelMap: Record<string, string> = {};
  private _isInitialized = false;
  private frameBuffer: number[][] = [];
  private lastPrediction: { sign: string; confidence: number } | null = null;
  private framesSinceLastPrediction = 0;
  private readonly PREDICT_EVERY_N_FRAMES = 5;
  private handPresentCount = 0; // Track how many frames have real hand data
  private modelLoadError = false;

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

      // Load the custom TensorFlow.js LSTM model
      const tf = await import("@tensorflow/tfjs");
      try {
        this.tfjsModel = await tf.loadLayersModel("/models/asl-lstm/model.json");
        console.log("[TFJSSequenceProvider] ✅ Loaded custom LSTM model");
        console.log("[TFJSSequenceProvider] Model input shape:", 
          this.tfjsModel.inputs[0]?.shape);
        console.log("[TFJSSequenceProvider] Model output shape:", 
          this.tfjsModel.outputs[0]?.shape);

        // Load label map
        const labelResp = await fetch("/models/asl-lstm/label_map.json");
        if (labelResp.ok) {
          this.labelMap = await labelResp.json();
          console.log(
            `[TFJSSequenceProvider] ✅ Loaded label map: ${Object.values(this.labelMap).join(", ")}`
          );
        }
      } catch (modelErr) {
        console.warn(
          "[TFJSSequenceProvider] ⚠️ Custom LSTM model not found at /models/asl-lstm/model.json.",
          "Run the training pipeline first. Falling back to MediaPipe-only mode.",
          modelErr
        );
        this.modelLoadError = true;
      }

      this._isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize TFJSSequenceProvider:", error);
      throw new Error(
        "TFJSSequenceProvider initialization failed. Check console for details."
      );
    }
  }

  /**
   * Normalize landmarks: make them wrist-relative and scale to [-1, 1].
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
      // Guard: video must have valid dimensions
      if (
        video.readyState < 2 ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        return null;
      }

      const results = this.handLandmarker.detectForVideo(video, timestamp);

      if (!results.landmarks || results.landmarks.length === 0) {
        // No hands — DON'T push zero frames (the Masking layer treats 0.0 as masked).
        // Instead, simply skip this frame to avoid filling the buffer with masked data.
        // Reset hand present count since we lost tracking
        this.handPresentCount = Math.max(0, this.handPresentCount - 1);
        return null;
      }

      // Extract and normalize landmarks from the primary hand
      const handLandmarks: HandLandmark[] = results.landmarks[0].map(
        (lm: any) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility,
        })
      );

      const normalized = this.normalizeLandmarks(handLandmarks);

      // Push into frame buffer (only real frames, never zeros)
      this.frameBuffer.push(normalized);
      if (this.frameBuffer.length > SEQ_LEN) {
        this.frameBuffer.shift();
      }
      this.handPresentCount = Math.min(SEQ_LEN, this.handPresentCount + 1);

      // Build hands result for visualization
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

      // Run LSTM inference when we have enough frames
      this.framesSinceLastPrediction++;

      if (
        this.tfjsModel &&
        !this.modelLoadError &&
        this.frameBuffer.length >= SEQ_LEN &&
        this.handPresentCount >= 15 && // At least half the buffer has real hand data
        this.framesSinceLastPrediction >= this.PREDICT_EVERY_N_FRAMES
      ) {
        this.framesSinceLastPrediction = 0;

        try {
          const tf = await import("@tensorflow/tfjs");

          // Use the last SEQ_LEN frames from the buffer
          const inputData = this.frameBuffer.slice(-SEQ_LEN);
          const inputTensor = tf.tensor3d(
            [inputData],
            [1, SEQ_LEN, NUM_FEATURES]
          );

          const prediction = this.tfjsModel.predict(inputTensor) as any;
          const probabilities = await prediction.data();

          inputTensor.dispose();
          prediction.dispose();

          // Find the class with highest probability
          let maxProb = 0;
          let maxIdx = 0;
          for (let i = 0; i < probabilities.length; i++) {
            if (probabilities[i] > maxProb) {
              maxProb = probabilities[i];
              maxIdx = i;
            }
          }

          const predictedWord =
            this.labelMap[String(maxIdx)] || `Class_${maxIdx}`;

          // Log predictions for debugging
          console.log(
            `[LSTM] Predicted: "${predictedWord}" (${(maxProb * 100).toFixed(1)}%) | Buffer: ${this.frameBuffer.length}/${SEQ_LEN} | Hand frames: ${this.handPresentCount}`
          );

          this.lastPrediction = {
            sign: predictedWord,
            confidence: maxProb,
          };
        } catch (inferenceError) {
          console.error("[TFJSSequenceProvider] Inference error:", inferenceError);
        }
      }

      // Return the latest prediction (or the hand detection without a word)
      if (this.lastPrediction && this.lastPrediction.confidence > 0.15) {
        return {
          sign: this.lastPrediction.sign,
          confidence: this.lastPrediction.confidence,
          hands,
          timestamp,
        };
      }

      // Return hand data even if no word prediction yet (for landmark drawing)
      return {
        sign: "...",
        confidence: 0,
        hands,
        timestamp,
      };
    } catch (error) {
      console.error("[TFJSSequenceProvider] Detection error:", error);
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
    this.frameBuffer = [];
    this.lastPrediction = null;
    this._isInitialized = false;
  }
}
