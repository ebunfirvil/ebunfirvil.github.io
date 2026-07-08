# e편한세상 분당 퍼스트빌리지 입주예정자 협의회 — 웹사이트 문서

## 개요

**e편한세상 분당 퍼스트빌리지 입주예정자 협의회** 공식 웹사이트.  
GitHub Pages(`ebunfirvil.github.io`)에서 정적 파일로 서비스됩니다. 실제 서비스 도메인 앞단에 CDN(캐시 TTL 10분)이 있어 배포 후 반영까지 최대 10분 정도 걸릴 수 있습니다.

- **위치**: 경기도 성남시 분당구 동막로 245 일원 (성남낙생지구 A-1블록)
- **시행**: 한국토지주택공사 (LH)
- **시공**: DL이앤씨 · 극동건설 · 고덕종합건설 · 금성백조건설 (공동시공)
- **규모**: 지하 4층 ~ 지상 25층, 15개동, 총 1,400세대 (신혼희망타운 933 + 행복주택 467)
- **입주 예정**: 2029.02 (미확정 — 택지조성/송전탑 지중화 공사 상황에 따라 지연 가능)

---

## 파일 구조

```
e-park-hansang-bundang/
├── index.html               # 메인 페이지 (단일 페이지 앱)
├── system.html               # 스마트 시스템 안내 (별도 페이지, index.html #about 하단에서 링크)
├── location.html             # 최고의 입지 안내 (별도 페이지, index.html #about 하단에서 링크)
├── chat.html                  # AI 질문하기 페이지 (RAG 챗봇)
├── apply-precautions.html    # 청약 시 주의사항
├── apply-documents.html      # 당첨자 제출 서류
├── contract-documents.html   # 계약 구비 서류
├── img/
│   ├── favicon.svg, favicon-16.png, favicon-32.png, favicon-192.png, apple-touch-icon.png
│   │                          # e-life 로고 마크(흰색) + 오렌지 배경, 90% 스케일. 전체 페이지 <head>에서 참조
│   ├── elife_logo.svg        # 협의회 로고 원본 (흰색 fill, 84×42px, favicon의 소스)
│   ├── aerial.png            # 조감도
│   ├── perspective.png       # 투시도
│   ├── siteplan.png          # 부지 계획도 (미사용, 참고용으로만 보관)
│   ├── cafe-logo.png         # 네이버 카페 로고 (배경 제거 처리됨)
│   ├── 51A.png / 55A.png / 55B.png / 59A.png / 59T.png       # 평면도 (2D)
│   ├── planimages_51A.png ...  # 3D 투시도 (타입별)
│   ├── pyposition_51A.png ...  # 타입 위치도 — 동 배치도에서 해당 타입 동을 강조 표시
│   ├── amenities/             # index.html #siteinfo 단지안내 hotspot/갤러리에서 쓰는 시설 사진 (영문 파일명, 19개)
│   └── location/              # location.html에서 쓰는 광역위치도/조감도/주변시설 사진 (18개)
└── README.md                  # 이 파일
```

> `index_0708.html`, `index.html.backup` 등은 임시 백업 파일로, 배포 대상이 아니지만 GitHub Pages는 저장소의 모든 파일을 그대로 서빙하므로 실제로는 공개 URL로 열립니다. 필요 없으면 삭제 권장.

---

## 디자인 시스템

### 색상 변수 (index.html 기준, 하위 페이지도 동일 팔레트 사용)

| 변수 | 값 | 용도 |
|------|-----|------|
| `--orange` | `#e8622e` | 헤더, 버튼, 강조 |
| `--orange-light` | `#f08850` | 호버, 그라디언트 |
| `--orange-dark` | `#c44e1e` | 다크 헤더 |
| `--orange-warm` | `#ff9a56` | 하이라이트 텍스트, 포인트 |
| `--navy` | `#1a3a5c` | 히어로, 섹션 배경 |
| `--navy-light` | `#2a5a8c` | 그라디언트 |
| `--navy-dark` | `#0d1b2a` | 푸터, 다크 배경 |
| `--beige` | `#fdf8f5` | 기본 배경 |
| `--beige-dark` | `#f5efe8` | 카드 구분선 |
| `--beige-warm` | `#f0e6d8` | 보조 배경 |
| `--dark` | `#2c1810` | 진한 본문 텍스트 |
| `--gray` | `#6b5b52` | 보조 텍스트 |
| `--white` | `#ffffff` | — |

