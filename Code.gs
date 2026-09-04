var HARDCODED_SPREADSHEET_ID = "";
/**
 * 伴伴記❤️ - Google Apps Script 後端處理 (Code.gs)
 * 精通全端與 GAS 開發的資深工程師精心撰寫，包含完整防呆、所有 8 大工作表初始化與即時雙向連線邏輯。
 * 
 * 支援 8 大工作頁：
 * 1. 流水帳資料庫 (公積金收支記錄)
 * 2. 月度核銷狀態 (公積金月度撥款對帳核銷)
 * 3. 代墊明細 (情侶日常私人代墊借還)
 * 4. 購物清單 (雙人採購清單與完成狀態)
 * 5. 常用商店 (採購地點快速推薦)
 * 6. 旅遊行程 (出國/國內旅遊行程與成員預算)
 * 7. 旅遊支出明細 (多幣別出國開銷與代墊明細)
 * 8. 旅遊心願清單 (旅遊踩點心願與代買)
 */

function doGet(e) {
  if (e && e.parameter && e.parameter.action) {
    var action = e.parameter.action;
    if (action === "getTravelData") return jsonResponse(getTravelData());
    if (action === "getSplitData") return jsonResponse(getSplitData());
    if (action === "getDashboardData") return jsonResponse(getDashboardData());
    if (action === "getShoppingData") return jsonResponse(getShoppingData());
    if (action === "getStoreData") return jsonResponse(getStoreData());
    return jsonResponse({ success: true, message: "伴伴記後端 API 連線正常！" });
  }

  try {
    var output = HtmlService.createHtmlOutputFromFile('Index');
    output.addMetaTag('viewport', 'width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no, viewport-fit=cover');
    output.setTitle('伴伴記❤️');
    output.setFaviconUrl("https://img.icons8.com/color/180/cherry-blossom.png");
    output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    return output;
  } catch (err) {
    var fallbackHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>伴伴記後端 API</title><style>body{font-family:sans-serif;text-align:center;padding:40px;background:#fdfaf7;color:#333;}h2{color:#e11d48;}.card{background:#fff;border-radius:12px;padding:24px;max-width:500px;margin:20px auto;box-shadow:0 4px 12px rgba(0,0,0,0.05);line-height:1.6;}</style></head><body><h2>✨ 伴伴記 Google Apps Script 後端 API 運作中</h2><div class="card"><p>✅ 8 大工作表資料庫與即時同步已就緒！</p><p>🚀 前端網頁可由 GitHub Pages 託管，或在 Apps Script 左側建立 <b>Index</b> (HTML) 檔案。</p></div></body></html>';
    return HtmlService.createHtmlOutput(fallbackHtml)
      .setTitle('伴伴記 後端 API 服務')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return jsonResponse({ success: false, error: "系統忙碌中，請稍後重試 (Lock timeout)" });
  }

  try {
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var action = payload.action;
    var res = { success: true };

    // 1. 公積金模式相關 API
    if (action === "getDashboardData") res = getDashboardData();
    else if (action === "addRecord") res = addRecord(payload);
    else if (action === "updateRecordByRow") res = updateRecordByRow(payload);
    else if (action === "deleteRecordByRow") res = deleteRecordByRow(payload);
    else if (action === "setMonthReconciled") res = setMonthReconciled(payload.month, payload.isReconciled);

    // 2. 代墊借還模式相關 API
    else if (action === "getSplitData") res = getSplitData();
    else if (action === "addSplitRecord") res = addSplitRecord(payload);
    else if (action === "updateSplitRecord") res = updateSplitRecord(payload);
    else if (action === "deleteSplitRecord") res = deleteSplitRecord(payload);
    else if (action === "settleAllSplitRecords" || action === "settleSplitRecords") res = settleAllSplitRecords(payload);

    // 3. 雙人採購清單相關 API
    else if (action === "getShoppingData") res = getShoppingData();
    else if (action === "addShoppingItem") res = addShoppingItem(payload);
    else if (action === "updateShoppingItem") res = updateShoppingItem(payload);
    else if (action === "toggleShoppingItemStatus") res = toggleShoppingItemStatus(payload);
    else if (action === "deleteShoppingItem") res = deleteShoppingItem(payload);
    else if (action === "clearDoneShoppingItems") res = clearDoneShoppingItems();

    // 4. 常用商店清單相關 API
    else if (action === "getStoreData") res = getStoreData();
    else if (action === "addStoreItem") res = addStoreItem(payload);
    else if (action === "deleteStoreItem") res = deleteStoreItem(payload);

    // 5. 旅遊行程與分帳相關 API
    else if (action === "getTravelData") res = getTravelData();
    else if (action === "saveTravelTrip" || action === "addTravelTrip") res = saveTravelTrip(payload);
    else if (action === "deleteTravelTrip") res = deleteTravelTrip(payload);
    else if (action === "addTravelExpense") res = addTravelExpense(payload);
    else if (action === "addBatchTravelExpenses") res = addBatchTravelExpenses(payload);
    else if (action === "updateTravelExpense") res = updateTravelExpense(payload);
    else if (action === "deleteTravelExpense") res = deleteTravelExpense(payload);
    else if (action === "syncAllTravelData") res = syncAllTravelData(payload);
    else if (action === "addTravelWishItem") res = addTravelWishItem(payload);
    else if (action === "toggleTravelWishStatus") res = toggleTravelWishStatus(payload);
    else if (action === "deleteTravelWishItem") res = deleteTravelWishItem(payload);

    // 6. 系統設定與資料庫初始化
    else if (action === "saveSpreadsheetId") res = saveSpreadsheetId(payload.spreadsheetId || payload.url);
    else if (action === "getSpreadsheetConfig") res = getSpreadsheetConfig();
    else if (action === "setupDatabase") res = { success: true, message: setupDatabase() };
    else res = { success: false, error: "未知的 API 請求動作: " + action };

    return jsonResponse(res);
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getDbSpreadsheet() {
  if (typeof HARDCODED_SPREADSHEET_ID === 'string' && HARDCODED_SPREADSHEET_ID.trim() !== '') {
    try {
      var id = HARDCODED_SPREADSHEET_ID.trim();
      if (id.indexOf('docs.google.com') !== -1) {
        return SpreadsheetApp.openByUrl(id);
      }
      return SpreadsheetApp.openById(id);
    } catch(e) {}
  }

  try {
    var customId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (customId && customId.trim() !== '') {
      customId = customId.trim();
      if (customId.indexOf('docs.google.com') !== -1) {
        return SpreadsheetApp.openByUrl(customId);
      }
      return SpreadsheetApp.openById(customId);
    }
  } catch(e) {}

  try {
    var activeSs = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSs) return activeSs;
  } catch(e) {}

  return null;
}

function saveSpreadsheetId(input) {
  if (!input) throw new Error("請輸入試算表 ID 或完整網址");
  var raw = input.toString().trim();
  var finalId = raw;
  var match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    finalId = match[1];
  }
  
  var ss = SpreadsheetApp.openById(finalId);
  if (!ss) throw new Error("找不到指定的試算表，請確認權限已開啟");
  
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', finalId);
  try {
    setupDatabase();
  } catch(e) {}

  return { success: true, spreadsheetId: finalId, name: ss.getName() };
}

function getSpreadsheetConfig() {
  var ss = getDbSpreadsheet();
  if (ss) {
    return { success: true, connected: true, id: ss.getId(), name: ss.getName(), url: ss.getUrl() };
  }
  return { success: true, connected: false };
}

/**
 * 核心初始化：建立 8 大工作表並套用優雅樣式
 */
function setupDatabase() {
  var ss = getDbSpreadsheet();
  if (!ss) throw new Error("未連接任何試算表。請先至設定頁面綁定您的試算表。");

  var headerStyle = function(sheet, headers) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground("#F4F1EA")
      .setFontColor("#3E3A36")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  };

  var sheetsDef = [
    { name: "流水帳資料庫", headers: ["月份", "日期", "項目", "出錢人", "出錢金額", "類型", "時間戳記"] },
    { name: "月度核銷狀態", headers: ["月份", "已撥款核銷"] },
    { name: "代墊明細", headers: ["ID", "時間", "代墊人", "分帳模式", "項目描述", "總金額", "分帳結果", "狀態", "結清時間", "備註"] },
    { name: "購物清單", headers: ["ID", "分類", "品項名稱", "購買地點", "預計購買日期", "狀態", "建立者", "建立時間", "備註細項"] },
    { name: "常用商店", headers: ["商店名稱", "備註"] },
    { name: "旅遊行程", headers: ["ID", "行程名稱", "目的地", "代表圖示", "開始日期", "結束日期", "幣別", "匯率", "預算台幣", "狀態", "主題顏色", "成員清單", "建立時間", "登錄者ID (Gmail)", "登錄者姓名"] },
    { name: "旅遊支出明細", headers: ["ID", "行程ID", "日期", "分類", "品項名稱", "付款人", "幣別", "原幣金額", "匯率", "台幣總額", "分攤模式", "分攤成員", "成員分攤細項", "代墊欠款對象", "代墊金額", "地點", "備註", "已轉日常代墊", "建立時間", "登錄者ID (Gmail)", "登錄者姓名"] },
    { name: "旅遊心願清單", headers: ["ID", "行程ID", "心願項目", "分類", "預估金額台幣", "提議人", "狀態", "備註", "登錄者ID (Gmail)", "登錄者姓名"] }
  ];

  sheetsDef.forEach(function(def) {
    var sh = ss.getSheetByName(def.name);
    if (!sh) {
      sh = ss.insertSheet(def.name);
      headerStyle(sh, def.headers);
    }
  });

  return "所有 8 張工作表初始化已就緒！";
}

