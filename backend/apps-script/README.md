# Apps Script Web App 배포 절차

`Code.gs`는 [`.omc/plans/lh-winner-auth-page.md`](../../.omc/plans/lh-winner-auth-page.md)의 "Implementation Steps > 3. 백엔드 — Google Apps Script Web App" 섹션 코드 샘플을 그대로 옮긴 것이다(Architect+Critic 4라운드 컨센서스 승인 완료, v3). 로직은 한 글자도 바꾸지 않았다.

## 1. Apps Script 프로젝트 생성
1. https://script.google.com 접속 → 새 프로젝트
2. 프로젝트 이름을 알아보기 쉽게 지정 (예: `lh-auth-page-submit`)

## 2. Code.gs 붙여넣기
1. 기본 생성된 `Code.gs`(또는 `myFunction` 스텁이 든 파일)의 내용을 전부 지우고, 이 디렉터리의 [`Code.gs`](./Code.gs) 내용을 그대로 붙여넣는다.

## 3. SPREADSHEET_ID / DRIVE_FOLDER_ID 교체
1. `Code.gs` 상단의 두 상수를 실제 값으로 교체한다:
   - `SPREADSHEET_ID`: 대상 스프레드시트 URL의 `/d/` 와 `/edit` 사이 문자열
   - `DRIVE_FOLDER_ID`: 대상 Drive 폴더 URL의 `/folders/` 뒤 문자열
2. 테스트 환경과 운영 환경을 분리하려면(플랜 5. 테스트/스테이징 참고), 테스트용 스프레드시트/폴더 ID로 먼저 배포해 검증한 뒤 운영 ID로 교체 배포한다.

## 4. 전용 탭 `인증페이지제출` 생성 + 헤더 행 채우기
1. 대상 스프레드시트에 `인증페이지제출` 이름의 새 시트(탭)를 만든다. **기존 Google Form 응답 탭은 절대 건드리지 않는다.**
2. 1행에 아래 순서 그대로, 정확히 이 문자열로 헤더를 채운다(순서가 하나라도 다르면 `assertHeaderMatches`가 매 요청마다 에러를 던진다):

   | # | 헤더 |
   |---|------|
   | 1 | `submission_id` |
   | 2 | `제출시각` |
   | 3 | `이메일` |
   | 4 | `접수번호` |
   | 5 | `호수` |
   | 6 | `청약구분` |
   | 7 | `카톡닉네임` |
   | 8 | `주택형` |
   | 9 | `당첨동` |
   | 10 | `네이버ID` |
   | 11 | `배우자닉네임` |
   | 12 | `배우자구분` |
   | 13 | `OCR판독-이름(참고용,미검증)` |
   | 14 | `입력방식` |
   | 15 | `Drive링크` |

   (2026-08-05 갱신: 접수번호·호수·주택형·당첨동이 프론트에서 OCR 자동입력으로 바뀌면서, 예전엔 "OCR판독값 vs 수동입력값 비교"가 의미 있었지만 이제는 비교 대상이 없어져 관련 열 4개를 지우고 `입력방식`(자동인식 / 수동입력(자동인식3회실패)) 1개로 대체함)

## 5. 배포 (웹앱)
1. Apps Script 에디터 우측 상단 **배포 → 새 배포**
2. 유형: **웹앱**
3. 설명: 임의(예: `v1`)
4. **실행 사용자: 나(배포한 계정)**
5. **액세스 권한: 전체(익명 사용자 포함)** — 플랜에서 명시적으로 요구하는 설정, 다른 값으로 바꾸면 GitHub Pages에서 익명 방문자가 호출할 수 없다
6. 배포 전에 배포 계정(개인 구글 계정, 서비스계정과 무관)이 대상 스프레드시트 편집 권한과 대상 Drive 폴더 편집 권한을 실제로 갖고 있는지 확인한다
7. 배포를 누르면 웹앱 URL(`https://script.google.com/macros/s/.../exec`)이 발급된다

## 6. 프론트엔드에 배포 URL 반영
1. 발급된 웹앱 URL을 `auth-page.html`의 Apps Script Web App URL 상수(`chat.html`의 `API_URL` 상수와 동일한 패턴)에 채운다
2. 재배포 시 URL이 바뀌는 경우(새 배포를 만들 때) 프론트 상수도 함께 갱신해야 한다 — 기존 배포를 "관리 → 배포 편집"으로 새 버전만 올리면 URL은 유지된다

## 참고
- CORS: 프론트는 `Content-Type: text/plain;charset=utf-8`으로 전송해 프리플라이트를 회피하고, `doPost`에서 `JSON.parse(e.postData.contents)`로 파싱한다(이미 `Code.gs`에 반영됨)
- Apps Script의 302 리다이렉트(`googleusercontent.com`)는 브라우저 `fetch`가 기본적으로 따라가므로 별도 처리 불필요
- 재시도/멱등성: 동일 `submission_id`로 재제출해도 `LockService` + `findRowBySubmissionId`로 중복 행/중복 Drive 파일이 생기지 않는다(자세한 시맨틱은 플랜 문서 3절 참고)
