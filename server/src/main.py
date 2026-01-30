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

# --- 설정 ---
DB_URL = os.getenv("DB_URL")
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-pro')

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
    prompt = f"문자내용: '{req.content}'. 스미싱 위험도를 0~100 숫자만 출력해."
    #try:
    response = model.generate_content(prompt)
    score = int(''.join(filter(str.isdigit, response.text)))
    #except:
        #score = 50 # 에러 시 기본값

    # 2. Selenium 조회 (URL이 있거나 필요시)
    # run_selenium_check(req.content) 

    # 3. DB 저장
    db = SessionLocal()
    log = ScanLog(sender=req.sender, content=req.content, risk_score=score)
    db.add(log)
    db.commit()
    db.close()

    return {"risk_score": score, "message": "분석 완료"}
