# FastAPI application for beehive diagnosis, using a single-bucket S3 handler.

import uvicorn
import json
import uuid

import cv2
import numpy as np
from fastapi import FastAPI, Body, HTTPException
from pydantic import BaseModel
from starlette.responses import Response

# Import from the bee_analyzer module
from bee_analyzer import load_model, analyze_bee_image
# Import from the s3_handler module
# We still import S3_BUCKET_NAME to check its configuration at startup for clarity,
# even though get_s3_object_bytes no longer takes it as an argument.
from s3_handler import get_s3_object_bytes, S3_BUCKET_NAME, s3_client as s3_handler_client

# --- Application Setup ---
app = FastAPI(title="Beehive-Diagnosis API with Single S3 Bucket")

# Load the model when the application starts
try:
    MODEL = load_model()
except Exception as e:
    print(f"FATAL: Could not load YOLO model: {e}")
    MODEL = None

# --- Request Models ---
class DiagnosisRequest(BaseModel):
    s3Key: str # S3 key for the image

# --- API Endpoints ---
@app.post("/beehives/diagnosis")
async def diagnose_beehive(body: DiagnosisRequest = Body(...)):
    """
    Receives an S3 key, downloads the image from the pre-configured S3 bucket,
    performs bee disease diagnosis, and returns the diagnosis results along
    with the annotated image.
    """
    if MODEL is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Service unavailable.")

    # Check if S3 client and bucket name are configured (from s3_handler)
    if s3_handler_client is None:
        raise HTTPException(status_code=503, detail="S3 client not initialized. Check server logs for AWS configuration issues.")
    if not S3_BUCKET_NAME or S3_BUCKET_NAME == "your-default-bucket-name":
        print(f"Error: S3_BUCKET_NAME is not configured correctly in s3_handler.py or environment variables. Current value: {S3_BUCKET_NAME}")
        raise HTTPException(status_code=500, detail="S3 bucket not configured on server. Check server logs.")

    # 1. Download the image from S3 using the simplified s3_handler function
    try:
        print(f"Received request to diagnose image with S3 key: {body.s3Key} (from bucket: {S3_BUCKET_NAME})")
        # The bucket_name argument is no longer needed here
        img_bytes = get_s3_object_bytes(body.s3Key)
    except FileNotFoundError as e:
        # Log the specific key and bucket for easier debugging on the server
        print(f"FileNotFoundError for key '{body.s3Key}' in bucket '{S3_BUCKET_NAME}': {e}")
        raise HTTPException(status_code=404, detail=f"Image not found in S3 with key: {body.s3Key}")
    except PermissionError as e:
        print(f"PermissionError for key '{body.s3Key}' in bucket '{S3_BUCKET_NAME}': {e}")
        raise HTTPException(status_code=403, detail=f"Access denied for S3 object with key: {body.s3Key}")
    except RuntimeError as e: # Catches S3 client/config issues from s3_handler
        print(f"RuntimeError from s3_handler (key: {body.s3Key}): {e}")
        raise HTTPException(status_code=503, detail=f"S3 service error: {e}")
    except Exception as e: # Catch-all for other S3 or unexpected errors
        print(f"An unexpected error occurred during S3 download for key '{body.s3Key}': {e}")
        raise HTTPException(status_code=500, detail=f"Failed to download image from S3: An unexpected error occurred.")

    # 2. Decode the image
    try:
        img_np = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)
        if img_np is None:
            # This could happen if the S3 object is not a valid image file or is corrupted.
            print(f"Failed to decode image from S3 (key: {body.s3Key}). The file might be corrupted or not a supported image format.")
            raise HTTPException(status_code=415, detail="Unsupported image format or corrupt image downloaded from S3.")
    except Exception as e: # Catch potential errors from cv2.imdecode or np.frombuffer
        print(f"Error decoding image (key: {body.s3Key}): {e}")
        raise HTTPException(status_code=415, detail=f"Could not decode image from S3: {e}")

    # 3. Perform analysis using the bee_analyzer module
    try:
        diagnosis_result, annotated_img_np = analyze_bee_image(MODEL, img_np)
    except RuntimeError as e: # Model prediction errors
        print(f"Model inference error for image (key: {body.s3Key}): {e}")
        raise HTTPException(status_code=500, detail=f"Model inference error: {e}")
    except ValueError as e: # Image processing errors (e.g., null image to analyzer)
        print(f"Image processing error for image (key: {body.s3Key}): {e}")
        raise HTTPException(status_code=400, detail=f"Image processing error: {e}")
    except Exception as e:
        print(f"Unexpected error during image analysis (key: {body.s3Key}): {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred during image analysis.")

    # 4. Encode the annotated image to JPEG
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
    ok, buf = cv2.imencode(".jpg", annotated_img_np, encode_param)
    if not ok:
        print(f"Failed to encode annotated image to JPEG (key: {body.s3Key}).")
        raise HTTPException(status_code=500, detail="Failed to encode annotated image to JPEG.")

    # 5. Prepare multipart response
    boundary = uuid.uuid4().hex
    multipart_content = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="diagnosis"\r\n'
        'Content-Type: application/json\r\n\r\n'
        f"{json.dumps(diagnosis_result, ensure_ascii=False)}\r\n"
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="image"; filename="annotated.jpg"\r\n'
        'Content-Type: image/jpeg\r\n\r\n'
    ).encode() + buf.tobytes() + f"\r\n--{boundary}--\r\n".encode()

    return Response(multipart_content, media_type=f"multipart/form-data; boundary={boundary}")

# --- Main Execution ---
if __name__ == "__main__":
    # Perform startup checks
    can_start = True
    if MODEL is None:
        print("CRITICAL: Application cannot start because the YOLO model failed to load. Please check logs.")
        can_start = False
    
    # Check S3 configuration from s3_handler
    if s3_handler_client is None:
        print("CRITICAL: Application cannot start because the S3 client failed to initialize. Check AWS credentials/configuration and server logs.")
        can_start = False
    elif not S3_BUCKET_NAME:
        print(f"CRITICAL: Application cannot start because S3_BUCKET_NAME is not configured correctly.")
        print("Please set the S3_BUCKET_NAME environment variable or update the placeholder in s3_handler.py.")
        can_start = False

    if can_start:
        print(f"Starting Beehive-Diagnosis API on http://0.0.0.0:8001")
        print(f"YOLO Model loaded successfully.")
        print(f"S3 Client initialized. Configured to use S3 bucket: '{S3_BUCKET_NAME}' (via s3_handler.py).")
        uvicorn.run(app, host="0.0.0.0", port=8001)
    else:
        print("Application startup failed due to critical errors listed above.")

