"""
download_wlasl.py — Download WLASL videos for the top N most common ASL words.

WLASL (Word-Level American Sign Language) dataset:
  https://github.com/dxli94/WLASL

Usage:
  python download_wlasl.py --num_words 100 --output_dir ./data/videos

This script:
  1. Downloads the WLASL JSON annotation file from the official GitHub repo.
  2. Selects the top N words (sorted by number of available videos).
  3. Downloads up to K videos per word using yt-dlp.
  4. Saves videos organized as: data/videos/{word}/{video_id}.mp4
"""

import os
import json
import argparse
import subprocess
import sys
from pathlib import Path

import requests
from tqdm import tqdm


WLASL_JSON_URL = (
    "https://raw.githubusercontent.com/dxli94/WLASL/master/start_kit/WLASL_v0.3.json"
)


def download_wlasl_json(cache_path: Path) -> list:
    """Download and cache the WLASL annotation JSON."""
    if cache_path.exists():
        print(f"[INFO] Using cached WLASL JSON: {cache_path}")
        with open(cache_path, "r") as f:
            return json.load(f)

    print("[INFO] Downloading WLASL annotation JSON...")
    resp = requests.get(WLASL_JSON_URL, timeout=60)
    resp.raise_for_status()
    data = resp.json()

    cache_path.parent.mkdir(parents=True, exist_ok=True)
    with open(cache_path, "w") as f:
        json.dump(data, f)

    print(f"[INFO] Saved WLASL JSON to {cache_path}")
    return data


def select_top_words(data: list, num_words: int) -> list:
    """Select the top N words sorted by number of video instances."""
    # Each entry: { "gloss": "word", "instances": [...] }
    words = []
    for entry in data:
        gloss = entry.get("gloss", "").strip()
        instances = entry.get("instances", [])
        if gloss and instances:
            words.append({
                "gloss": gloss,
                "instances": instances,
                "count": len(instances),
            })

    # Sort by number of available videos (descending)
    words.sort(key=lambda x: x["count"], reverse=True)
    selected = words[:num_words]
    print(f"[INFO] Selected top {len(selected)} words:")
    for i, w in enumerate(selected[:20]):
        print(f"  {i+1:3d}. {w['gloss']} ({w['count']} videos)")
    if len(selected) > 20:
        print(f"  ... and {len(selected) - 20} more")
    return selected


def download_video(url: str, output_path: Path, timeout: int = 30) -> bool:
    """Download a single video using yt-dlp."""
    if output_path.exists():
        return True

    output_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        result = subprocess.run(
            [
                sys.executable, "-m", "yt_dlp",
                "--quiet",
                "--no-warnings",
                "--socket-timeout", str(timeout),
                "--output", str(output_path),
                "--format", "worst[ext=mp4]/worst",  # smallest file
                "--no-playlist",
                url,
            ],
            capture_output=True,
            text=True,
            timeout=timeout + 15,
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, Exception):
        return False


def download_videos_for_words(
    words: list,
    output_dir: Path,
    max_videos_per_word: int = 15,
):
    """Download videos for each selected word."""
    output_dir.mkdir(parents=True, exist_ok=True)

    total_downloaded = 0
    total_failed = 0

    for word_entry in tqdm(words, desc="Words"):
        gloss = word_entry["gloss"]
        instances = word_entry["instances"][:max_videos_per_word]
        word_dir = output_dir / gloss.lower().replace(" ", "_")

        downloaded = 0
        for inst in instances:
            video_id = inst.get("video_id", "")
            url = inst.get("url", "")

            if not url or not video_id:
                continue

            ext = ".mp4"
            output_path = word_dir / f"{video_id}{ext}"

            if download_video(url, output_path):
                downloaded += 1
                total_downloaded += 1
            else:
                total_failed += 1

        tqdm.write(f"  {gloss}: {downloaded}/{len(instances)} downloaded")

    print(f"\n[DONE] Downloaded: {total_downloaded}, Failed: {total_failed}")


def main():
    parser = argparse.ArgumentParser(
        description="Download WLASL videos for the top N words."
    )
    parser.add_argument(
        "--num_words",
        type=int,
        default=100,
        help="Number of top words to download (default: 100)",
    )
    parser.add_argument(
        "--max_videos",
        type=int,
        default=15,
        help="Max videos per word (default: 15)",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="./data/videos",
        help="Output directory for downloaded videos",
    )
    parser.add_argument(
        "--json_cache",
        type=str,
        default="./data/wlasl.json",
        help="Path to cache the WLASL JSON file",
    )
    args = parser.parse_args()

    data = download_wlasl_json(Path(args.json_cache))
    words = select_top_words(data, args.num_words)

    # Save the selected word list (this is our label map)
    label_map_path = Path(args.output_dir).parent / "label_map.json"
    label_map_path.parent.mkdir(parents=True, exist_ok=True)
    label_map = {i: w["gloss"] for i, w in enumerate(words)}
    with open(label_map_path, "w") as f:
        json.dump(label_map, f, indent=2)
    print(f"[INFO] Saved label map to {label_map_path}")

    download_videos_for_words(
        words,
        Path(args.output_dir),
        max_videos_per_word=args.max_videos,
    )


if __name__ == "__main__":
    main()
