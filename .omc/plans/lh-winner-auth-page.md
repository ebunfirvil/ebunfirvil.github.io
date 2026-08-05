# Plan: LH 청약 당첨자 인증 페이지 (OCR 사전검토 + 구글시트/드라이브 연동)

Source spec: `.omc/specs/deep-interview-lh-winner-auth-page.md` (deep-interview ambiguity 14.5%, PASSED)
Status: **pending approval — Architect(v3) 아키텍처 승인 + Critic 최종 승인(4라운드 컨센서스 후) 완료. 구현 착수 여부는 사용자 승인 대기.**

## Changelog

**v1 → v2** (Architect+Critic both rejected v1):
- Form 응답 시트에 직접 열 추가 → **별도 전용 탭**으로 전환(Form 시트 절대 미변경)
- 쓰기 경로(Sheets/Drive)를 192.168.1.3에서 **Google Apps Script**로 이전(서비스계정 키 필요 없음, 터널 의존성 제거 목적)
- `submission_id` 기반 멱등성 도입

**v2 → v3** (Architect 재검토에서 v2 자체의 치명적 모순 발견):
- **모순**: v2는 "이미지를 제출 시 재전송하지 않는다"고 명시했으면서, 동시에 "Apps Script가 이미지를 Drive에 업로드한다"고 되어 있었음 → Apps Script가 이미지를 얻으려면 결국 192.168.1.3에서 가져와야 하고, 이는 정확히 우리가 없애려던 "터널이 죽으면 제출 실패" 문제를 되살림. **v3: 제출 시 클라이언트가 이미지를 Apps Script로 직접 전송(base64 inline)**하는 것으로 수정 — 홈서버는 이제 순수 조언용 OCR 미리보기 API로만 남고, 제출 경로 어디에도 관여하지 않음
- **OCR 토큰/캐시 시스템 전체 제거**: v2는 위조 방지를 위해 `ocr_token` 서버 캐시 방식을 도입했으나, 애초에 OCR 결과는 "참고용"이며(스펙에서 이미 제출 차단 사유가 아니라고 결정됨) 실제 검증은 관리자가 Drive에 저장된 원본 사진을 육안으로 확인하는 것이 최종 근거이므로, 암호학적 위조 방지가 필요한 보안 경계가 아님. **v3: OCR 판독값은 클라이언트가 그대로 제출 페이로드에 포함시키되, 시트 컬럼명에 "(참고용, 미검증)"을 명시**하는 것으로 단순화 — 불필요한 토큰/콜백 시스템 제거로 운영 복잡도 원상 회복
- **`LockService` 추가**: Apps Script의 "submission_id 중복 확인 후 추가" 로직이 익명 동시 요청에서 TOCTOU 레이스가 될 수 있다는 지적 반영, `LockService.getScriptLock()`으로 보호
- **CORS 처리 방식 명시**: GitHub Pages(다른 오리진)에서 `script.google.com`을 호출할 때 프리플라이트를 유발하지 않도록 `Content-Type: text/plain`으로 전송, Apps Script의 302 리다이렉트(→`googleusercontent.com`)는 브라우저 `fetch`가 기본적으로 따라감을 명시
- **배포 설정 명확화**: Apps Script 배포 시 "실행 사용자: 나(배포자)", "액세스 권한: 전체(익명 포함)"로 설정해야 함을 명시
- **권한 검증 대상 정정**: v1~v2에서 검증한 것은 서비스계정의 Drive 읽기 권한이었음. Apps Script는 **배포자 개인 구글 계정** 권한으로 동작하므로, 그 계정이 대상 Drive 폴더/스프레드시트에 대한 편집 권한을 갖고 있는지 별도로 확인 필요(서비스계정 검증과는 별개)

## RALPLAN-DR Summary

