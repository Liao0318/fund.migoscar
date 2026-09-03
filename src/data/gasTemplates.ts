export const INDEX_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>伴伴記❤️ - 情侶生活公積金與代墊對帳</title>
  <link rel="icon" type="image/png" href="https://img.icons8.com/color/180/cherry-blossom.png">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background-color: #F7F5F0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    iframe { width: 100%; height: 100%; border: 0; display: block; }
  </style>
</head>
<body>
  <!-- 伴伴記公積金主前端 (託管於 GitHub Pages) -->
  <iframe 
    id="banban-frame" 
    src="https://liao0318.github.io/fund.migoscar/" 
    allow="clipboard-read; clipboard-write; geolocation; camera;"
    title="伴伴記"
  ></iframe>
</body>
</html>`;

export const SPLIT_INDEX_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>伴伴記❤️ - 情侶代墊與私人借還</title>
  <link rel="icon" type="image/png" href="https://img.icons8.com/color/180/cherry-blossom.png">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    iframe { width: 100%; height: 100%; border: 0; display: block; }
  </style>
</head>
<body>
  <!-- 伴伴記情侶代墊分帳子頁面 (託管於 GitHub Pages) -->
  <iframe 
    id="banban-split-frame" 
    src="https://liao0318.github.io/fund.migoscar/#/split" 
    allow="clipboard-read; clipboard-write; geolocation; camera;"
    title="伴伴記・代墊返還"
  ></iframe>
</body>
</html>`;

