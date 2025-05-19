# This module contains the core logic for bee disease analysis using a YOLO model.

import cv2
import numpy as np
from ultralytics import YOLO
from typing import Dict, Tuple
import json

# --- Constants ---
MODEL_PATH = "https://huggingface.co/Twinkay/BEE_DISEASE/resolve/main/bee_disease.pt"

CLASS_NAMES = [
    "유충_정상", "유충_응애", "유충_석고병", "유충_부저병",
    "성충_정상", "성충_응애", "성충_날개불구바이러스감염증",
]

COLOR_MAP = {
    "성충_응애": (229, 115, 115),          # BGR format for OpenCV
    "성충_날개불구바이러스감염증": (255, 183, 77),
    "유충_응애": (199, 165, 255),
    "유충_석고병": (129, 199, 132),
    "유충_부저병": (100, 181, 246),
}

SKIP_DRAW = {"유충_정상", "성충_정상"}

# --- Model Loading ---
def load_model(model_path: str = MODEL_PATH) -> YOLO:
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
        "larva": {"normalCount": 0, "varroaCount": 0,
                  "foulBroodCount": 0, "chalkBroodCount": 0},
        "imago": {"normalCount": 0, "varroaCount": 0, "dwvCount": 0},
    }

# --- Image Analysis and Annotation ---
def analyze_bee_image(model: YOLO, img_np: np.ndarray) -> Tuple[Dict[str, Dict[str, int]], np.ndarray]:
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
        if not predictions or not hasattr(predictions[0], 'boxes'):
            # Handle cases where predictions might be empty or not in the expected format
            print("Warning: Model returned no predictions or unexpected format.")
            return get_empty_diagnosis(), img_np.copy()
        pred = predictions[0] # Process the first result
    except Exception as e:
        # Log the error and re-raise or handle as appropriate
        print(f"Error during model prediction: {e}")
        raise RuntimeError(f"Model prediction failed: {e}")


    diagnosis = get_empty_diagnosis()
    annotated_img = img_np.copy()  # Work on a copy to keep the original intact
    height, width = annotated_img.shape[:2]

    # Ensure predictions.boxes.xyxy and predictions.boxes.cls are available and not None
    if pred.boxes is None or pred.boxes.xyxy is None or pred.boxes.cls is None:
        print("Warning: Predictions do not contain bounding boxes or class information.")
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
        if cls_id < 0 or cls_id >= len(CLASS_NAMES):
            print(f"Warning: Detected class ID {cls_id} is out of bounds for CLASS_NAMES.")
            continue # Skip this detection

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
        else: # 성충
            if cls_name == "성충_정상":
                diagnosis["imago"]["normalCount"] += 1
            elif cls_name == "성충_응애":
                diagnosis["imago"]["varroaCount"] += 1
            elif cls_name == "성충_날개불구바이러스감염증":
                diagnosis["imago"]["dwvCount"] += 1

        # Draw bounding boxes on the image, skip normal ones
        if cls_name in SKIP_DRAW:
            continue

        x1, y1, x2, y2 = xyxy
        if (x1 < 0 or x2 >= width or y1 < 0 or y2 >= height):
            print(f"Box out of bounds: ({x1}, {y1}, {x2}, {y2}) for image size {width}x{height}")

        color = COLOR_MAP.get(cls_name, (255, 255, 255))  # Default to white if color not mapped
        cv2.rectangle(annotated_img, (x1, y1), (x2, y2), color, 2)
        # Optionally, add text (label) - uncomment if needed
        # cv2.putText(annotated_img, cls_name, (x1, y1 - 8),
        #             cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    return diagnosis, annotated_img

if __name__ == '__main__':
    # Example usage (optional, for testing the module directly)
    # This requires a sample image and the model to be accessible.
    print("Testing bee_analyzer module...")
    try:
        test_model = load_model()
        # Create a dummy image for testing if you don't have one readily available
        # For a real test, replace with: 
        test_image_np = cv2.imread("test.jpg")
        # test_image_np = np.zeros((640, 640, 3), dtype=np.uint8) # Example: 640x640 black image
        if test_image_np is None or test_image_np.size == 0:
             print("Failed to load or create a test image.")
        else:
            print(f"Test image shape: {test_image_np.shape}")
            diagnosis_result, annotated_result_img = analyze_bee_image(test_model, test_image_np)
            print("\nDiagnosis Result:")
            print(json.dumps(diagnosis_result, indent=2, ensure_ascii=False))
            print(f"\nAnnotated image shape: {annotated_result_img.shape}")
            # Optionally, save or display the annotated image
            # cv2.imwrite("test_annotated_image.jpg", annotated_result_img)
            # print("Test annotated image saved as test_annotated_image.jpg")
    except Exception as e:
        print(f"Error during module self-test: {e}")