**Principles**
1. 정적 프론트(GitHub Pages)에는 어떤 비밀정보도 두지 않는다
2. 기존 시스템을 재사용하되, 기존 Form이 소유한 데이터 구조는 절대 직접 변형하지 않는다
3. 기존 Google Form과 병행 운영 가능해야 한다
4. OCR은 보조 수단이다 — 판독 실패/불일치가 제출을 막아서는 안 되고, 암호학적 신뢰가 필요한 보안 경계도 아니다(v3에서 명문화)
5. 새 페이지는 기존 사이트 디자인 시스템과 시각적으로 일관되어야 한다
6. **핵심 쓰기 경로(Drive 업로드+Sheets 기록)는 어떤 단일 홈랩 서버/터널에도 의존하지 않아야 한다**(v3에서 원칙으로 승격 — v2에서 이 원칙을 세웠다고 착각했지만 실제로는 어겼던 것을 Architect가 발견)

**Decision Drivers (top 3)**
1. 보안 — 구글 서비스계정 자격증명 노출 방지
2. 기존 시트 구조 무결성
3. 운영 부담 최소화(1인 유지보수)

**Options** — v2에서 Option C(OCR=홈서버, 쓰기=Apps Script)로 확정. v3는 같은 Option C의 데이터 흐름 결함을 수정한 것으로 아키텍처 결정 자체는 유지.

### Option C 최종안 (v3)
- **OCR 미리보기**(선택적, 실패 허용): 클라이언트 → 192.168.1.3 `/api/auth-page/ocr` → 화면 표시용 참고값만 반환. 이 API가 죽어도 제출에는 영향 없음
- **제출**(필수, 반드시 성공해야 함): 클라이언트 → Apps Script Web App 1곳에만 요청. 이미지(base64) + 폼필드 + (있다면) OCR 참고값 + `submission_id`를 한 번에 전송. Apps Script가 자기 권한으로 Drive 업로드 + 전용 탭 기록을 모두 처리. **192.168.1.3은 이 경로에 전혀 관여하지 않음** — 이게 v3에서 확실히 달성됨(v2는 달성하지 못했음)

## Requirements Summary
(원본: `.omc/specs/deep-interview-lh-winner-auth-page.md`)

## Implementation Steps

### 1. 프론트엔드 — `auth-page.html` (이 저장소)
- `qna.html` 공통 템플릿 재사용
- 폼 필드 11개 + 페이지 로드시 `submission_id`(UUID) 1회 생성
- **주의**: `192.168.1.3`은 사설 LAN IP이며 외부(GitHub Pages 방문자)에서 직접 접근 불가능하다. 프론트엔드가 실제로 호출할 주소는 chat.html의 `API_URL` 상수와 동일한 패턴의 **Cloudflare 터널 공개 HTTPS 호스트명**(예: `const OCR_API_URL = 'https://<현재-터널-호스트>.trycloudflare.com/api/auth-page/ocr'`)이어야 한다. **반드시 `https://`여야 함** — GitHub Pages는 HTTPS로 서빙되므로 `http://192.168.1.3:8000` 같은 사설 IP·평문 주소를 넣으면 Mixed Content로 브라우저가 요청 자체를 차단한다. `192.168.1.3`은 서버 관리(SSH 등) 목적의 내부 식별자로만 쓰인다
- 이미지 선택 시(선택적) `OCR_API_URL`로 POST → **5초 타임아웃(`AbortController`)을 반드시 건다.** 터널이 죽어있으면 연결이 "에러"가 아니라 "무한 대기"가 될 수 있으므로, 타임아웃 없이는 OCR이 죽었을 때 화면이 멈춘 것처럼 보임. 타임아웃/실패 시 조용히 무시하고 폼 진행 가능, 성공 시 판독값을 화면에 표시 + 입력값과 대조해 불일치 경고(차단 안 함)
- **제출 시**: `FileReader.readAsDataURL()`로 이미지를 base64 인코딩 — 결과 문자열은 `data:image/jpeg;base64,AAAA...` 형태이므로 **콤마(`,`) 뒤의 순수 base64 부분만 잘라서** `image_base64` 필드에 담는다(접두어를 그대로 보내면 Apps Script의 `Utilities.base64Decode`가 깨진 이미지를 만듦). 이걸 폼필드 전체 + `submission_id` + (있으면) OCR 참고값과 함께 **Apps Script Web App URL로 직접 `fetch(url, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify(payload)})`** 호출 (text/plain으로 보내 CORS 프리플라이트 회피 — Apps Script `doPost`에서 `JSON.parse(e.postData.contents)`로 파싱)
- index.html에는 링크 추가 안 함

