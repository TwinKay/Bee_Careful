# S12P31A203 Infra

원래는 본 레포지토리(source code repository)와 분리된 별도의 레포지토리에 있던 폴더였으나 산출물 제출을 위해 여기에 포함하게 되었습니다.

## 주요 파일 설명

- `Jenkinsfile`: CI/CD 파이프라인. 일부 민감한 값들 마스킹함.
- `.env`: 모든 환경 변수를 명시한 파일. 일부 민감한 값들 마스킹함.
- `docker-compose.infra.yaml`: Jenkins, Nginx 컨테이너들을 정의한 docker compose 파일. ec2 instance에서 수동으로 `docker compose up`을 통해 실행.
- `docker-compose.application.yaml`: 서비스 컨테이너들을 정의한 docker compose 파일. `Jenkinsfile`에서 마지막에 실행함.
