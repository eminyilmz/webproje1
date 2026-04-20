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
import urllib.request
import logging

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
    urllib.request.urlretrieve(url, dest)
    logger.info(f"[Model] {os.path.basename(dest)} ready.")


# ══════════════════════════════════════════════════════════════════════════════
# 1. COLORIZATION  (Zhang et al. 2016 — opencv dnn + caffe)
# ══════════════════════════════════════════════════════════════════════════════

_COLORIZE_PROTO_URL = (
    "https://raw.githubusercontent.com/richzhang/colorization/"
    "caffe/colorization/models/colorization_deploy_v2.prototxt"
)
_COLORIZE_MODEL_URL = (
    "http://eecs.berkeley.edu/~rich.zhang/projects/2016_colorization/"
    "files/demo_v2/colorization_release_v2.caffemodel"
)
_COLORIZE_HULL_URL = (
    "https://github.com/richzhang/colorization/raw/caffe/"
    "colorization/resources/pts_in_hull.npy"
)

_colorize_net = None  # cached after first load


def _load_colorize_net():
    global _colorize_net
    if _colorize_net is not None:
        return _colorize_net

    proto  = os.path.join(MODELS_DIR, "colorization_deploy_v2.prototxt")
    model  = os.path.join(MODELS_DIR, "colorization_release_v2.caffemodel")
    hull   = os.path.join(MODELS_DIR, "pts_in_hull.npy")

    _download(_COLORIZE_PROTO_URL, proto)
    _download(_COLORIZE_MODEL_URL, model)
    _download(_COLORIZE_HULL_URL,  hull)

    net = cv2.dnn.readNetFromCaffe(proto, model)

    # Insert quantized ab-palette into the network layers
    pts = np.load(hull).transpose().reshape(2, 313, 1, 1).astype(np.float32)
    class8_id = net.getLayerId("class8_ab")
    conv8_id  = net.getLayerId("conv8_313_rh")
    net.getLayer(class8_id).blobs = [pts]
    net.getLayer(conv8_id).blobs  = [np.full([1, 313], 2.606, dtype="float32")]

    _colorize_net = net
    return _colorize_net


def colorize_image(image_bytes: bytes) -> bytes:
    """
    Colorize a grayscale (or desaturated) image using the Zhang 2016 model.

    Pipeline:
        BGR → LAB → extract L → resize to 224×224 → net forward → ab output
        → combine with original L → LAB → BGR → PNG bytes
    """
    net   = _load_colorize_net()
    nparr = np.frombuffer(image_bytes, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image.")

    h, w  = img.shape[:2]
    img_f = img.astype("float32") / 255.0
    lab   = cv2.cvtColor(img_f, cv2.COLOR_BGR2LAB)
    L     = cv2.split(lab)[0]                      # luminance
    L_in  = cv2.resize(L, (224, 224)) - 50          # centre and resize

    net.setInput(cv2.dnn.blobFromImage(L_in))
    ab_dec = net.forward()[0, :, :, :].transpose(1, 2, 0)
    ab_dec = cv2.resize(ab_dec, (w, h))

    colorized = np.concatenate([L[:, :, np.newaxis], ab_dec], axis=2)
    colorized = np.clip(cv2.cvtColor(colorized, cv2.COLOR_LAB2BGR), 0, 1)
    colorized = (colorized * 255).astype(np.uint8)

    _, buf = cv2.imencode(".png", colorized)
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
