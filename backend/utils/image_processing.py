import cv2
import numpy as np
from PIL import Image, ImageEnhance
import io

class ImageProcessor:
    @staticmethod
    def to_grayscale(image_bytes):
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, buffer = cv2.imencode('.png', gray)
        return buffer.tobytes()

    @staticmethod
    def apply_blur(image_bytes, level=5):
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        ksize = (level * 2 + 1, level * 2 + 1)
        blurred = cv2.GaussianBlur(img, ksize, 0)
        _, buffer = cv2.imencode('.png', blurred)
        return buffer.tobytes()

    @staticmethod
    def adjust_image(image_bytes, brightness=1.0, contrast=1.0, saturation=1.0):
        img = Image.open(io.BytesIO(image_bytes))
        
        if brightness != 1.0:
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(brightness)
            
        if contrast != 1.0:
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(contrast)
            
        if saturation != 1.0:
            enhancer = ImageEnhance.Color(img)
            img = enhancer.enhance(saturation)
            
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        return img_byte_arr.getvalue()