function getDbSheet() {
  var ss = getDbSpreadsheet();
  if (!ss) throw new Error("未連結試算表");
  var sh = ss.getSheetByName("流水帳資料庫");
  if (!sh) {
    setupDatabase();
    sh = ss.getSheetByName("流水帳資料庫");
  }
  return sh;
}

function formatAmPmTime(dateInput) {
  if (!dateInput) return "";
  var d;
  if (dateInput instanceof Date) d = dateInput;
  else {
    try { d = new Date(dateInput); } catch (e) { d = new Date(); }
  }
  if (isNaN(d.getTime())) d = new Date();

  var timezone = "GMT+8";
  var year = Utilities.formatDate(d, timezone, "yyyy");
  var month = Utilities.formatDate(d, timezone, "MM");
  var day = Utilities.formatDate(d, timezone, "dd");
  var hours = parseInt(Utilities.formatDate(d, timezone, "HH"), 10);
  var minutes = Utilities.formatDate(d, timezone, "mm");
  var ampm = hours >= 12 ? '下午' : '上午';
  var h12 = hours % 12;
  if (h12 === 0) h12 = 12;
  var hh = (h12 < 10 ? '0' : '') + h12;
  return year + "-" + month + "-" + day + " " + ampm + " " + hh + ":" + minutes;
}

