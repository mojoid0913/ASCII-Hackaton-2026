# 파일명: Dockerfile
FROM python:3.9-slim

# 1. 필수 시스템 패키지 설치 (Chrome, Xvfb, MariaDB Client 등)
RUN apt-get update && apt-get install -y \
    wget unzip curl gnupg xvfb libxi6 \
    default-libmysqlclient-dev build-essential \
    && rm -rf /var/lib/apt/lists/*

# 2. 구글 크롬 설치 (Stable 버전)
# 앞에 'apt-get update'를 추가해서 지도를 다시 가져오게 함
RUN apt-get update && wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt-get install -y ./google-chrome-stable_current_amd64.deb \
    && rm google-chrome-stable_current_amd64.deb \
    && rm -rf /var/lib/apt/lists/*

# 3. 작업 디렉토리 설정
WORKDIR /app

# 4. 파이썬 패키지 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. 코드 복사
COPY . .

# 6. 실행 명령 (Xvfb 가상 모니터 켜고 -> 앱 실행)
CMD Xvfb :99 -screen 0 1920x1080x24 & export DISPLAY=:99 && uvicorn src.main:app --host 0.0.0.0 --port 8000
