# e편한세상 분당 퍼스트빌리지 입주예정자 협의회 — 웹사이트 문서

## 개요

**e편한세상 분당 퍼스트빌리지 입주예정자 협의회** 공식 웹사이트.  
GitHub Pages(`ebunfirvil.github.io`)에서 정적 파일로 서비스됩니다.

- **위치**: 경기도 성남시 분당구 동막로 245 일원 (성남낙생지구 A-1블록)
- **시행**: 한국토지주택공사 (LH)
- **시공**: DL이앤씨 · 극동건설 · 고덕종합건설 · 금성백조건설 (공동시공)
- **규모**: 지하 4층 ~ 지상 25층, 15개동, 총 1,400세대
- **입주 예정**: 2029년 02월

---

## 파일 구조

```
e-park-hansang-bundang/
├── index.html              # 메인 페이지 (단일 페이지 앱)
├── chat.html               # AI 질문하기 페이지 (RAG 챗봇)
├── apply-precautions.html  # 청약 시 주의사항
├── apply-documents.html    # 당첨자 제출 서류
├── contract-documents.html # 계약 구비 서류
├── nakseong_notice.html    # 낙생지구 공고
├── img/
│   ├── elife_logo.svg      # 협의회 로고 (흰색 fill, 84×42px)
│   ├── aerial.png          # 조감도 (2MB)
│   ├── perspective.png     # 파사드/현황 이미지 (1.4MB)
│   ├── siteplan.png        # 부지 계획도 (933KB)
│   ├── 51A.png             # 51A형 평면도
│   ├── 55A.png             # 55A형 평면도
│   ├── 55B.png             # 55B형 평면도
│   ├── 59A.png             # 59A형 평면도
│   └── 59T.png             # 59T형 평면도
└── README.md               # 이 파일
```

---

## 디자인 시스템

### 색상 변수

| 변수 | 값 | 용도 |
|------|-----|------|
| `--orange` | `#e8622e` | 헤더, 버튼, 강조 |
| `--orange-light` | `#f08850` | 호버, 그라디언트 |
| `--orange-dark` | `#c44e1e` | 다크 헤더 |
| `--navy` | `#1a3a5c` | 히어로, 섹션 배경 |
| `--navy-light` | `#2a5a8c` | 그라디언트 |
| `--navy-dark` | `#0d1b2a` | 푸터, 다크 배경 |
| `--beige` | `#fdf8f5` | 기본 배경 |
| `--beige-dark` | `#f5efe8` | 카드 구분선 |

### 폰트
- Noto Sans KR (Google Fonts): 300 / 400 / 500 / 700 / 900
- Font Awesome 6.5.1 (아이콘)

---

## index.html 섹션별 구조

### Header (고정)
- 로고: `img/elife_logo.svg`
- 네비게이션: 메인 · 개요 · 평형 · 일정 · 뉴스 · 갤러리 · 계산기 · 문의 · **AI 질문**
- 소셜 링크: 네이버 카페 / 카카오톡 / 이메일
- 모바일 햄버거 메뉴

### Hero (`#main`)
- 배경: `img/aerial.png` (조감도)
- D-Day 카운트다운 3개:

| ID | 목표일 | 의미 |
|----|--------|------|
| `dday1` | 2026-07-03 | 주택전시관 개관 |
| `dday2` | 2026-07-20 | 본청약 시작 |
| `dday3` | 2029-02-01 | 입주 예정 |

- 버튼: 청약시 주의사항 / 당첨자 제출 서류 / 계약 구비 서류 (별도 HTML 파일로 연결)

### 단지 개요 (`#about`)
- 투시도 이미지 + 텍스트 설명
- 주요 정보 아이콘 리스트 (위치·규모·세대수·주차·입주·전시관)

### 주요 정보 (`#info`)
- 카드 6개: 시행사 / 시공사 / 현장 위치 / 주택전시관 / 문의 전화 / 주택유형

### 평형 정보 (`#plans`)
클릭 시 모달 팝업으로 평면도 표시.

| 타입 | 전용면적 | 세대수 | 분양가 범위 |
|------|---------|--------|------------|
| 51A | 51㎡ | 413호 | 약 5.55억 ~ 5.91억 |
| 55A | 55㎡ | 468호 | — |
| 55B | 55㎡ | 254호 | — |
| 59A | 59㎡ | 255호 | — |
| 59T | 59㎡ | 10호 | — |

### 주요 일정 (`#timeline`)

| 일정 | 내용 |
|------|------|
| 2026.05.29 | 입주자 모집 공고 |
| 2026.07.03 | 주택전시관 개관 (용인시 수지구 동천동 855-2) |
| 07.13 ~ 07.14 | 사전청약 당첨자 신청 (LH 청약플러스) |
| 07.20 ~ 07.21 | 본청약 (신혼부부 등) |
| 07.31 | 당첨자 발표 |
| 08.07 ~ 08.17 | 당첨자 서류 제출 |
| 11.04 ~ 11.13 | 계약 체결 (주택전시관 내) |
| 2029.02 | 입주 예정 |

### 뉴스 & 소식 (`#news`)
정적 뉴스 카드 4개. 업데이트 시 HTML 직접 편집.

### 갤러리 (`#gallery`)
- 이미지 3개: 부지계획도 / 조감도 / 파사드
- 클릭 시 모달 확대 + 캡션 표시

### 커뮤니티 (`#community`)
- 네이버 카페, 카카오톡 오픈채팅 연결 카드

