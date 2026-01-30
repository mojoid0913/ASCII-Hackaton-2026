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
# from crawler import inspect_url # 필요시 주석 해제
import re
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma # 👈 (추가) 이거 없으면 Chroma 에러남

# 1. 임베딩 모델 준비
print("📂 벡터 DB 로딩 중...")
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# 2. 벡터 DB 연결
vector_db = Chroma(
    persist_directory="/home/mojoid0913/chroma_db", 
    embedding_function=embeddings
)

# --- 설정 ---
DB_URL = os.getenv("DB_URL")
# DB URL 없으면 로컬 테스트용 (안전장치)
if not DB_URL:
    DB_URL = "sqlite:///./test.db"
    
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

# 모델 설정 (사용자가 지정한 gemini-3 유지)
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
    pass 

@app.post("/analyze")
async def analyze(req: SmsRequest):
    print(f"📡 Gemini 요청: {req.content[:20]}...") 

    # [수정됨] 1. RAG 검색 수행 (여기서 DB 뒤져서 비슷한거 가져옴)
    context_text = "유사 사례 없음"
    try:
        docs = vector_db.similarity_search(req.content, k=3)
        # 유사도 기반 상위 3개 검색
        if len(docs)==0:
            print("RAG로 도출된 결과가 없습니다")
        elif docs:
            # 검색된 내용을 문자열로 합침
            context_text = "\n".join([f"- {doc.page_content}" for doc in docs])
            print(f"🔍 RAG 검색 성공: {len(docs)}건 발견")
    except Exception as e:
        print(f"⚠️ RAG 검색 실패 (무시하고 진행): {e}")

    # [수정됨] 2. 프롬프트에 검색 결과(context_text) 포함
    prompt = f"""[System Prompt]
당신은 디지털 취약계층(고령층, 장애인 등)을 위한 보안 도우미입니다.
사용자가 입력한 문자를 분석하여 위험 여부를 판단하고, 다음 원칙에 따라 답변하세요.

[참고할 과거 스미싱 사기 데이터]
{context_text}

쉬운 우리말 사용: 'URL', '피싱', '계정' 같은 IT 용어를 쓰지 마세요. 대신 '인터넷 주소', '사기', '내 정보' 등으로 풀어서 설명하세요.
결론부터 말하기: 첫 문장은 무조건 "위험해요!" 혹은 "안전해요."로 시작하세요.
청각적 배려: 시각장애인이 음성 안내(TTS)로 들을 수 있으므로, 특수문자나 무의미한 이모지 반복을 피하세요.
존중하는 태도: 쉬운 말을 쓰되, 예의 바르고 정중한 경어체(해요체)를 사용하세요. 어린아이를 대하듯 하지 마세요.
행동 유도: 마지막에는 사용자가 해야 할 행동을 하나만 딱 집어서 알려주세요. (예: "답장하지 말고 바로 지우세요.")
    다음 형식으로만 답변하세요: 위험도점수(0~100)|친절한설명
    예시: 90|위험해요! 절대 누르지 마세요.

    [Message] '{req.content}'"""
    
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
