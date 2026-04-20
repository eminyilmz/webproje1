"""
FastAPI main — Lumina AI
========================
Endpoints:
  GET  /            → health
  GET  /health      → detailed health
  POST /upload      → upload image + dispatch Celery task
  GET  /task/{id}   → poll task status / retrieve result
"""

import base64
import logging
import os

from celery.result import AsyncResult
from fastapi import FastAPI, File, HTTPException, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from worker import celery_app

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── allowed MIME types ────────────────────────────────────────────────────────
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"}
MAX_FILE_SIZE  = 20 * 1024 * 1024  # 20 MB

# ── app ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Lumina AI API",
    description="AI-powered image processing backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Restrict to your domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── routes ────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "Lumina AI API is running", "docs": "/docs"}


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "celery_broker": os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    }


@app.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    action: str = Query(
        default="grayscale",
        description="One of: grayscale | blur | adjust | colorize | sharpen",
    ),
    outscale: float = Query(default=1.0, description="Output scale for sharpen (1.0 = restore only, 4.0 = 4× upscale)"),
    blur_level: int = Query(default=5, ge=1, le=20, description="Blur kernel strength"),
):
    # ── Validate file type ────────────────────────────────────────────────────
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. "
                   f"Allowed: {', '.join(ALLOWED_TYPES)}",
        )

    contents = await file.read()

    # ── Validate file size ────────────────────────────────────────────────────
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({len(contents)//1024//1024} MB). Max: 20 MB",
        )

    # ── Build params dict for the worker ─────────────────────────────────────
    params = {}
    if action == "sharpen":
        params["outscale"] = outscale
    elif action == "blur":
        params["level"] = blur_level

    logger.info(f"[API] Dispatching task: action={action}, size={len(contents)} bytes")

    task = celery_app.send_task(
        "process_image_task",
        args=[contents, action],
        kwargs={"params": params},
    )

    return {"task_id": task.id, "status": "queued", "action": action}


@app.get("/task/{task_id}")
async def get_task(task_id: str):
    result = AsyncResult(task_id, app=celery_app)

    if result.ready():
        if result.successful():
            img_bytes = result.result
            return {
                "status": "completed",
                "result": base64.b64encode(img_bytes).decode("utf-8"),
            }
        else:
            logger.error(f"[API] Task {task_id} failed: {result.info}")
            return JSONResponse(
                status_code=500,
                content={"status": "failed", "error": str(result.info)},
            )

    # PENDING | STARTED | RETRY
    return {"status": result.status}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