### 2. 백엔드 — 192.168.1.3(내부 LAN IP, 관리용) `~/rag-server/main.py` (OCR 미리보기 전담, 저장소 밖)
- `POST /api/auth-page/ocr`: 이미지 수신 → `qwen3-vl:8b`로 이름/접수번호/호수 추출 → `{name, receipt_no, unit_no}` 즉시 응답(캐시/토큰 불필요, 이 값을 신뢰하지 않고 그저 화면 표시+제출 페이로드에 참고용으로만 포함되므로 상태 저장 불필요)
- **외부 노출**: 이 엔드포인트는 `192.168.1.3`으로 직접 호출되는 게 아니라, chat.html과 동일하게 **Cloudflare Tunnel의 공개 URL**을 통해서만 외부에서 도달 가능하다. 프론트엔드 상수(`OCR_API_URL`)는 이 터널 URL을 가리켜야 하며, 터널 재시작 시 URL이 바뀌면 chat.html의 `API_URL`과 함께 `auth-page.html`의 `OCR_API_URL`도 갱신해야 함(README의 "chat.html API URL 고정화(추후)" 항목에 이 파일도 추가해야 함)
- 제출 경로와 완전히 무관 — 이 엔드포인트(및 터널)가 영구적으로 죽어도 제출 기능은 정상 동작해야 함(Acceptance Criteria로 검증)

### 3. 백엔드 — Google Apps Script Web App (쓰기 전담, 신규 구성요소)

**컬럼 순서(헤더 행에 이 순서 그대로 미리 채워둠)**: `submission_id, 제출시각, 이메일, 접수번호, 호수, 청약구분, 카톡닉네임, 주택형, 당첨동, 네이버ID, 배우자닉네임, 배우자구분, OCR판독-이름(참고용,미검증), OCR판독-접수번호(참고용,미검증), OCR판독-호수(참고용,미검증), 접수번호일치여부, 호수일치여부, Drive링크`

