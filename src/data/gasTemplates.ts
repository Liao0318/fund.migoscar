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
    { name: "旅遊行程", headers: ["ID", "行程名稱", "目的地", "代表圖示", "開始日期", "結束日期", "幣別", "匯率", "預算台幣", "狀態", "主題顏色", "成員清單", "建立時間"] },
    { name: "旅遊支出明細", headers: ["ID", "行程ID", "日期", "分類", "品項名稱", "付款人", "幣別", "原幣金額", "匯率", "台幣總額", "分攤模式", "分攤成員", "成員分攤細項", "代墊人", "代墊金額", "地點", "備註", "已轉日常代墊", "建立時間"] },
    { name: "旅遊心願清單", headers: ["ID", "行程ID", "心願項目", "分類", "預估金額台幣", "提議人", "狀態", "備註"] }
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

// 10. 旅遊模組 API
function getTravelData() {
  try {
    var ss = getDbSpreadsheet();
    if (!ss) return { success: false, trips: [], expenses: [], wishes: [] };

    var tripsSheet = ss.getSheetByName("旅遊行程");
    var expSheet = ss.getSheetByName("旅遊支出明細");
    var wishSheet = ss.getSheetByName("旅遊心願清單");

    var trips = [];
    var expenses = [];
    var wishes = [];

    if (tripsSheet && tripsSheet.getLastRow() > 1) {
      var tVals = tripsSheet.getRange(2, 1, tripsSheet.getLastRow() - 1, 13).getValues();
      for (var i = 0; i < tVals.length; i++) {
        var r = tVals[i];
        if (!r[0]) continue;
        var members = [];
        try { members = JSON.parse(r[11]); } catch (e) { members = ["廖尹丞", "周沛緹"]; }
        trips.push({
          id: String(r[0]),
          name: String(r[1] || ""),
          destination: String(r[2] || ""),
          icon: String(r[3] || "✈️"),
          startDate: r[4] instanceof Date ? Utilities.formatDate(r[4], "GMT+8", "yyyy-MM-dd") : String(r[4] || ""),
          endDate: r[5] instanceof Date ? Utilities.formatDate(r[5], "GMT+8", "yyyy-MM-dd") : String(r[5] || ""),
          baseCurrency: String(r[6] || "JPY"),
          exchangeRate: parseFloat(r[7]) || 0.22,
          budgetTwd: parseFloat(r[8]) || 0,
          status: String(r[9] || "planning"),
          themeColor: String(r[10] || "indigo"),
          members: members,
          createdAt: String(r[12] || "")
        });
      }
    }

    if (expSheet && expSheet.getLastRow() > 1) {
      var eVals = expSheet.getRange(2, 1, expSheet.getLastRow() - 1, 19).getValues();
      for (var j = 0; j < eVals.length; j++) {
        var er = eVals[j];
        if (!er[0]) continue;
        var splitMembers = [];
        var memberSplitShares = {};
        try { splitMembers = JSON.parse(er[11]); } catch (e) { splitMembers = []; }
        try { memberSplitShares = JSON.parse(er[12]); } catch (e) { memberSplitShares = {}; }

        expenses.push({
          id: String(er[0]),
          tripId: String(er[1] || ""),
          date: er[2] instanceof Date ? Utilities.formatDate(er[2], "GMT+8", "yyyy-MM-dd") : String(er[2] || ""),
          category: String(er[3] || "餐飲"),
          title: String(er[4] || ""),
          payer: String(er[5] || "廖尹丞"),
          currency: String(er[6] || "JPY"),
          amount: parseFloat(er[7]) || 0,
          exchangeRate: parseFloat(er[8]) || 1,
          amountTwd: parseFloat(er[9]) || 0,
          splitMode: String(er[10] || "equal"),
          splitMembers: splitMembers,
          memberSplitShares: memberSplitShares,
          debtor: String(er[13] || ""),
          debtAmount: parseFloat(er[14]) || 0,
          location: String(er[15] || ""),
          note: String(er[16] || ""),
          syncedToDailySplit: er[17] === true || er[17] === "true",
          createdAt: String(er[18] || "")
        });
      }
    }

    if (wishSheet && wishSheet.getLastRow() > 1) {
      var wVals = wishSheet.getRange(2, 1, wishSheet.getLastRow() - 1, 8).getValues();
      for (var k = 0; k < wVals.length; k++) {
        var wr = wVals[k];
        if (!wr[0]) continue;
        wishes.push({
          id: String(wr[0]),
          tripId: String(wr[1] || ""),
          title: String(wr[2] || ""),
          category: String(wr[3] || "景點"),
          estimatedTwd: parseFloat(wr[4]) || 0,
          proposedBy: String(wr[5] || "廖尹丞"),
          status: String(wr[6] || "wish"),
          note: String(wr[7] || "")
        });
      }
    }

    return { success: true, trips: trips, expenses: expenses, wishes: wishes };
  } catch (e) {
    return { success: false, message: e.toString(), trips: [], expenses: [], wishes: [] };
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
      data.name || "未命名行程",
      data.destination || "",
      data.icon || "✈️",
      data.startDate || "",
      data.endDate || "",
      data.baseCurrency || "JPY",
      parseFloat(data.exchangeRate) || 0.22,
      parseFloat(data.budgetTwd) || 0,
      data.status || "planning",
      data.themeColor || "indigo",
      JSON.stringify(data.members || ["廖尹丞", "周沛緹"]),
      data.createdAt || formatAmPmTime(new Date())
    ];

    if (foundRow !== -1) {
      sheet.getRange(foundRow, 1, 1, 13).setValues([rowVals]);
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
    var sheet = ss.getSheetByName("旅遊支出明細");
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName("旅遊支出明細");
    }
    var id = data.id || "travelexp-" + Date.now();
    var newRow = [
      id,
      data.tripId || "",
      data.date || Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd"),
      data.category || "餐飲",
      data.title || "支出項目",
      data.payer || "廖尹丞",
      data.currency || "JPY",
      parseFloat(data.amount) || 0,
      parseFloat(data.exchangeRate) || 1,
      parseFloat(data.amountTwd) || 0,
      data.splitMode || "equal",
      JSON.stringify(data.splitMembers || []),
      JSON.stringify(data.memberSplitShares || {}),
      data.debtor || "",
      parseFloat(data.debtAmount) || 0,
      data.location || "",
      data.note || "",
      data.syncedToDailySplit === true,
      data.createdAt || formatAmPmTime(new Date())
    ];
    sheet.appendRow(newRow);
    return { success: true, message: "已新增旅遊支出！", id: id };
  } catch (e) {
    return { success: false, message: "新增支出失敗：" + e.toString() };
  }
}

function addBatchTravelExpenses(payload) {
  try {
    var items = payload.items || [];
    if (!items.length) return { success: true, count: 0 };
    for (var i = 0; i < items.length; i++) {
      addTravelExpense(items[i]);
    }
    return { success: true, count: items.length };
  } catch (e) {
    return { success: false, message: "批次新增失敗：" + e.toString() };
  }
}

function deleteTravelExpense(payload) {
  try {
    var id = typeof payload === 'object' ? payload.id : payload;
    var ss = getDbSpreadsheet();
    var sheet = ss.getSheetByName("旅遊支出明細");
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
    var id = data.id || "wish-" + Date.now();
    var newRow = [
      id,
      data.tripId || "",
      data.title || "心願項目",
      data.category || "景點",
      parseFloat(data.estimatedTwd) || 0,
      data.proposedBy || "廖尹丞",
      data.status || "wish",
      data.note || ""
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
