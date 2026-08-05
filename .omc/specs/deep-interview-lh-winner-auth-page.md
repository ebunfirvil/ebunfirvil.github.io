# Deep Interview Spec: LH 청약 당첨자 인증 페이지 (OCR 사전검토 + 구글시트/드라이브 연동)

## Metadata
- Interview ID: di-auth-page-001
- Rounds: 7 (+ Round 0 topology)
- Final Ambiguity Score: ~14.5%
- Type: brownfield
- Generated: 2026-08-04
- Threshold: 0.2 (20%)
- Threshold Source: default
- Initial Context Summarized: no
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.85 | 35% | 0.2975 |
| Constraint Clarity | 0.90 | 25% | 0.225 |
| Success Criteria | 0.85 | 25% | 0.2125 |
| Context Clarity | 0.80 | 15% | 0.12 |
| **Total Clarity** | | | **0.855** |
| **Ambiguity** | | | **0.145 (14.5%)** |

## Topology
| Component | Status | Description | Coverage / Deferral Note |
|-----------|--------|-------------|--------------------------|
| 인증 페이지 폼 UI | active | 기존 구글폼과 동일한 필드 + 신규 호수 필드 + 배우자 닉네임/구분(선택) 2필드를 받는 독립 페이지 | Goal/Acceptance Criteria에 반영 |
| 이미지 OCR 사전검토 | active | 업로드한 인증샷에서 이름/접수번호/호수를 OCR로 추출해 화면에 표시, 사용자 입력값과 대조 | Goal/Acceptance Criteria에 반영, 불일치는 경고만 |
| 구글시트 기록 | active | 폼 값 + OCR 판독값 + 일치여부 + 드라이브 링크를 기존 폼 응답 시트에 새 행/새 열로 추가 | 기존 폼 관리 열 뒤에 append만, 재정렬 금지 |
| 구글드라이브 업로드 | active | 업로드된 인증샷 원본을 기존 폼의 파일응답 폴더에 저장, 링크 확보 | 폴더 접근 실측 검증 완료(읽기), 쓰기 권한은 사용자 확인 |

## Goal
메인 페이지(index.html)와 전혀 연동되지 않는 독립 페이지를 만든다. 이 페이지는 기존 Google Form(`forms.gle/bBe4odMSAsrq93Ac8`)의 10개 필드에 신규 "호수" 필드(기존 폼엔 없던 항목)를 추가해 총 11개 필드를 입력받는다. 사용자가 당첨 인증샷 이미지를 업로드하면 백엔드가 OCR로 이미지 속 이름/접수번호/호수를 추출해 화면에 그대로 보여주고, 사용자가 직접 입력한 접수번호·호수와 비교해 불일치 시 경고를 띄운다(제출은 항상 허용). 제출하면 이미지는 기존 구글폼이 쓰는 파일응답 Drive 폴더에 업로드되어 링크가 생성되고, 그 링크와 모든 필드값·OCR 판독값·일치여부가 기존 Google Form 응답이 쌓이는 바로 그 스프레드시트에 새 행으로 추가된다(기존 폼 관리 열은 건드리지 않고 뒤에 새 열만 추가).

## Constraints
- GitHub Pages는 정적 호스팅이라 서버 코드 실행이 불가능하고, 브라우저에 내려가는 어떤 파일도 방문자가 열람 가능 — 구글 API 인증정보를 클라이언트에 둘 수 없음
- 모든 Google Sheets/Drive 쓰기 작업과 OCR 추론은 기존 192.168.1.3 FastAPI 백엔드(`~/rag-server/main.py`)에 새 엔드포인트로 추가해 처리 (사용자가 명시적으로 선택한 방식 — Apps Script 분리안 대신 단일 서버 통합안 채택)
- OCR은 기존에 이미 돌아가는 Ollama 비전 모델 `qwen3-vl:8b` 재사용
- 외부 노출은 기존 Cloudflare Tunnel 방식 재사용 (chat.html의 `API_URL`과 동일 패턴) — 터널 URL이 재시작마다 바뀌는 기존 운영 리스크가 이 기능에도 동일하게 적용됨, 영구 도메인 확보는 README에 이미 기록된 별도 후속 과제
- 구글 서비스계정 자격증명(`service-account.json`)은 백엔드 서버에만 존재해야 하며 절대 정적 사이트 코드나 git 저장소에 커밋되지 않음
- 서비스계정(`ebunfirvil@intense-attic-226806.iam.gserviceaccount.com`)은 대상 Drive 폴더에 대한 읽기 접근이 이번 인터뷰 중 실제 API 호출로 검증됨; 대상 스프레드시트 및 양쪽 쓰기 권한은 사용자가 이미 설정 완료했다고 확인(이번 세션에서 쓰기 권한 자체를 별도 재검증하지는 않음)
- 신규 페이지는 index.html 어디에도 링크되지 않음 (내비게이션/푸터 미포함, 직접 URL 접근 전용)
- 기존 Google Form은 폐기하지 않고 병행 운영 — 새 페이지와 기존 폼 모두 같은 스프레드시트에 쓸 수 있어야 함