function getDashboardData() {
  try {
    var sheet = getDbSheet();
    var lastRow = sheet.getLastRow();
    var response = { records: [], liaoTotal: 0, zhouTotal: 0, reconciledMonths: [], success: true };

    try {
      response.reconciledMonths = getReconciledMonthsFromSheet();
    } catch (e) {}

    if (lastRow <= 1) return response;

    var values = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
    var liaoTotal = 0;
    var zhouTotal = 0;
    var recordsList = [];

    for (var i = values.length - 1; i >= 0; i--) {
      var row = values[i];
      var monthVal = row[0];
      var month = monthVal instanceof Date ? Utilities.formatDate(monthVal, "GMT+8", "yyyy-MM") : String(monthVal || "").substring(0, 7);
      var dateVal = row[1];
      var dateStr = dateVal instanceof Date ? Utilities.formatDate(dateVal, "GMT+8", "yyyy-MM-dd") : String(dateVal || (month ? month + "-01" : ""));
      var item = String(row[2] || "");
      var payer = String(row[3] || "");
      var amount = parseFloat(row[4]) || 0;
      var type = String(row[5] || "");
      var timestampVal = row[6];
      var timestampStr = timestampVal ? (timestampVal instanceof Date ? formatAmPmTime(timestampVal) : String(timestampVal)) : dateStr + " 上午 12:00";

      recordsList.push({
        id: i + 2,
        month: month,
        date: dateStr,
        item: item,
        payer: payer,
        amount: amount,
        type: type,
        timestamp: timestampStr
      });

      if (type.indexOf("支出") !== -1) {
        if (payer.indexOf("廖") !== -1) liaoTotal += amount;
        else if (payer.indexOf("周") !== -1) zhouTotal += amount;
      }
    }

    response.records = recordsList;
    response.liaoTotal = liaoTotal;
    response.zhouTotal = zhouTotal;
    return response;
  } catch (err) {
    return { success: false, error: err.toString(), records: [] };
  }
}

function getReconciledMonthsFromSheet() {
  try {
    var ss = getDbSpreadsheet();
    if (!ss) return [];
    var sheet = ss.getSheetByName("月度核銷狀態");
    if (!sheet) return [];
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    var res = [];
    for (var i = 0; i < values.length; i++) {
      var m = values[i][0];
      var isDone = values[i][1];
      if (isDone === true || isDone === "已核銷" || isDone === "TRUE" || isDone === 1) {
        var mStr = m instanceof Date ? Utilities.formatDate(m, "GMT+8", "yyyy-MM") : String(m).substring(0, 7);
        if (mStr && res.indexOf(mStr) === -1) res.push(mStr);
      }
    }
    return res;
  } catch (e) {
    return [];
  }
}

function addRecord(data) {
  var sheet = getDbSheet();
  var month = data.month || (data.date ? data.date.substring(0, 7) : Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM"));
  var date = data.date || Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd");
  var item = data.item || "未命名項目";
  var payer = data.payer || "廖";
  var amount = parseFloat(data.amount) || 0;
  var type = data.type || "支出";
  var timestamp = formatAmPmTime(new Date());

  sheet.appendRow([month, date, item, payer, amount, type, timestamp]);
  return { success: true, id: sheet.getLastRow() };
}

function updateRecordByRow(data) {
  var sheet = getDbSheet();
  var row = parseInt(data.id || data.rowId, 10);
  if (!row || row < 2) throw new Error("無效的行號 ID");

  if (data.month) sheet.getRange(row, 1).setValue(data.month);
  if (data.date) sheet.getRange(row, 2).setValue(data.date);
  if (data.item) sheet.getRange(row, 3).setValue(data.item);
  if (data.payer) sheet.getRange(row, 4).setValue(data.payer);
  if (data.amount !== undefined) sheet.getRange(row, 5).setValue(parseFloat(data.amount) || 0);
  if (data.type) sheet.getRange(row, 6).setValue(data.type);

  return { success: true };
}

function deleteRecordByRow(data) {
  var sheet = getDbSheet();
  var row = parseInt(data.id || data.rowId, 10);
  if (!row || row < 2) throw new Error("無效的行號 ID");
  sheet.deleteRow(row);
  return { success: true };
}

function setMonthReconciled(month, isReconciled) {
  var ss = getDbSpreadsheet();
  if (!ss) throw new Error("未連接試算表");
  var sheet = ss.getSheetByName("月度核銷狀態");
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName("月度核銷狀態");
  }

  var monthStr = String(month).substring(0, 7);
  var lastRow = sheet.getLastRow();
  var found = false;

  if (lastRow > 1) {
    var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (var i = 0; i < values.length; i++) {
      var mVal = values[i][0];
      var curM = mVal instanceof Date ? Utilities.formatDate(mVal, "GMT+8", "yyyy-MM") : String(mVal).substring(0, 7);
      if (curM === monthStr) {
        sheet.getRange(i + 2, 2).setValue(isReconciled ? "已核銷" : "未核銷");
        found = true;
        break;
      }
    }
  }

  if (!found) {
    sheet.appendRow([monthStr, isReconciled ? "已核銷" : "未核銷"]);
  }

  return { success: true };
}

