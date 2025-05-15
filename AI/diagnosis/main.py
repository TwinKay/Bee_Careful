import uvicorn
import json
import uuid
import ssl # For handling SSL errors during image download
from typing import Dict # Keep for type hinting if needed elsewhere

import cv2
import numpy as np
import httpx # Asynchronous HTTP client
from fastapi import FastAPI, Body, HTTPException
from pydantic import BaseModel, HttpUrl # For request body validation
from starlette.responses import Response # For custom multipart response

# Import from the new bee_analyzer module
from bee_analyzer import load_model, analyze_bee_image

# --- Application Setup ---
app = FastAPI(title="Beehive-Diagnosis API")

# Load the model when the application starts
# This ensures the model is loaded only once, not on every request
try:
    MODEL = load_model()
except Exception as e:
    # If model loading fails, the app shouldn't start or should be in a degraded state.
    # For simplicity, we print and raise, which will stop FastAPI startup if unhandled.
    print(f"FATAL: Could not load YOLO model: {e}")
    # Depending on deployment, you might want a more robust error handling or health check here.
    MODEL = None # Or raise an error to prevent app startup
    # raise RuntimeError(f"Failed to load model: {e}") # Uncomment to make startup fail

# --- Request Models ---
class DiagnosisRequest(BaseModel):
    url: HttpUrl # Validates that the input is a valid HTTP/HTTPS URL

# --- API Endpoints ---
@app.post("/beehives/diagnosis")
async def diagnose_beehive(body: DiagnosisRequest = Body(...)):
    """
    Receives an image URL, downloads the image, performs bee disease diagnosis,
    and returns the diagnosis results along with the annotated image.
    """
    if MODEL is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Service unavailable.")

    # 1. Download the image
    try:
        async with httpx.AsyncClient(timeout=20.0) as client: # Increased timeout
            response = await client.get(str(body.url))
            response.raise_for_status()  # Raises HTTPStatusError for 4xx/5xx responses
            img_bytes = response.content
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Image download timed out.")
    except httpx.RequestError as e: # Catches network errors, DNS failures, etc.
        raise HTTPException(status_code=400, detail=f"Failed to download image: Network error - {e}")
    except httpx.HTTPStatusError as e: # Catches 4xx/5xx errors from the image server
        raise HTTPException(status_code=e.response.status_code, detail=f"Failed to download image: Server error - {e.response.text[:200]}") # Include part of server error
    except ssl.SSLError as e: # Specifically catch SSL errors
        raise HTTPException(status_code=400, detail=f"Failed to download image: SSL error - {e}")
    except Exception as e: # Catch-all for other unexpected errors during download
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during image download: {e}")


    # 2. Decode the image
    img_np = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)
    if img_np is None:
        raise HTTPException(status_code=415, detail="Unsupported image format or corrupt image.")

    # 3. Perform analysis using the bee_analyzer module
    try:
        diagnosis_result, annotated_img_np = analyze_bee_image(MODEL, img_np)
    except RuntimeError as e: # Catch errors from analyze_bee_image (e.g., model prediction)
        raise HTTPException(status_code=500, detail=f"Model inference error: {e}")
    except ValueError as e: # Catch errors like null image input
        raise HTTPException(status_code=400, detail=f"Image processing error: {e}")
    except Exception as e: # General catch-all for unexpected errors in analysis
        # It's good practice to log this error server-side for debugging
        print(f"Unexpected error during image analysis: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred during image analysis.")


    # 4. Encode the annotated image to JPEG
    # Using JPEG quality 90 as in the original code
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
    ok, buf = cv2.imencode(".jpg", annotated_img_np, encode_param)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to encode annotated image to JPEG.")

    # 5. Prepare multipart response
    # This part remains the same as it's about response formatting
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
    # Standard uvicorn server startup
    # Host "0.0.0.0" makes it accessible on the network
    # Port 8001 as specified
    if MODEL is None:
        print("Application cannot start because the model failed to load. Please check logs.")
    else:
        print("Starting Beehive-Diagnosis API on http://0.0.0.0:8001")
        uvicorn.run(app, host="0.0.0.0", port=8001)