## Non-Goals
- 기존 Google Form을 대체하거나 비활성화하지 않음
- 제출된 인증 데이터의 관리자 검토/승인 대시보드는 포함하지 않음
- 스팸/어뷰징 방지(캡차, rate limit 등)는 이번 스코프에 포함하지 않음 — 필요시 후속 과제
- OCR 불일치를 이유로 제출을 강제 차단하지 않음 (경고만, 명시적으로 결정됨)

## Acceptance Criteria
- [ ] 신규 페이지가 index.html의 nav/footer 등 어디에서도 링크되지 않는다 (직접 URL 접근만 가능)
- [ ] 폼에 정확히 11개 필드가 존재한다: 이메일*, 인증샷 업로드*, 청약구분(사전청약당첨자/본청약당첨자)*, 접수번호 5자리*, 카톡방닉네임*, 주택형(51A/55A/55B/59A/59T)*, 당첨동(101~112동)*, 호수*(신규), 네이버ID*, 배우자닉네임(선택), 배우자구분(남편/아내, 선택) — *는 필수
- [ ] 인증샷 이미지를 업로드하면 백엔드가 OCR로 이름/접수번호/호수를 추출해 화면에 표시한다
- [ ] 화면에 표시된 OCR 판독 접수번호·호수가 사용자가 입력한 값과 다르면 경고 메시지가 표시되지만, 제출 버튼은 비활성화되지 않는다
- [ ] 제출 시 이미지가 지정된 Drive 폴더(`LH청약플러스 당첨화면 캡쳐 제출 (File responses)`)에 업로드되고 파일 링크가 생성된다
- [ ] 제출 시 기존 Form 응답이 쌓이는 동일 스프레드시트(`1cGHP5QPnAvF5uPGA1pIFar7CR5pP-Y2Av9p8NSDnMNQ`) **안에** 새 행이 추가된다. **[2026-08-04 omc-plan 컨센서스로 갱신]** 최초 구상은 "기존 Form 응답 탭에 신규 열을 이어붙이는" 방식이었으나, Architect/Critic 컨센서스 리뷰에서 이 방식이 Form의 자동 열 관리와 충돌해 데이터 손상 위험이 있다고 지적되어, 같은 스프레드시트 안의 **별도 전용 탭**(`인증페이지제출`)에 접수번호로 조인 가능한 독립 행을 쌓는 방식으로 변경됨 — 자세한 내용은 `.omc/plans/lh-winner-auth-page.md`의 ADR 참고. 기존 Form 관리 열은 어떤 경우에도 건드리지 않는다는 원 요구사항의 의도는 이 방식으로 더 안전하게 충족됨
- [ ] `service-account.json`은 백엔드 서버 파일시스템에만 존재하고, 정적 사이트 저장소나 클라이언트로 전송되는 코드 어디에도 포함되지 않는다
- [ ] 192.168.1.3 백엔드에 이미지 업로드 → OCR 추출 → (제출 시) Sheets/Drive 기록까지 처리하는 새 API 엔드포인트(들)가 추가된다