// =======================
// 代墊明細相關 API
// =======================
function getSplitData() {
  try {
    var ss = getDbSpreadsheet();
    if (!ss) return { splitItems: [], success: true };
    var sheet = ss.getSheetByName("代墊明細");
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName("代墊明細");
    }

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { splitItems: [], success: true };

    var values = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
    var list = [];

    for (var i = values.length - 1; i >= 0; i--) {
      var r = values[i];
      if (!r[0] && !r[4]) continue;
      list.push({
        id: String(r[0] || i + 2),
        timestamp: r[1] instanceof Date ? formatAmPmTime(r[1]) : String(r[1] || ""),
        payer: String(r[2] || "廖"),
        mode: String(r[3] || "AA"),
        desc: String(r[4] || ""),
        amount: parseFloat(r[5]) || 0,
        result: String(r[6] || ""),
        status: String(r[7] || "未結清"),
        settledAt: r[8] ? (r[8] instanceof Date ? formatAmPmTime(r[8]) : String(r[8])) : null,
        note: String(r[9] || "")
      });
    }

    return { splitItems: list, success: true };
  } catch (err) {
    return { splitItems: [], success: false, error: err.toString() };
  }
}

function addSplitRecord(data) {
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName("代墊明細");
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName("代墊明細");
  }

  var id = data.id || ("split-" + Date.now());
  var timestamp = data.timestamp || formatAmPmTime(new Date());
  var payer = data.payer || "廖";
  var mode = data.mode || "AA";
  var desc = data.desc || "代墊支出";
  var amount = parseFloat(data.amount) || 0;
  var result = data.result || "";
  var status = data.status || "未結清";
  var settledAt = data.settledAt || "";
  var note = data.note || "";

  sheet.appendRow([id, timestamp, payer, mode, desc, amount, result, status, settledAt, note]);
  return { success: true, id: id };
}

function updateSplitRecord(data) {
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName("代墊明細");
  if (!sheet) throw new Error("找不到代墊明細表");

  var id = String(data.id);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error("無代墊資料");

  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === id) {
      var row = i + 2;
      if (data.payer) sheet.getRange(row, 3).setValue(data.payer);
      if (data.mode) sheet.getRange(row, 4).setValue(data.mode);
      if (data.desc) sheet.getRange(row, 5).setValue(data.desc);
      if (data.amount !== undefined) sheet.getRange(row, 6).setValue(parseFloat(data.amount) || 0);
      if (data.result) sheet.getRange(row, 7).setValue(data.result);
      if (data.status) sheet.getRange(row, 8).setValue(data.status);
      if (data.settledAt !== undefined) sheet.getRange(row, 9).setValue(data.settledAt);
      if (data.note !== undefined) sheet.getRange(row, 10).setValue(data.note);
      return { success: true };
    }
  }
  return { success: false, error: "找不到該筆代墊記錄" };
}

function deleteSplitRecord(data) {
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName("代墊明細");
  if (!sheet) throw new Error("找不到代墊明細表");

  var id = String(data.id || data);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: true };

  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === id) {
      sheet.deleteRow(i + 2);
      return { success: true };
    }
  }
  return { success: true };
}

function settleAllSplitRecords(data) {
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName("代墊明細");
  if (!sheet) throw new Error("找不到代墊明細表");

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: true, count: 0 };

  var values = sheet.getRange(2, 8, lastRow - 1, 2).getValues();
  var nowStr = formatAmPmTime(new Date());
  var count = 0;

  for (var i = 0; i < values.length; i++) {
    if (values[i][0] === "未結清" || !values[i][0]) {
      sheet.getRange(i + 2, 8).setValue("已結清");
      sheet.getRange(i + 2, 9).setValue(nowStr);
      count++;
    }
  }

  return { success: true, count: count, settledAt: nowStr };
}

