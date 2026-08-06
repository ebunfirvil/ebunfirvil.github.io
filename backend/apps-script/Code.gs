var SPREADSHEET_ID = '1cGHP5QPnAvF5uPGA1pIFar7CR5pP-Y2Av9p8NSDnMNQ';
var DRIVE_FOLDER_ID = '1Y3fAHtOeaAd3-YOxEo0dUf6e-QHIB63z0duIQJGX2jkmeIxpwHSDefyw3883B0-aW5uCXTAB';

var HEADER = ['submission_id','제출시각','이메일','접수번호','호수','청약구분','카톡닉네임',
  '주택형','당첨동','네이버ID','배우자닉네임','배우자구분',
  'OCR판독-이름(참고용,미검증)','입력방식','Drive링크'];
// 2026-08-05: 접수번호/호수/주택형/당첨동이 프론트에서 OCR 자동입력(3회 실패 시에만 수동입력)으로
// 바뀌면서, "OCR판독값 vs 수동입력값 비교"라는 원래 취지의 일치여부 컬럼 2개와 OCR판독-접수번호/
// 호수 컬럼 2개가 무의미해져 제거하고, 대신 이 행이 자동인식으로 채워졌는지 3회 실패 후 수동입력
// 되었는지를 남기는 '입력방식' 컬럼 1개로 교체했다.
// 헤더 이름 -> 1-based 열 번호. 코드 가독성을 위한 이름 매핑일 뿐, 실제 열 순서는 반드시 HEADER와 시트가
// 정확히 일치해야 하며 assertHeaderMatches가 이를 강제한다(순서가 달라도 알아서 맞춰주는 것이 아님)
var COL = {};
HEADER.forEach(function(name, i) { COL[name] = i + 1; });

function doGet(e) {
  var action = e.parameter.action;
  if (action === 'getKakaoConfig') {
    return jsonResponse(getKakaoConfig());
  }
  return jsonResponse({ok: false, error: 'UNKNOWN_ACTION'});
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return jsonResponse({ok: false, error: 'BUSY'});
  }
  try {
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
        data.ocr_name || '', data.entry_method || '',
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

// 카톡 인증코드 팝업 설정 — '카톡인증코드' 탭(없으면 자동 생성)의 2행에 [코드, 활성화]를 둔다.
// 이 탭을 시트에서 직접 열어 값을 고치면 auth-page.html의 제출 완료 팝업에 바로 반영된다.
function getOrCreateKakaoConfigSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('카톡인증코드');
  if (!sheet) {
    sheet = ss.insertSheet('카톡인증코드');
    sheet.getRange(1, 1, 1, 2).setValues([['코드', '활성화']]);
    sheet.getRange(2, 1, 1, 2).setValues([['', false]]);
  }
  return sheet;
}

function getKakaoConfig() {
  var sheet = getOrCreateKakaoConfigSheet();
  var row = sheet.getRange(2, 1, 1, 2).getValues()[0];
  return {ok: true, code: String(row[0] || ''), active: row[1] === true};
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
