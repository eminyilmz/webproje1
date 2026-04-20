"""
AI Model Services for Lumina AI
================================
- ColorizeService  : Zhang et al. 2016 colorization via OpenCV DNN (Caffe model)
- SharpenService   : Real-ESRGAN x4 super-resolution (xinntao)

Both services implement lazy loading — models are downloaded and cached on
first call, not at container startup.  Replace model weights with your own
trained .pth files when retraining is complete.
"""

import cv2
import numpy as np
from PIL import Image
import io
import os
import logging
import requests
import torch

logger = logging.getLogger(__name__)

# ── paths ──────────────────────────────────────────────────────────────────────
MODELS_DIR = os.path.join(os.path.dirname(__file__), "../models")
os.makedirs(MODELS_DIR, exist_ok=True)

# ── helper ─────────────────────────────────────────────────────────────────────
def _download(url: str, dest: str) -> None:
    """Download a file if it doesn't already exist."""
    if os.path.exists(dest):
        return
    logger.info(f"[Model] Downloading {os.path.basename(dest)} …")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/124.0.0.0 Safari/537.36"
    }
    with requests.get(url, headers=headers, stream=True, timeout=120) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=65536):
                f.write(chunk)
    logger.info(f"[Model] {os.path.basename(dest)} ready.")


# ══════════════════════════════════════════════════════════════════════════════
# 1. COLORIZATION  (richzhang/colorization via PyTorch Hub)
# ══════════════════════════════════════════════════════════════════════════════
#
# PyTorch Hub downloads weights (~55 MB) to ~/.cache/torch/hub/checkpoints/
# on first call — no external URL configuration needed.

_colorizer = None  # cached after first load

# Path where torch.hub extracted the richzhang/colorization repo
_HUB_REPO_PATH = "/root/.cache/torch/hub/richzhang_colorization_master"


def _ensure_colorizer_downloaded():
    """Download the colorization repo if not already cached."""
    if not os.path.exists(_HUB_REPO_PATH):
        logger.info("[Colorizer] Downloading richzhang/colorization repo …")
        import zipfile
        zip_path = "/root/.cache/torch/hub/master.zip"
        os.makedirs("/root/.cache/torch/hub", exist_ok=True)
        _download(
            "https://github.com/richzhang/colorization/archive/refs/heads/master.zip",
            zip_path,
        )
        with zipfile.ZipFile(zip_path, "r") as z:
            z.extractall("/root/.cache/torch/hub/")
        extracted = "/root/.cache/torch/hub/colorization-master"
        if os.path.exists(extracted):
            os.rename(extracted, _HUB_REPO_PATH)
        logger.info("[Colorizer] Repo extracted.")


def _load_colorizer():
    global _colorizer
    if _colorizer is not None:
        return _colorizer

    _ensure_colorizer_downloaded()

    import sys
    if _HUB_REPO_PATH not in sys.path:
        sys.path.insert(0, _HUB_REPO_PATH)

    from colorizers import siggraph17  # noqa: import from hub repo

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"[Colorizer] Loading siggraph17 on device: {device}")

    model = siggraph17(pretrained=True).to(device).eval()

    _colorizer = model
    logger.info("[Colorizer] Model ready.")
    return _colorizer


def colorize_image(image_bytes: bytes) -> bytes:
    """
    Colorize a grayscale image using the Zhang 2017 SIGGRAPH colorizer.
    Uses colorizers library's preprocess_img / postprocess_tens pipeline.
    """
    import sys

    if _HUB_REPO_PATH not in sys.path:
        sys.path.insert(0, _HUB_REPO_PATH)

    from colorizers import preprocess_img, postprocess_tens

    colorizer = _load_colorizer()
    device    = next(colorizer.parameters()).device

    pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_rgb = np.array(pil_img)

    (tens_l_orig, tens_l_rs) = preprocess_img(img_rgb, HW=(256, 256))
    tens_l_rs = tens_l_rs.to(device)

    with torch.no_grad():
        ab_out = colorizer(tens_l_rs).cpu()

    img_colorized = postprocess_tens(tens_l_orig, ab_out)  # float [0,1] RGB

    img_uint8 = (np.clip(img_colorized, 0, 1) * 255).astype(np.uint8)
    img_bgr   = cv2.cvtColor(img_uint8, cv2.COLOR_RGB2BGR)
    _, buf = cv2.imencode(".png", img_bgr)
    return buf.tobytes()


# ══════════════════════════════════════════════════════════════════════════════
# 2. SHARPENING / SUPER-RESOLUTION  (Real-ESRGAN x4plus)
# ══════════════════════════════════════════════════════════════════════════════

_REALESRGAN_WEIGHTS_URL = (
    "https://github.com/xinntao/Real-ESRGAN/releases/download/"
    "v0.1.0/RealESRGAN_x4plus.pth"
)
_REALESRGAN_WEIGHTS_PATH = os.path.join(MODELS_DIR, "RealESRGAN_x4plus.pth")

_realesrgan_upsampler = None  # cached after first load


def _load_realesrgan():
    global _realesrgan_upsampler
    if _realesrgan_upsampler is not None:
        return _realesrgan_upsampler

    try:
        from realesrgan import RealESRGANer
        from basicsr.archs.rrdbnet_arch import RRDBNet
    except ImportError as e:
        raise ImportError(
            "realesrgan / basicsr not installed. "
            "Run: pip install realesrgan basicsr facexlib gfpgan"
        ) from e

    _download(_REALESRGAN_WEIGHTS_URL, _REALESRGAN_WEIGHTS_PATH)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"[RealESRGAN] Using device: {device}")

    backbone = RRDBNet(
        num_in_ch=3, num_out_ch=3,
        num_feat=64, num_block=23, num_grow_ch=32, scale=4,
    )

    _realesrgan_upsampler = RealESRGANer(
        scale=4,
        model_path=_REALESRGAN_WEIGHTS_PATH,
        model=backbone,
        tile=400,           # process in tiles to avoid GPU OOM on large images
        tile_pad=10,
        pre_pad=0,
        half=torch.cuda.is_available(),  # fp16 inference on GPU only
        device=device,
    )
    return _realesrgan_upsampler


def sharpen_image(image_bytes: bytes, outscale: float = 1.0) -> bytes:
    """
    Enhance an image using Real-ESRGAN x4plus.

    outscale=1.0  → upscale 4× then downscale back (maximum detail recovery)
    outscale=4.0  → full 4× super-resolution output

    Falls back to unsharp masking if Real-ESRGAN is not available.
    """
    try:
        upsampler = _load_realesrgan()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Could not decode image.")

        output, _ = upsampler.enhance(img, outscale=outscale if outscale > 1 else 4)

        if outscale <= 1.0:
            # Resize back to original dimensions for a "sharpen-only" effect
            output = cv2.resize(output, (img.shape[1], img.shape[0]),
                                interpolation=cv2.INTER_LANCZOS4)

        _, buf = cv2.imencode(".png", output)
        return buf.tobytes()

    except Exception as e:
        logger.warning(f"[RealESRGAN] Falling back to unsharp mask: {e}")
        return _fallback_sharpen(image_bytes)


def _fallback_sharpen(image_bytes: bytes) -> bytes:
    """Lightweight unsharp mask — used when Real-ESRGAN is unavailable."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    blur  = cv2.GaussianBlur(img, (0, 0), 3)
    sharp = cv2.addWeighted(img, 1.5, blur, -0.5, 0)
    _, buf = cv2.imencode(".png", sharp)
    return buf.tobytes()
