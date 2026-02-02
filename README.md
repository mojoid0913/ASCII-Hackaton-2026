# 🛡️ 안심이 (Ansimi)

> **고령층을 위한 AI 기반 능동형 스미싱 탐지 서비스**

<p align="center">
  <img src="ajas/assets/images/icon.png" alt="안심이 로고" width="180"/>
</p>

<p align="center">
  <strong> ASCII-THON 2026 서비스 SW개발 트랙 우수상</strong>
</p>

---

##  대회 정보

| 항목 | 내용 |
|------|------|
| **대회명** | 2026 제1회 대학 연합 해커톤 'ASCII-THON' |
| **정식명칭** | Advanced Software Challenge for Innovation & Integration |
| **주제** | 디지털 소외계층을 위한 안전하고 포용적인 기술 |
| **일시** | 2026. 1. 30.(금) ~ 1. 31.(토), 무박 2일 |
| **장소** | 아주대학교 혜강관 |
| **주최** | 아주대학교 SW중심대학사업 |
| **공동주관** | 중앙대학교, 서울시립대학교, 인하대학교 SW중심대학사업 |

---

##  프로젝트 개요

**안심이**는 디지털 취약계층(특히 고령층)을 위한 **능동형 스미싱 예방 앱**입니다.

기존 보안 앱들은 사용자가 직접 의심하고, 텍스트를 복사하고, 앱을 열어 판단해야 합니다. 안심이는 이러한 과정 없이 **AI가 먼저 위험을 감지하고 알려주는** 방식으로 설계되었습니다.

---

##  주요 기능

### 1. 백그라운드 알림 감지
```
문자, 카카오톡, 네이버 밴드 등 → 자동 감지 → AI 분석 → 팝업 알림
```
- Android `NotificationListenerService`를 활용하여 **앱을 열지 않아도** 메시지 수신 시 자동 분석
- 사용자가 복사/붙여넣기 할 필요 없음

### 2. AI 위험도 분석
| 분석 요소 | 설명 |
|-----------|------|
| **LLM 분석** | Google Gemini를 활용한 문맥 기반 위험도 판단 |
| **RAG 검색** | 실제 스미싱 사례 DB에서 유사 패턴 검색 |
| **신고번호 조회** | 경찰청 피싱 신고번호 DB 실시간 확인 |

### 3. 위험 알림 UI
- **위험 단계 표시**: 안전 / 주의 / 위험 (3단계)
- **분석 이유 설명**: IT 용어 없이 쉬운 말로 안내
- **액션 버튼**: "무시하기" 또는 "자녀에게 확인 요청"

### 4. 보호자 연동
- 위험 메시지 감지 시 **등록된 보호자에게 SMS 리포트 전송**
- 분석 결과와 원문 내용을 함께 전달

### 5. 고령층 친화 설정
- **글씨 크기 조절**: 온보딩에서 슬라이더로 직접 설정
- **간단한 온보딩**: 글씨 크기 → 보호자 등록 → 동의, 3단계로 완료

---

##  시스템 구성

```
┌──────────────────────────────────────────────────────────┐
│                      모바일 앱                           │
│  React Native (Expo) + TypeScript                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │  NotificationListenerService (Android)             │  │
│  │  → 알림 수신 → HTTP POST /analyze                  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                      백엔드 서버                          │
│  FastAPI + Docker Compose                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │ Gemini LLM  │  │ ChromaDB    │  │ Selenium        │   │
│  │ (위험 분석) │  │ (RAG 검색)  │  │ (번호 조회)     │   │
│  └─────────────┘  └──────┬──────┘  └────────┬────────┘   │
│                          │                  │            │
│                   ┌──────▼──────┐    ┌──────▼──────┐     │
│                   │  MariaDB    │    │ 경찰청 API  │     │
│                   │ (스미싱 DB) │    │ (신고 조회) │     │
│                   └─────────────┘    └─────────────┘     │
└──────────────────────────────────────────────────────────┘
```

