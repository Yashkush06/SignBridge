"""
train_model.py — Train an LSTM/GRU sequence model for ASL word recognition.

Usage:
  python train_model.py --dataset ./data/dataset.npz --output_dir ./model

This script:
  1. Loads the dataset.npz (X: landmark sequences, y: labels).
  2. Splits into train/validation sets.
  3. Builds an LSTM model: Input(30, 63) -> LSTM(128) -> Dense(64) -> Softmax(N).
  4. Trains for configurable epochs with early stopping.
  5. Saves the trained Keras model to the output directory.
"""

import os
import json
import argparse
from pathlib import Path

import numpy as np
import tensorflow as tf
import tf_keras as keras
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight


def build_model(seq_len: int, num_features: int, num_classes: int) -> keras.Model:
    """Build an LSTM sequence classification model."""
    model = keras.Sequential([
        keras.layers.Input(shape=(seq_len, num_features)),

        # Masking layer to ignore zero-padded frames
        keras.layers.Masking(mask_value=0.0),

        # Bidirectional LSTM for temporal pattern recognition
        keras.layers.Bidirectional(
            keras.layers.LSTM(128, return_sequences=True, dropout=0.3)
        ),
        keras.layers.Bidirectional(
            keras.layers.LSTM(64, dropout=0.3)
        ),

        # Classification head
        keras.layers.Dense(128, activation="relu"),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.4),

        keras.layers.Dense(64, activation="relu"),
        keras.layers.Dropout(0.3),

        keras.layers.Dense(num_classes, activation="softmax"),
    ])

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    return model


def main():
    parser = argparse.ArgumentParser(
        description="Train LSTM model for ASL word recognition."
    )
    parser.add_argument(
        "--dataset",
        type=str,
        default="./data/dataset.npz",
        help="Path to dataset.npz",
    )
    parser.add_argument(
        "--label_map",
        type=str,
        default="./data/label_map.json",
        help="Path to label_map.json",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="./model",
        help="Output directory for the trained model",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=100,
        help="Max training epochs (default: 100)",
    )
    parser.add_argument(
        "--batch_size",
        type=int,
        default=32,
        help="Training batch size (default: 32)",
    )
    parser.add_argument(
        "--val_split",
        type=float,
        default=0.2,
        help="Validation split ratio (default: 0.2)",
    )
    args = parser.parse_args()

    # Load dataset
    print("[INFO] Loading dataset...")
    data = np.load(args.dataset)
    X = data["X"]
    y = data["y"]

    print(f"[INFO] Dataset: X={X.shape}, y={y.shape}")
    print(f"[INFO] Classes: {len(np.unique(y))}")
    print(f"[INFO] Samples per class (min/max): {np.min(np.bincount(y))}/{np.max(np.bincount(y))}")

    # Load label map
    with open(args.label_map, "r") as f:
        label_map = json.load(f)
    num_classes = len(label_map)
    print(f"[INFO] Label map has {num_classes} classes")

    # Train/validation split (stratified)
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=args.val_split, random_state=42, stratify=y
    )
    print(f"[INFO] Train: {X_train.shape[0]} samples, Val: {X_val.shape[0]} samples")

    # Compute class weights to handle imbalanced data
    class_weights = compute_class_weight(
        "balanced", classes=np.unique(y_train), y=y_train
    )
    class_weight_dict = {i: w for i, w in enumerate(class_weights)}

    # Build model
    seq_len = X.shape[1]
    num_features = X.shape[2]
    model = build_model(seq_len, num_features, num_classes)
    model.summary()

    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor="val_accuracy",
            patience=15,
            restore_best_weights=True,
            verbose=1,
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=5,
            min_lr=1e-6,
            verbose=1,
        ),
    ]

    # Train
    print("\n[INFO] Starting training...")
    history = model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=args.epochs,
        batch_size=args.batch_size,
        class_weight=class_weight_dict,
        callbacks=callbacks,
        verbose=1,
    )

    # Evaluate
    val_loss, val_acc = model.evaluate(X_val, y_val, verbose=0)
    print(f"\n[RESULT] Validation Loss: {val_loss:.4f}")
    print(f"[RESULT] Validation Accuracy: {val_acc:.4f}")

    # Save model
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    keras_path = output_dir / "asl_model.keras"
    model.save(keras_path)
    print(f"[INFO] Saved Keras model to {keras_path}")

    # Save training metadata
    metadata = {
        "seq_len": seq_len,
        "num_features": num_features,
        "num_classes": num_classes,
        "val_accuracy": float(val_acc),
        "val_loss": float(val_loss),
        "epochs_trained": len(history.history["loss"]),
        "label_map": label_map,
    }
    meta_path = output_dir / "metadata.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"[INFO] Saved metadata to {meta_path}")


if __name__ == "__main__":
    main()
