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

print("--------------------------------------------------")
print("🔍 사용 가능한 모델 목록 조회 중...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"   👉 {m.name}")
except Exception as e:
    print(f"   ⚠️ 모델 조회 실패: {e}")
print("--------------------------------------------------")

# 💡 안전 설정 추가: "위험한 말이라도 차단하지 마라" (스미싱 분석용 필수)
safety_settings = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
    }


model = genai.GenerativeModel('gemini-3-flash-preview', safety_settings=safety_settings)

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
    prompt = f"[System Prompt]
당신은 디지털 취약계층(고령층, 장애인 등)을 위한 보안 도우미입니다.
사용자가 입력한 문자를 분석하여 위험 여부를 판단하고, 다음 원칙에 따라 답변하세요.

쉬운 우리말 사용: 'URL', '피싱', '계정' 같은 IT 용어를 쓰지 마세요. 대신 '인터넷 주소', '사기', '내 정보' 등으로 풀어서 설명하세요.
결론부터 말하기: 첫 문장은 무조건 "위험해요!" 혹은 "안전해요."로 시작하세요.
청각적 배려: 시각장애인이 음성 안내(TTS)로 들을 수 있으므로, 특수문자나 무의미한 이모지 반복을 피하세요.
존중하는 태도: 쉬운 말을 쓰되, 예의 바르고 정중한 경어체(해요체)를 사용하세요. 어린아이를 대하듯 하지 마세요.
행동 유도: 마지막에는 사용자가 해야 할 행동을 하나만 딱 집어서 알려주세요. (예: "답장하지 말고 바로 지우세요.") 위험도(0~100) 와 이유가 필요한데 위험도와 이유는 | 를 기준으로 슬라이싱해 출력할 수 있도록 해주세요.

[Message] '{req.content}'"
    
    print(f"📡 Gemini 요청: {req.content[:20]}...") # 로그 확인용

    answer_str="Gemini Error"

    try:
        response = model.generate_content(prompt)
        
        # 디버깅: Gemini가 뭐라고 대답했는지 로그에 찍기
        print(f"🤖 Gemini 응답 원본: {response.text}") 
        
        # 숫자만 추출 (예: "위험도는 90입니다" -> 90)
        score_str = response.text.split("|")[0]
        answer_str = response.text.split("|")[1]
        
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

    return {"risk_score": score, "reason": answer_str, "message": "분석 완료"}