### 폰트 / 아이콘
- Noto Sans KR (Google Fonts): 300 / 400 / 500 / 700 / 900
- Font Awesome 6.5.1

### 파비콘
`img/favicon.svg` — e-life 로고 마크(흰색 구름 모양)를 오렌지(`--orange`) 라운드 사각형 배경 위에 90% 스케일로 중앙 배치. PNG(16/32/192px) 및 apple-touch-icon 폴백을 전체 7개 HTML 페이지 `<head>`에서 참조.

### 독립 페이지(system.html, location.html, chat.html, apply-*.html, contract-documents.html) 공통 템플릿
- 상단 sticky 오렌지 top-bar(메인 페이지로 돌아가기 버튼) + 네이비 그라디언트 page-header
- 타이틀 규칙: `〈페이지 제목〉 — e편한세상 분당 퍼스트빌리지`
- index.html과 동일한 CSS 변수/카드 스타일을 각 파일에 인라인으로 중복 정의 (빌드 시스템 없음, 공유 스타일시트 없음 — 색상 변경 시 모든 파일에서 각각 수정 필요)

---

## index.html 섹션별 구조

### Header (고정, `max-width:1100px`부터 햄버거 메뉴로 전환)
- 로고: `img/elife_logo.svg`
- 네비게이션: 메인 · 개요 · 평형 · 단지안내 · 일정 · 뉴스 · 계산기 · 문의 · **AI 질문**
- 소셜 링크: 네이버 카페(`img/cafe-logo.png`) / 카카오톡
- 우측 하단 "맨 위로" 버튼: 400px 이상 스크롤 시 표시 (`#backToTop`)
- 모바일/중간 너비 햄버거 메뉴: nav 항목이 9개라 992px가 아닌 **1100px**부터 햄버거로 전환 (768~1090px 구간에서 nav 텍스트가 줄바꿈되던 버그 수정, 관련 CSS는 `@media (max-width: 1100px)` 블록)

### Hero (`#main`)
- 배경: `img/aerial.png` (조감도)
- D-Day 카운트다운 6개, **3×2 그리드**(균일 크기 카드, `.hero-stat`):

| ID | 목표일 | 의미 |
|----|--------|------|
| `dday1` | 2026-07-13 | 사전청약 당첨자 선호타입선택 |
| `dday2` | 2026-07-20 | 본청약 |
| `dday3` | 2026-07-31 | 당첨자 및 동호수 발표 |
| `dday4` | 2026-11-04 | 계약 |
| `dday6` | 2026-12-01 | 옵션 선택 (2026.12 예정) |
| `dday5` | 2029-02-01 | 입주 (2029.02 예정) |

- 버튼: 청약시 주의사항 / 당첨자 제출 서류 / 계약 구비 서류 (별도 HTML 파일, `target="_blank"`)

### 단지 개요 (`#about`)
- 투시도 이미지 + 텍스트 설명
- 주요 정보 아이콘 리스트: 위치 · 규모 · 세대수 · 주차(1,784대 = 공동 1,776 + 근린 8) · 입주 예정(2029.02) · 주택전시관(2026.07.03 오픈)
- 하단에 **"최고의 입지" 링크 카드** → `location.html`

### 주요 정보 (`#info`)
- 카드 6개: 시행사 / 시공사 / 현장 위치 / 주택전시관(2026.07.03 오픈) / 문의 전화 / 주택유형

### 평형 정보 (`#plans`)
클릭 시 모달 팝업으로 이미지 3장 순환(평면도 → 투시도 → 타입위치), 좌우 화살표 + 키보드 방향키 + 카운터.

| 타입 | 전용면적 | 세대수 | 분양가 범위 |
|------|---------|--------|------------|
| 51A | 51㎡ | 413세대 | 약 5.55억 ~ 5.91억 |
| 55A | 55㎡ | 468세대 | 약 5.98억 ~ 6.37억 |
| 55B | 55㎡ | 254세대 | 약 5.98억 ~ 6.36억 |
| 59A | 59㎡ | 255세대 | 약 6.4억 ~ 6.8억 |
| 59T | 59㎡ | 10세대 | 약 6.7억 ~ 6.8억 |

