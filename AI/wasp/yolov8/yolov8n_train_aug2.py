import os
os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
os.environ["CUDA_VISIBLE_DEVICES"] = "3"

from ultralytics import settings, YOLO

# ---- 전역 W&B 활성화 (한 줄이면 충분) ----
settings["wandb"] = True

# ----------------------------- Configuration
ROOT_PATH = "/home/j-k12a203/hornet_dataset"
DATA_YAML = os.path.join(ROOT_PATH, "data.yaml")

PRETRAINED = "yolov8n.pt"
EPOCHS     = 100
IMG_SIZE   = 640
BATCH_SIZE = 16
PROJECT    = "Hornet"
NAME       = "yolov8n_aug2"

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

        # ────────────── 여기를 추가 ──────────────
        augment=True,              # manual augment 활성화
        auto_augment=None,       # randaugment 대신 수동 설정만 사용
        hsv_h=0.03,                # 색상 변화 폭↑
        hsv_s=1.0,                 # 채도 변화 폭↑
        hsv_v=1.0,                 # 명도 변화 폭↑

        degrees=45.0,              # 회전 각도↑
        translate=0.2,             # 이동 비율↑
        scale=0.75,                # 스케일 변화 범위↑
        shear=10.0,                # 전단(tilt) 각도↑
        perspective=0.2,           # 원근 왜곡↑

        fliplr=0.5,                # 수평 뒤집기
        flipud=0.3,                # 수직 뒤집기↑

        mosaic=1.0,                # Mosaic 사용 (100% 확률)
        mixup=0.5,                 # MixUp 사용
        cutmix=0.5,                # CutMix 사용 추가
        copy_paste=0.5,            # Copy-Paste 사용

        erasing=0.6,               # Random Erasing (확률↑)

    )


if __name__ == "__main__":
    main()