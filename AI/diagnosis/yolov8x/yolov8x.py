import os
os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
os.environ["CUDA_VISIBLE_DEVICES"] = "3"
import yaml

# ─────────────── CUDA 설정 ───────────────

from ultralytics import YOLO, settings


# ─────────────── W&B 설정 ───────────────
settings["wandb"] = True  # 전역 W&B 로깅 활성화


# ─────────────── 경로 & 클래스 정의 ───────────────
BASE = "/home/j-k12a203/aihub"
paths = {
    "train": os.path.join(BASE, "image/train"),
    "val":   os.path.join(BASE, "image/val"),
    "test":  os.path.join(BASE, "image/test")
}
class_names = [
    "유충_정상", "유충_응애", "유충_석고병", "유충_부저병",
    "성충_정상", "성충_응애", "성충_날개불구바이러스감염증"
]

# ─────────────── YAML 파일 생성 ───────────────
data_yaml = "data_hornet.yaml"
with open(data_yaml, "w") as f:
    yaml.safe_dump({
        "train": paths["train"],
        "val":   paths["val"],
        "test":  paths["test"],
        "names": {i: n for i, n in enumerate(class_names)}
    }, f)

# ─────────────── 하이퍼파라미터 ───────────────
PRETRAINED  = "yolov8x.pt"
EPOCHS      = 100
IMG_SIZE    = 1024
BATCH_SIZE  = 16
PROJECT     = "Disease"
RUN_NAME    = "yolov8x"

def main():
    # 모델 로드ㅋ
    model = YOLO("/home/j-k12a203/hornet/Disease/yolov8x/weights/last.pt")

    # 학습
    model.train(
        data=data_yaml,      # 이제 문자열 경로를 넘깁니다
        epochs=EPOCHS,
        imgsz=IMG_SIZE,
        batch=BATCH_SIZE,
        project=PROJECT,
        name=RUN_NAME,
        resume=True,    



        exist_ok=True,
        pretrained=True,

        # Augment
        augment=True,
        auto_augment=None,
        hsv_h=0.015, hsv_s=0.7, hsv_v=0.4,
        degrees=10.0, translate=0.1, scale=0.5, shear=2.0, perspective=0.0,
        flipud=0.1, fliplr=0.5,
        mosaic=1.0, mixup=0.5, copy_paste=0.5
    )

    # 검증
    model.val()

if __name__ == "__main__":
    main()