- 모달 이미지: `img/{type}.png`(평면도) → `img/planimages_{type}.png`(투시도) → `img/pyposition_{type}.png`(타입위치)
- 관련 JS: `openFloorPlan()`, `navFloorPlanImage()`, `currentFloorPlan` (index.html)

### 단지안내 (`#siteinfo`)
- 단지 배치도(`img/amenities/site-plan.png`) 위에 시설 위치를 % 좌표로 표시한 hotspot 오버레이
- hotspot 클릭 시 모달로 해당 시설 사진 표시 (여러 장인 경우 좌/우 화살표 + 키보드 방향키, 모달 모서리는 각진 사각형)
- 배치도 하단에 동일 목록을 카드 그리드로도 제공, 그 아래 "단지 전경 갤러리"(투시도/조감도)
- 관련 JS: `// ===== SITE INFO (단지안내) =====` 블록의 `amenities`/`galleryPhotos` 배열

#### 시설 목록 (`amenities` 배열 — 표시 순서 그대로)
| 순서 | 시설 | 사진 |
|------|------|------|
| 1 | 주출입구 | `enteries.png` |
| 2 | 커뮤니티센터 Ⅰ (B1) | `community-center1.png`, `cc1_gym.png`, `comunity_rg.png`, `gx-room.png` |
| 3 | 커뮤니티센터 Ⅱ (B1) | `community-center2.png`, `indoor-sports-court.png`, `cm1_private_office.png` |
| 4 | 어린이집 (1, 2F) | `daycare-interior.png`, `daycare-exterior.png` |
| 5 | 드포엠카페 | `dpoem-cafe-exterior.png`, `dpoem-cafe-interior.png` |
| 6 | 드포엠파크 | `dpoem-park.png` |
| 7 | 드포엠플레이 (104동측) | `community-center1-exterior.png` |
| 8 | 드포엠플레이 (111동측) | `dpoem-play.png` |
| 9 | 게스트하우스 | `guesthouse.png` |
| 10 | 근린생활시설 | `neighborhood-facility.png` |

- `img/amenities/`의 파일명은 모두 영문(ASCII)으로 통일 — GitHub Pages(Linux)는 파일명을 바이트 단위로 비교하므로 한글/공백 파일명은 배포 후 404가 날 수 있어 영문명으로 유지
- hotspot 좌표 추가/조정 시: `amenities` 배열에서 해당 항목의 `top`/`left`(배치도 이미지 기준 %) 값을 수정
- 새 시설 사진 추가 시: `img/amenities/`에 영문 파일명으로 추가 후 `amenities` 배열에 항목 추가

#### 단지 전경 갤러리 (`galleryPhotos` 배열)
| 사진 | 경로 |
|------|------|
| 단지 투시도 | `img/perspective.png` |
| 단지 조감도 | `img/aerial.png` |

### 주요 일정 (`#timeline`)
날짜 표기 규칙: 확정된 날짜는 `yyyy.mm.dd`, 날짜 미확정 항목은 `yyyy.mm(예정)`. 오늘 기준 다음 일정 카드는 자동으로 확대·글로우·배지("다음 일정"/"진행중")로 강조됨 (`updateTimelineProgress()`, `.is-current`).

| 일정 | 내용 |
|------|------|
| 2026.05.29 | 입주자 모집 공고 |
| 2026.07.03 | 주택전시관 개관 |
| 2026.07.13 ~ 2026.07.14 | 사전청약 당첨자 신청 |
| 2026.07.20 ~ 2026.07.21 | 본청약 (신혼부부 등) |
| 2026.07.31 | 당첨자 발표 |
| 2026.08.07 ~ 2026.08.17 | 당첨자 서류 제출 |
| 2026.11.04 ~ 2026.11.13 | 계약 체결 |
| 2026.12(예정) | 옵션 선택 |
| 2029.02(예정) | 입주 예정 |

### 뉴스 & 소식 (`#news`)
정적 뉴스 카드 8개(시간순): 입주자모집공고(05.29) → 주택전시관개관(07.03) → 사전청약 선호타입선정(07.13-14) → 본청약(07.20-21) → 당첨자발표(07.31) → 서류제출(08.07-17) → 택지조성공사(연중) → 입예협설립준비(연중). 업데이트 시 HTML 직접 편집.

