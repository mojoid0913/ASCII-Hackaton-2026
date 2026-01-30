from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import os
import datetime
import json

# --- 설정 ---
DB_URL = os.getenv("DB_URL")
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# --- 안전 설정 ---
safety_settings = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}

# 모델 설정
model = genai.GenerativeModel('gemini-1.5-flash', safety_settings=safety_settings)

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
    pass 

@app.post("/analyze")
async def analyze(req: SmsRequest):
    # 프롬프트 설정
    prompt = f"""[System Prompt]
당신은 디지털 취약계층을 위한 보안 도우미입니다.
다음 형식으로만 답변하세요: 위험도점수(0~100)|친절한설명
예시: 90|위험해요! 절대 누르지 마세요.

[Message] '{req.content}'"""
    
    print(f"📡 Gemini 요청: {req.content[:20]}...") 

    score = 0
    answer_str = "분석 중 오류 발생"

    try:
        response = model.generate_content(prompt)
        text_data = response.text.strip()
        print(f"🤖 Gemini 응답: {text_data}") 
        
        if "|" in text_data:
            parts = text_data.split("|")
            score = int(''.join(filter(str.isdigit, parts[0])))
            answer_str = parts[1].strip()
        else:
            score = 50
            answer_str = text_data

    except Exception as e:
        print(f"❌ 에러: {e}")
        score = 50
        answer_str = "잠시 후 다시 시도해주세요."

    # DB 저장
    db = SessionLocal()
    log = ScanLog(sender=req.sender, content=req.content, risk_score=score)
    db.add(log)
    db.commit()
    db.close()

    return {"risk_score": score, "reason": answer_str, "message": "분석 완료"}
