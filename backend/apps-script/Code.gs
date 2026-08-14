var SPREADSHEET_ID = '1cGHP5QPnAvF5uPGA1pIFar7CR5pP-Y2Av9p8NSDnMNQ';
var DRIVE_FOLDER_ID = '1Y3fAHtOeaAd3-YOxEo0dUf6e-QHIB63z0duIQJGX2jkmeIxpwHSDefyw3883B0-aW5uCXTAB';

var HEADER = ['submission_id','제출시각','이메일','접수번호','호수','청약구분','카톡닉네임',
  '주택형','당첨동','네이버ID','배우자닉네임','배우자구분',
  'OCR판독-이름(참고용,미검증)','입력방식','Drive링크',
  '등업결과','실패사유','','','배우자 네이버 계정'];
// P~S(등업결과/실패사유/미사용 2칸)는 제출 시점엔 채우지 않고 관리자/자동화가 나중에 채우는 컬럼이라
// HEADER에는 자리만 잡아두고(assertHeaderMatches가 시트와 어긋남을 잡아내도록) 빈 문자열로 남긴다.
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
  if (action === 'getVerifiedUnits') {
    return jsonResponse(getVerifiedUnits());
  }
  if (action === 'checkReceiptStatus') {
    return jsonResponse(checkReceiptStatus(e.parameter.receipt, e.parameter.building, e.parameter.unit_no));
  }
  return jsonResponse({ok: false, error: 'UNKNOWN_ACTION'});
}

function normalizeBuildingForMatch(v) {
  return String(v || '').trim().replace(/동$/, '');
}
function normalizeUnitForMatch(v) {
  return String(v || '').replace(/[^0-9]/g, '');
}

// 접수번호+당첨동+호수 세 개가 전부 일치해야 조회되도록 한다(접수번호만으로 무작위 대입해서
// 남의 인증 상태를 훑어보는 걸 막기 위한 최소한의 문턱). "1-처리중"에 있으면 status:'processing'을
// 최우선으로 반환하고(아직 최종 처리 전이라는 뜻), 없으면 "2-처리완료"에서 인증 결과=성공 여부를 본다.
// alreadyVerified는 하위호환용 — auth-page.html이 제출 직전 "이미 인증되었는데 다시 제출하시겠습니까?"
// 확인창을 띄울 때는 여전히 이 필드(= status가 'verified'일 때만 true)를 쓴다.
function checkReceiptStatus(receipt, building, unitNo) {
  receipt = String(receipt || '').trim();
  var bKey = normalizeBuildingForMatch(building);
  var uKey = normalizeUnitForMatch(unitNo);
  if (!receipt || !bKey || !uKey) return {ok: true, status: 'none', alreadyVerified: false};

  var processingSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('1-처리중');
  if (processingSheet && processingSheet.getLastRow() >= 2) {
    var pValues = processingSheet.getRange(2, 1, processingSheet.getLastRow() - 1, 7).getValues();
    for (var j = 0; j < pValues.length; j++) {
      var pRow = pValues[j];
      if (String(pRow[0] || '').trim() === receipt &&
          normalizeBuildingForMatch(pRow[5]) === bKey &&
          normalizeUnitForMatch(pRow[6]) === uKey) {
        return {ok: true, status: 'processing', alreadyVerified: false};
      }
    }
  }

  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('2-처리완료');
  if (!sheet || sheet.getLastRow() < 2) return {ok: true, status: 'none', alreadyVerified: false};

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (String(row[0] || '').trim() === receipt &&
        normalizeBuildingForMatch(row[5]) === bKey &&
        normalizeUnitForMatch(row[6]) === uKey &&
        String(row[8] || '').indexOf('성공') === 0) {
      return {ok: true, status: 'verified', alreadyVerified: true};
    }
  }
  return {ok: true, status: 'none', alreadyVerified: false};
}

