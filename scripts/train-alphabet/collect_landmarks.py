"""
Step 1: Collect ASL Alphabet landmarks from the Kaggle ASL Alphabet dataset.

This script processes images through MediaPipe HandLandmarker to extract
21 3D hand landmarks per image, then saves them as a NumPy array for training.

Dataset: https://www.kaggle.com/datasets/grassknighted/asl-alphabet
Expected folder structure:
  asl_alphabet_train/
    A/  (3000 images)
    B/  (3000 images)
    ...
    Z/  (3000 images)

Usage:
  python collect_landmarks.py --dataset_dir "path/to/asl_alphabet_train"
"""

import os
import sys
import json
import argparse
import numpy as np
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from pathlib import Path

# ASL alphabet classes (A-Z only, skip 'del', 'nothing', 'space')
CLASSES = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ")

def extract_landmarks_from_image(image_path: str, hands_detector) -> np.ndarray | None:
    """Extract 21 hand landmarks (63 features) from an image using MediaPipe Tasks API."""
    image = mp.Image.create_from_file(str(image_path))
    
    results = hands_detector.detect(image)
    
    if not results.hand_landmarks or len(results.hand_landmarks) == 0:
        return None
    
    # Take the first hand
    hand = results.hand_landmarks[0]
    landmarks = []
    
    # Normalize relative to wrist (index 0)
    wrist = hand[0]
    for lm in hand:
        landmarks.extend([lm.x - wrist.x, lm.y - wrist.y, lm.z - wrist.z])
    
    # Scale to [-1, 1]
    arr = np.array(landmarks, dtype=np.float32)
    max_val = np.max(np.abs(arr))
    if max_val > 0:
        arr = arr / max_val
    
    return arr


def main():
    parser = argparse.ArgumentParser(description="Extract ASL alphabet landmarks")
    parser.add_argument(
        "--dataset_dir",
        type=str,
        required=True,
        help="Path to asl_alphabet_train folder"
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="./data",
        help="Output directory for landmark data"
    )
    parser.add_argument(
        "--max_per_class",
        type=int,
        default=500,  # Lowered to 500 for faster processing
        help="Max images to process per class (default: 500)"
    )
    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if not dataset_dir.exists():
        print(f"[ERROR] Dataset directory not found: {dataset_dir}")
        sys.exit(1)

    # Make sure we have the model downloaded
    model_path = Path("hand_landmarker.task")
    if not model_path.exists():
        print(f"[ERROR] hand_landmarker.task not found! Downloading it for you...")
        os.system("curl -o hand_landmarker.task https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task")

    # Initialize MediaPipe Hands using Tasks API
    base_options = python.BaseOptions(model_asset_path='hand_landmarker.task')
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=1,
        min_hand_detection_confidence=0.5
    )
    hands_detector = vision.HandLandmarker.create_from_options(options)

    all_landmarks = []
    all_labels = []
    label_map = {}

    for class_idx, letter in enumerate(CLASSES):
        label_map[class_idx] = letter
        class_dir = dataset_dir / letter
        
        if not class_dir.exists():
            print(f"[WARNING] Skipping {letter}: directory not found at {class_dir}")
            continue
        
        # Get all image files
        image_files = sorted(list(class_dir.glob("*.jpg")) + list(class_dir.glob("*.png")))
        image_files = image_files[:args.max_per_class]
        
        success_count = 0
        for img_path in image_files:
            try:
                landmarks = extract_landmarks_from_image(str(img_path), hands_detector)
                if landmarks is not None:
                    all_landmarks.append(landmarks)
                    all_labels.append(class_idx)
                    success_count += 1
            except Exception as e:
                pass # skip unreadable images
        
        print(f"[SUCCESS] {letter}: {success_count}/{len(image_files)} images processed")

    # The detector doesn't need to be explicitly closed in Tasks API unless using context manager

    if len(all_landmarks) == 0:
        print("[ERROR] No landmarks extracted! Check your dataset directory.")
        sys.exit(1)

    # Save as NumPy arrays
    X = np.array(all_landmarks, dtype=np.float32)
    y = np.array(all_labels, dtype=np.int32)
    
    np.save(output_dir / "X_landmarks.npy", X)
    np.save(output_dir / "y_labels.npy", y)
    
    with open(output_dir / "label_map.json", "w") as f:
        json.dump({str(k): v for k, v in label_map.items()}, f, indent=2)

    print(f"\n📊 Dataset Summary:")
    print(f"   Total samples: {len(X)}")
    print(f"   Feature shape: {X.shape}")
    print(f"   Classes: {len(label_map)}")
    print(f"   Saved to: {output_dir}")


if __name__ == "__main__":
    main()
