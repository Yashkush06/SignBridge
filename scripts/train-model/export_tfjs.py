"""
export_tfjs.py — Convert trained Keras model to TensorFlow.js format.

Usage:
  python export_tfjs.py --model_dir ./model --output_dir ../public/models/asl-lstm

This script:
  1. Loads the trained Keras model.
  2. Converts it to TensorFlow.js LayersModel format.
  3. Copies the model files (model.json + .bin weights) to the Next.js public directory.
  4. Copies label_map.json and metadata.json alongside the model.
"""

import os
import json
import shutil
import argparse
from pathlib import Path

import sys
import types
sys.modules['tensorflow_hub'] = types.ModuleType('tensorflow_hub')

import tensorflow as tf

# Monkeypatch numpy to fix tensorflowjs compatibility with NumPy 2.x
import numpy as np
if not hasattr(np, "object"):
    np.object = np.object_
if not hasattr(np, "bool"):
    np.bool = np.bool_
if not hasattr(np, "complex"):
    np.complex = np.complex128

import tensorflowjs as tfjs


def main():
    parser = argparse.ArgumentParser(
        description="Export Keras model to TensorFlow.js format."
    )
    parser.add_argument(
        "--model_dir",
        type=str,
        default="./model",
        help="Directory containing the trained Keras model",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="../../public/models/asl-lstm",
        help="Output directory for TensorFlow.js model files",
    )
    args = parser.parse_args()

    model_dir = Path(args.model_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Load Keras model
    keras_path = model_dir / "asl_model.keras"
    import tf_keras as keras

    print(f"[INFO] Loading Keras model from {keras_path}...")
    model = keras.models.load_model(keras_path)
    model.summary()

    # Convert to TensorFlow.js
    print(f"[INFO] Converting to TensorFlow.js format...")
    tfjs.converters.save_keras_model(model, str(output_dir))
    print(f"[INFO] Saved TensorFlow.js model to {output_dir}")

    # Copy metadata and label map
    metadata_src = model_dir / "metadata.json"
    if metadata_src.exists():
        shutil.copy2(metadata_src, output_dir / "metadata.json")
        print(f"[INFO] Copied metadata.json")

    label_map_src = model_dir.parent / "data" / "label_map.json"
    if not label_map_src.exists():
        # Try alternate location
        label_map_src = model_dir / "label_map.json"
    if not label_map_src.exists():
        # Try loading from metadata
        if metadata_src.exists():
            with open(metadata_src) as f:
                meta = json.load(f)
            if "label_map" in meta:
                label_path = output_dir / "label_map.json"
                with open(label_path, "w") as f:
                    json.dump(meta["label_map"], f, indent=2)
                print(f"[INFO] Extracted label_map from metadata")
    else:
        shutil.copy2(label_map_src, output_dir / "label_map.json")
        print(f"[INFO] Copied label_map.json")

    print(f"\n[DONE] TensorFlow.js model ready at: {output_dir}")
    print(f"[DONE] Files:")
    for f in sorted(output_dir.iterdir()):
        size = f.stat().st_size
        unit = "KB" if size > 1024 else "B"
        val = size / 1024 if size > 1024 else size
        print(f"  {f.name} ({val:.1f} {unit})")


if __name__ == "__main__":
    main()
