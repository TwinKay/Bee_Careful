# 기본 이미지 선택 (Python + 가상환경 지원)
FROM python:3.10-slim

# OpenCV를 위한 OS 패키지 설치
RUN apt-get update && apt-get install -y \
    libglib2.0-0 libsm6 libxext6 libxrender-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# 필요 파일 복사
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# 포트 개방
EXPOSE 8001

# 실행 명령
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