// =======================
// 雙人購物清單與常用商店 API
// =======================
function getShoppingData() {
  try {
    var ss = getDbSpreadsheet();
    if (!ss) return { shoppingItems: [], success: true };
    var sheet = ss.getSheetByName("購物清單");
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName("購物清單");
    }

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { shoppingItems: [], success: true };

    var values = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    var list = [];

    for (var i = values.length - 1; i >= 0; i--) {
      var r = values[i];
      if (!r[0] && !r[2]) continue;
      list.push({
        id: String(r[0] || i + 2),
        category: String(r[1] || "日用品"),
        name: String(r[2] || ""),
        location: String(r[3] || "超市"),
        targetDate: r[4] ? (r[4] instanceof Date ? Utilities.formatDate(r[4], "GMT+8", "yyyy-MM-dd") : String(r[4])) : "",
        status: String(r[5] || "待購買"),
        creator: String(r[6] || "廖"),
        createdAt: r[7] ? (r[7] instanceof Date ? formatAmPmTime(r[7]) : String(r[7])) : "",
        note: String(r[8] || "")
      });
    }

    return { shoppingItems: list, success: true };
  } catch (err) {
    return { shoppingItems: [], success: false, error: err.toString() };
  }
}

function addShoppingItem(data) {
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName("購物清單");
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName("購物清單");
  }

  var id = data.id || ("shop-" + Date.now());
  var category = data.category || "日用品";
  var name = data.name || "未命名商品";
  var location = data.location || "全聯";
  var targetDate = data.targetDate || Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd");
  var status = data.status || "待購買";
  var creator = data.creator || "廖";
  var createdAt = data.createdAt || formatAmPmTime(new Date());
  var note = data.note || "";

  sheet.appendRow([id, category, name, location, targetDate, status, creator, createdAt, note]);
  return { success: true, id: id };
}

function updateShoppingItem(data) {
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName("購物清單");
  if (!sheet) throw new Error("找不到購物清單表");

  var id = String(data.id);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error("無購物資料");

  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === id) {
      var row = i + 2;
      if (data.category) sheet.getRange(row, 2).setValue(data.category);
      if (data.name) sheet.getRange(row, 3).setValue(data.name);
      if (data.location) sheet.getRange(row, 4).setValue(data.location);
      if (data.targetDate !== undefined) sheet.getRange(row, 5).setValue(data.targetDate);
      if (data.status) sheet.getRange(row, 6).setValue(data.status);
      if (data.note !== undefined) sheet.getRange(row, 9).setValue(data.note);
      return { success: true };
    }
  }
  return { success: false, error: "找不到該商品項目" };
}

function toggleShoppingItemStatus(data) {
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName("購物清單");
  if (!sheet) throw new Error("找不到購物清單表");

  var id = String(data.id);
  var newStatus = data.status || (data.isDone ? "已完成" : "待購買");
  var lastRow = sheet.getLastRow();

  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === id) {
      sheet.getRange(i + 2, 6).setValue(newStatus);
      return { success: true, status: newStatus };
    }
  }
  return { success: false, error: "找不到該項目" };
}

function deleteShoppingItem(data) {
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName("購物清單");
  if (!sheet) throw new Error("找不到購物清單表");

  var id = String(data.id || data);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: true };

  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === id) {
      sheet.deleteRow(i + 2);
      return { success: true };
    }
  }
  return { success: true };
}

function clearDoneShoppingItems() {
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName("購物清單");
  if (!sheet) return { success: true, count: 0 };

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: true, count: 0 };

  var values = sheet.getRange(2, 6, lastRow - 1, 1).getValues();
  var count = 0;
  for (var i = values.length - 1; i >= 0; i--) {
    if (values[i][0] === "已完成" || values[i][0] === "已買") {
      sheet.deleteRow(i + 2);
      count++;
    }
  }
  return { success: true, count: count };
}

function getStoreData() {
  try {
    var ss = getDbSpreadsheet();
    if (!ss) return { stores: [], success: true };
    var sheet = ss.getSheetByName("常用商店");
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName("常用商店");
    }

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { stores: [], success: true };

    var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    var list = [];
    for (var i = 0; i < values.length; i++) {
      if (values[i][0]) {
        list.push({ name: String(values[i][0]), note: String(values[i][1] || "") });
      }
    }
    return { stores: list, success: true };
  } catch (err) {
    return { stores: [], success: false, error: err.toString() };
  }
}

function addStoreItem(data) {
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName("常用商店");
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName("常用商店");
  }
  var name = data.name || data.storeName;
  var note = data.note || "";
  if (!name) throw new Error("商店名稱不得為空");
  sheet.appendRow([name, note]);
  return { success: true };
}

function deleteStoreItem(data) {
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName("常用商店");
  if (!sheet) return { success: true };
  var name = String(data.name || data.storeName || data);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: true };
  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === name) {
      sheet.deleteRow(i + 2);
      return { success: true };
    }
  }
  return { success: true };
}