```javascript
var SPREADSHEET_ID = 'PASTE_TARGET_SPREADSHEET_ID_HERE'; // 배포 시 실제 ID로 교체 (테스트/운영 별도 값)
var DRIVE_FOLDER_ID = 'PASTE_TARGET_DRIVE_FOLDER_ID_HERE'; // 배포 시 실제 ID로 교체 (테스트/운영 별도 값)

var HEADER = ['submission_id','제출시각','이메일','접수번호','호수','청약구분','카톡닉네임',
  '주택형','당첨동','네이버ID','배우자닉네임','배우자구분',
  'OCR판독-이름(참고용,미검증)','OCR판독-접수번호(참고용,미검증)','OCR판독-호수(참고용,미검증)',
  '접수번호일치여부','호수일치여부','Drive링크'];
// 헤더 이름 -> 1-based 열 번호. 코드 가독성을 위한 이름 매핑일 뿐, 실제 열 순서는 반드시 HEADER와 시트가
// 정확히 일치해야 하며 assertHeaderMatches가 이를 강제한다(순서가 달라도 알아서 맞춰주는 것이 아님)
var COL = {};
HEADER.forEach(function(name, i) { COL[name] = i + 1; });

function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return jsonResponse({ok: false, error: 'BUSY'});
  }
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('인증페이지제출');
    assertHeaderMatches(sheet); // 시트 헤더가 코드가 기대하는 것과 다르면 즉시 에러로 실패(조용한 컬럼 밀림 방지)

    var rowIndex = findRowBySubmissionId(sheet, data.submission_id);

    // 이미 완료된 제출(Drive링크까지 채워짐)이면 순수 재시도 — 아무것도 다시 하지 않음
    if (rowIndex && sheet.getRange(rowIndex, COL['Drive링크']).getValue()) {
      return jsonResponse({ok: true, duplicate: true});
    }

    // 행이 없으면 먼저 만든다(Drive 업로드보다 먼저 — 업로드 실패해도 고아 파일이 생기지 않게)
    if (!rowIndex) {
      sheet.appendRow([
        data.submission_id, new Date(), data.email, data.receipt_no, data.unit_no,
        data.apply_type, data.kakao_nick, data.house_type, data.building, data.naver_id,
        data.spouse_nick || '', data.spouse_role || '',
        data.ocr_name || '', data.ocr_receipt_no || '', data.ocr_unit_no || '',
        data.receipt_no_match ? 'Y' : 'N', data.unit_no_match ? 'Y' : 'N',
        '' // Drive링크는 업로드 성공 후 채움
      ]);
      rowIndex = sheet.getLastRow();
    }

    // 이 단계부터 실패하면(Drive 장애 등) 행은 남아있고 Drive링크만 비어있는 상태 —
    // 다음 재시도가 위의 "행이 없으면 만든다"를 건너뛰고 곧장 여기로 와서 이어서 처리(중복 업로드 없음)
    // data.image_base64는 접두어(data:image/jpeg;base64, 등)가 제거된 순수 base64 문자열이어야 함
    // — 프론트에서 FileReader.readAsDataURL() 결과를 쓸 경우 반드시 콤마 뒤 부분만 잘라 전송할 것(Step 1에 명시)
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var blob = Utilities.newBlob(Utilities.base64Decode(data.image_base64), data.image_mime,
      data.submission_id + '_' + data.image_filename);
    var file = folder.createFile(blob); // 이 줄과 다음 줄 사이에 실패하면 고아 Drive 파일이 생길 수 있음(재시도 시 새 파일이 하나 더 생성됨) — 소규모 트래픽에서는 수용 가능한 리스크로 판단, 파일명에 submission_id가 있어 수동 정리 가능
    sheet.getRange(rowIndex, COL['Drive링크']).setValue(file.getUrl());

    return jsonResponse({ok: true, duplicate: false});
  } catch (err) {
    return jsonResponse({ok: false, error: String(err)});
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function findRowBySubmissionId(sheet, submissionId) {
  if (sheet.getLastRow() < 2) return null; // 헤더 행뿐인 빈 시트 — getRange(numRows=0)은 예외를 던지므로 먼저 걸러냄
  var ids = sheet.getRange(2, COL['submission_id'], sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === submissionId) return i + 2; // +2: 1-based, 헤더 행 보정
  }
  return null;
}

function assertHeaderMatches(sheet) {
  var actual = sheet.getRange(1, 1, 1, HEADER.length).getValues()[0];
  for (var i = 0; i < HEADER.length; i++) {
    if (actual[i] !== HEADER[i]) {
      throw new Error('헤더 불일치: 시트의 ' + (i + 1) + '번째 열이 예상과 다름(코드/시트 컬럼 순서 재확인 필요)');
    }
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```
- 배포 설정: **실행 사용자 = 나(배포한 계정)**, **액세스 권한 = 전체(익명 사용자 포함)**
- 배포 계정(개인 구글 계정, 서비스계정과 별개)이 대상 스프레드시트 편집 권한 + 대상 Drive 폴더 편집 권한을 갖고 있는지 배포 전 별도 확인 필요
- 전용 탭 `인증페이지제출`을 미리 생성, 헤더 행을 위 `HEADER` 배열과 정확히 같은 순서로 미리 채워둠(사람이 1회 수동 생성 — `assertHeaderMatches`가 매 요청마다 어긋남을 감지해 조용한 컬럼 밀림을 방지)
- 기존 Form 응답 탭은 이 스크립트가 읽지도 쓰지도 않음
- **재시도 시맨틱**: (a) 행 자체가 없으면 새로 만들고 Drive 업로드까지 진행 (b) 행은 있는데 Drive링크가 비어있으면(직전 시도가 Drive 업로드 단계에서 실패) 그 행을 재사용해 업로드만 이어서 진행 — 어느 경우든 중복 행이나 중복 업로드가 생기지 않음

### 4. 이미지 제약 (기본값 제안)
- 허용 포맷: jpg/jpeg/png/heic, 최대 10MB — base64 인코딩 시 약 13.3MB 페이로드, 프론트에서 업로드 전 크기 검증 후 초과 시 안내

### 5. 테스트/스테이징
- 별도 테스트용 스프레드시트 + 테스트용 Drive 폴더 + 테스트용 Apps Script 배포로 검증 후, 운영 배포 시 `SPREADSHEET_ID`/`DRIVE_FOLDER_ID` 상수만 교체