## Assumptions Exposed & Resolved
| Assumption | Challenge | Resolution |
|------------|-----------|------------|
| OCR 불일치 시 제출을 막아야 한다 | "차단 vs 경고만 허용" 질문 | 경고만 표시, 제출은 항상 허용 (자동 차단 없음) |
| 동/호수는 기존 폼과 동일한 필드 구성일 것 | 실제 필드 목록을 사용자에게 직접 요청해 대조 | 기존 폼엔 "당첨동"만 있고 "호수" 필드가 없어, 신규 필드로 추가하기로 결정 |
| 이름도 폼에 수동 입력되어 OCR과 대조될 것 | 필드 목록 확인 | 폼에 이름 필드 자체가 없음 — OCR 단독으로만 확보, 대조 로직 불필요 |
| Google API 인증을 클라이언트(브라우저)에서 처리할 수 있을 것 | GitHub Pages는 정적 사이트라 시크릿을 안전하게 보관할 수 없다는 점을 설명 | Sheets/Drive/OCR 전량을 192.168.1.3 백엔드로 이전, Apps Script 분리안은 기각(관리 단순화를 위해 단일 서버 선택) |
| 새 페이지가 별도의 신규 시트에 쓸 것 | 시트 대상을 명시적으로 질문 | 기존 Google Form 응답이 쌓이는 바로 그 스프레드시트에 씀(열만 추가, 기존 열 순서 유지) |
| 사용자가 제공한 Drive 폴더 링크가 깨졌다(두 URL이 붙은 것으로 의심) | 서비스계정으로 실제 API 조회해 검증 요청 | 실제로는 정상 링크였음(Google Form 자동생성 파일응답 폴더라 ID가 예상보다 긺) — 폴더명/타입까지 라이브로 확인 완료 |
| `service-account.json`이 저장소에 있어도 안전할 것 | 발견 즉시 `.gitignore` 부재 및 커밋 위험 지적 | 저장소 밖 `~/.secrets/e-park-hansang-bundang/`로 이동, 저장소에 `.gitignore` 신설, 중복 사본(`~/Downloads/`)도 해시 대조 후 삭제 |

## Technical Context
- **백엔드**: 192.168.1.3, FastAPI(`~/rag-server/main.py`), Ollama(`qwen2.5:14b`, `bge-m3`, `qwen3-vl:8b`), ChromaDB, Cloudflare Tunnel로 외부 노출(임시 URL — chat.html의 `API_URL` 패턴과 동일하게 하드코딩 후 필요 시 갱신)
- **기존 Google 연동**: 이번 인터뷰 전까지 저장소 내 Sheets/Drive/OAuth 연동 코드 전무 — 완전 신규 구현
- **`.gitignore`**: 이번 세션에서 신설(`service-account.json`, `*.pem`, `*.key`, `.env*` 커버)
- **서비스계정**: `ebunfirvil@intense-attic-226806.iam.gserviceaccount.com`, 키 파일은 `~/.secrets/e-park-hansang-bundang/service-account.json`(저장소 밖, 권한 600)에 위치. 대상 Drive 폴더에 대한 실제 읽기 접근을 이번 세션에서 Drive API 호출로 라이브 검증함(`drive.readonly` 스코프). 쓰기 권한 및 대상 스프레드시트 접근은 사용자가 이미 부여했다고 진술(이번 세션에서 쓰기 자체는 별도 검증 안 함)
- **대상 스프레드시트**: `https://docs.google.com/spreadsheets/d/1cGHP5QPnAvF5uPGA1pIFar7CR5pP-Y2Av9p8NSDnMNQ`
- **대상 Drive 폴더**: `https://drive.google.com/drive/folders/1Y3fAHtOeaAd3-YOxEo0dUf6e-QHIB63z0duIQJGX2jkmeIxpwHSDefyw3883B0-aW5uCXTAB` (폴더명: `LH청약플러스 당첨화면 캡쳐 제출 (File responses)`)
- **기존 구글폼**: `https://forms.gle/bBe4odMSAsrq93Ac8` → `https://docs.google.com/forms/d/e/1FAIpQLScslTBya38E6nxT5ohaypE7xmM-0SxDP1qlyqop8i4kgrPeHA/viewform` — 로그인 필요 설정이라 WebFetch로 직접 열람 불가(401), 필드 목록은 사용자가 수동으로 제공

