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
    allow_origins=["*"],
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
    action: str     = Query(default="grayscale", description="grayscale|blur|adjust|colorize|sharpen"),
    # sharpen
    outscale: float = Query(default=1.0, description="Output scale for sharpen"),
    # blur
    level: int      = Query(default=5, ge=1, le=20, description="Blur strength"),
    # adjust
    brightness: float = Query(default=1.0, description="Brightness multiplier (0.5–2.0)"),
    contrast:   float = Query(default=1.0, description="Contrast multiplier (0.5–2.0)"),
    saturation: float = Query(default=1.0, description="Saturation multiplier (0.0–2.0)"),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: {', '.join(ALLOWED_TYPES)}",
        )

    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({len(contents)//1024//1024} MB). Max: 20 MB",
        )

    params: dict = {}
    if action == "sharpen":
        params["outscale"] = outscale
    elif action == "blur":
        params["level"] = level
    elif action == "adjust":
        params["brightness"] = brightness
        params["contrast"]   = contrast
        params["saturation"] = saturation

    logger.info(f"[API] action={action} params={params} size={len(contents)}B")

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
            b64_str = result.result  # worker already returns base64 string
            return {
                "status": "completed",
                "result": b64_str,
            }
        else:
            logger.error(f"[API] Task {task_id} failed: {result.info}")
            return JSONResponse(
                status_code=500,
                content={"status": "failed", "error": str(result.info)},
            )

    return {"status": result.status}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