// =======================
// 旅遊行程、支出與心願清單 API
// =======================
function getTravelData() {
  try {
    var ss = getDbSpreadsheet();
    if (!ss) return { trips: [], expenses: [], wishlist: [], success: true };

    var tripSheet = ss.getSheetByName("旅遊行程");
    var expSheet = ss.getSheetByName("旅遊支出明細");
    var wishSheet = ss.getSheetByName("旅遊心願清單");

    if (!tripSheet || !expSheet || !wishSheet) {
      setupDatabase();
      tripSheet = ss.getSheetByName("旅遊行程");
      expSheet = ss.getSheetByName("旅遊支出明細");
      wishSheet = ss.getSheetByName("旅遊心願清單");
    }

    var trips = [];
    var expenses = [];
    var wishlist = [];

    // 1. 旅遊行程
    if (tripSheet && tripSheet.getLastRow() > 1) {
      var tValues = tripSheet.getRange(2, 1, tripSheet.getLastRow() - 1, 15).getValues();
      for (var i = 0; i < tValues.length; i++) {
        var r = tValues[i];
        if (!r[0] && !r[1]) continue;
        var members = [];
        try {
          members = typeof r[11] === 'string' ? JSON.parse(r[11]) : (Array.isArray(r[11]) ? r[11] : ["廖", "周"]);
        } catch(e) {
          members = ["廖", "周"];
        }

        trips.push({
          id: String(r[0] || "trip-" + (i + 1)),
          name: String(r[1] || "未命名行程"),
          destination: String(r[2] || "日本"),
          coverIcon: String(r[3] || "✈️"),
          startDate: r[4] ? (r[4] instanceof Date ? Utilities.formatDate(r[4], "GMT+8", "yyyy-MM-dd") : String(r[4])) : "",
          endDate: r[5] ? (r[5] instanceof Date ? Utilities.formatDate(r[5], "GMT+8", "yyyy-MM-dd") : String(r[5])) : "",
          currency: String(r[6] || "JPY"),
          exchangeRate: parseFloat(r[7]) || 0.22,
          budgetTwd: parseFloat(r[8]) || 50000,
          status: String(r[9] || "planning"),
          themeColor: String(r[10] || "#E11D48"),
          members: members,
          createdAt: r[12] ? (r[12] instanceof Date ? formatAmPmTime(r[12]) : String(r[12])) : "",
          authorId: String(r[13] || ""),
          authorName: String(r[14] || "")
        });
      }
    }

    // 2. 旅遊支出明細
    if (expSheet && expSheet.getLastRow() > 1) {
      var eValues = expSheet.getRange(2, 1, expSheet.getLastRow() - 1, 21).getValues();
      for (var j = 0; j < eValues.length; j++) {
        var row = eValues[j];
        if (!row[0] && !row[4]) continue;
        var splitMembers = [];
        var customSplits = {};
        try { splitMembers = typeof row[11] === 'string' ? JSON.parse(row[11]) : []; } catch(e) {}
        try { customSplits = typeof row[12] === 'string' ? JSON.parse(row[12]) : {}; } catch(e) {}

        expenses.push({
          id: String(row[0] || "travelexp-" + (j + 1)),
          tripId: String(row[1] || ""),
          date: row[2] ? (row[2] instanceof Date ? Utilities.formatDate(row[2], "GMT+8", "yyyy-MM-dd") : String(row[2])) : "",
          category: String(row[3] || "餐飲美食"),
          item: String(row[4] || ""),
          payer: String(row[5] || "廖"),
          currency: String(row[6] || "JPY"),
          originalAmount: parseFloat(row[7]) || 0,
          exchangeRate: parseFloat(row[8]) || 1,
          amountTwd: parseFloat(row[9]) || 0,
          splitMode: String(row[10] || "equal"),
          splitMembers: splitMembers,
          customSplits: customSplits,
          debtor: String(row[13] || ""),
          debtAmountTwd: parseFloat(row[14]) || 0,
          location: String(row[15] || ""),
          note: String(row[16] || ""),
          transferredToSplit: row[17] === true || row[17] === "已轉代墊" || row[17] === "TRUE",
          createdAt: row[18] ? (row[18] instanceof Date ? formatAmPmTime(row[18]) : String(row[18])) : "",
          authorId: String(row[19] || ""),
          authorName: String(row[20] || "")
        });
      }
    }

    // 3. 旅遊心願清單
    if (wishSheet && wishSheet.getLastRow() > 1) {
      var wValues = wishSheet.getRange(2, 1, wishSheet.getLastRow() - 1, 10).getValues();
      for (var k = 0; k < wValues.length; k++) {
        var w = wValues[k];
        if (!w[0] && !w[2]) continue;
        wishlist.push({
          id: String(w[0] || "wish-" + (k + 1)),
          tripId: String(w[1] || ""),
          item: String(w[2] || ""),
          category: String(w[3] || "必吃美食"),
          estimatedTwd: parseFloat(w[4]) || 0,
          proposer: String(w[5] || "廖"),
          status: String(w[6] || "pending"),
          note: String(w[7] || ""),
          authorId: String(w[8] || ""),
          authorName: String(w[9] || "")
        });
      }
    }

    return { trips: trips, expenses: expenses, wishlist: wishlist, success: true };
  } catch (err) {
    return { trips: [], expenses: [], wishlist: [], success: false, error: err.toString() };
  }
}

