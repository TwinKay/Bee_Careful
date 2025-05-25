# This module contains the core logic for bee disease analysis using a YOLO model.

import os
import cv2
import numpy as np
from ultralytics import YOLO
from typing import Dict, Tuple
import json

# --- S3 Configuration ---
# Read custom environment variables for AWS credentials and bucket name
# These will be read from the actual environment, which includes .env variables if loaded.
BEE_DISEASE_MODEL_PATH = os.environ.get("BEE_DISEASE_MODEL_PATH")

# --- Constants ---
CLASS_NAMES = [
    "유충_정상",
    "유충_응애",
    "유충_석고병",
    "유충_부저병",
    "성충_정상",
    "성충_응애",
    "성충_날개불구바이러스감염증",
]

COLOR_MAP = {
    "성충_응애": (229, 115, 115),  # BGR format for OpenCV
    "성충_날개불구바이러스감염증": (255, 183, 77),
    "유충_응애": (199, 165, 255),
    "유충_석고병": (129, 199, 132),
    "유충_부저병": (100, 181, 246),
}

SKIP_DRAW = {"유충_정상", "성충_정상"}


# --- Model Loading ---
def load_model(model_path: str = BEE_DISEASE_MODEL_PATH) -> YOLO:
    """
    Loads the YOLO model from the specified path.

    Args:
        model_path (str): The path or URL to the YOLO model file.

    Returns:
        YOLO: The loaded YOLO model object.
    """
    print(f"Loading model from: {model_path}")
    model = YOLO(model_path)
    print("Model loaded successfully.")
    return model


# --- Diagnosis Structure ---
def get_empty_diagnosis() -> Dict[str, Dict[str, int]]:
    """
    Returns an empty structure for storing diagnosis counts.

    Returns:
        Dict[str, Dict[str, int]]: A dictionary initialized with zero counts for
                                     larva and imago categories.
    """
    return {
        "larva": {
            "normalCount": 0,
            "varroaCount": 0,
            "foulBroodCount": 0,
            "chalkBroodCount": 0,
        },
        "imago": {"normalCount": 0, "varroaCount": 0, "dwvCount": 0},
    }