// "1-처리중" 시트 컬럼 — 관리자 검수 화면(auth-page.html?mode=manage)이 읽고 쓰는 대상.
// 인증페이지제출과는 별도 시트/헤더라 COL과 분리해서 관리한다.
var PROCESSING_COL = {
  '접수번호': 1, '제출시각': 2, '이메일': 3, '청약구분': 4, '주택형': 5, '당첨동': 6, '호수': 7,
  '이름': 8, '인증 결과': 9, 'Drive링크': 10, '카톡닉네임': 11, '네이버ID': 12, '배우자구분': 13,
  '배우자닉네임': 14, '배우자 네이버 계정': 15, '등업결과': 16, '실패사유': 17, '현재등급': 18,
  'submission_id': 19, '입력방식': 20
};

// 관리자 계정 확인 — "관리자계정" 시트(아이디, 비밀번호 2열)와 평문 대조.
// 검수 화면 접근을 막는 최소한의 문턱일 뿐, 강한 보안이 필요하면(관리자 여러 명 등) 나중에 강화 필요.
// 비밀번호는 시트에 평문으로 남기지 않는다 — B열(비밀번호)에 평문이 남아있으면 매 로그인 시도마다
// 자동으로 해시를 계산해 C열(비밀번호해시)에 저장하고 B열은 지운다. 그 다음부터는 항상 C열의
// 해시와 비교한다.
function hashPassword(pw) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(pw), Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function checkAdminCredentials(id, pw) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('관리자계정');
  if (!sheet || sheet.getLastRow() < 2) return false;

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues(); // A:아이디, B:비밀번호(평문,레거시), C:비밀번호해시
  for (var i = 0; i < values.length; i++) {
    var plain = values[i][1];
    if (plain) { // 평문이 남아있으면 해시로 마이그레이션하고 평문은 지운다
      var newHash = hashPassword(plain);
      sheet.getRange(i + 2, 3).setValue(newHash);
      sheet.getRange(i + 2, 2).setValue('');
      values[i][1] = '';
      values[i][2] = newHash;
    }
  }

  var pwHash = hashPassword(pw);
  for (var j = 0; j < values.length; j++) {
    if (String(values[j][0]) === String(id) && values[j][2] && String(values[j][2]) === pwHash) {
      return true;
    }
  }
  return false;
}

// "1-처리중"에서 인증 결과가 아직 비어있는 첫 행을 반환한다(관리자 검수 대기 큐).
// 이미지가 있으면 Drive에서 직접 읽어 base64로 함께 내려준다 — Drive 파일 자체는 비공개로 두고
// (제3자 미제공 원칙), 로그인된 관리자 화면을 통해서만 이미지를 볼 수 있게 하기 위함.
function getNextPending(data) {
  if (!checkAdminCredentials(data.admin_id, data.admin_pw)) {
    return {ok: false, error: 'UNAUTHORIZED'};
  }
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('1-처리중');
  if (!sheet || sheet.getLastRow() < 2) return {ok: true, done: true};

  var lastRow = sheet.getLastRow();
  var values = sheet.getRange(2, 1, lastRow - 1, 20).getValues();
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var result = String(row[PROCESSING_COL['인증 결과'] - 1] || '').trim();
    if (result === '성공' || result === '실패') continue; // 이미 결정된 행만 건너뜀 (빈 값/"확인 필요"는 대기로 취급)

    var driveLink = String(row[PROCESSING_COL['Drive링크'] - 1] || '');
    var imageDataUrl = null;
    var fileIdMatch = driveLink.match(/\/d\/([^/]+)/);
    if (fileIdMatch) {
      try {
        var file = DriveApp.getFileById(fileIdMatch[1]);
        var blob = file.getBlob();
        imageDataUrl = 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
      } catch (imgErr) {
        imageDataUrl = null; // 이미지 로드 실패해도 나머지 필드는 보여줌
      }
    }

    return {
      ok: true, done: false,
      submission_id: row[PROCESSING_COL['submission_id'] - 1],
      receipt_no: row[PROCESSING_COL['접수번호'] - 1],
      apply_type: row[PROCESSING_COL['청약구분'] - 1],
      building: row[PROCESSING_COL['당첨동'] - 1],
      unit_no: row[PROCESSING_COL['호수'] - 1],
      image: imageDataUrl
    };
  }
  return {ok: true, done: true};
}

// 관리자가 검수 화면에서 이름 입력 + 성공/실패 버튼을 누르면 호출됨 — "1-처리중"의 해당 행에
// 이름/인증 결과를 기록한다(다음 항목으로 넘어가는 건 프론트에서 getNextPending을 다시 부르는 식).
function submitReview(data) {
  if (!checkAdminCredentials(data.admin_id, data.admin_pw)) {
    return {ok: false, error: 'UNAUTHORIZED'};
  }
  if (data.result !== '성공' && data.result !== '실패') {
    return {ok: false, error: 'INVALID_RESULT'};
  }
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('1-처리중');
  var rowIndex = findRowBySubmissionId2(sheet, data.submission_id, PROCESSING_COL['submission_id']);
  if (!rowIndex) return {ok: false, error: 'NOT_FOUND'};

  sheet.getRange(rowIndex, PROCESSING_COL['이름']).setValue(data.name || '');
  sheet.getRange(rowIndex, PROCESSING_COL['인증 결과']).setValue(data.result);
  return {ok: true};
}

// 관리자 검수 화면의 "이력 조회" 탭 — 접수번호 또는 당첨동/호수로 "1-처리중"+"2-처리완료"를
// 뒤져서 지금까지의 신청 이력을 전부 반환한다(이미지는 링크만 내려주고 base64로는 안 읽음 —
// getNextPending과 달리 여러 건을 한 번에 보여줘서 매번 Drive를 읽으면 느려짐).
function searchHistory(data) {
  if (!checkAdminCredentials(data.admin_id, data.admin_pw)) {
    return {ok: false, error: 'UNAUTHORIZED'};
  }
  var receipt = String(data.receipt || '').trim();
  var building = String(data.building || '').trim();
  var unit = String(data.unit_no || '').trim();
  if (!receipt && !building && !unit) {
    return {ok: false, error: 'EMPTY_QUERY'};
  }

  var results = [];
  function collect(sheetName, source) {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() < 2) return;
    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 20).getValues();
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var rReceipt = String(row[PROCESSING_COL['접수번호'] - 1] || '').trim();
      var rBuilding = String(row[PROCESSING_COL['당첨동'] - 1] || '').trim();
      var rUnit = String(row[PROCESSING_COL['호수'] - 1] || '').trim();
      if (receipt && rReceipt !== receipt) continue;
      if (building && rBuilding !== building) continue;
      if (unit && rUnit.indexOf(unit) === -1) continue;

      results.push({
        source: source,
        submission_id: row[PROCESSING_COL['submission_id'] - 1],
        receipt_no: rReceipt,
        submitted_at: row[PROCESSING_COL['제출시각'] - 1],
        apply_type: row[PROCESSING_COL['청약구분'] - 1],
        house_type: row[PROCESSING_COL['주택형'] - 1],
        building: rBuilding,
        unit_no: rUnit,
        name: row[PROCESSING_COL['이름'] - 1],
        result: row[PROCESSING_COL['인증 결과'] - 1],
        drive_link: row[PROCESSING_COL['Drive링크'] - 1],
        kakao_nick: row[PROCESSING_COL['카톡닉네임'] - 1],
        naver_id: row[PROCESSING_COL['네이버ID'] - 1],
        spouse_role: row[PROCESSING_COL['배우자구분'] - 1],
        spouse_nick: row[PROCESSING_COL['배우자닉네임'] - 1],
        spouse_naver_id: row[PROCESSING_COL['배우자 네이버 계정'] - 1],
        upgrade_result: row[PROCESSING_COL['등업결과'] - 1],
        fail_reason: row[PROCESSING_COL['실패사유'] - 1],
        current_grade: row[PROCESSING_COL['현재등급'] - 1]
      });
    }
  }

  collect('1-처리중', '처리중');
  collect('2-처리완료', '처리완료');

  return {ok: true, results: results};
}

// "이력 조회" 탭에서 결과 카드를 직접 수정해 저장할 때 호출됨 — source로 어느 시트인지 정하고
// submission_id로 행을 찾아 전달된 필드만 덮어쓴다(안 보낸 필드는 그대로 둠).
function updateHistoryRow(data) {
  if (!checkAdminCredentials(data.admin_id, data.admin_pw)) {
    return {ok: false, error: 'UNAUTHORIZED'};
  }
  var sheetName = data.source === '처리완료' ? '2-처리완료' : '1-처리중';
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  var rowIndex = findRowBySubmissionId2(sheet, data.submission_id, PROCESSING_COL['submission_id']);
  if (!rowIndex) return {ok: false, error: 'NOT_FOUND'};

  var fieldMap = {
    receipt_no: '접수번호', apply_type: '청약구분', house_type: '주택형', building: '당첨동',
    unit_no: '호수', name: '이름', result: '인증 결과', kakao_nick: '카톡닉네임', naver_id: '네이버ID',
    spouse_role: '배우자구분', spouse_nick: '배우자닉네임', spouse_naver_id: '배우자 네이버 계정',
    upgrade_result: '등업결과', fail_reason: '실패사유', current_grade: '현재등급'
  };
  var fields = data.fields || {};
  for (var key in fieldMap) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      sheet.getRange(rowIndex, PROCESSING_COL[fieldMap[key]]).setValue(fields[key]);
    }
  }
  return {ok: true};
}

function findRowBySubmissionId2(sheet, submissionId, colIndex) {
  if (sheet.getLastRow() < 2) return null;
  var ids = sheet.getRange(2, colIndex, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === submissionId) return i + 2;
  }
  return null;
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  if (data.action === 'adminLogin') {
    return jsonResponse({ok: checkAdminCredentials(data.admin_id, data.admin_pw)});
  }
  if (data.action === 'getNextPending') {
    return jsonResponse(getNextPending(data));
  }
  if (data.action === 'submitReview') {
    return jsonResponse(submitReview(data));
  }
  if (data.action === 'searchHistory') {
    return jsonResponse(searchHistory(data));
  }
  if (data.action === 'updateHistoryRow') {
    return jsonResponse(updateHistoryRow(data));
  }

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
        '', // Drive링크는 업로드 성공 후 채움
        '', '', '', '', // 등업결과/실패사유/미사용 2칸 — 제출 시점엔 비워둠
        data.spouse_naver_id || ''
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

// 동호수 배치도(인증완료 표시)용 — 101동~112동, T201~T203동만 유효한 동으로 인정한다.
var VALID_BUILDINGS_SET = (function () {
  var s = {};
  for (var n = 101; n <= 112; n++) s[n + '동'] = true;
  s['T201동'] = true;
  s['T202동'] = true;
  s['T203동'] = true;
  return s;
})();

function normalizeBuilding(v) {
  if (!v) return null;
  v = String(v).trim();
  if (/^\d+$/.test(v)) v = v + '동'; // "110" 같이 '동'이 빠진 오기입 보정
  if (v === '201동' || v === '202동' || v === '203동') v = 'T' + v; // T동 입력 시 T 접두사 누락 보정
  return VALID_BUILDINGS_SET[v] ? v : null;
}

// 인증완료(접수번호 기준 중복 제거) 대상의 당첨동/호수 목록을 "동|호수" 문자열 배열로 반환한다.
// 시트1(입력방식=일괄OCR검증인 행만) + 인증페이지제출(전체) 합쳐서, 같은 접수번호는 마지막(가장
// 최근 시도)에 등장한 값으로 덮어쓴다 — 시트 행 순서가 곧 제출 순서라 재시도로 값을 고친 경우
// 최신 값이 반영된다(auth-page.html의 동호수 배치도가 초록색 표시에 사용).
function getVerifiedUnits() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var latestByReceipt = {};

  function collect(sheetName, requireOcrOk) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() < 2) return;
    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 14).getValues();
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      if (requireOcrOk && row[13] !== '일괄OCR검증') continue;
      var receipt = String(row[3] || '').trim();
      if (!receipt) continue;
      var building = normalizeBuilding(row[8]);
      var unitNo = String(row[4] || '').trim();
      latestByReceipt[receipt] = (building && unitNo) ? (building + '|' + unitNo) : null;
    }
  }

  collect('시트1', true);
  collect('인증페이지제출', false);

  var units = {};
  for (var receipt in latestByReceipt) {
    if (latestByReceipt[receipt]) units[latestByReceipt[receipt]] = true;
  }
  return {ok: true, units: Object.keys(units)};
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