function saveTravelTrip(data) {
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName("旅遊行程");
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName("旅遊行程");
  }

  var id = data.id || ("trip-" + Date.now());
  var name = data.name || "新旅遊行程";
  var destination = data.destination || "日本";
  var coverIcon = data.coverIcon || "✈️";
  var startDate = data.startDate || Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd");
  var endDate = data.endDate || startDate;
  var currency = data.currency || "JPY";
  var exchangeRate = parseFloat(data.exchangeRate) || 0.22;
  var budgetTwd = parseFloat(data.budgetTwd) || 50000;
  var status = data.status || "planning";
  var themeColor = data.themeColor || "#E11D48";
  var membersStr = JSON.stringify(data.members || ["廖", "周"]);
  var createdAt = data.createdAt || formatAmPmTime(new Date());
  var authorId = data.authorId || "";
  var authorName = data.authorName || "";

  var lastRow = sheet.getLastRow();
  var foundRow = -1;

  if (lastRow > 1) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        foundRow = i + 2;
        break;
      }
    }
  }

  var rowData = [id, name, destination, coverIcon, startDate, endDate, currency, exchangeRate, budgetTwd, status, themeColor, membersStr, createdAt, authorId, authorName];

  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return { success: true, id: id };
}

function deleteTravelTrip(data) {
  try {
    var id = String(typeof data === 'object' ? (data.id || data.tripId || '') : data);
    if (!id) return { success: false, message: "無效的行程 ID" };
    var ss = getDbSpreadsheet();
    if (!ss) return { success: false, message: "查無試算表" };

    // 1. 刪除行程本體
    var tripSheet = ss.getSheetByName("旅遊行程");
    if (tripSheet) {
      var lastRow = tripSheet.getLastRow();
      if (lastRow > 1) {
        var ids = tripSheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < ids.length; i++) {
          if (String(ids[i][0]) === id) {
            tripSheet.deleteRow(i + 2);
            break;
          }
        }
      }
    }

    // 2. 聯動刪除該行程的所有「旅遊支出明細」
    var expSheet = ss.getSheetByName("旅遊支出明細") || ss.getSheetByName("旅遊分帳");
    if (expSheet) {
      var expLastRow = expSheet.getLastRow();
      if (expLastRow > 1) {
        var expTripIds = expSheet.getRange(2, 2, expLastRow - 1, 1).getValues();
        for (var j = expTripIds.length - 1; j >= 0; j--) {
          if (String(expTripIds[j][0]) === id) {
            expSheet.deleteRow(j + 2);
          }
        }
      }
    }

    // 3. 聯動刪除該行程的所有「旅遊心願清單」
    var wishSheet = ss.getSheetByName("旅遊心願清單");
    if (wishSheet) {
      var wishLastRow = wishSheet.getLastRow();
      if (wishLastRow > 1) {
        var wishTripIds = wishSheet.getRange(2, 2, wishLastRow - 1, 1).getValues();
        for (var k = wishTripIds.length - 1; k >= 0; k--) {
          if (String(wishTripIds[k][0]) === id) {
            wishSheet.deleteRow(k + 2);
          }
        }
      }
    }

    return { success: true, message: "已自試算表完整刪除旅遊行程及其所有關聯支出與心願明細！" };
  } catch (e) {
    return { success: false, message: "刪除行程失敗：" + e.toString() };
  }
}

function addTravelExpense(data) {
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName("旅遊支出明細");
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName("旅遊支出明細");
  }

  var id = data.id || ("travelexp-" + Date.now() + "-" + Math.floor(Math.random() * 1000));
  var tripId = data.tripId || "";
  var date = data.date || Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd");
  var category = data.category || "餐飲美食";
  var item = data.item || "未命名支出";
  var payer = data.payer || "廖";
  var currency = data.currency || "JPY";
  var originalAmount = parseFloat(data.originalAmount) || 0;
  var exchangeRate = parseFloat(data.exchangeRate) || 1;
  var amountTwd = parseFloat(data.amountTwd) || Math.round(originalAmount * exchangeRate);
  var splitMode = data.splitMode || "equal";
  var splitMembers = JSON.stringify(data.splitMembers || []);
  var customSplits = JSON.stringify(data.customSplits || {});
  var debtor = data.debtor || "";
  var debtAmountTwd = parseFloat(data.debtAmountTwd) || 0;
  var location = data.location || "";
  var note = data.note || "";
  var transferred = data.transferredToSplit ? "已轉代墊" : "未轉代墊";
  var createdAt = data.createdAt || formatAmPmTime(new Date());
  var authorId = data.authorId || "";
  var authorName = data.authorName || "";

  sheet.appendRow([id, tripId, date, category, item, payer, currency, originalAmount, exchangeRate, amountTwd, splitMode, splitMembers, customSplits, debtor, debtAmountTwd, location, note, transferred, createdAt, authorId, authorName]);
  return { success: true, id: id };
}