## Acceptance Criteria
- [ ] `auth-page.html`이 index.html 어디에도 링크되지 않음
- [ ] 11개 필드가 정확한 순서/필수여부로 렌더링됨
- [ ] 이미지 업로드 시 OCR 판독값이 화면에 표시됨(192.168.1.3 정상 동작 시)
- [ ] **OCR 엔드포인트(Cloudflare 터널 공개 URL, 즉 홈서버로의 외부 경로)가 응답 불가 상태여도 제출(Drive 업로드+Sheets 기록)이 성공함** — v3가 실제로 이 목표를 달성하는지 검증하는 핵심 기준. 테스트는 `192.168.1.3`이라는 사설 IP를 막는 게 아니라(외부에서 도달 불가한 주소이므로 의미 없음), 터널 프로세스(`cloudflared`)를 중지하거나 `OCR_API_URL`을 존재하지 않는 주소로 바꿔서 재현
- [ ] 접수번호/호수 불일치 시 경고 배너 표시, 제출 버튼은 계속 활성 상태
- [ ] 제출 전/후 기존 Form 응답 탭의 행 수·셀 값이 스냅샷 diff로 완전히 동일함
- [ ] 신규 전용 탭에 정확히 1행 추가됨(테스트 환경 기준)
- [ ] 동일 `submission_id`로 2회 연속 제출해도 신규 탭에 행이 1개만 존재함(Apps Script `LockService` 적용 후 재검증)
- [ ] `service-account.json`이 이 git 저장소에 존재하지 않음(이미 확인됨)
- [ ] Apps Script Web App이 GitHub Pages 오리진에서 CORS 에러 없이 호출됨(브라우저 콘솔 확인)
- [ ] 이메일 필드 값이 시트 행에 정확히 기록됨(11개 필드 중 유실되는 필드가 없는지 전수 확인 — v3 초안 코드 샘플에서 한 차례 누락된 전력이 있어 별도 항목으로 명시)
- [ ] 10MB 초과 이미지를 업로드하면 프론트에서 업로드 전에 명확한 에러 메시지로 거부됨(서버까지 보내지 않음)
- [ ] 제출 중 로딩 상태가 표시되고, Apps Script가 `{ok:false}`를 반환하거나 네트워크 에러가 나면 사용자에게 실패 메시지 + 재시도 안내가 표시됨(무한 로딩/무응답 없음)
- [ ] 동일 `submission_id`로 "행은 생성됐지만 Drive 업로드는 실패한" 상태를 인위적으로 재현한 뒤 재시도하면, 중복 행이나 중복 Drive 파일 없이 정상적으로 Drive링크가 채워짐

## Risks and Mitigations
| Risk | Mitigation |
|------|-----------|
| Apps Script `LockService` 대기 중 동시요청이 많으면 타임아웃(30초) | 초기 트래픽 규모(소규모 커뮤니티)에서는 낮은 리스크로 판단, 필요시 재시도 로직 프론트에 추가 |
| base64 인코딩으로 페이로드가 원본의 약 1.33배(최대 ~13.3MB) | Apps Script Web App 요청 크기 한도 내(약 50MB) — 문제 없음, 다만 모바일 업로드 시 체감 속도 저하 가능성은 수용 |
| Apps Script 배포 계정이 개인 구글 계정이라, 계정 소유자가 바뀌면(예: 협의회 임원 교체) 재배포 필요 | 후속 과제로 기록 — 조직용 구글 계정으로 이전하는 것을 장기적으로 권장 |
| 공개 무인증 쓰기 엔드포인트 스팸/오남용 | 수용된 리스크로 명시(스펙에서 스코프 아웃 결정, URL 비공개 공유 전제) |
| 기존 Form 응답 탭 오염 | 별도 탭 사용으로 원천 차단 |
| OCR 판독값이 검증되지 않은 참고용 데이터임을 관리자가 오인 | 시트 컬럼명에 "(참고용, 미검증)" 명시, 실제 확인은 Drive의 원본 사진으로 |
| `qwen3-vl:8b`가 HEIC 포맷을 인식하지 못할 가능성(검증 안 됨) | 구현 전 실제 HEIC 샘플로 사전 테스트, 안 되면 허용 포맷에서 HEIC 제외하거나 프론트에서 HEIC→JPEG 변환 후 전송 |
| Drive 업로드가 스팸 목적으로 반복 호출되어 스토리지 용량 소진 | 공개 무인증 엔드포인트 리스크의 연장선(수용된 리스크)이지만, Drive 용량은 스팸 행보다 실질적 비용이 크므로 사용량 급증 시 알림을 받을 수 있는 후속 모니터링 과제로 기록 |

