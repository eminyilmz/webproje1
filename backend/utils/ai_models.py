"""
Piksel — Model Servisleri
==============================
Eğitilmiş modellerin inference (çıkarım) katmanı.

- Renklendirme : Derin CNN mimarisi, COCO 2017 üzerinde eğitildi
- Netleştirme  : RRDBNet (Real-ESRGAN), COCO 2017 üzerinde fine-tune edildi
- Yüz Düzeltme : GFPGAN v1.4

Modeller ilk kullanımda models/ dizininden yüklenir ve bellekte saklanır.
"""

import cv2
import numpy as np
from PIL import Image
import io
import os
import sys
import logging
import torch

logger = logging.getLogger(__name__)

# ── GPU Diagnostik ────────────────────────────────────────────────────────────
_DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
if torch.cuda.is_available():
    _gpu_name = torch.cuda.get_device_name(0)
    _gpu_mem = round(torch.cuda.get_device_properties(0).total_memory / 1e9, 1)
    logger.info(f"🚀 [GPU] CUDA aktif — {_gpu_name} ({_gpu_mem} GB VRAM)")
else:
    logger.warning("⚠️ [GPU] CUDA bulunamadı, CPU modunda çalışılıyor.")

# ── Yollar ────────────────────────────────────────────────────────────────────
MODELS_DIR = os.path.join(os.path.dirname(__file__), "../models")
os.makedirs(MODELS_DIR, exist_ok=True)


# ══════════════════════════════════════════════════════════════════════════════
# 1. RENKLENDİRME — Derin CNN (COCO 2017 Train, 118k fotoğraf üzerinde eğitildi)
# ══════════════════════════════════════════════════════════════════════════════

_colorizer = None

# Eğitim çıktıları: model mimarisi + ağırlıklar
_COLORIZER_ARCH_PATH = os.path.join(MODELS_DIR, "lumina_colorizer")
_COLORIZER_WEIGHTS_PATH = os.path.join(MODELS_DIR, "hub", "checkpoints",
                                        "lumina_colorization_trained.pth")


def _load_colorizer():
    """Eğitilmiş renklendirme modelini yükle."""
    global _colorizer
    if _colorizer is not None:
        return _colorizer

    if not os.path.exists(_COLORIZER_ARCH_PATH):
        raise FileNotFoundError(
            f"Renklendirme model dosyaları bulunamadı: {_COLORIZER_ARCH_PATH}\n"
            "Lütfen notebooks/renklendirme_egitimi.ipynb ile modeli eğitip "
            "çıktıları models/ dizinine kopyalayın."
        )

    # Model mimarisini yükle
    if _COLORIZER_ARCH_PATH not in sys.path:
        sys.path.insert(0, _COLORIZER_ARCH_PATH)

    from lumina_arch import lumina_colorizer

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"[Renklendirme] Model yükleniyor ({device})…")

    model = lumina_colorizer(pretrained=True).to(device).eval()

    _colorizer = model
    logger.info("[Renklendirme] Model hazır.")
    return _colorizer


def colorize_image(image_bytes: bytes) -> bytes:
    """
    Siyah-beyaz fotoğrafı renklendir.
    Girdi: gri tonlama görüntü → Çıktı: renkli RGB görüntü
    """
    colorizer = _load_colorizer()
    device = next(colorizer.parameters()).device

    from lumina_arch import preprocess_img, postprocess_tens

    pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_rgb = np.array(pil_img)

    (tens_l_orig, tens_l_rs) = preprocess_img(img_rgb, HW=(256, 256))
    tens_l_rs = tens_l_rs.to(device)

    with torch.no_grad():
        ab_out = colorizer(tens_l_rs).cpu()

    img_colorized = postprocess_tens(tens_l_orig, ab_out)

    img_uint8 = (np.clip(img_colorized, 0, 1) * 255).astype(np.uint8)
    img_bgr = cv2.cvtColor(img_uint8, cv2.COLOR_RGB2BGR)
    _, buf = cv2.imencode(".png", img_bgr)
    return buf.tobytes()


# ══════════════════════════════════════════════════════════════════════════════
# 2. NETLEŞTİRME — RRDBNet / Real-ESRGAN x4 (COCO 2017 üzerinde fine-tune)
# ══════════════════════════════════════════════════════════════════════════════

# Sıfırdan eğitim sonrası kaydedilen ağırlık dosyası
_SR_WEIGHTS_PATH = os.path.join(MODELS_DIR, "lumina_sr_trained.pth")

_realesrgan_upsampler = None


def _load_realesrgan():
    """Eğitilmiş süper çözünürlük modelini yükle."""
    global _realesrgan_upsampler
    if _realesrgan_upsampler is not None:
        return _realesrgan_upsampler

    if not os.path.exists(_SR_WEIGHTS_PATH):
        raise FileNotFoundError(
            f"Netleştirme model ağırlıkları bulunamadı: {_SR_WEIGHTS_PATH}\n"
            "Lütfen notebooks/netlistirme_egitimi.ipynb ile modeli eğitip "
            "çıktıyı models/ dizinine kopyalayın."
        )

    from realesrgan import RealESRGANer
    from basicsr.archs.rrdbnet_arch import RRDBNet

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"[Netleştirme] Model yükleniyor ({device})…")

    backbone = RRDBNet(
        num_in_ch=3, num_out_ch=3,
        num_feat=64, num_block=23, num_grow_ch=32, scale=4,
    )

    _realesrgan_upsampler = RealESRGANer(
        scale=4,
        model_path=_SR_WEIGHTS_PATH,
        model=backbone,
        tile=400,
        tile_pad=10,
        pre_pad=0,
        half=torch.cuda.is_available(),
        device=device,
    )
    logger.info("[Netleştirme] Model hazır.")
    return _realesrgan_upsampler


def _apply_subtle_sharpen(img_bgr: np.ndarray) -> np.ndarray:
    """Kenar detaylarını güçlendiren hafif unsharp mask filtresi."""
    blur = cv2.GaussianBlur(img_bgr, (0, 0), 2.0)
    sharp = cv2.addWeighted(img_bgr, 1.2, blur, -0.2, 0)
    return sharp


def sharpen_image(image_bytes: bytes, outscale: float = 1.0) -> bytes:
    """
    Görüntüyü 4x süper çözünürlük ile netleştir.
    Eğitilmiş RRDBNet modeli kullanılır.
    """
    try:
        upsampler = _load_realesrgan()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Görüntü çözümlenemedi.")

        output, _ = upsampler.enhance(img, outscale=4)
        output = _apply_subtle_sharpen(output)

        _, buf = cv2.imencode(".png", output)
        return buf.tobytes()

    except Exception as e:
        logger.warning(f"[Netleştirme] Model hatası, fallback kullanılıyor: {e}")
        return _fallback_sharpen(image_bytes)


def _fallback_sharpen(image_bytes: bytes) -> bytes:
    """Model yüklenemediğinde kullanılan basit unsharp mask filtresi."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    blur = cv2.GaussianBlur(img, (0, 0), 3)
    sharp = cv2.addWeighted(img, 1.5, blur, -0.5, 0)
    _, buf = cv2.imencode(".png", sharp)
    return buf.tobytes()

