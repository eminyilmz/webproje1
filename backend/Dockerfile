# ── Base: Official PyTorch image (torch + torchvision pre-installed) ──────────
# This eliminates the need to pip-install torch (530MB+ download that times out).
# GPU inference works automatically when nvidia-docker runtime is available.
FROM pytorch/pytorch:2.5.1-cuda12.4-cudnn9-runtime

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    git \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ── Step 1: Install AI packages (basicsr needs torch pre-installed) ───────────
# --no-build-isolation prevents basicsr/setup.py from re-downloading torch
RUN pip install --no-cache-dir --timeout=120 --retries=3 \
    --no-build-isolation \
    basicsr \
    facexlib \
    gfpgan \
    realesrgan

# ── Step 2: Install application dependencies ──────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=120 --retries=3 -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
