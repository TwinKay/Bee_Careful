import os
os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
os.environ["CUDA_VISIBLE_DEVICES"] = "3"

from ultralytics import settings, YOLO

# ---- 전역 W&B 활성화 (한 줄이면 충분) ----
settings["wandb"] = True

# ----------------------------- Configuration
ROOT_PATH = "/home/j-k12a203/hornet_1class_dataset"
DATA_YAML = os.path.join(ROOT_PATH, "data.yaml")

PRETRAINED = "yolov8n.pt"
EPOCHS     = 100
IMG_SIZE   = 640
BATCH_SIZE = 16
PROJECT    = "Hornet"
NAME       = "yolov8n_1class"


# ----------------------------- Train
def main():
    model = YOLO(PRETRAINED)
    model.train(
        data=DATA_YAML,
        epochs=EPOCHS,
        imgsz=IMG_SIZE,
        batch=BATCH_SIZE,
        project=PROJECT,
        name=NAME,
        exist_ok=True,
        pretrained=True,

    )
    print(f"Training complete. Results: {os.path.join(PROJECT, NAME)}")

if __name__ == "__main__":
    main()
