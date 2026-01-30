# sync_db.py
import os
import pandas as pd
from sqlalchemy import create_engine
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
import time

# 1. 설정
# Docker 내부에서 실행 시 'db', 로컬에서 실행 시 'localhost'
DB_URL = "mysql+pymysql://root:rootpassword@localhost:3306/smishing_db"
# 실제 Docker 서비스명 사용시: "mysql+pymysql://root:rootpassword@db:3306/smishing_db"

os.environ["GOOGLE_API_KEY"] = "AIzaSyDXAqnb6826hQNaYYOKdp6NScOjPV1BD2Q"  # 혹은 환경변수 로드

def sync_mariadb_to_chroma():
    print("🔌 MariaDB 연결 중...")
    engine = create_engine(DB_URL)
    
    # 2. MariaDB에서 데이터 읽기 (전체 로드)
    # 필요한 컬럼: content(내용), label(정답)
    query = """
        SELECT id, content, label 
        FROM sms_dataset 
        WHERE label = 2 
        LIMIT 1000
    """
    df = pd.read_sql(query, engine)
    
    print(f"📥 데이터 로드 완료: 총 {len(df)}개 행")
    
    if len(df) == 0:
        print("⚠️ 데이터가 없습니다. insert_data.py를 먼저 실행하세요.")
        return

    # 3. 문서 객체로 변환 (LangChain 포맷)
    documents = []
    for _, row in df.iterrows():
        doc = Document(
            page_content=row['content'],
            metadata={
                "id": row['id'],      # 나중에 원본 찾을 때 씀
                "label": row['label'] # 1:정상, 2:스미싱
            }
        )
        documents.append(doc)

    # 4. 임베딩 모델 준비
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    
    # 5. ChromaDB 저장 (배치 처리)
    # 19,000개를 한 번에 넣으면 API Rate Limit에 걸림 -> 100개씩 쪼개서 넣기
    BATCH_SIZE = 10
    PERSIST_PATH = "./chroma_db"
    
    print(f"🚀 벡터 DB 구축 시작 (저장소: {PERSIST_PATH})")
    time.sleep(2)
    # 기존 DB가 있다면 로드, 없으면 생성
    vector_db = Chroma(
        embedding_function=embeddings,
        persist_directory=PERSIST_PATH
    )

    total_docs = len(documents)
    
    for i in range(0, total_docs, BATCH_SIZE):
        batch = documents[i : i + BATCH_SIZE]
        
        try:
            # 벡터 변환 및 저장
            vector_db.add_documents(batch)
            print(f"✅ 진행 중: {i + len(batch)} / {total_docs} 완료")
            
            # API 제한 방지를 위해 잠깐 쉬기 (0.5초)
            time.sleep(0.5)
            
        except Exception as e:
            print(f"❌ 에러 발생 (인덱스 {i}): {e}")
            # 에러 나도 멈추지 않고 다음 배치 시도 (선택 사항)
            time.sleep(5) 

    print("🎉 모든 데이터가 ChromaDB로 동기화되었습니다!")

if __name__ == "__main__":
    sync_mariadb_to_chroma()