# --- Image Analysis and Annotation ---
def analyze_bee_image(
    model: YOLO, img_np: np.ndarray, skip_normal: bool = True
) -> Tuple[Dict[str, Dict[str, int]], np.ndarray]:
    """
    Analyzes a bee image using the YOLO model, generates a diagnosis,
    and annotates the image with detections.

    Args:
        model (YOLO): The loaded YOLO model.
        img_np (np.ndarray): The input image as a NumPy array (in BGR format).

    Returns:
        Tuple[Dict[str, Dict[str, int]], np.ndarray]:
            - A dictionary containing the diagnosis counts.
            - The annotated image as a NumPy array (in BGR format).
    """
    if img_np is None:
        raise ValueError("Input image cannot be None.")

    # Perform prediction
    # The model is expected to be called with verbose=False as in the original code
    try:
        predictions = model(img_np, verbose=False)
        if not predictions or not hasattr(predictions[0], "boxes"):
            # Handle cases where predictions might be empty or not in the expected format
            print("Warning: Model returned no predictions or unexpected format.")
            return get_empty_diagnosis(), img_np.copy()
        pred = predictions[0]  # Process the first result
    except Exception as e:
        # Log the error and re-raise or handle as appropriate
        print(f"Error during model prediction: {e}")
        raise RuntimeError(f"Model prediction failed: {e}")

    diagnosis = get_empty_diagnosis()
    annotated_img = img_np.copy()  # Work on a copy to keep the original intact
    height, width = annotated_img.shape[:2]
    print(width, height)

    # Ensure predictions.boxes.xyxy and predictions.boxes.cls are available and not None
    if pred.boxes is None or pred.boxes.xyxy is None or pred.boxes.cls is None:
        print(
            "Warning: Predictions do not contain bounding boxes or class information."
        )
        return diagnosis, annotated_img

    try:
        xyxy_coords = pred.boxes.xyxy.cpu().numpy().astype(int)
        class_ids = pred.boxes.cls.cpu().numpy().astype(int)
    except Exception as e:
        print(f"Error processing prediction tensors: {e}")
        # Depending on the error, you might return or raise
        return diagnosis, annotated_img

    print(f"Detected Counts: {len(pred.boxes)}")

    for xyxy, cls_id in zip(xyxy_coords, class_ids):
        print(xyxy, cls_id)
        if cls_id < 0 or cls_id >= len(CLASS_NAMES):
            print(
                f"Warning: Detected class ID {cls_id} is out of bounds for CLASS_NAMES."
            )
            continue  # Skip this detection

        cls_name = CLASS_NAMES[cls_id]

        # Populate diagnosis dictionary
        if cls_name.startswith("유충"):
            if cls_name == "유충_정상":
                diagnosis["larva"]["normalCount"] += 1
            elif cls_name == "유충_응애":
                diagnosis["larva"]["varroaCount"] += 1
            elif cls_name == "유충_부저병":
                diagnosis["larva"]["foulBroodCount"] += 1
            elif cls_name == "유충_석고병":
                diagnosis["larva"]["chalkBroodCount"] += 1
        else:  # 성충
            if cls_name == "성충_정상":
                diagnosis["imago"]["normalCount"] += 1
            elif cls_name == "성충_응애":
                diagnosis["imago"]["varroaCount"] += 1
            elif cls_name == "성충_날개불구바이러스감염증":
                diagnosis["imago"]["dwvCount"] += 1

        # Draw bounding boxes on the image, skip normal ones
        if skip_normal and cls_name in SKIP_DRAW:
            print("SKIP_DRAW")
            continue

        x1, y1, x2, y2 = xyxy
        if x1 < 0 or x2 > width or y1 < 0 or y2 > height:
            print(
                f"Box out of bounds: ({x1}, {y1}, {x2}, {y2}) for image size {width}x{height}"
            )

        color = COLOR_MAP.get(
            cls_name, (255, 255, 255)
        )  # Default to white if color not mapped
        cv2.rectangle(annotated_img, (x1, y1), (x2, y2), color, 6)
        # Optionally, add text (label) - uncomment if needed
        # cv2.putText(annotated_img, cls_name, (x1, y1 - 8),
        #             cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    return diagnosis, annotated_img


if __name__ == "__main__":
    try:
        from dotenv import load_dotenv

        load_dotenv()
        print("Loaded .env file.")
    except ImportError:
        print("Install python-dotenv for local development.")
    except Exception as e:
        print(f"Error loading .env file: {e}")

    print("Testing bee_analyzer module with batch images...")
    test_img_dir = "test_img"
    analyzed_img_dir = "analyzed_img"

    os.makedirs(analyzed_img_dir, exist_ok=True)

    try:
        test_model = load_model(os.environ.get("BEE_DISEASE_MODEL_PATH"))
    except Exception as e:
        print(f"Failed to load model: {e}")
        exit(1)

    image_files = [f for f in os.listdir(test_img_dir)]

    if not image_files:
        print(f"No image files found in {test_img_dir}")
        exit(1)

    for fname in image_files:
        fpath = os.path.join(test_img_dir, fname)
        print(f"\nProcessing: {fname}")
        img_np = cv2.imread(fpath)
        if img_np is None or img_np.size == 0:
            print(f"  Failed to load image: {fname}")
            continue
        try:
            diagnosis_result, annotated_img = analyze_bee_image(
                test_model, img_np, False
            )
            print("  Diagnosis Result:")
            print(json.dumps(diagnosis_result, indent=2, ensure_ascii=False))
            out_path = os.path.join(analyzed_img_dir, fname)
            cv2.imwrite(out_path, annotated_img)
            print(f"  Annotated image saved as: {out_path}")
        except Exception as e:
            print(f"  Error processing {fname}: {e}")
