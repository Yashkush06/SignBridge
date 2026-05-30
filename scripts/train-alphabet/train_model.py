"""
Step 2: Train a Dense neural network for ASL alphabet classification.

Input:  63 features (21 landmarks × 3 coords, wrist-normalized)
Output: 26 classes (A-Z)

Architecture: Dense → BatchNorm → Dropout → Dense → BatchNorm → Dropout → Dense(softmax)

Usage:
  python train_model.py
"""

import os
import json
import numpy as np
from pathlib import Path

# Use tf_keras for compatibility with tensorflowjs converter
import tf_keras as keras
from tf_keras import layers

DATA_DIR = Path("./data")
MODEL_DIR = Path("./model_output")

def main():
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    # Load data
    X = np.load(DATA_DIR / "X_landmarks.npy")
    y = np.load(DATA_DIR / "y_labels.npy")

    with open(DATA_DIR / "label_map.json") as f:
        label_map = json.load(f)

    num_classes = len(label_map)
    print(f"[DATA] {X.shape[0]} samples, {X.shape[1]} features, {num_classes} classes")

    # Shuffle
    indices = np.arange(len(X))
    np.random.seed(42)
    np.random.shuffle(indices)
    X = X[indices]
    y = y[indices]

    # Split 85/15
    split = int(0.85 * len(X))
    X_train, X_val = X[:split], X[split:]
    y_train, y_val = y[:split], y[split:]

    print(f"   Train: {len(X_train)} | Val: {len(X_val)}")

    # Build model — Dense network for single-frame classification
    model = keras.Sequential([
        layers.Input(shape=(63,)),
        layers.Dense(256, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(128, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(64, activation="relu"),
        layers.Dropout(0.2),
        layers.Dense(num_classes, activation="softmax"),
    ])

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    model.summary()

    # Callbacks
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor="val_accuracy",
            patience=10,
            restore_best_weights=True,
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=5,
            min_lr=1e-6,
        ),
    ]

    # Train
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=100,
        batch_size=64,
        callbacks=callbacks,
        verbose=1,
    )

    # Evaluate
    val_loss, val_acc = model.evaluate(X_val, y_val, verbose=0)
    print(f"\n[TARGET] Final Validation Accuracy: {val_acc:.4f}")
    print(f"   Final Validation Loss: {val_loss:.4f}")

    # Save the Keras model
    model_path = MODEL_DIR / "asl_alphabet_model.keras"
    model.save(str(model_path))
    print(f"\n[SAVED] Model saved to: {model_path}")

    # Save metadata
    metadata = {
        "num_features": 63,
        "num_classes": num_classes,
        "val_accuracy": float(val_acc),
        "val_loss": float(val_loss),
        "epochs_trained": len(history.history["loss"]),
        "label_map": label_map,
        "model_type": "dense_single_frame",
    }
    with open(MODEL_DIR / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"[DONE] Training complete!")


if __name__ == "__main__":
    main()
