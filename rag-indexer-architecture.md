# RAG 인덱서 구조도

## 개요

`192.168.1.3:~/rag-server/` — NAS 문서를 ChromaDB 벡터 DB에 인덱싱하는 파이프라인.  
파일 변경 감지 → 텍스트 추출 → **LLM 청킹** → 임베딩 → ChromaDB 저장.

---

## 전체 흐름

```
NAS (/Volumes/RAG/낙생/)
        │
        │  fswatch (poll_monitor, 30s)
        │  watcher.sh
        ▼
   파일 변경 감지
        │
        ▼
  indexer.py: build_index()
        │
        ├─ PDF  → pdfplumber (페이지별 텍스트)
        ├─ XLSX → pandas (시트별 텍스트)
        └─ JPG  → qwen3-vl:8b OCR
        │
        ▼
  llm_chunk()  ← qwen2.5:14b (temperature=0, num_predict=4096)
        │
        │  텍스트 > 1500자: 줄 단위로 분할 → 각 세그먼트별 LLM 처리
        │  텍스트 ≤ 1500자: 단일 LLM 호출
        │
        │  실패 시: chunk_text_fallback() (문자 단위 500/50 슬라이딩 윈도우)
        │
        ▼
  청크 목록 (===CHUNK=== 구분자로 파싱)
        │
        ▼
  bge-m3 임베딩 (Ollama)
        │
        ▼
  ChromaDB ("nakseong" collection)
  ~/rag-server/chroma_db/
```

---

## 파일별 역할

| 파일 | 역할 |
|------|------|
| `indexer.py` | 핵심 인덱서. 텍스트 추출 → LLM 청킹 → 임베딩 → 저장 |
| `config.py` | 경로/모델/파라미터 설정 |
| `main.py` | FastAPI 서버. 질문 수신 → 검색 → LLM 답변 |
| `watcher.sh` | fswatch 기반 파일 변경 감지 → indexer.py 실행 |

---

## LLM 청킹 상세 (`llm_chunk`)

```
입력 텍스트
    │
    ├─ len > 1500자?
    │       │
    │       YES → 줄(\n) 단위 분할 → 세그먼트 배열
    │               │
    │               └─ 각 세그먼트 _llm_chunk_single() 호출
    │
    └─ NO  → _llm_chunk_single() 단일 호출
                    │
                    ▼
          qwen2.5:14b (temperature=0, num_predict=4096)
                    │
          [변환 규칙]
          - 표/정산표: 헤더 파악 → 각 행을 독립 청크로
            "파일명 | 행_레이블 | 컬럼1: 값1, 컬럼2: 값2, ..."
          - 서술문: 의미 단위(단락·항목)로 분리
          - 구분자: ===CHUNK===
                    │
                    ▼
          raw.split("===CHUNK===")
          → 30자 미만 필터링
                    │
                    ▼
          chunks[]
```

---

## ChromaDB 청크 ID 체계

| 파일 유형 | ID 패턴 | 예시 |
|-----------|---------|------|
| PDF | `{stem}_llm_p{page}_{counter}` | `모기지정산표_llm_p3_42` |
| XLSX | `{stem}_llm_{counter}` | `일정표_llm_5` |
| JPG | `{stem}_llm_{counter}` | `공고문_llm_0` |

**이미 인덱싱 확인**: `{stem}_llm_p0_0` ID 존재 여부로 판단 (PDF 기준)

---

## 인덱싱 중복/갱신 처리

```
파일 처리 시작
    │
    ├─ is_already_indexed()? → YES → 건너뜀
    │
    └─ NO
          │
          ▼
    remove_old_chunks()
    (구 ID 패턴 정리: _0~499, _p0~49, _row*, _summary)
          │
          ▼
    새 LLM 청크 생성 및 저장
```

---

## 모델 구성

| 용도 | 모델 | 설정 |
|------|------|------|
| LLM 청킹 | `qwen2.5:14b` | temperature=0, num_predict=4096 |
| 임베딩 | `bge-m3` | Ollama embedding API |
| OCR (JPG) | `qwen3-vl:8b` | vision model |

---

## 자동화 서비스 (launchd)

| 서비스 | plist | 역할 |
|--------|-------|------|
| FastAPI | `com.jibdol.ragserver.plist` | main.py 상시 실행 |
| 파일 감시 | `com.jibdol.ragwatcher.plist` | watcher.sh 상시 실행 |
| Cloudflare | `com.jibdol.cloudflared.plist` | tunnel 상시 실행 |
| URL 모니터 | `com.jibdol.urlmonitor.plist` | url-monitor.sh 상시 실행 |

---

## 검색/답변 흐름 (`main.py`)

```
질문 (POST /api/chat)
    │
    ▼
bge-m3 임베딩
    │
    ▼
ChromaDB cosine 유사도 검색 (TOP_K=8)
    │
    ├─ distance < 0.42 → RAG 답변 (qwen2.5:14b, temperature=0)
    │                     SYSTEM_RAG 프롬프트 적용
    │                     - 한국어 전용
    │                     - 표 row 정확 lookup 지침
    │                     - 수치 hallucination 방지
    │
    └─ distance ≥ 0.42 → DuckDuckGo 웹 검색
                          (블로그 도메인 자동 제외)
    │
    ▼
스트리밍 응답 (text/plain)
```

---

## 주요 설정값 (`config.py`)

```python
NAS_PATH    = "/Volumes/RAG/낙생"
CHROMA_PATH = "/Users/jibdol/rag-server/chroma_db"
EMBED_MODEL = "bge-m3"
LLM_MODEL   = "qwen2.5:14b"
VL_MODEL    = "qwen3-vl:8b"
CHUNK_SIZE  = 500
CHUNK_OVERLAP = 50
TOP_K       = 8
```

---

## 지원 파일 형식

| 형식 | 처리 | 비고 |
|------|------|------|
| PDF | pdfplumber 페이지별 추출 | 이미지 포함 PDF는 텍스트만 |
| XLSX | pandas 시트별 추출 | |
| JPG/JPEG | qwen3-vl:8b OCR | |
| HWP | 미지원 | 제외 |
| 예외 폴더 | 제외 | `/Volumes/RAG/낙생/예외/` |
