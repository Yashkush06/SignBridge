"""
Step 3: Export trained Keras model to TensorFlow.js format.

Usage:
  python export_tfjs.py
"""

import json
import shutil
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()
MODEL_DIR = SCRIPT_DIR / "model_output"
TFJS_OUTPUT = SCRIPT_DIR / "tfjs_model"
PUBLIC_DIR = SCRIPT_DIR.parent.parent / "public" / "models" / "asl-alphabet"

def main():
    import numpy as np
    # Patch numpy for tensorflowjs compatibility with numpy >= 1.24
    if not hasattr(np, 'object'):
        np.object = object
    if not hasattr(np, 'bool'):
        np.bool = bool
        
    import tensorflow as tf
    import sys
    
    # Mock tensorflow_hub so tensorflowjs doesn't crash
    class MockHub:
        pass
    sys.modules['tensorflow_hub'] = MockHub()
    
    if not hasattr(tf.compat.v1, 'estimator'):
        class DummyEstimator:
            class Exporter:
                pass
        tf.compat.v1.estimator = DummyEstimator()
        
    import tensorflowjs as tfjs
    import tf_keras as keras

    model_path = MODEL_DIR / "asl_alphabet_model.keras"
    if not model_path.exists():
        print(f"[ERROR] Model not found at {model_path}. Run train_model.py first.")
        return

    # Load model
    model = keras.models.load_model(str(model_path))
    print(f"[SUCCESS] Loaded model from {model_path}")

    # Export to TFJS
    TFJS_OUTPUT.mkdir(parents=True, exist_ok=True)
    tfjs.converters.save_keras_model(model, str(TFJS_OUTPUT))
    print(f"[SUCCESS] Exported to TFJS at {TFJS_OUTPUT}")

    # Copy label_map and metadata
    for fname in ["label_map.json", "metadata.json"]:
        src = MODEL_DIR / fname
        if src.exists():
            shutil.copy2(src, TFJS_OUTPUT / fname)
    
    # Also copy the data/label_map.json if MODEL_DIR one doesn't exist
    data_label = Path("./data/label_map.json")
    if data_label.exists() and not (TFJS_OUTPUT / "label_map.json").exists():
        shutil.copy2(data_label, TFJS_OUTPUT / "label_map.json")

    # Copy to public directory for the app
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    for f in TFJS_OUTPUT.iterdir():
        shutil.copy2(f, PUBLIC_DIR / f.name)
    
    print(f"[SUCCESS] Copied to {PUBLIC_DIR}")
    print(f"\n[READY] Model ready! The app can now load it from /models/asl-alphabet/model.json")


if __name__ == "__main__":
    main()
