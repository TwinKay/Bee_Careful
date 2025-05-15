# 기본 이미지 선택 (Python 3.10-slim)
# Use an official Python runtime as a parent image
FROM python:3.10-slim

# OpenCV 및 기타 필요한 OS 패키지 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 애플리케이션을 위한 작업 디렉토리 설정
WORKDIR /app

# requirements.txt를 먼저 복사하고 의존성 설치 (Docker 레이어 캐싱 활용)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 소스 코드 복사
COPY main.py .
COPY bee_analyzer.py .
COPY s3_handler.py .

# 애플리케이션이 실행될 포트 지정
EXPOSE 8001

# 컨테이너 시작 시 실행될 명령
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
