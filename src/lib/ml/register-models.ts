/**
 * Registers all available ML model providers in the model registry.
 * This module must be imported early in the app lifecycle
 * so that providers are available when the translator page loads.
 */

import { getModelRegistry } from "./model-registry";
import { MediaPipeProvider } from "./mediapipe-provider";
import { TFJSSequenceProvider } from "./tfjs-sequence-provider";
import { AlphabetNNProvider } from "./alphabet-nn-provider";

let registered = false;

export function registerModels(): void {
  if (registered) return;

  const registry = getModelRegistry();

  registry.register({
    name: "mediapipe",
    description: "Google MediaPipe HandLandmarker — rule-based ASL alphabet detection (A-Z).",
    factory: () => new MediaPipeProvider(),
  });

  registry.register({
    name: "tfjs-asl",
    description: "Custom LSTM Neural Network — trained on WLASL for ASL word recognition.",
    factory: () => new TFJSSequenceProvider(),
  });

  registry.register({
    name: "alphabet-nn",
    description: "Trained Dense Neural Network — ASL alphabet (A-Z) single-frame classifier.",
    factory: () => new AlphabetNNProvider(),
  });

  registered = true;
}

// Auto-register when this module is imported
registerModels();

