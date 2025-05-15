import uvicorn
import json, uuid, ssl
from typing import Dict

import cv2, numpy as np, httpx
from fastapi import FastAPI, Body, HTTPException
from pydantic import BaseModel, HttpUrl
from starlette.responses import Response
from ultralytics import YOLO


MODEL_PATH = "https://huggingface.co/Twinkay/BEE_DISEASE/resolve/main/bee_disease.pt"
model = YOLO(MODEL_PATH)

CLASS_NAMES = [
    "유충_정상", "유충_응애", "유충_석고병", "유충_부저병",
    "성충_정상", "성충_응애", "성충_날개불구바이러스감염증",
]

COLOR_MAP = {
    "성충_응애": (229, 115, 115),
    "성충_날개불구바이러스감염증": (255, 183, 77),
    "유충_응애": (199, 165, 255),
    "유충_석고병": (129, 199, 132),
    "유충_부저병": (100, 181, 246),
}

SKIP_DRAW = {"유충_정상", "성충_정상"}

def empty_diagnosis() -> Dict[str, Dict[str, int]]:
    return {
        "larva": {"normalCount": 0, "varroaCount": 0,
                  "foulBroodCount": 0, "chalkBroodCount": 0},
        "imago": {"normalCount": 0, "varroaCount": 0, "dwvCount": 0},
    }

class DiagnosisRequest(BaseModel):
    url: HttpUrl

app = FastAPI(title="Beehive-Diagnosis API")

@app.post("/beehives/diagnosis")
async def diagnose_beehive(body: DiagnosisRequest = Body(...)):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(str(body.url))
            r.raise_for_status()
            img_bytes = r.content
    except (httpx.RequestError, httpx.HTTPStatusError, ssl.SSLError) as e:
        raise HTTPException(400, f"이미지 다운로드 실패: {e}")

    img_np = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)
    if img_np is None:
        raise HTTPException(415, "지원하지 않는 이미지 형식")

    try:
        pred = model(img_np, verbose=False)[0]
    except Exception as e:
        raise HTTPException(500, f"모델 추론 오류: {e}")

    diagnosis = empty_diagnosis()

    for xyxy, cls_id in zip(
        pred.boxes.xyxy.cpu().numpy().astype(int),
        pred.boxes.cls.cpu().numpy().astype(int)
    ):
        cls_name = CLASS_NAMES[cls_id]

        if cls_name.startswith("유충"):
            if cls_name == "유충_정상":
                diagnosis["larva"]["normalCount"] += 1
            elif cls_name == "유충_응애":
                diagnosis["larva"]["varroaCount"] += 1
            elif cls_name == "유충_부저병":
                diagnosis["larva"]["foulBroodCount"] += 1
            elif cls_name == "유충_석고병":
                diagnosis["larva"]["chalkBroodCount"] += 1
        else:
            if cls_name == "성충_정상":
                diagnosis["imago"]["normalCount"] += 1
            elif cls_name == "성충_응애":
                diagnosis["imago"]["varroaCount"] += 1
            elif cls_name == "성충_날개불구바이러스감염증":
                diagnosis["imago"]["dwvCount"] += 1

        if cls_name in SKIP_DRAW:
            continue

        x1, y1, x2, y2 = xyxy
        color = COLOR_MAP.get(cls_name, (255, 255, 255))
        cv2.rectangle(img_np, (x1, y1), (x2, y2), color, 2)
        # cv2.putText(img_np, cls_name, (x1, y1 - 8),
        #             cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    ok, buf = cv2.imencode(".jpg", img_np, [cv2.IMWRITE_JPEG_QUALITY, 90])
    if not ok:
        raise HTTPException(500, "OpenCV JPEG 인코딩 실패")

    boundary = uuid.uuid4().hex
    multipart = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="diagnosis"\r\n'
        'Content-Type: application/json\r\n\r\n'
        f"{json.dumps(diagnosis, ensure_ascii=False)}\r\n"
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="image"; filename="annotated.jpg"\r\n'
        'Content-Type: image/jpeg\r\n\r\n'
    ).encode() + buf.tobytes() + f"\r\n--{boundary}--\r\n".encode()

    return Response(multipart, media_type=f"multipart/form-data; boundary={boundary}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
