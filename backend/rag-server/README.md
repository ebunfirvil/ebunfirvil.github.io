# 192.168.1.3 — auth-page OCR 엔드포인트 통합 절차

`ocr_endpoint_addition.py`는 `POST /api/auth-page/ocr`을 위한 FastAPI 라우터 코드다. 실제 `~/rag-server/main.py`가 이 저장소 밖에 있어 원본을 볼 수 없으므로, 합리적인 가정(기존 `config.py`의 `VL_MODEL = "qwen3-vl:8b"`, Ollama 로컬 엔드포인트) 하에 작성했다. 통합 시 main.py의 실제 클라이언트 초기화 코드에 맞춰 조정이 필요하다(파일 상단 주석 참고).

## 통합 절차
1. 이 파일(`ocr_endpoint_addition.py`)을 `~/rag-server/`에 복사한다.
2. `main.py`가 이미 Ollama 클라이언트/`VL_MODEL` 상수를 정의하고 있다면, `ocr_endpoint_addition.py` 상단의 `OLLAMA_BASE_URL`/`VL_MODEL` 정의를 지우고 main.py의 기존 정의를 import해서 재사용한다.
3. `main.py`가 `APIRouter` 구조라면:
   ```python
   from ocr_endpoint_addition import router as auth_page_ocr_router
   app.include_router(auth_page_ocr_router)
   ```
4. `main.py`가 단일 파일에 `@app.post(...)`를 직접 붙이는 구조라면, `ocr_auth_page` 함수 본문만 복사해 동일한 데코레이터 패턴으로 `main.py`에 붙여넣는다.
5. `httpx`가 기존 `requirements.txt`/venv에 없다면 추가 설치: `~/rag-server/venv/bin/pip install httpx`
6. 서버 재시작 (README.md "서버 관리" 섹션 명령 재사용):
   ```bash
   cd ~/rag-server
   nohup env PYTHONUNBUFFERED=1 ~/rag-server/venv/bin/python main.py > server.log 2>&1 &
   ```
7. 확인:
   ```bash
   curl -F "image=@테스트이미지.jpg" http://localhost:8000/api/auth-page/ocr
   ```

## 이 엔드포인트의 위치 (플랜 참고)
- 이 엔드포인트는 **조언용(advisory-only)** 이다 — 실패/타임아웃이 나도 `auth-page.html`의 제출(Drive 업로드 + Sheets 기록, Google Apps Script Web App 경로)에는 전혀 영향을 주지 않는다. 자세한 아키텍처 근거는 `.omc/plans/lh-winner-auth-page.md`의 ADR 섹션 참고.
- 외부 노출은 `chat.html`과 동일하게 Cloudflare Tunnel의 공개 URL을 통해서만 이뤄진다(사설 IP `192.168.1.3`은 GitHub Pages 방문자가 직접 접근 불가).

## 루트 README.md에 추가 권장 문구
아래 문구를 실제 루트 `README.md`의 "chat.html API URL 고정화 (추후)" 항목 근처에 추가할 것을 제안한다(다른 태스크가 README.md를 동시에 건드릴 수 있어 이 파일에서는 제안만 하고 실제 수정은 하지 않음):

> ### chat.html / auth-page.html API URL 고정화 (추후)
> 현재 Cloudflare 임시 터널 URL 사용 중. 터널 재시작 시 URL이 바뀌면 `chat.html`의 `API_URL`뿐 아니라 `auth-page.html`의 OCR API URL 상수도 함께 갱신해야 함.
