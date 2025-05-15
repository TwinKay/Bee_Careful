# main.py
# FastAPI application for beehive diagnosis.
# Downloads original image from S3, analyzes, uploads annotated image to S3,
# and returns diagnosis with S3 Key of the annotated image.

import uvicorn
import uuid
import os

import cv2
import numpy as np
from fastapi import FastAPI, Body, HTTPException
from pydantic import BaseModel

# Import from the bee_analyzer module
from bee_analyzer import load_model, analyze_bee_image
# Import from the s3_handler module
from s3_handler import (
    get_s3_object_bytes,
    put_s3_object_bytes,
    extract_filename_from_s3_key,
    S3_BUCKET_NAME, # For constructing S3 URL and checks
    s3_client as s3_handler_client # For startup checks
)

# --- Application Setup ---
app = FastAPI(title="Beehive-Diagnosis API with S3 In/Out")

# Load the model when the application starts
try:
    MODEL = load_model()
except Exception as e:
    print(f"FATAL: Could not load YOLO model: {e}")
    MODEL = None

# --- Request & Response Models ---
class DiagnosisRequest(BaseModel):
    s3Key: str # S3 key for the original image

class DiagnosisResponse(BaseModel):
    diagnosis: dict
    annotatedImageS3Key: str

# --- Configuration for Annotated Images ---
ANNOTATED_IMAGE_S3_PREFIX = "BEEHIVE/ANNOTATED/" # Define a prefix for annotated images