export const CODE_GS_TEMPLATE = `var HARDCODED_SPREADSHEET_ID = "";
/**
 * 伴伴記❤️ - Google Apps Script 後端處理 (Code.gs)
 * 輕量高效率 Google 試算表資料庫與即時對帳 API 服務。
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
    var fallbackHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>伴伴記後端 API</title><style>body{font-family:sans-serif;text-align:center;padding:40px;background:#fdfaf7;color:#333;}h2{color:#e11d48;}.card{background:#fff;border-radius:16px;padding:24px;max-width:500px;margin:20px auto;box-shadow:0 4px 16px rgba(0,0,0,0.06);line-height:1.6;}</style></head><body><h2>🌸 伴伴記 Google Apps Script 後端 API 運作中</h2><div class="card"><p>✅ 試算表資料庫與 App 內建即時同步 API 已就緒！</p><p>🚀 前端網頁由 GitHub Pages 託管，支援手機 PWA 與離線對帳。</p></div></body></html>';
    return HtmlService.createHtmlOutput(fallbackHtml)
      .setTitle('伴伴記 後端 API 服務')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (lockErr) {}

  try {
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        payload = {};
      }
    }

    var action = payload.action || (e && e.parameter && e.parameter.action) || "";
    var res = { success: false, message: "未知的 API 動作：" + action };

    // 1. 公積金流水帳 API
    if (action === "getDashboardData") res = getDashboardData();
    else if (action === "addRecord") res = addRecord(payload);
    else if (action === "updateRecordByRow") res = updateRecordByRow(payload);
    else if (action === "deleteRecordByRow") res = deleteRecordByRow(payload);
    else if (action === "setMonthReconciled") res = setMonthReconciled(payload.month, payload.isReconciled);

    // 2. 代墊明細 API
    else if (action === "getSplitData") res = getSplitData();
    else if (action === "addSplitRecord") res = addSplitRecord(payload);
    else if (action === "updateSplitRecord") res = updateSplitRecord(payload);
    else if (action === "deleteSplitRecord") res = deleteSplitRecord(payload);
    else if (action === "settleAllSplitRecords" || action === "settleSplitRecords") res = settleAllSplitRecords(payload);

    // 3. 購物清單 API
    else if (action === "getShoppingData") res = getShoppingData();
    else if (action === "addShoppingItem") res = addShoppingItem(payload);
    else if (action === "updateShoppingItem") res = updateShoppingItem(payload);
    else if (action === "toggleShoppingItemStatus") res = toggleShoppingItemStatus(payload);
    else if (action === "deleteShoppingItem") res = deleteShoppingItem(payload);
    else if (action === "clearDoneShoppingItems") res = clearDoneShoppingItems();

    // 4. 常用商店 API
    else if (action === "getStoreData") res = getStoreData();
    else if (action === "addStoreItem") res = addStoreItem(payload);
    else if (action === "deleteStoreItem") res = deleteStoreItem(payload);

    // 5. 旅遊記帳 API
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

    // 6. 設定與資料庫管理 API
    else if (action === "saveSpreadsheetId") res = saveSpreadsheetId(payload.spreadsheetId || payload.url);
    else if (action === "getSpreadsheetConfig") res = getSpreadsheetConfig();
    else if (action === "setupDatabase") res = { success: true, message: setupDatabase() };

    return jsonResponse(res);
  } catch (err) {
    return jsonResponse({ success: false, message: "伺服器處理異常：" + err.toString() });
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function getDbSpreadsheet() {
  if (typeof HARDCODED_SPREADSHEET_ID !== 'undefined' && HARDCODED_SPREADSHEET_ID && HARDCODED_SPREADSHEET_ID.trim()) {
    var raw = HARDCODED_SPREADSHEET_ID.trim();
    var id = raw;
    if (raw.indexOf("docs.google.com/spreadsheets") !== -1) {
      var m = raw.match(/\\/d\\/([a-zA-Z0-9_\\-]+)/);
      if (m && m[1]) id = m[1];
    }
    try {
      var ss = SpreadsheetApp.openById(id);
      if (ss) return ss;
    } catch (e) {}
  }

  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}

  try {
    var savedId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
    if (savedId) return SpreadsheetApp.openById(savedId);
  } catch (e) {}

  return null;
}

function saveSpreadsheetId(idOrUrl) {
  try {
    if (!idOrUrl) {
      PropertiesService.getScriptProperties().deleteProperty("SPREADSHEET_ID");
      return { success: true, message: "已重置試算表綁定" };
    }
    var id = idOrUrl;
    if (idOrUrl.indexOf("docs.google.com/spreadsheets") !== -1) {
      var matches = idOrUrl.match(/\\/d\\/([a-zA-Z0-9_\\-]+)/);
      if (matches && matches[1]) id = matches[1];
    }
    var ss = SpreadsheetApp.openById(id);
    PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", id);
    setupDatabase();
    return { success: true, message: "成功綁定 Google 試算表「" + ss.getName() + "」！" };
  } catch (e) {
    return { success: false, message: "綁定失敗：" + e.toString() };
  }
}

function getSpreadsheetConfig() {
  try {
    var ss = getDbSpreadsheet();
    if (ss) {
      return { connected: true, name: ss.getName(), url: ss.getUrl() };
    }
    return { connected: false };
  } catch (e) {
    return { connected: false, error: e.toString() };
  }
}

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
        if (payer === "廖尹丞") liaoTotal += amount;
        else if (payer === "周沛緹") zhouTotal += amount;
      }
    }

    response.records = recordsList;
    response.liaoTotal = liaoTotal;
    response.zhouTotal = zhouTotal;
    return response;
  } catch (e) {
    return { success: false, message: "讀取錯誤：" + e.toString(), records: [], liaoTotal: 0, zhouTotal: 0, reconciledMonths: [] };
  }
}

function addRecord(data) {
  try {
    var sheet = getDbSheet();
    var now = new Date();
    var dateStr = data.date || Utilities.formatDate(now, "GMT+8", "yyyy-MM-dd");
    var monthStr = dateStr.substring(0, 7);
    var amount = parseFloat(data.amount) || 0;
    var timestampStr = formatAmPmTime(now);

    var newRow = [
      monthStr,
      dateStr,
      data.item || "未分類項目",
      data.payer || "廖尹丞",
      amount,
      data.type || "支出-日常代墊",
      timestampStr
    ];
    sheet.appendRow(newRow);
    return { success: true, message: "成功寫入一筆記帳資料！" };
  } catch (e) {
    return { success: false, message: "寫入失敗：" + e.toString() };
  }
}

function updateRecordByRow(data) {
  try {
    var sheet = getDbSheet();
    var rowId = parseInt(data.id || data.rowId, 10);
    if (!rowId || rowId < 2) return { success: false, message: "無效的紀錄編號" };

    var now = new Date();
    var dateStr = data.date || Utilities.formatDate(now, "GMT+8", "yyyy-MM-dd");
    var monthStr = dateStr.substring(0, 7);
    var amount = parseFloat(data.amount) || 0;

    sheet.getRange(rowId, 1, 1, 6).setValues([[
      monthStr,
      dateStr,
      data.item || "未分類項目",
      data.payer || "廖尹丞",
      amount,
      data.type || "支出-日常代墊"
    ]]);
    return { success: true, message: "已成功更新紀錄！" };
  } catch (e) {
    return { success: false, message: "更新失敗：" + e.toString() };
  }
}

function deleteRecordByRow(payload) {
  try {
    var rowId = parseInt(typeof payload === 'object' ? (payload.id || payload.rowId) : payload, 10);
    if (!rowId || rowId < 2) return { success: false, message: "無效的紀錄編號" };
    var sheet = getDbSheet();
    sheet.deleteRow(rowId);
    return { success: true, message: "已成功刪除記帳紀錄！" };
  } catch (e) {
    return { success: false, message: "刪除失敗：" + e.toString() };
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

    var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    var reconciled = [];
    for (var i = 0; i < data.length; i++) {
      var cellVal = data[i][0];
      var monthStr = cellVal instanceof Date ? Utilities.formatDate(cellVal, "GMT+8", "yyyy-MM") : String(cellVal || "").trim();
      var isReconciled = data[i][1];
      if (isReconciled === true || isReconciled === "TRUE" || isReconciled === "true") {
        if (monthStr && reconciled.indexOf(monthStr) === -1) reconciled.push(monthStr);
      }
    }
    return reconciled;
  } catch (e) {
    return [];
  }
}

function setMonthReconciled(month, isReconciled) {
  try {
    if (!month) return { success: false, message: "請指定月份" };
    var ss = getDbSpreadsheet();
    if (!ss) return { success: false, message: "未連結試算表" };
    var sheet = ss.getSheetByName("月度核銷狀態");
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName("月度核銷狀態");
    }

    var lastRow = sheet.getLastRow();
    var boolReconciled = (isReconciled === true || isReconciled === "true" || isReconciled === "TRUE");
    var foundRow = -1;

    if (lastRow > 1) {
      var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < values.length; i++) {
        var val = values[i][0];
        var mStr = val instanceof Date ? Utilities.formatDate(val, "GMT+8", "yyyy-MM") : String(val || "").trim();
        if (mStr === String(month).trim()) {
          foundRow = i + 2;
          break;
        }
      }
    }

    if (foundRow !== -1) {
      sheet.getRange(foundRow, 2).setValue(boolReconciled);
    } else {
      sheet.appendRow(["'" + month, boolReconciled]);
      sheet.getRange(sheet.getLastRow(), 2).insertCheckboxes();
    }
    return { success: true, message: "成功更新 " + month + " 核銷狀態！" };
  } catch (e) {
    return { success: false, message: "更新失敗：" + e.toString() };
  }
}

// 7. 代墊分帳 API (代墊明細工作表)
function getSplitData() {
  try {
    var ss = getDbSpreadsheet();
    if (!ss) return { success: false, items: [] };
    var sheet = ss.getSheetByName("代墊明細");
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName("代墊明細");
    }
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: true, items: [] };

    var values = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
    var items = [];
    for (var i = values.length - 1; i >= 0; i--) {
      var row = values[i];
      if (!row[0]) continue;
      items.push({
        id: String(row[0]),
        date: row[1] instanceof Date ? Utilities.formatDate(row[1], "GMT+8", "yyyy-MM-dd HH:mm") : String(row[1] || ""),
        payer: String(row[2] || "廖尹丞"),
        splitMode: String(row[3] || "equal"),
        description: String(row[4] || ""),
        amount: parseFloat(row[5]) || 0,
        splitResult: String(row[6] || ""),
        status: String(row[7] || "unsettled"),
        settledAt: row[8] instanceof Date ? Utilities.formatDate(row[8], "GMT+8", "yyyy-MM-dd HH:mm") : String(row[8] || ""),
        note: String(row[9] || "")
      });
    }
    return { success: true, items: items };
  } catch (e) {
    return { success: false, message: e.toString(), items: [] };
  }
}

function addSplitRecord(data) {
  try {
    var ss = getDbSpreadsheet();
    if (!ss) return { success: false, message: "未連結試算表" };
    var sheet = ss.getSheetByName("代墊明細");
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName("代墊明細");
    }

    var id = data.id || "split-" + Date.now();
    var nowStr = formatAmPmTime(new Date());
    var row = [
      id,
      data.date || nowStr,
      data.payer || "廖尹丞",
      data.splitMode || "equal",
      data.description || "日常代墊",
      parseFloat(data.amount) || 0,
      typeof data.splitResult === 'object' ? JSON.stringify(data.splitResult) : String(data.splitResult || ""),
      data.status || "unsettled",
      data.settledAt || "",
      data.note || ""
    ];
    sheet.appendRow(row);
    return { success: true, message: "成功新增代墊紀錄！", id: id };
  } catch (e) {
    return { success: false, message: "新增失敗：" + e.toString() };
  }
}

function deleteSplitRecord(payload) {
  try {
    var id = typeof payload === 'object' ? (payload.id) : payload;
    if (!id) return { success: false, message: "請指定代墊 ID" };
    var ss = getDbSpreadsheet();
    var sheet = ss.getSheetByName("代墊明細");
    if (!sheet) return { success: false, message: "查無代墊工作表" };
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, message: "查無紀錄" };

    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        sheet.deleteRow(i + 2);
        return { success: true, message: "已成功刪除代墊紀錄！" };
      }
    }
    return { success: false, message: "找不到該筆代墊紀錄" };
  } catch (e) {
    return { success: false, message: "刪除失敗：" + e.toString() };
  }
}

function settleAllSplitRecords(payload) {
  try {
    var ss = getDbSpreadsheet();
    var sheet = ss.getSheetByName("代墊明細");
    if (!sheet) return { success: false, message: "查無代墊工作表" };
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: true, message: "目前無待結算項目" };

    var statuses = sheet.getRange(2, 8, lastRow - 1, 1).getValues();
    var settledTime = formatAmPmTime(new Date());
    var count = 0;

    for (var i = 0; i < statuses.length; i++) {
      if (String(statuses[i][0]) === "unsettled") {
        sheet.getRange(i + 2, 8).setValue("settled");
        sheet.getRange(i + 2, 9).setValue(settledTime);
        count++;
      }
    }
    return { success: true, message: "已成功核銷結清 " + count + " 筆代墊紀錄！", count: count };
  } catch (e) {
    return { success: false, message: "結算失敗：" + e.toString() };
  }
}

// 8. 購物清單 API
function getShoppingData() {
  try {
    var ss = getDbSpreadsheet();
    if (!ss) return { success: false, items: [] };
    var sheet = ss.getSheetByName("購物清單");
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName("購物清單");
    }
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: true, items: [] };

    var values = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    var items = [];
    for (var i = values.length - 1; i >= 0; i--) {
      var row = values[i];
      if (!row[0]) continue;
      items.push({
        id: String(row[0]),
        category: String(row[1] || "需要買"),
        item: String(row[2] || ""),
        store: String(row[3] || "隨意"),
        deadline: String(row[4] || "儘快"),
        status: String(row[5] || "pending"),
        creator: String(row[6] || "伴伴記"),
        createdTime: String(row[7] || ""),
        note: String(row[8] || "")
      });
    }
    return { success: true, items: items };
  } catch (e) {
    return { success: false, message: e.toString(), items: [] };
  }
}

function addShoppingItem(data) {
  try {
    var ss = getDbSpreadsheet();
    var sheet = ss.getSheetByName("購物清單");
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName("購物清單");
    }
    var id = data.id || "shop-" + Date.now();
    var nowStr = formatAmPmTime(new Date());
    var newRow = [
      id,
      data.category || "需要買",
      data.item || "採買項目",
      data.store || "隨意",
      data.deadline || "儘快",
      data.status || "pending",
      data.creator || "廖尹丞",
      data.createdTime || nowStr,
      data.note || ""
    ];
    sheet.appendRow(newRow);
    return { success: true, message: "已加入購物清單！", id: id };
  } catch (e) {
    return { success: false, message: "新增失敗：" + e.toString() };
  }
}

function toggleShoppingItemStatus(payload) {
  try {
    var id = payload.id;
    var status = payload.status || "completed";
    var ss = getDbSpreadsheet();
    var sheet = ss.getSheetByName("購物清單");
    if (!sheet) return { success: false, message: "查無購物清單" };
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, message: "查無品項" };

    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        sheet.getRange(i + 2, 6).setValue(status);
        return { success: true, message: "購物狀態已更新！" };
      }
    }
    return { success: false, message: "找不到該品項" };
  } catch (e) {
    return { success: false, message: "更新失敗：" + e.toString() };
  }
}

function deleteShoppingItem(payload) {
  try {
    var id = typeof payload === 'object' ? payload.id : payload;
    var ss = getDbSpreadsheet();
    var sheet = ss.getSheetByName("購物清單");
    if (!sheet) return { success: false, message: "查無購物清單" };
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, message: "查無品項" };

    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        sheet.deleteRow(i + 2);
        return { success: true, message: "已自購物清單移除！" };
      }
    }
    return { success: false, message: "找不到該品項" };
  } catch (e) {
    return { success: false, message: "刪除失敗：" + e.toString() };
  }
}

function clearDoneShoppingItems() {
  try {
    var ss = getDbSpreadsheet();
    var sheet = ss.getSheetByName("購物清單");
    if (!sheet) return { success: false, message: "查無購物清單" };
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: true, message: "已清理完畢" };

    var statuses = sheet.getRange(2, 6, lastRow - 1, 1).getValues();
    for (var i = statuses.length - 1; i >= 0; i--) {
      if (String(statuses[i][0]) === "completed" || String(statuses[i][0]) === "done") {
        sheet.deleteRow(i + 2);
      }
    }
    return { success: true, message: "已一鍵清理所有已完成品項！" };
  } catch (e) {
    return { success: false, message: "清理失敗：" + e.toString() };
  }
}

// 9. 常用商店 API
function getStoreData() {
  try {
    var ss = getDbSpreadsheet();
    var sheet = ss.getSheetByName("常用商店");
    if (!sheet) return { success: true, stores: [] };
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: true, stores: [] };

    var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    var stores = [];
    for (var i = 0; i < values.length; i++) {
      if (values[i][0]) {
        stores.push({ name: String(values[i][0]), note: String(values[i][1] || "") });
      }
    }
    return { success: true, stores: stores };
  } catch (e) {
    return { success: false, message: e.toString(), stores: [] };
  }
}

function addStoreItem(payload) {
  try {
    var name = payload.name;
    var note = payload.note || "";
    if (!name) return { success: false, message: "請輸入商店名稱" };
    var ss = getDbSpreadsheet();
    var sheet = ss.getSheetByName("常用商店");
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName("常用商店");
    }
    sheet.appendRow([name, note]);
    return { success: true, message: "已新增常用商店！" };
  } catch (e) {
    return { success: false, message: "新增失敗：" + e.toString() };
  }
}

function deleteStoreItem(payload) {
  try {
    var name = typeof payload === 'object' ? payload.name : payload;
    var ss = getDbSpreadsheet();
    var sheet = ss.getSheetByName("常用商店");
    if (!sheet) return { success: false, message: "查無工作表" };
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, message: "查無商店" };

    var names = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < names.length; i++) {
      if (String(names[i][0]) === String(name)) {
        sheet.deleteRow(i + 2);
        return { success: true, message: "已刪除商店！" };
      }
    }
    return { success: false, message: "查無此商店" };
  } catch (e) {
    return { success: false, message: "刪除失敗：" + e.toString() };
  }
}

function getTravelData() {
  try {
    var ss = getDbSpreadsheet();
    if (!ss) return { success: false, trips: [], expenses: [], wishlist: [], wishes: [] };

    var tripsSheet = ss.getSheetByName("旅遊行程") || ss.getSheetByName("TravelTrips");
    var expSheet = ss.getSheetByName("旅遊支出明細") || ss.getSheetByName("旅遊分帳") || ss.getSheetByName("旅遊記帳") || ss.getSheetByName("TravelExpenses");
    var wishSheet = ss.getSheetByName("旅遊心願清單") || ss.getSheetByName("旅遊清單") || ss.getSheetByName("TravelWishlist");

    var trips = [];
    var expenses = [];
    var wishes = [];

    // 1. 讀取旅遊行程
    if (tripsSheet && tripsSheet.getLastRow() > 1) {
      var tRows = tripsSheet.getRange(2, 1, tripsSheet.getLastRow() - 1, Math.max(tripsSheet.getLastColumn(), 13)).getValues();
      for (var i = 0; i < tRows.length; i++) {
        var r = tRows[i];
        if (!r[0] && !r[1]) continue;
        var tripId = String(r[0] || ("trip-" + (i + 1)));
        var title = String(r[1] || "未命名行程");
        var destination = String(r[2] || "");
        var coverEmoji = String(r[3] || "✈️");
        var startDate = r[4] instanceof Date ? Utilities.formatDate(r[4], "GMT+8", "yyyy-MM-dd") : String(r[4] || "");
        var endDate = r[5] instanceof Date ? Utilities.formatDate(r[5], "GMT+8", "yyyy-MM-dd") : String(r[5] || "");
        var currency = String(r[6] || "JPY").toUpperCase();
        var exchangeRate = parseFloat(r[7]) || (currency === "KRW" ? 0.024 : currency === "JPY" ? 0.22 : 1);
        var budgetTWD = parseFloat(r[8]) || 0;
        var status = String(r[9] || "進行中");
        if (status === "planning") status = "規劃中";
        else if (status === "active" || status === "ongoing") status = "進行中";
        else if (status === "settled" || status === "completed") status = "已結算";

        var themeColor = String(r[10] || "rose");
        var members = ["廖", "周"];
        try {
          if (r[11]) {
            if (typeof r[11] === "string" && (r[11].indexOf("[") === 0 || r[11].indexOf("{") === 0)) {
              members = JSON.parse(r[11]);
            } else if (typeof r[11] === "string") {
              members = r[11].split(/[,+、/ ]+/).map(function(s){ return s.trim(); }).filter(Boolean);
            }
          }
        } catch (e) {
          members = ["廖", "周"];
        }

        var tripObj = {
          id: tripId,
          title: title,
          name: title,
          destination: destination,
          coverEmoji: coverEmoji,
          icon: coverEmoji,
          startDate: startDate,
          endDate: endDate,
          currency: currency,
          baseCurrency: currency,
          exchangeRate: exchangeRate,
          budgetTWD: budgetTWD,
          budgetTwd: budgetTWD,
          status: status,
          themeColor: themeColor,
          members: members,
          createdAt: String(r[12] || ""),
          creatorEmail: String(r[13] || ""),
          createdBy: String(r[14] || "")
        };
        trips.push(tripObj);
      }
    }

    // 預設行程對照表 (方便支出自動關聯)
    var defaultTrip = trips.length > 0 ? (trips.filter(function(t){ return t.status !== "已結算"; })[0] || trips[0]) : {
      id: "trip-default",
      currency: "KRW",
      exchangeRate: 0.024,
      members: ["廖", "周"]
    };

    // 2. 智慧讀取旅遊支出明細 (自適應 10 欄 Excel 模板與 21 欄資料庫格式，支援後端批量直接記帳)
    if (expSheet && expSheet.getLastRow() > 1) {
      var lastCol = Math.max(expSheet.getLastColumn(), 21);
      var headerValues = expSheet.getRange(1, 1, 1, lastCol).getValues()[0];
      var expRows = expSheet.getRange(2, 1, expSheet.getLastRow() - 1, lastCol).getValues();

      // 建立欄位索引動態對照表 (智慧模糊比對)
      var colMap = {};
      for (var h = 0; h < headerValues.length; h++) {
        var colName = String(headerValues[h] || "").trim().toLowerCase();
        if (!colName) continue;
        if (colName === "id" || colName === "編號") colMap.id = h;
        else if (colName.indexOf("行程") !== -1 || colName.indexOf("trip") !== -1) colMap.tripId = h;
        else if (colName.indexOf("時間") !== -1 || colName.indexOf("日期") !== -1 || colName.indexOf("date") !== -1) colMap.date = h;
        else if (colName.indexOf("分類") !== -1 || colName.indexOf("類別") !== -1 || colName.indexOf("category") !== -1) colMap.category = h;
        else if (colName.indexOf("地點") !== -1 || colName.indexOf("商店") !== -1 || colName.indexOf("購物地點") !== -1 || colName.indexOf("location") !== -1) colMap.location = h;
        else if (colName.indexOf("品項") !== -1 || colName.indexOf("項目") !== -1 || colName.indexOf("名稱") !== -1 || colName.indexOf("item") !== -1 || colName.indexOf("title") !== -1) colMap.item = h;
        else if (colName.indexOf("單價") !== -1 || colName.indexOf("price") !== -1) colMap.unitPrice = h;
        else if (colName.indexOf("數量") !== -1 || colName.indexOf("qty") !== -1 || colName.indexOf("quantity") !== -1) colMap.quantity = h;
        else if (colName.indexOf("小計") !== -1 || colName.indexOf("原幣金額") !== -1 || colName.indexOf("金額") !== -1 || colName.indexOf("amount") !== -1) colMap.amount = h;
        else if (colName.indexOf("幣別") !== -1 || colName.indexOf("貨幣") !== -1 || colName.indexOf("currency") !== -1) colMap.currency = h;
        else if (colName.indexOf("匯率") !== -1 || colName.indexOf("rate") !== -1) colMap.exchangeRate = h;
        else if (colName.indexOf("台幣") !== -1 || colName.indexOf("twd") !== -1) colMap.amountTwd = h;
        else if (colName.indexOf("備註") !== -1 || colName.indexOf("折扣") !== -1 || colName.indexOf("note") !== -1 || colName.indexOf("memo") !== -1) colMap.note = h;
        else if (colName.indexOf("支付") !== -1 || colName.indexOf("付款方式") !== -1 || colName.indexOf("payment") !== -1) colMap.paymentMethod = h;
        else if (colName.indexOf("代墊人") !== -1 || colName.indexOf("付款人") !== -1 || colName.indexOf("出資人") !== -1 || colName.indexOf("payer") !== -1) colMap.payer = h;
        else if (colName.indexOf("分帳對象") !== -1 || colName.indexOf("誰要還") !== -1 || colName.indexOf("splittarget") !== -1 || colName.indexOf("分帳") !== -1) colMap.splitTarget = h;
        else if (colName.indexOf("模式") !== -1 || colName.indexOf("分攤模式") !== -1 || colName.indexOf("splitmode") !== -1) colMap.splitMode = h;
        else if (colName.indexOf("分攤成員") !== -1 || colName.indexOf("成員") !== -1 || colName.indexOf("participants") !== -1) colMap.participants = h;
        else if (colName.indexOf("分攤細項") !== -1 || colName.indexOf("membersplits") !== -1) colMap.memberSplits = h;
        else if (colName.indexOf("欠款") !== -1 || colName.indexOf("debtor") !== -1) colMap.debtor = h;
        else if (colName.indexOf("已轉日常") !== -1 || colName.indexOf("已轉代墊") !== -1 || colName.indexOf("synced") !== -1) colMap.syncedToSplit = h;
        else if (colName.indexOf("登錄者id") !== -1 || colName.indexOf("gmail") !== -1 || colName.indexOf("email") !== -1 || colName.indexOf("creator") !== -1 || colName.indexOf("useremail") !== -1) colMap.creatorEmail = h;
        else if (colName.indexOf("登錄者姓名") !== -1 || colName.indexOf("登錄人") !== -1 || colName.indexOf("建立者") !== -1 || colName.indexOf("createdby") !== -1) colMap.createdBy = h;
      }

      // 如果未設定明確欄位名稱，預設依照標準 10 欄 Excel 模板（若總欄數約 10 欄）或 21 欄資料庫格式
      var isStandardExcel10Col = (colMap.item === undefined && lastCol <= 12 && String(headerValues[0] || "").indexOf("時間") !== -1);
      if (isStandardExcel10Col) {
        colMap = {
          date: 0,
          location: 1,
          item: 2,
          unitPrice: 3,
          quantity: 4,
          amount: 5,
          note: 6,
          paymentMethod: 7,
          payer: 8,
          splitTarget: 9
        };
      }

      for (var j = 0; j < expRows.length; j++) {
        var er = expRows[j];
        // 檢查該列是否有任何實質資料
        var hasContent = false;
        for (var c = 0; c < er.length; c++) {
          if (er[c] !== "" && er[c] !== null && er[c] !== undefined) {
            hasContent = true;
            break;
          }
        }
        if (!hasContent) continue;

        // 提取各欄位資料
        var rawId = colMap.id !== undefined ? er[colMap.id] : "";
        var rawTripId = colMap.tripId !== undefined ? er[colMap.tripId] : "";
        var rawDate = colMap.date !== undefined ? er[colMap.date] : "";
        var rawLocation = colMap.location !== undefined ? er[colMap.location] : "";
        var rawItem = colMap.item !== undefined ? er[colMap.item] : "";
        var rawUnitPrice = colMap.unitPrice !== undefined ? er[colMap.unitPrice] : "";
        var rawQuantity = colMap.quantity !== undefined ? er[colMap.quantity] : "";
        var rawAmount = colMap.amount !== undefined ? er[colMap.amount] : "";
        var rawNote = colMap.note !== undefined ? er[colMap.note] : "";
        var rawPaymentMethod = colMap.paymentMethod !== undefined ? er[colMap.paymentMethod] : "信用卡";
        var rawPayer = colMap.payer !== undefined ? er[colMap.payer] : "";
        var rawSplitTarget = colMap.splitTarget !== undefined ? er[colMap.splitTarget] : "";
        var rawCategory = colMap.category !== undefined ? er[colMap.category] : "";
        var rawCurrency = colMap.currency !== undefined ? er[colMap.currency] : "";
        var rawExchangeRate = colMap.exchangeRate !== undefined ? er[colMap.exchangeRate] : "";
        var rawAmountTwd = colMap.amountTwd !== undefined ? er[colMap.amountTwd] : "";
        var rawSplitMode = colMap.splitMode !== undefined ? er[colMap.splitMode] : "";
        var rawParticipants = colMap.participants !== undefined ? er[colMap.participants] : "";
        var rawMemberSplits = colMap.memberSplits !== undefined ? er[colMap.memberSplits] : "";
        var rawSynced = colMap.syncedToSplit !== undefined ? er[colMap.syncedToSplit] : false;
        var rawCreatorEmail = colMap.creatorEmail !== undefined ? er[colMap.creatorEmail] : (er[19] || "");
        var rawCreatedBy = colMap.createdBy !== undefined ? er[colMap.createdBy] : (er[20] || "");

        // 1. 匹配行程與幣別匯率
        var matchedTrip = defaultTrip;
        if (rawTripId) {
          var strTrip = String(rawTripId).trim();
          for (var t = 0; t < trips.length; t++) {
            if (trips[t].id === strTrip || trips[t].title === strTrip || trips[t].destination === strTrip) {
              matchedTrip = trips[t];
              break;
            }
          }
        }
        var targetTripId = matchedTrip.id || defaultTrip.id;
        var tripCurrency = rawCurrency ? String(rawCurrency).toUpperCase() : (matchedTrip.currency || "KRW");
        var tripRate = parseFloat(rawExchangeRate) || matchedTrip.exchangeRate || (tripCurrency === "KRW" ? 0.024 : tripCurrency === "JPY" ? 0.22 : 1);

        // 2. 解析品項名稱與數量單價金額
        var itemName = String(rawItem || rawLocation || "旅遊支出項目").trim();
        if (!itemName && rawLocation) itemName = String(rawLocation);
        var unitPrice = parseFloat(rawUnitPrice);
        var quantity = parseFloat(rawQuantity) || 1;
        var originalAmount = parseFloat(rawAmount);

        if (isNaN(originalAmount) || originalAmount === 0) {
          if (!isNaN(unitPrice) && unitPrice > 0) {
            originalAmount = unitPrice * quantity;
          } else {
            originalAmount = 0;
          }
        }
        if (isNaN(unitPrice)) unitPrice = quantity > 0 ? (originalAmount / quantity) : originalAmount;

        var totalAmountTWD = parseFloat(rawAmountTwd);
        if (isNaN(totalAmountTWD) || totalAmountTWD === 0) {
          totalAmountTWD = Math.round(originalAmount * tripRate);
        }

        // 3. 解析日期
        var dateStr = Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd");
        if (rawDate instanceof Date) {
          dateStr = Utilities.formatDate(rawDate, "GMT+8", "yyyy-MM-dd");
        } else if (rawDate) {
          var sDate = String(rawDate).trim();
          if (sDate.indexOf("T") !== -1) sDate = sDate.split("T")[0];
          else if (sDate.indexOf(" ") !== -1) sDate = sDate.split(" ")[0];
          sDate = sDate.replace(/[\/.]/g, "-");
          dateStr = sDate;
        }

        // 4. 解析代墊人/付款人
        var payer = String(rawPayer || "廖").trim();
        if (payer === "廖尹丞") payer = "廖";
        if (payer === "周沛緹") payer = "周";

        // 5. 智慧解析分帳對象與分帳模式
        var splitTargetStr = String(rawSplitTarget || "").trim();
        var splitMode = "全體AA";
        var splitTarget = undefined;
        var participants = matchedTrip.members || ["廖", "周"];
        var debtor = "";
        var debtorAmountTWD = 0;
        var memberSplits = {};

        if (rawSplitMode) {
          splitMode = String(rawSplitMode).trim();
        }

        if (splitTargetStr) {
          var cleanTarget = splitTargetStr.replace(/\(.*?\)/g, "").trim();
          if (cleanTarget === "全體AA" || cleanTarget === "AA平分" || cleanTarget === "AA" || cleanTarget === "平分" || cleanTarget === "全部") {
            splitMode = "全體AA";
            participants = matchedTrip.members || ["廖", "周"];
          } else if (cleanTarget.indexOf("+") !== -1 || cleanTarget.indexOf("、") !== -1 || cleanTarget.indexOf(",") !== -1) {
            splitMode = "參與者AA";
            participants = cleanTarget.split(/[+、, ]+/).map(function(s){ return s.trim(); }).filter(Boolean);
          } else if (cleanTarget === payer || cleanTarget === (payer === "廖" ? "廖尹丞" : "周沛緹")) {
            splitMode = "個人自付";
            splitTarget = payer;
            debtor = "";
            debtorAmountTWD = 0;
          } else {
            // 指定特定單人代墊 (例如: 代墊人=廖, 分帳對象=周)
            var targetPerson = cleanTarget === "周沛緹" ? "周" : cleanTarget === "廖尹丞" ? "廖" : cleanTarget;
            splitMode = "全額代墊";
            splitTarget = targetPerson;
            debtor = targetPerson;
            debtorAmountTWD = totalAmountTWD;
            participants = [targetPerson];
          }
        }

        // 計算分攤金額
        if (splitMode === "全體AA" || splitMode === "AA平分") {
          var pList = (participants && participants.length > 0) ? participants : (matchedTrip.members || ["廖", "周"]);
          var sharePerPerson = Math.round(totalAmountTWD / Math.max(pList.length, 1));
          var otherMembers = pList.filter(function(m){ return m !== payer; });
          debtorAmountTWD = sharePerPerson * otherMembers.length;
          debtor = otherMembers.join("、");
          pList.forEach(function(m){ memberSplits[m] = sharePerPerson; });
        } else if (splitMode === "參與者AA") {
          var pCount = Math.max(participants.length, 1);
          var pShare = Math.round(totalAmountTWD / pCount);
          var pOthers = participants.filter(function(m){ return m !== payer; });
          debtorAmountTWD = pShare * pOthers.length;
          debtor = pOthers.join("、");
          participants.forEach(function(m){ memberSplits[m] = pShare; });
        } else if (splitMode === "全額代墊") {
          debtorAmountTWD = totalAmountTWD;
          if (splitTarget) memberSplits[splitTarget] = totalAmountTWD;
        } else if (splitMode === "個人自付") {
          debtorAmountTWD = 0;
          debtor = "";
          if (splitTarget) memberSplits[splitTarget] = totalAmountTWD;
        }

        // 6. 智慧分類判定
        var category = "購物伴手禮";
        if (rawCategory) {
          category = String(rawCategory).trim();
        } else {
          var nameLow = (itemName + " " + rawLocation + " " + rawNote).toLowerCase();
          if (/機票|地鐵|新幹線|巴士|計程車|uber|交通|suica|icoca|pass|車票/.test(nameLow)) category = "機票交通";
          else if (/飯店|住宿|旅館|airbnb|hotel|民宿|房費/.test(nameLow)) category = "住宿訂房";
          else if (/餐廳|午餐|晚餐|早餐|拉麵|燒肉|咖啡|一隻雞|美食|吃|喝|酒|甜點|harbs|敘敘苑/.test(nameLow)) category = "美食餐廳";
          else if (/門票|景點|觀景台|快速通關|環球|迪士尼|展覽|票券/.test(nameLow)) category = "門票景點";
          else if (/藥妝|唐吉訶德|免稅|伴手禮|買|代購|lotte|mart|棉被|超市|衣服|鞋|香水|合利他命/.test(nameLow)) category = "購物伴手禮";
          else if (/租車|加油|etc|高速|停車/.test(nameLow)) category = "租車加油";
          else if (/韓服|和服|體驗|滑雪|潛水|按摩|spa|寫真/.test(nameLow)) category = "體驗活動";
          else category = "其他雜支";
        }

        // 7. 生成穩定 ID
        var expId = rawId ? String(rawId) : ("travelexp-" + targetTripId + "-" + (j + 1));

        var expenseObj = {
          id: expId,
          tripId: targetTripId,
          date: dateStr,
          category: category,
          itemName: itemName,
          title: itemName,
          payer: payer,
          originalCurrency: tripCurrency,
          currency: tripCurrency,
          originalAmount: originalAmount,
          amount: originalAmount,
          exchangeRate: tripRate,
          totalAmountTWD: totalAmountTWD,
          amountTwd: totalAmountTWD,
          splitMode: splitMode,
          splitTarget: splitTarget,
          unitPrice: unitPrice,
          quantity: quantity,
          discount: 0,
          paymentMethod: String(rawPaymentMethod || "信用卡"),
          participants: participants,
          splitMembers: participants,
          memberSplits: memberSplits,
          memberSplitShares: memberSplits,
          debtor: debtor,
          debtorAmountTWD: debtorAmountTWD,
          debtAmount: debtorAmountTWD,
          location: String(rawLocation || ""),
          note: String(rawNote || ""),
          syncedToSplit: rawSynced === true || rawSynced === "true" || rawSynced === "TRUE",
          syncedToDailySplit: rawSynced === true || rawSynced === "true" || rawSynced === "TRUE",
          createdAt: String(er[18] || Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm")),
          creatorEmail: String(rawCreatorEmail || ""),
          createdBy: String(rawCreatedBy || ""),
          userEmail: String(rawCreatorEmail || "")
        };

        expenses.push(expenseObj);
      }
    }

    // 3. 讀取心願清單
    if (wishSheet && wishSheet.getLastRow() > 1) {
      var wRows = wishSheet.getRange(2, 1, wishSheet.getLastRow() - 1, Math.max(wishSheet.getLastColumn(), 10)).getValues();
      for (var k = 0; k < wRows.length; k++) {
        var wr = wRows[k];
        if (!wr[0] && !wr[2]) continue;
        var wishId = String(wr[0] || ("wish-" + (k + 1)));
        var wishTripId = String(wr[1] || (defaultTrip.id));
        var wishTitle = String(wr[2] || "未命名心願");
        var wishCategory = String(wr[3] || "景點");
        var estTwd = parseFloat(wr[4]) || 0;
        var proposedBy = String(wr[5] || "共同");
        var wishStatus = String(wr[6] || "待預訂");
        if (wishStatus === "fulfilled" || wishStatus === "completed" || wishStatus === "已完成") wishStatus = "已完成";
        else wishStatus = "待預訂";

        var wishObj = {
          id: wishId,
          tripId: wishTripId,
          itemName: wishTitle,
          title: wishTitle,
          category: wishCategory,
          estimatedAmountTWD: estTwd,
          estimatedTwd: estTwd,
          addedBy: proposedBy,
          proposedBy: proposedBy,
          status: wishStatus,
          note: String(wr[7] || ""),
          creatorEmail: String(wr[8] || ""),
          createdBy: String(wr[9] || "")
        };
        wishes.push(wishObj);
      }
    }

    return {
      success: true,
      trips: trips,
      expenses: expenses,
      wishlist: wishes,
      wishes: wishes
    };
  } catch (e) {
    return {
      success: false,
      message: "讀取旅遊資料失敗：" + e.toString(),
      trips: [],
      expenses: [],
      wishlist: [],
      wishes: []
    };
  }
}

function saveTravelTrip(data) {
  try {
    var ss = getDbSpreadsheet();
    var sheet = ss.getSheetByName("旅遊行程");
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName("旅遊行程");
    }
    var id = data.id || "trip-" + Date.now();
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

    var rowVals = [
      id,
      data.title || data.name || "未命名行程",
      data.destination || "",
      data.coverEmoji || data.icon || "✈️",
      data.startDate || "",
      data.endDate || "",
      data.currency || data.baseCurrency || "JPY",
      parseFloat(data.exchangeRate) || 0.22,
      parseFloat(data.budgetTWD !== undefined ? data.budgetTWD : data.budgetTwd) || 0,
      data.status || "進行中",
      data.themeColor || "rose",
      JSON.stringify(data.members || ["廖", "周"]),
      data.createdAt || Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm"),
      data.creatorEmail || data.userEmail || "",
      data.createdBy || data.creatorName || ""
    ];

    if (foundRow !== -1) {
      sheet.getRange(foundRow, 1, 1, 15).setValues([rowVals]);
    } else {
      sheet.appendRow(rowVals);
    }
    return { success: true, message: "行程已儲存！", id: id };
  } catch (e) {
    return { success: false, message: "儲存失敗：" + e.toString() };
  }
}

function deleteTravelTrip(payload) {
  try {
    var id = typeof payload === 'object' ? payload.id : payload;
    var ss = getDbSpreadsheet();
    var sheet = ss.getSheetByName("旅遊行程");
    if (!sheet) return { success: false, message: "查無行程工作表" };
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, message: "查無行程" };

    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        sheet.deleteRow(i + 2);
        return { success: true, message: "已刪除旅遊行程！" };
      }
    }
    return { success: false, message: "查無此行程" };
  } catch (e) {
    return { success: false, message: "刪除失敗：" + e.toString() };
  }
}

function addTravelExpense(data) {
  try {
    var ss = getDbSpreadsheet();
    var sheet = ss.getSheetByName("旅遊支出明細") || ss.getSheetByName("旅遊分帳");
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName("旅遊支出明細");
    }
    var id = data.id || ("travelexp-" + Date.now() + "-" + Math.floor(Math.random() * 1000));
    var dateStr = data.date || Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd");
    var rate = parseFloat(data.exchangeRate) || 1;
    var origAmt = parseFloat(data.originalAmount !== undefined ? data.originalAmount : data.amount) || 0;
    var totalTWD = parseFloat(data.totalAmountTWD !== undefined ? data.totalAmountTWD : data.amountTwd) || Math.round(origAmt * rate);
    var payer = data.payer || "廖";
    var splitMode = data.splitMode || "全體AA";
    var splitTarget = data.splitTarget || (splitMode === "全體AA" ? "全體AA" : "");

    var newRow = [
      id,
      data.tripId || "",
      dateStr,
      data.category || "購物伴手禮",
      data.itemName || data.title || "旅遊支出",
      payer,
      data.originalCurrency || data.currency || "KRW",
      origAmt,
      rate,
      totalTWD,
      splitMode,
      JSON.stringify(data.participants || data.splitMembers || ["廖", "周"]),
      JSON.stringify(data.memberSplits || data.memberSplitShares || {}),
      data.debtor || "",
      parseFloat(data.debtorAmountTWD !== undefined ? data.debtorAmountTWD : data.debtAmount) || 0,
      data.location || "",
      data.note || "",
      data.syncedToSplit === true || data.syncedToDailySplit === true,
      data.createdAt || Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm"),
      data.creatorEmail || data.userEmail || "",
      data.createdBy || data.creatorName || ""
    ];
    sheet.appendRow(newRow);
    return { success: true, message: "已新增旅遊支出！", id: id };
  } catch (e) {
    return { success: false, message: "新增支出失敗：" + e.toString() };
  }
}

function updateTravelExpense(data) {
  try {
    var ss = getDbSpreadsheet();
    var sheet = ss.getSheetByName("旅遊支出明細") || ss.getSheetByName("旅遊分帳");
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName("旅遊支出明細");
    }
    var id = data.id;
    if (!id) return addTravelExpense(data);

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

    var dateStr = data.date || Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd");
    var rate = parseFloat(data.exchangeRate) || 1;
    var origAmt = parseFloat(data.originalAmount !== undefined ? data.originalAmount : data.amount) || 0;
    var totalTWD = parseFloat(data.totalAmountTWD !== undefined ? data.totalAmountTWD : data.amountTwd) || Math.round(origAmt * rate);
    var payer = data.payer || "廖";
    var splitMode = data.splitMode || "全體AA";

    var rowVals = [
      id,
      data.tripId || "",
      dateStr,
      data.category || "購物伴手禮",
      data.itemName || data.title || "旅遊支出",
      payer,
      data.originalCurrency || data.currency || "KRW",
      origAmt,
      rate,
      totalTWD,
      splitMode,
      JSON.stringify(data.participants || data.splitMembers || ["廖", "周"]),
      JSON.stringify(data.memberSplits || data.memberSplitShares || {}),
      data.debtor || "",
      parseFloat(data.debtorAmountTWD !== undefined ? data.debtorAmountTWD : data.debtAmount) || 0,
      data.location || "",
      data.note || "",
      data.syncedToSplit === true || data.syncedToDailySplit === true,
      data.createdAt || Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm"),
      data.creatorEmail || data.userEmail || "",
      data.createdBy || data.creatorName || ""
    ];

    if (foundRow !== -1) {
      sheet.getRange(foundRow, 1, 1, 21).setValues([rowVals]);
      return { success: true, message: "已更新旅遊支出！", id: id };
    } else {
      sheet.appendRow(rowVals);
      return { success: true, message: "已新增旅遊支出！", id: id };
    }
  } catch (e) {
    return { success: false, message: "更新支出失敗：" + e.toString() };
  }
}

function addBatchTravelExpenses(payload) {
  try {
    var items = payload.items || [];
    if (!items.length) return { success: true, count: 0 };
    for (var i = 0; i < items.length; i++) {
      addTravelExpense(items[i]);
    }
    return { success: true, count: items.length, message: "已成功寫入 " + items.length + " 筆旅費至試算表！" };
  } catch (e) {
    return { success: false, message: "批次新增失敗：" + e.toString() };
  }
}

function syncAllTravelData(payload) {
  try {
    var ss = getDbSpreadsheet();
    if (!ss) return { success: false, message: "未連結試算表" };

    if (payload.trips && Array.isArray(payload.trips)) {
      var tripsSheet = ss.getSheetByName("旅遊行程");
      if (!tripsSheet) {
        setupDatabase();
        tripsSheet = ss.getSheetByName("旅遊行程");
      }
      if (tripsSheet.getLastRow() > 1) {
        tripsSheet.deleteRows(2, tripsSheet.getLastRow() - 1);
      }
      for (var t = 0; t < payload.trips.length; t++) {
        saveTravelTrip(payload.trips[t]);
      }
    }

    if (payload.expenses && Array.isArray(payload.expenses)) {
      var expSheet = ss.getSheetByName("旅遊支出明細");
      if (!expSheet) {
        setupDatabase();
        expSheet = ss.getSheetByName("旅遊支出明細");
      }
      if (expSheet.getLastRow() > 1) {
        expSheet.deleteRows(2, expSheet.getLastRow() - 1);
      }
      for (var e = 0; e < payload.expenses.length; e++) {
        addTravelExpense(payload.expenses[e]);
      }
    }

    if (payload.wishlist && Array.isArray(payload.wishlist)) {
      var wishSheet = ss.getSheetByName("旅遊心願清單");
      if (!wishSheet) {
        setupDatabase();
        wishSheet = ss.getSheetByName("旅遊心願清單");
      }
      if (wishSheet.getLastRow() > 1) {
        wishSheet.deleteRows(2, wishSheet.getLastRow() - 1);
      }
      for (var w = 0; w < payload.wishlist.length; w++) {
        addTravelWishItem(payload.wishlist[w]);
      }
    }

    return { success: true, message: "旅遊分帳全量資料已完整同步回寫至 Google 試算表！" };
  } catch (e) {
    return { success: false, message: "全量同步失敗：" + e.toString() };
  }
}

function deleteTravelExpense(payload) {
  try {
    var id = typeof payload === 'object' ? payload.id : payload;
    var ss = getDbSpreadsheet();
    var sheet = ss.getSheetByName("旅遊支出明細") || ss.getSheetByName("旅遊分帳");
    if (!sheet) return { success: false, message: "查無工作表" };
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, message: "查無紀錄" };

    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        sheet.deleteRow(i + 2);
        return { success: true, message: "已刪除該筆支出紀錄！" };
      }
    }
    return { success: false, message: "找不到該筆支出" };
  } catch (e) {
    return { success: false, message: "刪除失敗：" + e.toString() };
  }
}

function addTravelWishItem(data) {
  try {
    var ss = getDbSpreadsheet();
    var sheet = ss.getSheetByName("旅遊心願清單");
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName("旅遊心願清單");
    }
    var id = data.id || ("wish-" + Date.now());
    var newRow = [
      id,
      data.tripId || "",
      data.itemName || data.title || "心願項目",
      data.category || "景點",
      parseFloat(data.estimatedAmountTWD !== undefined ? data.estimatedAmountTWD : data.estimatedTwd) || 0,
      data.addedBy || data.proposedBy || "廖",
      data.status || "待預訂",
      data.note || "",
      data.creatorEmail || data.userEmail || "",
      data.createdBy || data.creatorName || ""
    ];
    sheet.appendRow(newRow);
    return { success: true, message: "已加入心願清單！", id: id };
  } catch (e) {
    return { success: false, message: "新增失敗：" + e.toString() };
  }
}

function toggleTravelWishStatus(payload) {
  try {
    var id = payload.id;
    var status = payload.status || "fulfilled";
    var ss = getDbSpreadsheet();
    var sheet = ss.getSheetByName("旅遊心願清單");
    if (!sheet) return { success: false, message: "查無工作表" };
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, message: "查無清單" };

    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        sheet.getRange(i + 2, 7).setValue(status);
        return { success: true, message: "心願狀態已更新！" };
      }
    }
    return { success: false, message: "找不到該心願" };
  } catch (e) {
    return { success: false, message: "更新失敗：" + e.toString() };
  }
}

function deleteTravelWishItem(payload) {
  try {
    var id = typeof payload === 'object' ? payload.id : payload;
    var ss = getDbSpreadsheet();
    var sheet = ss.getSheetByName("旅遊心願清單");
    if (!sheet) return { success: false, message: "查無工作表" };
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, message: "查無清單" };

    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        sheet.deleteRow(i + 2);
        return { success: true, message: "已自心願清單移除！" };
      }
    }
    return { success: false, message: "找不到該心願" };
  } catch (e) {
    return { success: false, message: "刪除失敗：" + e.toString() };
  }
}
`;
