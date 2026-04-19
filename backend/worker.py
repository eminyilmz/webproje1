import os
from celery import Celery
import time
from utils.image_processing import ImageProcessor

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("worker", broker=redis_url, backend=redis_url)

@celery_app.task(name="process_image_task")
def process_image_task(image_bytes, action, params=None):
    processor = ImageProcessor()
    
    if action == "grayscale":
        return processor.to_grayscale(image_bytes)
    elif action == "blur":
        level = params.get("level", 5) if params else 5
        return processor.apply_blur(image_bytes, level)
    elif action == "adjust":
        brightness = params.get("brightness", 1.0) if params else 1.0
        contrast = params.get("contrast", 1.0) if params else 1.0
        saturation = params.get("saturation", 1.0) if params else 1.0
        return processor.adjust_image(image_bytes, brightness, contrast, saturation)
    
    # AI Tasks (Placeholders for now)
    elif action == "colorize":
        # Simulate AI processing time
        time.sleep(2)
        return image_bytes # Placeholder
    elif action == "sharpen":
        time.sleep(2)
        return image_bytes # Placeholder
        
    return image_bytes
