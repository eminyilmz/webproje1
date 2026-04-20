"""
Celery Worker — Lumina AI
==========================
Routes image processing tasks to the appropriate service:
  - grayscale / blur / adjust  →  ImageProcessor (OpenCV, synchronous, fast)
  - colorize                   →  colorize_image  (Zhang 2016, DNN)
  - sharpen                    →  sharpen_image   (Real-ESRGAN or fallback)
"""

import os
import base64
import logging
from celery import Celery

from utils.image_processing import ImageProcessor
from utils.ai_models import colorize_image, sharpen_image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("worker", broker=redis_url, backend=redis_url)

# Use JSON serializer — safe for root containers, no pickle security warnings
celery_app.conf.update(
    result_serializer="json",
    accept_content=["json"],
    task_serializer="json",
)


@celery_app.task(name="process_image_task", bind=True, max_retries=2)
def process_image_task(self, image_bytes: bytes, action: str, params: dict = None):
    """
    Main task dispatcher.

    Args:
        image_bytes : raw image bytes (PNG/JPEG/etc.)
        action      : one of grayscale | blur | adjust | colorize | sharpen
        params      : optional dict with action-specific parameters

    Returns:
        Processed image as PNG bytes.
    """
    params = params or {}
    processor = ImageProcessor()

    try:
        # ── Classic operations (fast, no GPU needed) ──────────────────────────
        if action == "grayscale":
            result = processor.to_grayscale(image_bytes)
            return base64.b64encode(result).decode("utf-8")

        elif action == "blur":
            level = int(params.get("level", 5))
            result = processor.apply_blur(image_bytes, level)
            return base64.b64encode(result).decode("utf-8")

        elif action == "adjust":
            result = processor.adjust_image(
                image_bytes,
                brightness = float(params.get("brightness", 1.0)),
                contrast   = float(params.get("contrast",   1.0)),
                saturation = float(params.get("saturation", 1.0)),
            )
            return base64.b64encode(result).decode("utf-8")

        # ── AI operations (may use GPU, first call downloads weights) ─────────
        elif action == "colorize":
            logger.info("[Worker] Starting colorization task …")
            result = colorize_image(image_bytes)
            logger.info("[Worker] Colorization complete.")
            return base64.b64encode(result).decode("utf-8")

        elif action == "sharpen":
            outscale = float(params.get("outscale", 1.0))
            logger.info(f"[Worker] Starting sharpening task (outscale={outscale}) …")
            result = sharpen_image(image_bytes, outscale=outscale)
            logger.info("[Worker] Sharpening complete.")
            return base64.b64encode(result).decode("utf-8")

        else:
            logger.warning(f"[Worker] Unknown action '{action}', returning original.")
            return base64.b64encode(image_bytes).decode("utf-8")

    except Exception as exc:
        logger.error(f"[Worker] Task failed for action='{action}': {exc}")
        raise self.retry(exc=exc, countdown=5)
