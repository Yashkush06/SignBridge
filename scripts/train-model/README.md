# ASL Word Recognition — Training Pipeline

This directory contains the full ML training pipeline for building a custom
LSTM neural network that recognizes ASL words from hand landmark sequences.

## Prerequisites

- Python 3.10+
- pip

## Quick Start

```bash
# 1. Install dependencies
cd scripts/train-model
pip install -r requirements.txt

# 2. Download WLASL videos (top 100 words, ~15 videos each)
python download_wlasl.py --num_words 100 --max_videos 15

# 3. Extract MediaPipe landmarks from the videos
python extract_landmarks.py --video_dir ./data/videos --output_dir ./data/landmarks

# 4. Train the LSTM model
python train_model.py --dataset ./data/dataset.npz --epochs 100

# 5. Export to TensorFlow.js for the browser
python export_tfjs.py --model_dir ./model --output_dir ../../public/models/asl-lstm
```

## Pipeline Overview

```
WLASL Videos (.mp4)
       │
       ▼
┌──────────────────┐
│  extract_landmarks │  MediaPipe Hands → 21 landmarks × 3 coords = 63 features
│  .py               │  Normalize (wrist-relative), pad/truncate to 30 frames
└──────────────────┘
       │
       ▼
  dataset.npz
  X: (N, 30, 63)   y: (N,)
       │
       ▼
┌──────────────────┐
│  train_model.py   │  Bidirectional LSTM (128) → LSTM (64) → Dense → Softmax
│                   │  Early stopping, class balancing, LR scheduling
└──────────────────┘
       │
       ▼
  asl_model.keras
       │
       ▼
┌──────────────────┐
│  export_tfjs.py   │  Keras → TensorFlow.js LayersModel
└──────────────────┘
       │
       ▼
  public/models/asl-lstm/
    ├── model.json
    ├── group1-shard1of1.bin
    ├── metadata.json
    └── label_map.json
```

## Notes

- **Video downloads may fail** for some WLASL entries (broken links). This is normal.
  The pipeline handles missing data gracefully.
- Training on CPU takes ~10-30 minutes depending on dataset size.
- The exported TensorFlow.js model is typically 500KB–2MB, small enough for fast browser loading.