function addBatchTravelExpenses(data) {
  var items = Array.isArray(data) ? data : (data.items || []);
  if (!items || items.length === 0) return { success: true, count: 0 };

  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName("旅遊支出明細");
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName("旅遊支出明細");
  }

  var rows = [];
  for (var i = 0; i < items.length; i++) {
    var d = items[i];
    var id = d.id || ("travelexp-" + Date.now() + "-" + i);
    rows.push([
      id,
      d.tripId || "",
      d.date || Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd"),
      d.category || "餐飲美食",
      d.item || "未命名項目",
      d.payer || "廖",
      d.currency || "JPY",
      parseFloat(d.originalAmount) || 0,
      parseFloat(d.exchangeRate) || 1,
      parseFloat(d.amountTwd) || 0,
      d.splitMode || "equal",
      JSON.stringify(d.splitMembers || []),
      JSON.stringify(d.customSplits || {}),
      d.debtor || "",
      parseFloat(d.debtAmountTwd) || 0,
      d.location || "",
      d.note || "",
      d.transferredToSplit ? "已轉代墊" : "未轉代墊",
      d.createdAt || formatAmPmTime(new Date()),
      d.authorId || "",
      d.authorName || ""
    ]);
  }

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  return { success: true, count: rows.length };
}

function updateTravelExpense(data) {
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName("旅遊支出明細");
  if (!sheet) throw new Error("找不到旅遊支出明細表");

  var id = String(data.id);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error("無旅遊支出記錄");

  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === id) {
      var row = i + 2;
      if (data.date) sheet.getRange(row, 3).setValue(data.date);
      if (data.category) sheet.getRange(row, 4).setValue(data.category);
      if (data.item) sheet.getRange(row, 5).setValue(data.item);
      if (data.payer) sheet.getRange(row, 6).setValue(data.payer);
      if (data.currency) sheet.getRange(row, 7).setValue(data.currency);
      if (data.originalAmount !== undefined) sheet.getRange(row, 8).setValue(parseFloat(data.originalAmount) || 0);
      if (data.exchangeRate !== undefined) sheet.getRange(row, 9).setValue(parseFloat(data.exchangeRate) || 1);
      if (data.amountTwd !== undefined) sheet.getRange(row, 10).setValue(parseFloat(data.amountTwd) || 0);
      if (data.splitMode) sheet.getRange(row, 11).setValue(data.splitMode);
      if (data.splitMembers) sheet.getRange(row, 12).setValue(JSON.stringify(data.splitMembers));
      if (data.customSplits) sheet.getRange(row, 13).setValue(JSON.stringify(data.customSplits));
      if (data.debtor !== undefined) sheet.getRange(row, 14).setValue(data.debtor);
      if (data.debtAmountTwd !== undefined) sheet.getRange(row, 15).setValue(parseFloat(data.debtAmountTwd) || 0);
      if (data.location !== undefined) sheet.getRange(row, 16).setValue(data.location);
      if (data.note !== undefined) sheet.getRange(row, 17).setValue(data.note);
      if (data.transferredToSplit !== undefined) sheet.getRange(row, 18).setValue(data.transferredToSplit ? "已轉代墊" : "未轉代墊");
      return { success: true };
    }
  }
  return { success: false, error: "找不到該筆旅遊支出" };
}

function deleteTravelExpense(data) {
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName("旅遊支出明細");
  if (!sheet) return { success: true };

  var id = String(data.id || data);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: true };

  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === id) {
      sheet.deleteRow(i + 2);
      return { success: true };
    }
  }
  return { success: true };
}

function syncAllTravelData(data) {
  var trips = data.trips || [];
  var expenses = data.expenses || [];
  var wishlist = data.wishlist || [];

  if (trips.length > 0) {
    trips.forEach(function(t) { saveTravelTrip(t); });
  }
  if (expenses.length > 0) {
    addBatchTravelExpenses(expenses);
  }
  if (wishlist.length > 0) {
    wishlist.forEach(function(w) { addTravelWishItem(w); });
  }

  return { success: true, message: "所有旅遊分帳資料同步成功" };
}

function addTravelWishItem(data) {
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName("旅遊心願清單");
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName("旅遊心願清單");
  }

  var id = data.id || ("wish-" + Date.now());
  var tripId = data.tripId || "";
  var item = data.item || "未命名心願";
  var category = data.category || "必吃美食";
  var estimatedTwd = parseFloat(data.estimatedTwd) || 0;
  var proposer = data.proposer || "廖";
  var status = data.status || "pending";
  var note = data.note || "";
  var authorId = data.authorId || "";
  var authorName = data.authorName || "";

  sheet.appendRow([id, tripId, item, category, estimatedTwd, proposer, status, note, authorId, authorName]);
  return { success: true, id: id };
}

function toggleTravelWishStatus(data) {
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName("旅遊心願清單");
  if (!sheet) throw new Error("找不到旅遊心願清單表");

  var id = String(data.id);
  var newStatus = data.status || "completed";
  var lastRow = sheet.getLastRow();

  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === id) {
      sheet.getRange(i + 2, 7).setValue(newStatus);
      return { success: true, status: newStatus };
    }
  }
  return { success: false, error: "找不到該心願項目" };
}

function deleteTravelWishItem(data) {
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName("旅遊心願清單");
  if (!sheet) return { success: true };

  var id = String(data.id || data);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: true };

  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === id) {
      sheet.deleteRow(i + 2);
      return { success: true };
    }
  }
  return { success: true };
}