### 계산기 (`#calculator`)
- 외부 링크: `https://spontaneous-semifreddo-d21be3.netlify.app` (로즈님 제공)

### 문의 (`#contact`)
- 주택전시관 전화: 031-538-1777
- 주택전시관 위치 / 현장 위치 (네이버 지도 링크)
- 대출 문의: 우리 · 국민 · 신한
- LH 청약플러스 / 공식 홈페이지

### Footer
- 바로가기 / 커뮤니티 / 참고 링크 3단 구성
- 네이버 카페: `https://cafe.naver.com/naksangheemang`
- 카카오톡: `https://open.kakao.com/o/g3bb1i9d`

---

## chat.html — AI 질문하기

### 개요
RAG(Retrieval-Augmented Generation) 기반 챗봇 페이지.  
공식 문서를 기반으로 답변하고, 문서에 없는 경우 인터넷 검색으로 보완.

### API 엔드포인트
```
POST https://<cloudflare-tunnel-url>/api/chat
Content-Type: application/json
{ "question": "질문 내용" }
```
응답: 스트리밍 텍스트 (text/plain)

> 현재 Cloudflare 임시 터널 사용 중. URL 변경 시 `chat.html` 내 `API_URL` 상수 수정 필요.

### 주요 기능
- 자주 묻는 질문 버튼 5개
- 스트리밍 답변 (실시간 타이핑 효과)
- 참고 문서 출처 표시
- 웹 검색 결과 시 🌐 아이콘으로 구분 표시
- Enter 전송 / Shift+Enter 줄바꿈
- 모바일 반응형

---

## RAG 백엔드 시스템

### 인프라

| 구성 요소 | 위치 | 상세 |
|-----------|------|------|
| LLM | 192.168.1.3 | Ollama — `qwen2.5:14b` |
| 임베딩 | 192.168.1.3 | Ollama — `bge-m3` |
| OCR (JPG) | 192.168.1.3 | Ollama — `qwen3-vl:8b` |
| 벡터 DB | 192.168.1.3 | ChromaDB (`~/rag-server/chroma_db/`) |
| FastAPI | 192.168.1.3:8000 | `~/rag-server/main.py` |
| 외부 노출 | Cloudflare Tunnel | `~/bin/cloudflared` |
| 문서 소스 | NAS SMB 마운트 | `/Volumes/RAG/낙생/` |

### 문서 소스 (`/Volumes/RAG/낙생/`)
연도별 폴더(2021~2026) 구성. `/Volumes/RAG/낙생/예외/` 는 인덱싱 제외.

| 형식 | 처리 방법 |
|------|-----------|
| PDF | pdfplumber |
| XLSX | pandas + openpyxl |
| JPG | qwen3-vl:8b (비전 모델 OCR) |
| HWP | 제외 |

### 답변 흐름

```
질문 → bge-m3 임베딩 → ChromaDB 유사도 검색
  ├─ 유사도 충분 (distance < 0.42) → RAG 문서 기반 답변
  └─ 유사도 부족 (distance ≥ 0.42) → DuckDuckGo 웹 검색
       └─ 블로그 도메인 자동 제외 (naver blog, tistory, velog 등)
```

### 서버 관리 (192.168.1.3)

```bash
# FastAPI 서버 시작
cd ~/rag-server
nohup env PYTHONUNBUFFERED=1 ~/rag-server/venv/bin/python main.py > server.log 2>&1 &

# Cloudflare 터널 시작
nohup ~/bin/cloudflared tunnel --url http://localhost:8000 > tunnel.log 2>&1 &

# 터널 URL 확인
grep 'trycloudflare.com' ~/rag-server/tunnel.log

# 문서 재인덱싱
cd ~/rag-server
env PYTHONUNBUFFERED=1 ~/rag-server/venv/bin/python indexer.py

# 상태 확인
curl http://localhost:8000/health
```

### 주요 설정 (`~/rag-server/config.py`)

```python
NAS_PATH = "/Volumes/RAG/낙생"
CHROMA_PATH = "/Users/jibdol/rag-server/chroma_db"
EMBED_MODEL = "bge-m3"
LLM_MODEL = "qwen2.5:14b"
VL_MODEL = "qwen3-vl:8b"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
TOP_K = 5
```

---

## 배포

### GitHub Pages
```bash
git add index.html chat.html
git commit -m "업데이트 내용"
git push origin main
```
자동으로 `ebunfirvil.github.io` 에 반영됩니다.

### chat.html API URL 고정화 (추후)
현재 Cloudflare 임시 터널 URL 사용 중.  
영구 도메인 확보 후 `chat.html`의 `API_URL` 상수를 고정 URL로 교체.

```javascript
// chat.html 내
const API_URL = 'https://<고정도메인>/api/chat';
```

---

## 외부 링크 모음

| 용도 | URL |
|------|-----|
| 공식 홈페이지 | https://www.elife.co.kr/Posm_list01.action?commonMap.CD_BIZ_LND=210114 |
| 입주자모집공고 (전문) | https://www.elife.co.kr/jsp/front/po/210114/static/pdf/210114_notice_02_260529.pdf |
| LH 청약플러스 | https://apply.lh.or.kr |
| 네이버 카페 | https://cafe.naver.com/naksangheemang |
| 카카오톡 오픈채팅 | https://open.kakao.com/o/g3bb1i9d |
| 주택전시관 위치 | https://naver.me/FoXz6CAZ |
| 현장 위치 | https://naver.me/xprK8gSA |
| 계산기 (로즈님) | https://spontaneous-semifreddo-d21be3.netlify.app |