## Ontology (Key Entities)
| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| 인증제출 (Submission) | core domain | 이메일, 청약구분, 접수번호, 카톡닉네임, 주택형, 당첨동, 호수, 네이버ID, 배우자닉네임(옵션), 배우자구분(옵션), 인증샷이미지 | 인증샷이미지 1개를 가짐; OCR판독결과 1건을 생성; 구글시트행 1건으로 귀결 |
| 인증샷이미지 (VerificationImage) | supporting | 파일, 업로드시각 | 인증제출에 속함; 구글드라이브폴더에 업로드됨; OCR판독결과의 입력값 |
| OCR판독결과 (OCRResult) | supporting | 판독이름, 판독접수번호, 판독호수, 접수번호일치여부, 호수일치여부 | 인증샷이미지로부터 도출; 화면에 표시됨; 구글시트행에 기록됨 |
| 구글시트행 (SheetRow) | external system mapping | 기존 폼 필드 전체 + 호수 + OCR판독값3종 + 일치여부 + 드라이브파일링크 | 대상스프레드시트에 append; 드라이브파일(링크)에 의존 |
| 구글드라이브폴더 (DriveFolder) | external system | 폴더ID, 폴더명 | 인증샷이미지 업로드를 수신 |

## Ontology Convergence
| Round | Entity Count | New | Changed | Stable | Stability Ratio |
|-------|-------------|-----|---------|--------|----------------|
| 1 (Round 0 응답) | 4 | 4 | - | - | N/A |
| 4 (필드 목록 확보) | 5 | 1 (인증제출 세분화) | 1 (구글시트행 확장) | 3 | 80% |
| 5 (호수 필드 결정) | 5 | 0 | 1 (인증제출·구글시트행에 호수 반영) | 4 | 80% |
| 7 (최종) | 5 | 0 | 0 | 5 | 100% |

## Interview Transcript
<details>
<summary>Full Q&A (7 rounds + Round 0)</summary>

### Round 0 — Topology
**Q:** 4가지 요소(폼 UI/OCR 사전검토/시트 기록/드라이브 업로드)로 나눈 것이 맞는지 확인
**A:** OCR은 이름/접수번호/동호수만 추출해 다음 단계 진행 조건으로 쓰려 했고, 드라이브 업로드 후 링크를 시트에 입력, 접수번호는 입력값과 OCR값 일치 필요, 동/호수는 각 필드 별도 입력 희망

### Round 1 — 아키텍처
**Q:** 정적 사이트에서 Sheets/Drive 쓰기와 OCR을 어디서 처리할지
**A:** (사용자가 GitHub Pages 자체 처리 가능 여부를 반문 → GitHub Pages는 정적 파일만 서빙, 서버 코드 실행 불가라는 점을 설명)

### Round 2 — 아키텍처 확정
**Q:** Apps Script(Sheets/Drive) + 기존서버(OCR) 조합 제안 vs 기존 서버 단일 통합
**A:** 기존 192.168.1.3 서버에 OCR+Sheets+Drive 전부 새 엔드포인트로 통합하는 방식 선택

### Round 3 — OCR 실패 시 UX
**Q:** OCR 미판독/접수번호 불일치 시 제출을 막을지, 경고만 하고 허용할지
**A:** 경고만 하고 제출은 항상 허용

### Round 4 — 폼 필드 확인
**Q:** 기존 구글폼 필드 목록을 어떻게 확보할지 (WebFetch 401로 직접 열람 실패)
**A:** 사용자가 11개 필드(실제 10개 + 새로 원하는 호수)를 순서대로 직접 제공. 이름 필드가 폼에 없다는 것도 이때 확인됨

### Round 5 — 동/호수 충돌 해소
**Q:** 기존 폼엔 "당첨동"만 있고 "호수"가 없는데, 신규 페이지에 호수 필드를 추가할지
**A:** 호수 필드 신규 추가로 결정

### Round 6 — 시트 대상 확인
**Q:** 신규 페이지가 쓰는 시트가 기존 폼 응답 시트와 같은 곳인지
**A:** 동일한 시트임을 확인 (기존 폼 관리 열 뒤에 새 열만 추가하는 설계로 이어짐)

### Round 7 — OCR 결과 노출 UX
**Q:** OCR 판독값을 화면에 보여주고 사용자가 확인하게 할지, 백엔드에서만 조용히 검증할지
**A:** 화면에 판독값을 보여주고 사용자가 눈으로 확인하는 방식 선택

### 사후 검증 (Round 7 이후)
사용자가 제공한 Drive 폴더 링크가 비정상적으로 길어(73자) 손상된 것으로 의심 → 서비스계정으로 실제 Drive API 호출해 검증 → 정상 링크로 확인(Google Form 자동생성 파일응답 폴더). 이 과정에서 저장소 루트에 무방비 상태로 있던 `service-account.json`을 발견해 `.gitignore` 신설 및 `~/.secrets/` 하위로 격리 조치.

</details>
