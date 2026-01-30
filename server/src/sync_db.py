# sync_db.py
import os
import shutil # 폴더 삭제용
import pandas as pd
from sqlalchemy import create_engine
from langchain_chroma import Chroma
from langchain_core.documents import Document
# ★ 구글 임베딩 대신 허깅페이스(무료/로컬) 임베딩 사용
from langchain_huggingface import HuggingFaceEmbeddings 

# 설정
DB_URL = "mysql+pymysql://root:rootpassword@localhost:3306/smishing_db"

def sync_mariadb_to_chroma():
    # 1. 기존 꼬인 DB 삭제 (중요! 깨끗하게 다시 시작)
    if os.path.exists("/home/mojoid0913/chroma_db"):
        shutil.rmtree("/home/mojoid0913/chroma_db")
        print("🗑️ 기존 ChromaDB 폴더 삭제 완료")

    print("🔌 MariaDB 연결 중...")
    engine = create_engine(DB_URL)
    
    # 2. 데이터 읽기 (이제 API 제한 없으니 2000개든 5000개든 맘껏 하세요)
    query = "SELECT id, content, label FROM sms_dataset WHERE label = 2 LIMIT 2000"
    df = pd.read_sql(query, engine)
    print(f"📥 데이터 로드 완료: 총 {len(df)}개 행")
    
    documents = []
    for _, row in df.iterrows():
        doc = Document(
            page_content=row['content'],
            metadata={"id": row['id'], "label": row['label']}
        )
        documents.append(doc)

    # 3. ★ 로컬 무료 모델 로드 (인터넷 안 써도 됨, CPU 사용)
    print("📥 임베딩 모델 로딩 중 (sentence-transformers/all-MiniLM-L6-v2)...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    
    # 4. ChromaDB 저장
    print("🚀 벡터 DB 구축 시작 (API 제한 없음, 쭉쭉 진행됨)")
    vector_db = Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        persist_directory="/home/mojoid0913/chroma_db"
    )
    
    print("🎉 완벽합니다! 무료로 RAG DB 구축 성공!")

if __name__ == "__main__":
    sync_mariadb_to_chroma()
