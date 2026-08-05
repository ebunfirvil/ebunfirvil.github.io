# backend/rag-server/ocr_endpoint_addition.py
#
# 192.168.1.3의 ~/rag-server/main.py에 실제로 배포되어 검증된 `POST /api/auth-page/ocr`.
# (2026-08-05 실제 서버에 배포하고 3회 호출로 실측·검증 완료 — 아래는 그 결과를 반영한 최종본)
#
# 최초 작성 시엔 main.py 원본을 못 본 채 httpx로 Ollama HTTP API를 직접 호출하는 걸로
# 가정했었는데, 실제 main.py를 보니 `ollama` 파이썬 클라이언트(`import ollama as ollama_client`)를
# 이미 쓰고 있었고, `indexer.py`의 `extract_jpg()`가 이미 같은 VL_MODEL로 이미지를 읽는
# 검증된 패턴(`ollama_client.chat(... images=[b64] ...)`)을 갖고 있어서 그걸 그대로 재사용했다.
# httpx는 필요 없다 — 추가 의존성 설치도 필요 없음.
#
# main.py에 필요한 변경:
#   from fastapi import FastAPI              →  from fastapi import FastAPI, File, UploadFile, HTTPException
#   from config import ... TOP_K             →  from config import ... TOP_K, VL_MODEL
#                                                (+ import base64, import json 추가)
#
# 주의: 아래 라우트는 반드시 `def`(동기)로 선언한다. `ollama_client.chat()`이 동기 호출이라,
# `async def`로 선언하면 추론 중(수 초~수십 초) 이벤트 루프를 막아 /api/chat 같은 다른 요청까지
# 지연시킨다. `def`로 두면 FastAPI가 자동으로 스레드풀에서 돌려 이 문제가 없다.
#
# 실측 결과 (192.168.1.3, CPU 추론, 같은 이미지로 3회):
#   1회차(콜드, 모델 첫 로드) 41.5초 / 2회차(웜) 9.1초 / 3회차 25.0초 — 전부 정확히 판독됨.
#   이 때문에 프론트(auth-page.html)의 OCR_TIMEOUT_MS를 최종 120초로 올렸다.
#   (조언용 엔드포인트라 타임아웃나도 제출에는 영향 없음 — 다만 5초로는 사실상 항상 실패해서
#   미리보기 기능 자체가 무의미해졌을 것)
#
# 2026-08-05 추가 변경: 접수번호·호수는 더 이상 사용자가 직접 입력하지 않고 이 엔드포인트의
# 판독값으로 자동 채워진다(프론트에서 자동 인식 3회 연속 실패 시에만 직접 입력 잠금 해제).
# 그래서 (1) 동호수가 "103-1201"처럼 붙어 나오는 경우 호수만 분리하도록 프롬프트에 명시하고,
# (2) 주택형·당첨동도 같은 이미지에서 함께 인식해 드롭다운에 자동 선택되도록 필드를 추가했다.

import base64
import json

from fastapi import File, HTTPException, UploadFile

# main.py에는 이미 `import ollama as ollama_client`가 있음 — 재사용
# main.py에는 이미 `from config import ... VL_MODEL`을 추가해서 재사용

ALLOWED_OCR_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/heic", "image/heif"}
MAX_OCR_BYTES = 10 * 1024 * 1024  # 10MB

OCR_PROMPT = (
    "이 이미지는 LH 청약 당첨 관련 서류 스크린샷입니다. "
    "다음 다섯 항목을 이미지에서 찾아 JSON으로만 답하세요. "
    "동호수가 \"103-1201\"처럼 동과 호수가 붙어서 표시된 경우, unit_no에는 호수 부분만 담으세요 "
    "(예: \"103-1201\"이면 unit_no는 \"1201\"). "
    "house_type은 반드시 51A, 55A, 55B, 59A, 59T 중 하나의 형식으로만 답하세요. "
    "building은 반드시 \"101동\"부터 \"112동\" 사이의 \"OOO동\" 형식으로만 답하세요. "
    "찾을 수 없는 항목은 빈 문자열로 두세요.\n"
    '{"name": "이름", "receipt_no": "접수번호", "unit_no": "호수", "house_type": "주택형", "building": "동"}'
)


@app.post("/api/auth-page/ocr")  # noqa: F821 — main.py에서는 이미 정의된 app 사용
def ocr_auth_page(image: UploadFile = File(...)):
    if image.content_type not in ALLOWED_OCR_TYPES:
        raise HTTPException(status_code=400, detail="지원하지 않는 이미지 형식입니다.")

    raw = image.file.read()
    if len(raw) > MAX_OCR_BYTES:
        raise HTTPException(status_code=400, detail="이미지 용량이 10MB를 초과합니다.")

    img_b64 = base64.b64encode(raw).decode()
    parsed = {}
    try:
        resp = ollama_client.chat(  # noqa: F821 — main.py의 기존 클라이언트 재사용
            model=VL_MODEL,  # noqa: F821
            messages=[{
                "role": "user",
                "content": OCR_PROMPT,
                "images": [img_b64],
            }],
            format="json",
        )
        parsed = json.loads(resp["message"]["content"])
    except Exception as e:
        # 조언용 엔드포인트이므로 실패해도 500을 던지지 않고 빈 값으로 조용히 응답한다.
        # 프론트는 OCR_TIMEOUT_MS(45초) 안에 응답이 없거나 실패하면 그냥 무시하고 진행한다.
        print(f"    auth-page OCR 오류: {e}")

    return {
        "name": parsed.get("name", ""),
        "receipt_no": parsed.get("receipt_no", ""),
        "unit_no": parsed.get("unit_no", ""),
        "house_type": parsed.get("house_type", ""),
        "building": parsed.get("building", ""),
    }


# main.py 통합 방법 — main.py는 단일 파일 구조(APIRouter 미사용)이므로:
#   1. `from fastapi import FastAPI` 줄에 `File, UploadFile, HTTPException` 추가
#   2. `from config import ... TOP_K` 줄에 `VL_MODEL` 추가 + 상단에 `import base64`, `import json` 추가
#   3. 위 함수 전체(데코레이터 포함, import 줄 제외)를 main.py의 `if __name__ == "__main__":` 바로 앞에 붙여넣기
# 2026-08-05, 실제 서버에 이 절차 그대로 적용해 배포 완료.