## Verification Steps
1. 프론트: 로컬 정적 서버로 렌더링, 11개 필드 확인
2. OCR: `/api/auth-page/ocr`에 테스트 이미지 curl 호출
3. 쓰기 경로: 테스트 Apps Script + 테스트 시트/폴더로 전체 플로우 1회 실행 — 이때 (a) 일반 크기 이미지, (b) 10MB에 가까운 큰 이미지, (c) 10MB 초과 이미지(프론트 단계에서 거부되는지) 3가지 케이스 모두 확인, 기록된 행의 모든 열(이메일 포함)이 폼 입력값과 정확히 일치하는지 전수 대조
4. **장애 격리 검증(핵심)**: `cloudflared` 터널 프로세스를 중지하거나 `OCR_API_URL`을 무효화해 OCR 경로를 응답 불가 상태로 만든 뒤 제출 → 성공 확인 (`192.168.1.3` 자체는 사설 IP라 외부에서 애초에 도달 불가하므로, 실제로 검증해야 하는 건 "터널이 죽었을 때"의 동작)
5. 멱등성: 동일 `submission_id` 2회 제출(동시 발사 포함, 예: 2개 탭에서 거의 동시 클릭) → 1행만 존재하는지 확인
6. CORS: 실제 GitHub Pages에 배포된 페이지에서 브라우저 콘솔 에러 없이 호출되는지 확인
7. 회귀: 제출 전/후 기존 Form 응답 탭 export diff
8. 운영 전환: 1-7 테스트 환경 통과 후 운영 ID로 교체 배포

## ADR (Architecture Decision Record)
- **Decision:** 쓰기 경로(Drive+Sheets)는 클라이언트가 이미지를 인라인으로 포함해 Google Apps Script Web App에 직접 제출하는 단일 호출로 처리하고, 192.168.1.3은 실패해도 무방한 OCR 미리보기 전용으로 완전히 분리한다
- **Drivers:** 서비스계정 키 제거(Driver 1), Form 시트 무결성(Driver 2), 운영 단순성은 일부 희생(Driver 3)
- **Alternatives considered:** v1(전량 홈서버), v2(Apps Script 쓰기 + 홈서버에서 이미지 가져오기 — 내부 모순으로 재검토 후 폐기), 전량 Apps Script(OCR 포함, `qwen3-vl:8b` 재사용 포기하게 되어 기각)
- **Why chosen:** Architect가 v2의 데이터 흐름 모순(이미지 재전송 안 한다면서 Apps Script가 업로드해야 한다는 모순)을 지적, 클라이언트가 제출 시점에 이미지를 직접 Apps Script로 보내는 것이 유일하게 "쓰기 경로가 홈서버에 의존하지 않는다"는 목표를 실제로 달성하는 방법
- **Consequences:** 제출 페이로드가 커짐(최대 ~13.3MB), Apps Script 배포/유지보수라는 새 운영 축 추가, 대신 홈서버 장애가 제출 성공률에 전혀 영향을 주지 않음
- **Follow-ups:** 이미지 포맷/크기 제한 최종 확정, Apps Script 배포 계정을 개인 계정에서 조직 계정으로 이전하는 문제 재검토, 스팸 방지 필요성 모니터링

## Open Items for Confirmation
- Option C(v3, 쓰기=Apps Script/OCR만 홈서버) 최종 확인 — 인터뷰 원안(전량 홈서버)과 다름을 다시 한번 확인
- Apps Script 배포에 쓸 구글 계정(개인 계정 vs 협의회 조직 계정) 확정
- 이미지 포맷/크기 제한값(jpg/png/heic, 10MB) 확정
- 전용 탭 이름(`인증페이지제출`) 확정