### 커뮤니티 (`#community`)
- 네이버 카페, 카카오톡 오픈채팅 연결 카드

### 계산기 (`#calculator`)
- 외부 링크: `https://spontaneous-semifreddo-d21be3.netlify.app` (로즈님 제공)
- 외부 링크: `https://joy-papa.github.io/ebundangfirst/` (옵션 계산기)

### 문의 (`#contact`)
- 주택전시관 전화: 031-538-1777
- 주택전시관 위치 / 현장 위치 (네이버 지도 링크)
- 대출문의: 우리은행 1599-0800 · 국민은행 1599-1771 · 신한은행 1599-8000
- 청약 플랫폼: LH 청약플러스 · 모바일앱 · KB부동산

### Footer
- 바로가기 / 커뮤니티 / 참고 링크 3단 구성
- 네이버 카페: `https://cafe.naver.com/naksangheemang`
- 카카오톡: `https://open.kakao.com/o/g3bb1i9d`

---

## system.html — 스마트 시스템 안내

e-life 공식 시스템 소개 자료(`eLife_분당퍼스트빌리지_시스템정리.xlsx`)를 기반으로 제작. 5개 탭 × 총 41개 항목, 각 카드는 `+` 버튼으로 설명을 펼치고 `×`로 접는 방식.

| 탭 | 항목 수 |
|----|--------|
| 안전 시스템 | 12 |
| 에너지 절약 시스템 | 9 |
| 건강 시스템 | 7 |
| 편의 시스템 | 9 |
| 소음저감 시스템 | 4 |

index.html `#about` 섹션 하단 "시스템 안내 보기" 링크로 연결.

---

## location.html — 최고의 입지

e-life 공식 입지 페이지(elife.co.kr `Polo_list01.action`) 콘텐츠 기반. 광역 위치도 + 광역조감도(클릭 시 라이트박스 확대) + 주변시설 16개를 카테고리별 사진 카드로 정리.

| 카테고리 | 항목 | 예시 |
|----------|------|------|
| 교통 | 5 | 서분당IC, 금곡IC, 미금역, 정자역, 판교역 |
| 교육 | 2 | 늘푸른중학교, 낙생고 |
| 자연환경 | 1 | 낙생저수지 |
| 의료 · 행정 | 2 | 분당서울대학교병원, 분당구청 |
| 상업 · 업무 | 6 | 네이버1784, AK플라자, 현대백화점판교점, 판교알파돔시티, 카카오판교아지트, 엔씨소프트판교R&D센터 |

index.html `#about` 섹션 하단 "입지 안내 보기" 링크로 연결. 이미지는 `img/location/`.

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
git add index.html system.html location.html chat.html   # 수정한 파일만
git commit -m "업데이트 내용"
git push origin main
```
자동으로 `ebunfirvil.github.io` 에 반영되나, CDN 캐시(TTL 10분) 때문에 실제 화면 반영까지 최대 10분 정도 걸릴 수 있습니다. `https://raw.githubusercontent.com/ebunfirvil/ebunfirvil.github.io/main/<파일명>`으로 직접 조회하면 push 성공 여부를 캐시 없이 즉시 확인 가능.

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
| 공식 입지 페이지 | https://www.elife.co.kr/Polo_list01.action?commonMap.CD_BIZ_LND=210114 |
| 공식 단지 페이지 | https://www.elife.co.kr/Pogr_list01.action?commonMap.CD_BIZ_LND=210114 |
| 입주자모집공고 (전문) | https://www.elife.co.kr/jsp/front/po/210114/static/pdf/210114_notice_260702.pdf |
| LH 청약플러스 | https://apply.lh.or.kr |
| 네이버 카페 | https://cafe.naver.com/naksangheemang |
| 카카오톡 오픈채팅 | https://open.kakao.com/o/g3bb1i9d |
| 주택전시관 위치 | https://naver.me/FoXz6CAZ |
| 현장 위치 | https://naver.me/xprK8gSA |
| 계산기 (로즈님) | https://spontaneous-semifreddo-d21be3.netlify.app |
| 옵션 계산기 | https://joy-papa.github.io/ebundangfirst/ |