# --- API Endpoints ---
@app.post("/beehives/diagnosis", response_model=DiagnosisResponse)
async def diagnose_beehive(body: DiagnosisRequest = Body(...)):
    """
    Receives an S3 key for an original image, downloads it, performs bee disease diagnosis,
    uploads the annotated image to S3, and returns the diagnosis results along with
    the S3 URL of the annotated image.
    """
    if MODEL is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Service unavailable.")

    # Check S3 configuration (from s3_handler)
    if s3_handler_client is None:
        raise HTTPException(status_code=503, detail="S3 client not initialized. Check server logs for AWS configuration issues.")
    if not S3_BUCKET_NAME: # Check if S3_BUCKET_NAME is None or empty
        print("Error: S3_BUCKET_NAME environment variable is not set or is empty in s3_handler.py.")
        raise HTTPException(status_code=500, detail="S3 bucket not configured on server. Check server logs.")

    original_s3_key = body.s3Key

    # 1. Download the original image from S3
    try:
        print(f"Received request to diagnose image with S3 key: {original_s3_key} (from bucket: {S3_BUCKET_NAME})")
        img_bytes = get_s3_object_bytes(original_s3_key)
    except FileNotFoundError:
        print(f"FileNotFoundError for key '{original_s3_key}' in bucket '{S3_BUCKET_NAME}'.")
        raise HTTPException(status_code=404, detail=f"Original image not found in S3 with key: {original_s3_key}")
    except PermissionError:
        print(f"PermissionError for key '{original_s3_key}' in bucket '{S3_BUCKET_NAME}'.")
        raise HTTPException(status_code=403, detail=f"Access denied for original S3 object with key: {original_s3_key}")
    except RuntimeError as e: 
        print(f"RuntimeError from s3_handler (key: {original_s3_key}): {e}")
        raise HTTPException(status_code=503, detail=f"S3 service error: {e}")
    except Exception as e: 
        print(f"An unexpected error occurred during S3 download for key '{original_s3_key}': {e}")
        raise HTTPException(status_code=500, detail="Failed to download original image from S3: An unexpected error occurred.")

    # 2. Decode the image
    try:
        img_np = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)
        if img_np is None:
            print(f"Failed to decode image from S3 (key: {original_s3_key}). File might be corrupted or not a supported image format.")
            raise HTTPException(status_code=415, detail="Unsupported image format or corrupt image downloaded from S3.")
    except Exception as e:
        print(f"Error decoding image (key: {original_s3_key}): {e}")
        raise HTTPException(status_code=415, detail=f"Could not decode image from S3: {e}")

    # 3. Perform analysis using the bee_analyzer module
    try:
        # Note: analyze_bee_image now returns diagnosis_result, annotated_img_np
        diagnosis_result, annotated_img_np = analyze_bee_image(MODEL, img_np)
    except RuntimeError as e: 
        print(f"Model inference error for image (key: {original_s3_key}): {e}")
        raise HTTPException(status_code=500, detail=f"Model inference error: {e}")
    except ValueError as e: 
        print(f"Image processing error for image (key: {original_s3_key}): {e}")
        raise HTTPException(status_code=400, detail=f"Image processing error: {e}")
    except Exception as e:
        print(f"Unexpected error during image analysis (key: {original_s3_key}): {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred during image analysis.")

    # 4. Encode the annotated image to JPEG bytes
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
    ok, annotated_img_buf = cv2.imencode(".jpg", annotated_img_np, encode_param)
    if not ok:
        print(f"Failed to encode annotated image to JPEG (original key: {original_s3_key}).")
        raise HTTPException(status_code=500, detail="Failed to encode annotated image to JPEG.")
    annotated_img_bytes = annotated_img_buf.tobytes()

    # 5. Construct S3 key for the annotated image and upload it
    original_filename = extract_filename_from_s3_key(original_s3_key)
    # Sanitize filename or create a unique one if original_filename is empty or problematic
    if not original_filename:
        original_filename = f"annotated_{uuid.uuid4().hex}.jpg" # Fallback filename
    
    # Append a suffix to distinguish from original, or use a different prefix
    base, ext = os.path.splitext(original_filename)
    annotated_filename = f"{base}_annotated{ext if ext else '.jpg'}" # Ensure extension

    annotated_s3_key = f"{ANNOTATED_IMAGE_S3_PREFIX.strip('/')}/{annotated_filename}"

    try:
        print(f"Uploading annotated image to S3 key: {annotated_s3_key}")
        uploaded_s3_url_str = put_s3_object_bytes(
            s3_key=annotated_s3_key,
            object_bytes=annotated_img_bytes,
            content_type='image/jpeg'
        )
    except PermissionError:
        print(f"PermissionError uploading annotated image to S3 key '{annotated_s3_key}'.")
        raise HTTPException(status_code=403, detail=f"Access denied for uploading annotated image to S3.")
    except RuntimeError as e:
        print(f"RuntimeError from s3_handler during upload (key: {annotated_s3_key}): {e}")
        raise HTTPException(status_code=503, detail=f"S3 service error during upload: {e}")
    except Exception as e:
        print(f"Unexpected error during S3 upload for annotated image (key: {annotated_s3_key}): {e}")
        raise HTTPException(status_code=500, detail="Failed to upload annotated image to S3: An unexpected error occurred.")

    # 6. Return diagnosis and S3 URL of the annotated image
    return DiagnosisResponse(
        diagnosis=diagnosis_result,
        annotatedImageS3Key=annotated_s3_key
    )

# --- Main Execution ---
if __name__ == "__main__":
    can_start = True
    if MODEL is None:
        print("CRITICAL: Application cannot start because the YOLO model failed to load. Please check logs.")
        can_start = False
    
    if s3_handler_client is None:
        print("CRITICAL: Application cannot start because the S3 client failed to initialize. Check AWS credentials/configuration and server logs.")
        can_start = False
    elif not S3_BUCKET_NAME: # Check if S3_BUCKET_NAME is None or empty
        print("CRITICAL: Application cannot start because S3_BUCKET_NAME environment variable is not set or is empty.")
        print("Please set the S3_BUCKET_NAME environment variable.")
        can_start = False

    if can_start:
        print(f"Starting Beehive-Diagnosis API on http://0.0.0.0:8001")
        print(f"YOLO Model loaded successfully.")
        print(f"S3 Client initialized. Configured to use S3 bucket: '{S3_BUCKET_NAME}' (via s3_handler.py).")
        print(f"Annotated images will be uploaded to S3 prefix: '{ANNOTATED_IMAGE_S3_PREFIX}'")
        uvicorn.run(app, host="0.0.0.0", port=8001, reload=False) # reload=False for production
    else:
        print("Application startup failed due to critical errors listed above.")

