"""
extract_landmarks.py — Extract MediaPipe hand landmarks from WLASL videos.

Usage:
  python extract_landmarks.py --video_dir ./data/videos --output_dir ./data/landmarks

This script:
  1. Walks through the video directory (organized as videos/{word}/*.mp4).
  2. For each video, runs MediaPipe Hands to extract 21 hand landmarks per frame.
  3. Saves the landmarks as NumPy arrays: landmarks/{word}/{video_id}.npy
     Each .npy file has shape: (num_frames, 63) — 21 landmarks × 3 coords (x, y, z).
  4. Generates a master dataset file: data/dataset.npz containing:
     - X: padded/truncated landmark sequences, shape (N, SEQ_LEN, 63)
     - y: integer label for each sample
     - label_map: dict mapping integer -> word
"""

import os
import json
import argparse
from pathlib import Path

import cv2
import numpy as np
import mediapipe as mp
from tqdm import tqdm


# Target sequence length (in frames). Videos shorter than this are padded;
# videos longer are truncated (center-cropped).
SEQ_LEN = 30


from typing import Any

def extract_landmarks_from_video(
    video_path: str,
    hands: Any,
    global_timestamp_ms: int,
) -> tuple[np.ndarray | None, int]:
    """
    Extract hand landmarks from a video file.

    Returns:
        (landmarks_array, new_global_timestamp_ms)
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return None, global_timestamp_ms

    all_landmarks = []
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:
        fps = 30
        
    frame_ms = int(1000 / fps)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Convert BGR to RGB for MediaPipe
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        
        results = hands.detect_for_video(mp_image, global_timestamp_ms)

        if results.hand_landmarks:
            # Take the first detected hand
            hand = results.hand_landmarks[0]
            coords = []
            for lm in hand:
                coords.extend([lm.x, lm.y, lm.z])
            all_landmarks.append(coords)
        else:
            # No hand detected in this frame — append zeros
            all_landmarks.append([0.0] * 63)
            
        global_timestamp_ms += frame_ms

    cap.release()

    if not all_landmarks:
        return None, global_timestamp_ms

    return np.array(all_landmarks, dtype=np.float32), global_timestamp_ms


def normalize_landmarks(landmarks: np.ndarray) -> np.ndarray:
    """
    Normalize landmarks to be position-invariant.
    Subtracts the wrist position and scales by the max absolute value.
    """
    normalized = np.copy(landmarks)

    for i in range(len(normalized)):
        frame = normalized[i]
        if np.all(frame == 0):
            continue

        # Wrist is the first landmark (indices 0, 1, 2)
        wrist_x, wrist_y, wrist_z = frame[0], frame[1], frame[2]

        # Subtract wrist position from all landmarks
        for j in range(21):
            idx = j * 3
            frame[idx] -= wrist_x
            frame[idx + 1] -= wrist_y
            frame[idx + 2] -= wrist_z

        # Scale to [-1, 1]
        max_val = np.max(np.abs(frame))
        if max_val > 0:
            frame /= max_val

        normalized[i] = frame

    return normalized


def pad_or_truncate(sequence: np.ndarray, target_len: int) -> np.ndarray:
    """Pad (with zeros) or center-crop a sequence to the target length."""
    current_len = sequence.shape[0]

    if current_len == target_len:
        return sequence
    elif current_len > target_len:
        # Center crop
        start = (current_len - target_len) // 2
        return sequence[start : start + target_len]
    else:
        # Pad with zeros at the end
        pad_width = target_len - current_len
        return np.pad(sequence, ((0, pad_width), (0, 0)), mode="constant")


def main():
    parser = argparse.ArgumentParser(
        description="Extract MediaPipe landmarks from WLASL videos."
    )
    parser.add_argument(
        "--video_dir",
        type=str,
        default="./data/videos",
        help="Input directory with videos organized as videos/{word}/*.mp4",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="./data/landmarks",
        help="Output directory for landmark .npy files",
    )
    parser.add_argument(
        "--seq_len",
        type=int,
        default=SEQ_LEN,
        help=f"Target sequence length in frames (default: {SEQ_LEN})",
    )
    parser.add_argument(
        "--label_map",
        type=str,
        default="./data/label_map.json",
        help="Path to label_map.json",
    )
    args = parser.parse_args()

    video_dir = Path(args.video_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Load label map
    with open(args.label_map, "r") as f:
        label_map = json.load(f)
    # Invert: word -> index
    word_to_idx = {v.lower().replace(" ", "_"): int(k) for k, v in label_map.items()}

    # Use new MediaPipe Tasks API
    BaseOptions = mp.tasks.BaseOptions
    HandLandmarker = mp.tasks.vision.HandLandmarker
    HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
    VisionRunningMode = mp.tasks.vision.RunningMode

    # We need the model asset for HandLandmarker
    model_path = output_dir.parent / "hand_landmarker.task"
    if not model_path.exists():
        import urllib.request
        print("[INFO] Downloading hand_landmarker.task...")
        urllib.request.urlretrieve(
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            str(model_path)
        )

    options = HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(model_path)),
        running_mode=VisionRunningMode.VIDEO,
        num_hands=1,
        min_hand_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    hands = HandLandmarker.create_from_options(options)

    all_X = []
    all_y = []
    skipped = 0
    global_timestamp_ms = 0

    # Walk through video directories
    word_dirs = sorted([d for d in video_dir.iterdir() if d.is_dir()])

    for word_dir in tqdm(word_dirs, desc="Processing words"):
        word = word_dir.name.lower()
        if word not in word_to_idx:
            continue

        label_idx = word_to_idx[word]
        landmark_word_dir = output_dir / word
        landmark_word_dir.mkdir(parents=True, exist_ok=True)

        video_files = sorted(word_dir.glob("*.mp4"))
        for video_file in video_files:
            landmarks, global_timestamp_ms = extract_landmarks_from_video(
                str(video_file), hands, global_timestamp_ms
            )

            if landmarks is None or len(landmarks) < 5:
                skipped += 1
                continue

            # Normalize
            landmarks = normalize_landmarks(landmarks)

            # Save individual .npy
            npy_path = landmark_word_dir / f"{video_file.stem}.npy"
            np.save(npy_path, landmarks)

            # Pad/truncate to fixed length
            fixed = pad_or_truncate(landmarks, args.seq_len)
            all_X.append(fixed)
            all_y.append(label_idx)

    hands.close()

    if not all_X:
        print("[ERROR] No valid landmark sequences extracted!")
        return

    X = np.array(all_X, dtype=np.float32)
    y = np.array(all_y, dtype=np.int32)

    print(f"\n[INFO] Dataset shape: X={X.shape}, y={y.shape}")
    print(f"[INFO] Skipped {skipped} videos (too short or no hands detected)")
    print(f"[INFO] Classes: {len(set(y))}")

    # Save the master dataset
    dataset_path = Path(args.output_dir).parent / "dataset.npz"
    np.savez_compressed(dataset_path, X=X, y=y)
    print(f"[INFO] Saved dataset to {dataset_path}")


if __name__ == "__main__":
    main()
