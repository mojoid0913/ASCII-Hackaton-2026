# 파일명: main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import google.generativeai as genai
import os
import datetime
import json
from google.generativeai.types import HarmCategory, HarmBlockThreshold

# --- 설정 ---
DB_URL = os.getenv("DB_URL")
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# 💡 안전 설정 추가: "위험한 말이라도 차단하지 마라" (스미싱 분석용 필수)
safety_settings = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}
model = genai.GenerativeModel('gemini-1.5-pro', safety_settings=safety_settings)

app = FastAPI()

# --- DB 모델 ---
class ScanLog(Base):
    __tablename__ = "scan_logs"
    id = Column(Integer, primary_key=True, index=True)
    sender = Column(String(50))
    content = Column(Text)
    risk_score = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

Base.metadata.create_all(bind=engine)

# --- 요청 모델 ---
class SmsRequest(BaseModel):
    sender: str
    content: str

# --- 기능 함수 ---
def run_selenium_check(url_or_phone: str):
    """가상 모니터에서 Chrome 실행"""
    print("🖥️ Chrome (No-headless) 시작...")
    options = webdriver.ChromeOptions()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    # headless 옵션 없음! (Xvfb 덕분에 화면 있는 것처럼 돔)

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    try:
        # 여기에 경찰청이나 더치트 조회 로직 구현
        # driver.get("https://...") 
        driver.get("https://www.google.com") # 테스트용
        title = driver.title
        print(f"접속 성공: {title}")
        return True # 예시
    except Exception as e:
        print(f"Selenium Error: {e}")
        return False
    finally:
        driver.quit()

@app.post("/analyze")
async def analyze(req: SmsRequest):
    # 1. Gemini 분석
    prompt = f"다음 문자 메시지의 스미싱(사기) 위험도를 0에서 100 사이의 숫자만으로 응답해. 부연 설명 하지마.\n\n문자내용: '{req.content}'"
    
    print(f"📡 Gemini 요청: {req.content[:20]}...") # 로그 확인용

    try:
        response = model.generate_content(prompt)
        
        # 디버깅: Gemini가 뭐라고 대답했는지 로그에 찍기
        print(f"🤖 Gemini 응답 원본: {response.text}") 
        
        # 숫자만 추출 (예: "위험도는 90입니다" -> 90)
        score_str = ''.join(filter(str.isdigit, response.text))
        
        if not score_str:
            print("⚠️ 숫자 추출 실패! 기본값 50 설정")
            score = 50
        else:
            score = int(score_str)

    except Exception as e:
        # 에러가 나면 로그에 자세히 찍고, 클라이언트에는 500 에러 대신 결과를 줌
        print(f"❌ Gemini 치명적 에러: {e}")
        # (선택) 에러나도 서버가 안 죽게 하려면 아래 주석 해제
        # score = 50 
        raise HTTPException(status_code=500, detail=f"Gemini Error: {str(e)}")

    # ... (이하 DB 저장 로직 동일)
    db = SessionLocal()
    log = ScanLog(sender=req.sender, content=req.content, risk_score=score)
    db.add(log)
    db.commit()
    db.close()

    return {"risk_score": score, "message": "분석 완료"}
