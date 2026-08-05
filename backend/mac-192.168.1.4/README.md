# 192.168.1.4 — OCR 보조 서버 (기본 우선 서버)

기존 192.168.1.3 서버와 별개로, 성능이 더 좋은 두 번째 Mac(192.168.1.4)에 OCR 전용 서버를 하나 더 세웠다. `auth-page.html`은 평소엔 이 서버를 **먼저** 시도하고, 통신이 안 되거나 과부하 상태면 192.168.1.3으로 자동 전환한다(아래 "부하 기반 라우팅" 참고).

192.168.1.3의 `rag-server`(RAG 챗봇용 FastAPI, `main.py`)와 달리, 이 서버는 OCR 기능만 있는 완전히 독립된 최소 구성이다 — 기존 인프라에 얹는 게 아니라 이 기기에 새로 하나 띄운 것.

## 구성
- 코드: `server.py` (이 디렉터리, `~/ocr-server/server.py`에도 동일 파일 배치됨)
- 가상환경: `~/ocr-server/venv/` (fastapi, uvicorn, python-multipart, ollama)
- 모델: `qwen3-vl:8b` (192.168.1.3과 동일 모델, 동일 프롬프트 — 결과 일관성을 위해 맞춤)
- 포트: **8001** (8000번은 이 기기에서 Docker가 이미 사용 중이라 회피)
- 외부 노출: 시놀로지 NAS(`leeopklop.synology.me`) 리버스 프록시, 소스 포트 **7001** → 대상 `192.168.1.4:8001`

## 서버 실행
```bash
cd ~/ocr-server
nohup venv/bin/python3 server.py > server.log 2>&1 &
```

## 상태 확인
```bash
curl http://192.168.1.4:8001/health
# {"status":"ok","host":"192.168.1.4","recent_requests_5min":0,"overloaded":false}
curl -F "image=@테스트이미지.jpg" http://192.168.1.4:8001/api/auth-page/ocr
```

`/health`는 최근 5분간(`REQUEST_WINDOW_SECONDS`) 처리한 OCR 요청 수(`recent_requests_5min`)를
같이 보고한다. 5건(`REQUEST_THRESHOLD`) 이상이면 `overloaded: true`. 프로세스를 재시작하면
카운트는 0으로 초기화된다.

## 부하 기반 라우팅 (2026-08-05)
동시 요청이 몰릴 일은 드물다고 보고, `auth-page.html`은 기본적으로 항상 이 서버(7001)를
먼저 시도한다. 제출 전 가벼운 `/health` 호출로 `overloaded` 여부를 먼저 확인하고:
- `overloaded: false`(정상) 또는 헬스체크 자체가 빠르게 성공 → 이 서버(7001)를 우선 시도
- `overloaded: true` 또는 헬스체크 실패(다운/타임아웃 4초) → 192.168.1.3(7000)을 먼저 시도

어느 쪽이 먼저 뽑히든, 그 서버가 실패하면 나머지 한쪽으로 자동 폴백하는 안전망은 그대로 유지된다.
