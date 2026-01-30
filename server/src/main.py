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
# import 구문 꼭 확인하세요!
from google.generativeai.types import HarmCategory, HarmBlockThreshold

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

# 🚨 [수정 1] 모델명을 실존하는 최신 모델로 변경
# (gemini-3는 없습니다. 1.5-flash가 가장 빠르고 저렴하며 성능도 좋습니다)
model = genai.GenerativeModel('gemini-1.5-flash', safety_settings=safety_settings)

app = FastAPI()

# --- DB 모델 ---
class ScanLog(Base):
    __tablename__ = "scan_logs"
    id = Column(Integer, primary_key=True, index=True)
    sender = Column(String(50))
    content = Column(Text)
    risk_score = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime
