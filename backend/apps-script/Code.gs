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

// 시트 셀에 =/+/-/@로 시작하는 값을 그대로 쓰면 Sheets가 수식으로 실행해버린다(수식 인젝션).
// 사용자가 직접 입력하는 값을 setValue/appendRow에 넣기 전에 항상 이 함수를 거친다 — 앞에
// 작은따옴표를 붙이면 Sheets가 텍스트로 강제 처리한다.
function sanitizeCell(v) {
  var s = String(v == null ? '' : v).trim();
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
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
        normalizeUnitForMatch(row[6]) === uKey) {
      var result = String(row[8] || '');
      if (result.indexOf('성공') === 0) {
        return {ok: true, status: 'verified', alreadyVerified: true};
      }
      if (result.indexOf('실패') === 0) {
        return {ok: true, status: 'failed', alreadyVerified: false};
      }
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
    var receiptNo = String(row[PROCESSING_COL['접수번호'] - 1] || '').trim();
    if (!receiptNo) continue; // 접수번호가 없는 완전히 빈 행(트레일링 빈 행 등)은 대기 항목이 아니므로 건너뜀
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
// 실패 처리 시에는 사유를 실패사유 컬럼에 남기고, 신청자 이메일로 재제출 안내 메일을 보낸다
// (메일 발송이 실패해도 검수 처리 자체는 그대로 성공 처리 — 재발송은 관리자가 수동으로).
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

  sheet.getRange(rowIndex, PROCESSING_COL['이름']).setValue(sanitizeCell(data.name || ''));
  sheet.getRange(rowIndex, PROCESSING_COL['인증 결과']).setValue(data.result);

  var email = sheet.getRange(rowIndex, PROCESSING_COL['이메일']).getValue();
  var receiptNo = sheet.getRange(rowIndex, PROCESSING_COL['접수번호']).getValue();

  if (data.result === '실패') {
    var reason = String(data.fail_reason || '').trim();
    sheet.getRange(rowIndex, PROCESSING_COL['실패사유']).setValue(sanitizeCell(reason));
    if (email) {
      try {
        sendFailureEmail(email, receiptNo, reason);
      } catch (mailErr) {
        // 메일 발송 실패해도 검수 처리 자체는 성공으로 본다
      }
    }
  } else if (data.result === '성공' && email) {
    try {
      sendApprovalEmail(email, receiptNo);
    } catch (mailErr) {
      // 메일 발송 실패해도 검수 처리 자체는 성공으로 본다
    }
  }
  return {ok: true};
}

// 인증 승인 시 신청자에게 카톡 입장코드를 안내하는 메일을 보낸다. 이제 auth-page.html은 제출 직후
// 코드를 바로 보여주지 않고 이 메일로만 전달한다 — "카톡인증코드" 탭이 비활성화(active=false) 상태면
// 발송하지 않는다.
function sendApprovalEmail(email, receiptNo) {
  var kakaoConfig = getKakaoConfig();
  if (!kakaoConfig.active || !kakaoConfig.code) return;

  var subject = '[e편한세상 분당 퍼스트빌리지 입주예정자협의회] 본인인증 완료 및 입장코드 안내';
  var body =
    '안녕하세요, e편한세상 분당 퍼스트빌리지 입주예정자협의회입니다.\n\n' +
    '제출해 주신 본인인증 신청(접수번호: ' + receiptNo + ')이 확인되어 인증이 완료되었습니다.\n\n' +
    '아래 오픈채팅방에 입장하신 후, 인증코드를 입력해 주세요.\n\n' +
    '오픈채팅방: https://open.kakao.com/o/g3bb1i9d\n' +
    '인증코드: ' + kakaoConfig.code + '\n\n' +
    '감사합니다.\n' +
    'e편한세상 분당 퍼스트빌리지 입주예정자협의회';
  MailApp.sendEmail(email, subject, body);
}

// 인증 실패 시 신청자에게 재제출을 안내하는 메일을 보낸다.
function sendFailureEmail(email, receiptNo, reason) {
  var subject = '[e편한세상 분당 퍼스트빌리지 입주예정자협의회] 본인인증 재제출 안내';
  var body =
    '안녕하세요, e편한세상 분당 퍼스트빌리지 입주예정자협의회입니다.\n\n' +
    '제출해 주신 본인인증 신청(접수번호: ' + receiptNo + ')이 아래 사유로 확인되지 않아 재제출이 필요합니다.\n\n' +
    '----------------------------------------\n' +
    reason + '\n' +
    '----------------------------------------\n\n' +
    '아래 링크에서 다시 인증을 진행해 주시기 바랍니다.\n' +
    'https://ebunfirvil.github.io/auth-page.html\n\n' +
    '문의사항이 있으시면 카카오톡 오픈채팅방으로 편하게 연락해 주세요.\n' +
    'https://open.kakao.com/o/g3bb1i9d\n\n' +
    '감사합니다.\n' +
    'e편한세상 분당 퍼스트빌리지 입주예정자협의회';
  MailApp.sendEmail(email, subject, body);
}

// 관리 설정 탭의 "실패자 재알림 메일 발송" 버튼 — "2-처리완료"에서 접수번호 기준으로 실패 기록만
// 있고 성공 기록이 한 번도 없는 사람들에게 sendFailureEmail을 재사용해 재제출 안내를 다시 보낸다
// (submitReview가 실패 처리 시점에 이미 한 번 보내지만, 그걸 놓쳤거나 오래돼 잊은 사람 대상 리마인더).
// MailApp 일일 발송 한도(개인 Gmail 기준 100통)를 넘지 않도록 남은 할당량만큼만 보내고 멈춘다.
function sendFailureReminders(data) {
  if (!checkAdminCredentials(data.admin_id, data.admin_pw)) {
    return {ok: false, error: 'UNAUTHORIZED'};
  }
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('2-처리완료');
  if (!sheet || sheet.getLastRow() < 2) {
    return {ok: true, total: 0, sent: 0, failed: 0, quotaStopped: false, quotaBefore: MailApp.getRemainingDailyQuota()};
  }

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 20).getValues();
  var byReceipt = {};
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var receipt = String(row[PROCESSING_COL['접수번호'] - 1] || '').trim();
    if (!receipt) continue;
    if (!byReceipt[receipt]) byReceipt[receipt] = {hasSuccess: false, hasFail: false, email: '', reason: ''};
    var result = String(row[PROCESSING_COL['인증 결과'] - 1] || '').trim();
    if (result === '성공') byReceipt[receipt].hasSuccess = true;
    if (result === '실패') {
      byReceipt[receipt].hasFail = true;
      byReceipt[receipt].email = row[PROCESSING_COL['이메일'] - 1];
      byReceipt[receipt].reason = row[PROCESSING_COL['실패사유'] - 1];
    }
  }

  var targets = [];
  for (var receipt in byReceipt) {
    var info = byReceipt[receipt];
    var email = String(info.email || '').trim();
    if (info.hasFail && !info.hasSuccess && email) {
      targets.push({receipt: receipt, email: email, reason: String(info.reason || '').trim() || '사유 미기재'});
    }
  }

  var quotaBefore = MailApp.getRemainingDailyQuota();
  var sent = 0, failed = 0, quotaStopped = false;
  for (var t = 0; t < targets.length; t++) {
    if (sent >= quotaBefore) { quotaStopped = true; break; }
    var target = targets[t];
    try {
      sendFailureEmail(target.email, target.receipt, target.reason);
      sent++;
    } catch (e) {
      failed++;
    }
  }
  return {ok: true, total: targets.length, sent: sent, failed: failed, quotaStopped: quotaStopped, quotaBefore: quotaBefore};
}

// 관리자 검수 화면의 "이력 조회" 탭 — 접수번호 또는 당첨동/호수로 "1-처리중"+"2-처리완료"를
// 뒤져서 지금까지의 신청 이력을 전부 반환한다(이미지는 링크만 내려주고 base64로는 안 읽음 —
// getNextPending과 달리 여러 건을 한 번에 보여줘서 매번 Drive를 읽으면 느려짐).
function searchHistory(data) {
  if (!checkAdminCredentials(data.admin_id, data.admin_pw)) {
    return {ok: false, error: 'UNAUTHORIZED'};
  }
  var receipt = String(data.receipt || '').trim();
  var buildingKey = normalizeBuildingForMatch(data.building);
  var unitKey = normalizeUnitForMatch(data.unit_no);
  if (!receipt && !buildingKey && !unitKey) {
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
      if (buildingKey && normalizeBuildingForMatch(rBuilding) !== buildingKey) continue;
      if (unitKey && normalizeUnitForMatch(rUnit).indexOf(unitKey) === -1) continue;

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

// 접수번호+당첨동+호수 세 개가 전부 일치하는 행을 "1-처리중"과 "2-처리완료" 양쪽에서 전부 찾는다
// (재제출 등으로 같은 사람이 두 시트에 걸쳐 있을 수 있어 첫 매칭만 쓰면 처리완료 쪽이 안 바뀌는
// 채로 남을 수 있다). checkReceiptStatus와 동일한 신뢰 기준(이 세 값을 아는 사람 = 본인)을
// 셀프서비스 정보 수정에도 쓴다.
function findOwnRows(receipt, building, unitNo) {
  var r = String(receipt || '').trim();
  var bKey = normalizeBuildingForMatch(building);
  var uKey = normalizeUnitForMatch(unitNo);
  if (!r || !bKey || !uKey) return [];

  var results = [];
  var sheetNames = ['1-처리중', '2-처리완료'];
  for (var s = 0; s < sheetNames.length; s++) {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetNames[s]);
    if (!sheet || sheet.getLastRow() < 2) continue;
    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 20).getValues();
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      if (String(row[PROCESSING_COL['접수번호'] - 1] || '').trim() === r &&
          normalizeBuildingForMatch(row[PROCESSING_COL['당첨동'] - 1]) === bKey &&
          normalizeUnitForMatch(row[PROCESSING_COL['호수'] - 1]) === uKey) {
        results.push({sheetName: sheetNames[s], sheet: sheet, rowIndex: i + 2});
      }
    }
  }
  return results;
}

// 관리 설정 — Script Properties에 저장하는 간단한 on/off 플래그 모음. 관리 화면의 "관리 설정" 탭이
// 읽고 쓰는 대상이며, 나중에 다른 관리 기능이 늘어나도 이 객체에 키만 추가하면 된다.
function getAdminSettingsRaw() {
  var props = PropertiesService.getScriptProperties();
  var selfEdit = props.getProperty('self_edit_enabled');
  return {self_edit_enabled: selfEdit === null ? true : selfEdit === 'true'};
}

function getAdminSettings(data) {
  if (!checkAdminCredentials(data.admin_id, data.admin_pw)) {
    return {ok: false, error: 'UNAUTHORIZED'};
  }
  var settings = getAdminSettingsRaw();
  return {ok: true, self_edit_enabled: settings.self_edit_enabled};
}

function updateAdminSettings(data) {
  if (!checkAdminCredentials(data.admin_id, data.admin_pw)) {
    return {ok: false, error: 'UNAUTHORIZED'};
  }
  var settings = data.settings || {};
  var props = PropertiesService.getScriptProperties();
  if (Object.prototype.hasOwnProperty.call(settings, 'self_edit_enabled')) {
    props.setProperty('self_edit_enabled', settings.self_edit_enabled ? 'true' : 'false');
  }
  return {ok: true};
}

// 조회 화면에서 "정보 수정" 폼을 열 때 현재 값을 채워주기 위한 조회 전용 액션. 두 시트 모두에
// 매칭되는 행이 있으면 "2-처리완료"(실제로 쓰이는 최종 기록) 쪽을 우선한다 — findOwnRows가
// "1-처리중" → "2-처리완료" 순으로 채우므로 마지막 항목이 항상 처리완료 쪽이다.
function getOwnInfo(data) {
  if (!getAdminSettingsRaw().self_edit_enabled) {
    return {ok: false, error: 'FEATURE_DISABLED'};
  }
  var rows = findOwnRows(data.receipt, data.building, data.unit_no);
  if (rows.length === 0) return {ok: true, found: false};
  var source = rows[rows.length - 1];
  var row = source.sheet.getRange(source.rowIndex, 1, 1, 20).getValues()[0];
  return {
    ok: true, found: true,
    kakao_nick: row[PROCESSING_COL['카톡닉네임'] - 1],
    naver_id: row[PROCESSING_COL['네이버ID'] - 1],
    spouse_nick: row[PROCESSING_COL['배우자닉네임'] - 1],
    spouse_naver_id: row[PROCESSING_COL['배우자 네이버 계정'] - 1]
  };
}

// 본인이 조회 화면에서 직접 고칠 수 있는 필드만 화이트리스트로 제한한다 — 접수번호/당첨동/호수/인증
// 결과 등은 여기로 못 건드리게(관리자 전용 updateHistoryRow와 분리하는 이유).
var OWN_EDITABLE_FIELDS = {
  kakao_nick: '카톡닉네임', naver_id: '네이버ID',
  spouse_nick: '배우자닉네임', spouse_naver_id: '배우자 네이버 계정'
};

// "1-처리중"과 "2-처리완료" 양쪽에 매칭 행이 있으면 둘 다 갱신한다(재제출 등으로 두 시트에 걸쳐
// 같은 사람 기록이 남아있을 수 있음). 행 인덱스로 쓰는 동안 다른 요청이 시트를 건드리지 못하게
// LockService로 감싸고, 필드 하나를 쓸 때마다 바로 그 자리에서 이력을 남겨서(다음 필드에서 실패해도
// 이미 쓴 변경은 로그에 남도록) 부분 실패 시에도 감사 기록이 비지 않게 한다.
function updateOwnInfo(data) {
  if (!getAdminSettingsRaw().self_edit_enabled) {
    return {ok: false, error: 'FEATURE_DISABLED'};
  }
  var rows = findOwnRows(data.receipt, data.building, data.unit_no);
  if (rows.length === 0) return {ok: false, error: 'NOT_FOUND'};

  var fields = data.fields || {};
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return {ok: false, error: 'BUSY'};
  var totalChanged = 0;
  try {
    rows.forEach(function (found) {
      for (var key in OWN_EDITABLE_FIELDS) {
        if (!Object.prototype.hasOwnProperty.call(fields, key)) continue;
        var col = PROCESSING_COL[OWN_EDITABLE_FIELDS[key]];
        var cell = found.sheet.getRange(found.rowIndex, col);
        var cellValue = cell.getValue();
        var oldValue = String(cellValue == null ? '' : cellValue);
        var newValue = String(fields[key] == null ? '' : fields[key]).trim();
        if (oldValue === newValue) continue;
        cell.setValue(sanitizeCell(newValue)); // 수식 인젝션 방지 — =/+/-/@로 시작하면 텍스트로 강제
        totalChanged++;
        logOwnInfoEdit(found.sheetName, data.receipt, data.building, data.unit_no, OWN_EDITABLE_FIELDS[key], oldValue, newValue);
      }
    });
  } finally {
    lock.releaseLock();
  }
  return {ok: true, changed: totalChanged};
}

// 셀프서비스 수정은 관리자 로그인 없이(접수번호+당첨동+호수만으로) 이뤄지므로, 누가 뭘 언제 바꿨는지
// "수정이력" 시트에 전부 남겨서 나중에 감사할 수 있게 한다. 시트가 없으면 처음 호출 시 자동 생성하되,
// 동시에 두 요청이 처음 생성을 시도하는 경합 상황에서도 죽지 않게 try/catch로 감싼다. 로그에 들어가는
// 값도 sanitizeCell을 거쳐 감사 시트 자체가 수식 인젝션 통로가 되지 않게 한다.
function logOwnInfoEdit(sheetName, receipt, building, unitNo, field, oldValue, newValue) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var log = ss.getSheetByName('수정이력');
  if (!log) {
    try {
      log = ss.insertSheet('수정이력');
      log.appendRow(['타임스탬프', '시트', '접수번호', '당첨동', '호수', '필드', '이전값', '새값']);
    } catch (e) {
      log = ss.getSheetByName('수정이력'); // 동시 생성 경합으로 이미 만들어졌으면 그걸 그대로 씀
    }
  }
  log.appendRow([new Date(), sheetName, sanitizeCell(receipt), sanitizeCell(building), sanitizeCell(unitNo),
    field, sanitizeCell(oldValue), sanitizeCell(newValue)]);
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
  if (data.action === 'getOwnInfo') {
    return jsonResponse(getOwnInfo(data));
  }
  if (data.action === 'updateOwnInfo') {
    return jsonResponse(updateOwnInfo(data));
  }
  if (data.action === 'getAdminSettings') {
    return jsonResponse(getAdminSettings(data));
  }
  if (data.action === 'updateAdminSettings') {
    return jsonResponse(updateAdminSettings(data));
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