---

##  기술 스택

### 모바일 앱 (`ajas/`)
| 기술 | 용도 |
|------|------|
| React Native + Expo 54 | 크로스 플랫폼 앱 개발 |
| TypeScript | 타입 안정성 |
| React Query | 서버 상태 관리 |
| Expo SMS / Contacts | 보호자 연동 |
| Custom Native Module | Android 알림 리스너 |

### 백엔드 서버 (`server/`)
| 기술 | 용도 |
|------|------|
| FastAPI | REST API 서버 |
| Google Gemini | LLM 기반 위험도 분석 |
| LangChain + ChromaDB | RAG (검색 증강 생성) |
| HuggingFace Embeddings | 로컬 임베딩 (sentence-transformers) |
| Selenium | 경찰청 신고번호 조회 크롤링 |
| MariaDB | 스미싱 사례 및 로그 저장 |
| Docker Compose | 서비스 오케스트레이션 |

---

##  프로젝트 구조

```
ASCII-Hackaton-2026/
├── ajas/                              # 모바일 앱
│   ├── app/
│   │   ├── index.tsx                  # 메인 화면 (알림 표시/처리)
│   │   └── settings.tsx               # 온보딩 (글씨 크기, 보호자 등록)
│   ├── api/
│   │   └── analyzeMessage.ts          # 서버 API 호출
│   ├── modules/notifications/         # 네이티브 알림 리스너
│   │   └── android/.../NotificationListenerService.kt
│   ├── util/
│   │   ├── alertLevel.ts              # 위험 단계 정의
│   │   └── analyzeHistoryStorage.ts   # 분석 이력 저장
│   └── constants/
│       └── targetPackage.ts           # 감지 대상 앱 목록
│
├── server/                            # 백엔드 서버
│   ├── src/
│   │   ├── main.py                    # FastAPI 메인 (분석 API)
│   │   ├── crawler.py                 # 경찰청 번호 조회
│   │   └── sync_db.py                 # MariaDB → ChromaDB 동기화
│   ├── ddl/                           # DB 스키마
│   ├── docker-compose.yml
│   └── requirements.txt
│
└── README.md
```

---

##  실행 방법

### 1. 백엔드 서버

```bash
cd server

# 환경변수 설정
export GEMINI_API_KEY="your-api-key"

# Docker Compose 실행
docker-compose up -d
```

### 2. RAG 데이터베이스 구축

```bash
python src/sync_db.py
```

### 3. 모바일 앱

```bash
cd ajas
npm install
npx expo run:android
```

### 환경변수

| 변수 | 설명 |
|------|------|
| `GEMINI_API_KEY` | Google Gemini API 키 |
| `DB_URL` | MariaDB 연결 문자열 |
| `API_ENDPOINT` | 앱에서 사용할 서버 주소 |

---

##  사용 흐름

1. **앱 설치 후 온보딩**
   - 글씨 크기 조절 → 보호자 선택 → 개인정보 동의

2. **일상 사용**
   - 앱을 열 필요 없음
   - 문자/카카오톡 수신 시 자동 분석
   - 위험 감지 시 팝업 알림

3. **위험 대응**
   - "무시하기": 알림 해제
   - "자녀에게 확인 요청": 보호자에게 분석 리포트 SMS 전송

---

##  팀 아자스 (AJAS)

| 역할 | 이름 |
|------|------|
| **PM** | 최민권 |
| **Backend** | 박성재 (팀장), 안주성 |
| **Frontend** | 박원민, 조찬혁 |

---

##  수상

**ASCII-THON 2026** 서비스 SW개발 트랙 **우수상**

- 대회 주제: 디지털 소외계층을 위한 안전하고 포용적인 기술 - 세부 주제: 디지털 범죄 예방
- 대회 홈페이지: https://asciithon.dev

---

##  라이선스

이 프로젝트는 해커톤 참가작으로 제작되었습니다.
