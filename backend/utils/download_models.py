#!/usr/bin/env python3
"""
Model pre-download script for Lumina AI
Run once before starting the worker to pre-cache all model weights.

Usage:
    docker exec lumina-ai-worker-1 python utils/download_models.py
"""

from utils.ai_models import (
    _download,
    MODELS_DIR,
    _COLORIZE_PROTO_URL,
    _COLORIZE_MODEL_URL,
    _COLORIZE_HULL_URL,
    _REALESRGAN_WEIGHTS_URL,
    _REALESRGAN_WEIGHTS_PATH,
)
import os

def main():
    print("=" * 55)
    print("  Lumina AI — Model Weight Pre-Downloader")
    print("=" * 55)

    # Colorization
    print("\n[1/4] Colorization prototxt …")
    _download(_COLORIZE_PROTO_URL,  os.path.join(MODELS_DIR, "colorization_deploy_v2.prototxt"))
    print("[2/4] Colorization caffemodel (~125 MB) …")
    _download(_COLORIZE_MODEL_URL,  os.path.join(MODELS_DIR, "colorization_release_v2.caffemodel"))
    print("[3/4] Colorization hull …")
    _download(_COLORIZE_HULL_URL,   os.path.join(MODELS_DIR, "pts_in_hull.npy"))

    # Real-ESRGAN
    print("[4/4] Real-ESRGAN x4plus (~64 MB) …")
    _download(_REALESRGAN_WEIGHTS_URL, _REALESRGAN_WEIGHTS_PATH)

    print("\n✅ All model weights ready in:", MODELS_DIR)


if __name__ == "__main__":
    main()
