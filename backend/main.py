from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import uvicorn
import os
import uuid
from worker import celery_app
from celery.result import AsyncResult
import base64

app = FastAPI(title="Lumina AI API")

# CORS settings for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, change this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Lumina AI API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/upload")
async def upload_image(file: UploadFile = File(...), action: str = "grayscale"):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    contents = await file.read()
    
    # Start background task
    task = celery_app.send_task("process_image_task", args=[contents, action])
    
    return {"task_id": task.id, "status": "queued"}

@app.get("/task/{task_id}")
async def get_task_status(task_id: str):
    task_result = AsyncResult(task_id, app=celery_app)
    
    if task_result.ready():
        if task_result.successful():
            # Return result as b64 for easy frontend consumption or as a binary file
            result = task_result.result
            return {
                "status": "completed",
                "result": base64.b64encode(result).decode('utf-8')
            }
        else:
            return {"status": "failed", "error": str(task_result.info)}
    
    return {"status": task_result.status}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
