from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

def test_search():
    print("🔍 검색 테스트 시작...")
    
    # 1. 모델 로드
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    
    # 2. DB 연결
    db = Chroma(persist_directory="/home/mojoid0913/chroma_db", embedding_function=embeddings)
    
    # 3. 테스트 질문 (스미싱 의심 문구)
    query = "수리점에맡기고 잠시 컴퓨터로접속했어 뭐하나부탁해도되? 잔고여유되면 나 대신먼저 지인이계좌로 600만원 송금해줄수있어?"
    
    # 4. 검색 (유사한 문서 3개 찾기)
    docs = db.similarity_search(query, k=3)
    
    print(f"\n📢 질문: {query}")
    print(f"✅ 찾은 관련 문서: {len(docs)}개\n")
    
    for i, doc in enumerate(docs):
        print(f"--- [문서 {i+1}] ---")
        print(f"내용: {doc.page_content}")
        print(f"라벨: {doc.metadata.get('label')} (2=스미싱)")
        print("-------------------\n")

if __name__ == "__main__":
    test_search()
