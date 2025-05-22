import os
os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
os.environ["CUDA_VISIBLE_DEVICES"] = "4"

from ultralytics import settings, YOLO

# ---- 전역 W&B 활성화 (한 줄이면 충분) ----
settings["wandb"] = True

# ----------------------------- Configuration
ROOT_PATH = "/home/j-k12a203/hornet_dataset_back"
DATA_YAML = os.path.join(ROOT_PATH, "data.yaml")

PRETRAINED = "yolov8n.pt"
EPOCHS     = 100
IMG_SIZE   = 1280
BATCH_SIZE = 16
PROJECT    = "Hornet"
NAME       = "yolov8n_aug_multi_scale_1280_back"

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
        multi_scale=True,

    
        # ────────────── 여기를 추가 ──────────────
        augment=True,            # augmentation 활성화
        auto_augment=None,       # randaugment 대신 수동 설정만 사용
        hsv_h=0.015,             # 색상 변경 폭
        hsv_s=0.7,               # 채도 변경 폭
        hsv_v=0.4,               # 명도 변경 폭
        degrees=10.0,            # 회전 각도
        translate=0.1,           # 이동 비율
        scale=0.9,               # 스케일 변화 범위
        shear=2.0,               # 전단 각도
        perspective=0.0,         # 원근 왜곡
        flipud=0.1,              # 수직 뒤집기 확률
        fliplr=0.5,              # 수평 뒤집기 확률
        mosaic=1.0,              # 모자이크 확률
        mixup=0.5,               # MixUp 확률
        copy_paste=0.5,          # Copy-Paste 확률
    )


if __name__ == "__main__":
    main()