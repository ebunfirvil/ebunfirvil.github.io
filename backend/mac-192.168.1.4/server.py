import base64
import json
import time
from collections import deque
from threading import Lock

import ollama as ollama_client
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

VL_MODEL = "qwen3-vl:8b"

# 최근 REQUEST_WINDOW_SECONDS(5분) 안에 REQUEST_THRESHOLD(5)건 이상 OCR 요청을
# 처리 중이면 "과부하" 상태로 보고한다. auth-page.html은 이걸 보고 192.168.1.3으로
# 우회할지 결정한다(2026-08-05). 프로세스 재시작하면 카운트는 초기화됨 — 그걸로 충분.
REQUEST_WINDOW_SECONDS = 300
REQUEST_THRESHOLD = 5
_recent_requests = deque()
_recent_requests_lock = Lock()


def _prune_and_count():
    now = time.time()
    with _recent_requests_lock:
        while _recent_requests and now - _recent_requests[0] > REQUEST_WINDOW_SECONDS:
            _recent_requests.popleft()
        return len(_recent_requests)


def _record_request():
    with _recent_requests_lock:
        _recent_requests.append(time.time())

ALLOWED_OCR_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/heic", "image/heif"}
MAX_OCR_BYTES = 10 * 1024 * 1024  # 10MB

OCR_PROMPT = (
    "이 이미지는 LH 청약 당첨 관련 서류 스크린샷입니다. "
    "다음 다섯 항목을 이미지에서 찾아 JSON으로만 답하세요. "
    "동호수가 \"103-1201\"처럼 하나로 붙어서 표시되는 경우가 많습니다. 이때 앞부분(예: 103)은 "
    "반드시 building에 \"103동\"처럼 뒤에 '동'을 붙여 담고, 뒷부분(예: 1201)은 그대로 unit_no에 "
    "담으세요. 즉 \"103-1201\"을 보면 building=\"103동\", unit_no=\"1201\"로 각각 채워야 합니다 "
    "— 하나만 채우고 다른 하나를 비워두면 안 됩니다. building은 반드시 \"101동\"부터 \"112동\" "
    "사이의 \"OOO동\" 형식으로만 답하세요. "
    "house_type은 반드시 51A, 55A, 55B, 59A, 59T 중 하나의 형식으로만 답하세요. "
    "찾을 수 없는 항목은 빈 문자열로 두세요.\n"
    '{"name": "이름", "receipt_no": "접수번호", "unit_no": "호수", "house_type": "주택형", "building": "동"}'
)


@app.get("/health")
def health():
    count = _prune_and_count()
    return {
        "status": "ok",
        "host": "192.168.1.4",
        "recent_requests_5min": count,
        "overloaded": count >= REQUEST_THRESHOLD,
    }


@app.post("/api/auth-page/ocr")
def ocr_auth_page(image: UploadFile = File(...)):
    _record_request()
    if image.content_type not in ALLOWED_OCR_TYPES:
        raise HTTPException(status_code=400, detail="지원하지 않는 이미지 형식입니다.")

    raw = image.file.read()
    if len(raw) > MAX_OCR_BYTES:
        raise HTTPException(status_code=400, detail="이미지 용량이 10MB를 초과합니다.")

    img_b64 = base64.b64encode(raw).decode()
    parsed = {}
    try:
        resp = ollama_client.chat(
            model=VL_MODEL,
            messages=[{
                "role": "user",
                "content": OCR_PROMPT,
                "images": [img_b64],
            }],
            format="json",
        )
        parsed = json.loads(resp["message"]["content"])
    except Exception as e:
        print(f"    auth-page OCR 오류: {e}")

    return {
        "name": parsed.get("name", ""),
        "receipt_no": parsed.get("receipt_no", ""),
        "unit_no": parsed.get("unit_no", ""),
        "house_type": parsed.get("house_type", ""),
        "building": parsed.get("building", ""),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=False)
