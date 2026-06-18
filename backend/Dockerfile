# ── Base: Official PyTorch image (torch + torchvision pre-installed) ──────────
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

# ── Install dependencies ───────────────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=120 --retries=3 -r requirements.txt

# ── Patch basicsr for torchvision compatibility ───────────────────────────────
# newer torchvision moved functional_tensor to functional
RUN sed -i 's/from torchvision.transforms.functional_tensor import rgb_to_grayscale/from torchvision.transforms.functional import rgb_to_grayscale/g' \
    /opt/conda/lib/python3.11/site-packages/basicsr/data/degradations.py

# Copy application code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
