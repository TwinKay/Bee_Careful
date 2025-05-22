## 배포 환경

### 구성 요소

1. ec2 instance
  1. Jenkins
  2. Nginx
  3. Java Spring Boot server
    1. JDK 17
2. AWS S3
  1. 유저가 업로드한 원본 사진 및 진단 완료된 사진 보관
3. AWS lambda
  1. AWS S3의 업로드 완료 이벤트 서버로 송신

### 배포 방법

1. ec2 instance에서 본 레포지토리 클론
2. `/infra/docker-compose.infra.yaml`을 `docker compose up`를 사용하여 실행
3. 이후 Jenkins(8080 포트)에 접속하여 파이프라인 추가
  1. 본 레포지토리를 클론하여 실행되도록 구성
  2. Jenkinsfile의 위치는 `/infra/Jeninsfile`로 지정
4. Jenkins UI 상으로 파이프라인 수동 실행 혹은 웹훅 트리거 설정하여 자동 빌드 및 배포 되도록 설정
