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
    { name: "流水帳資料庫", headers: ["ID", "月份", "日期", "項目", "出錢人", "出錢金額", "類型", "時間戳記"] },
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

  // 檢查既有流水帳資料庫是否需要升級 ID 欄位 (若首欄仍為「月份」則自動插入 ID 欄位)
  try {
    var flowSheet = ss.getSheetByName("流水帳資料庫");
    if (flowSheet && flowSheet.getLastRow() >= 1) {
      var firstHeader = String(flowSheet.getRange(1, 1).getValue() || "").trim();
      if (firstHeader === "月份") {
        flowSheet.insertColumnBefore(1);
        flowSheet.getRange(1, 1).setValue("ID")
          .setBackground("#F4F1EA")
          .setFontColor("#3E3A36")
          .setFontWeight("bold")
          .setHorizontalAlignment("center");
        
        var totalRows = flowSheet.getLastRow();
        if (totalRows > 1) {
          var idColValues = [];
          for (var r = 2; r <= totalRows; r++) {
            idColValues.push(["rec_" + new Date().getTime() + "_" + Math.floor(Math.random() * 10000) + "_" + r]);
          }
          flowSheet.getRange(2, 1, totalRows - 1, 1).setValues(idColValues);
        }
      }
    }
  } catch (migErr) {}

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

    var maxCols = Math.max(sheet.getLastColumn(), 8);
    var headerRow = sheet.getRange(1, 1, 1, maxCols).getValues()[0];
    var values = sheet.getRange(2, 1, lastRow - 1, maxCols).getValues();

    // 1. 動態多階表頭欄位解析
    var colMap = {
      id: -1,
      month: -1,
      date: -1,
      type: -1,
      item: -1,
      payer: -1,
      amount: -1,
      timestamp: -1
    };

    // 第一階段：精準比對各欄表頭名稱
    for (var c = 0; c < headerRow.length; c++) {
      var h = String(headerRow[c] || "").trim().toLowerCase();
      if (!h) continue;
      if (colMap.id === -1 && (h === "id" || h.indexOf("編號") !== -1 || h.indexOf("序號") !== -1 || h.indexOf("流水號") !== -1)) {
        colMap.id = c;
      } else if (colMap.month === -1 && (h.indexOf("月") !== -1 || h.indexOf("month") !== -1) && h.indexOf("日") === -1) {
        colMap.month = c;
      } else if (colMap.date === -1 && (h.indexOf("日") !== -1 || h.indexOf("date") !== -1) && h.indexOf("月") === -1) {
        colMap.date = c;
      } else if (colMap.type === -1 && (h.indexOf("收支") !== -1 || h.indexOf("類") !== -1 || h.indexOf("category") !== -1 || h.indexOf("type") !== -1 || h.indexOf("類型") !== -1)) {
        colMap.type = c;
      } else if (colMap.amount === -1 && (h.indexOf("金額") !== -1 || h.indexOf("費用") !== -1 || h.indexOf("花費") !== -1 || h.indexOf("價錢") !== -1 || h.indexOf("amount") !== -1 || h.indexOf("cost") !== -1 || h.indexOf("台幣") !== -1)) {
        colMap.amount = c;
      } else if (colMap.payer === -1 && (h.indexOf("代墊") !== -1 || h.indexOf("出資") !== -1 || h.indexOf("付款") !== -1 || h.indexOf("出錢") !== -1 || h.indexOf("墊付") !== -1 || h.indexOf("經手") !== -1 || h.indexOf("支付") !== -1 || h.indexOf("誰") !== -1 || h.indexOf("payer") !== -1 || h.indexOf("who") !== -1)) {
        colMap.payer = c;
      } else if (colMap.timestamp === -1 && (h.indexOf("時間") !== -1 || h.indexOf("戳記") !== -1 || h.indexOf("建立") !== -1 || h.indexOf("登記") !== -1 || h.indexOf("time") !== -1 || h.indexOf("stamp") !== -1)) {
        colMap.timestamp = c;
      } else if (colMap.item === -1 && (h.indexOf("項目") !== -1 || h.indexOf("品項") !== -1 || h.indexOf("內容") !== -1 || h.indexOf("描述") !== -1 || h.indexOf("消費") !== -1 || h.indexOf("item") !== -1 || h.indexOf("desc") !== -1)) {
        colMap.item = c;
      }
    }

    // 第二階段：抽樣 5 列進行資料特徵啟發式分析（Data-Driven Heuristics）
    var sampleRowsCount = Math.min(values.length, 5);
    var colDataTypes = [];
    for (var colIdx = 0; colIdx < maxCols; colIdx++) {
      colDataTypes[colIdx] = { hasId: 0, hasDate: 0, hasMonth: 0, hasAmount: 0, hasPayer: 0, hasCategory: 0, hasTimestamp: 0, texts: [] };
      for (var r = 0; r < sampleRowsCount; r++) {
        var cell = values[r][colIdx];
        if (cell === null || cell === undefined || cell === "") continue;
        var cellStr = String(cell).trim();
        if (cellStr.indexOf("rec_") === 0 || (cellStr.length > 20 && cellStr.indexOf("-") !== -1)) colDataTypes[colIdx].hasId++;
        if (cell instanceof Date || /^\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}/.test(cellStr) || cellStr.indexOf("GMT") !== -1) colDataTypes[colIdx].hasDate++;
        if (/^\\d{4}[-/]\\d{1,2}$/.test(cellStr)) colDataTypes[colIdx].hasMonth++;
        if (typeof cell === "number" || (/^\\$?\\s*\\d+(\\.\\d+)?$/.test(cellStr) && !/^\\d{4}/.test(cellStr))) colDataTypes[colIdx].hasAmount++;
        if (cellStr.indexOf(DEFAULT_USER_A_NAME) !== -1 || cellStr.indexOf(DEFAULT_USER_B_NAME) !== -1 || cellStr.indexOf("廖") !== -1 || cellStr.indexOf("周") !== -1 || cellStr.indexOf("共同") !== -1 || cellStr === "待確認" || cellStr === "伴侶") colDataTypes[colIdx].hasPayer++;
        if (cellStr.indexOf("支出") !== -1 || cellStr.indexOf("收入") !== -1 || cellStr.indexOf("公積金") !== -1 || cellStr.indexOf("日常生活") !== -1 || cellStr.indexOf("代墊") !== -1) colDataTypes[colIdx].hasCategory++;
        if (cellStr.indexOf("上午") !== -1 || cellStr.indexOf("下午") !== -1 || cellStr.indexOf(":") !== -1) colDataTypes[colIdx].hasTimestamp++;
        colDataTypes[colIdx].texts.push(cellStr);
      }
    }

    // 依資料特徵自動校正/填補欄位映射
    for (var colIdx = 0; colIdx < maxCols; colIdx++) {
      var d = colDataTypes[colIdx];
      if (colMap.id === -1 && d.hasId >= 1) colMap.id = colIdx;
      if (colMap.month === -1 && d.hasMonth >= 1 && d.hasDate === 0) colMap.month = colIdx;
      if (colMap.date === -1 && d.hasDate >= 1) colMap.date = colIdx;
      if (colMap.amount === -1 && d.hasAmount >= 1 && d.hasDate === 0 && d.hasMonth === 0) colMap.amount = colIdx;
      if (colMap.payer === -1 && d.hasPayer >= 1) colMap.payer = colIdx;
      if (colMap.type === -1 && d.hasCategory >= 1) colMap.type = colIdx;
      if (colMap.timestamp === -1 && d.hasTimestamp >= 1 && d.hasDate === 0) colMap.timestamp = colIdx;
    }

    // 若 item 仍未對應，尋找尚未被指派且非純數字/非純日期之欄位
    if (colMap.item === -1) {
      for (var colIdx = 0; colIdx < maxCols; colIdx++) {
        if (colIdx !== colMap.id && colIdx !== colMap.month && colIdx !== colMap.date && 
            colIdx !== colMap.amount && colIdx !== colMap.payer && colIdx !== colMap.type && 
            colIdx !== colMap.timestamp) {
          colMap.item = colIdx;
          break;
        }
      }
    }

    // 關鍵保護：若 item 與 type 顛倒，主動交換校正
    if (colMap.item !== -1 && colMap.type !== -1) {
      var itemColData = colDataTypes[colMap.item];
      var typeColData = colDataTypes[colMap.type];
      if (itemColData && itemColData.hasCategory >= 2 && (!typeColData || typeColData.hasCategory === 0)) {
        var temp = colMap.item;
        colMap.item = colMap.type;
        colMap.type = temp;
      }
    }

    // 預設備援映射
    if (colMap.month === -1) colMap.month = 0;
    if (colMap.date === -1) colMap.date = 1;
    if (colMap.item === -1) colMap.item = 2;
    if (colMap.payer === -1) colMap.payer = 3;
    if (colMap.amount === -1) colMap.amount = 4;
    if (colMap.type === -1) colMap.type = 5;
    if (colMap.timestamp === -1) colMap.timestamp = 6;

    var liaoTotal = 0;
    var zhouTotal = 0;
    var recordsList = [];

    for (var i = values.length - 1; i >= 0; i--) {
      var row = values[i];

      var idVal = colMap.id !== -1 ? String(row[colMap.id] || ("rec_" + (i + 2))) : ("rec_" + (i + 2));
      var monthVal = colMap.month !== -1 ? row[colMap.month] : "";
      var dateVal = colMap.date !== -1 ? row[colMap.date] : "";
      var item = colMap.item !== -1 ? String(row[colMap.item] || "").trim() : "";
      var payer = colMap.payer !== -1 ? String(row[colMap.payer] || "").trim() : "";
      var amount = colMap.amount !== -1 ? (parseFloat(String(row[colMap.amount] || "").replace(/[^0-9.]/g, '')) || 0) : 0;
      var type = colMap.type !== -1 ? String(row[colMap.type] || "").trim() : "";
      var timestampVal = colMap.timestamp !== -1 ? row[colMap.timestamp] : "";

      // 🛡️ 列級智慧對齊與防禦校正：
      var isItemCategory = (item === "日常生活支出" || item === "日常代墊支出" || item === "固定公積金" || item === "公積金固定撥入" || item === "支出-日常代墊" || item === "收入-固定公積金" || item === "支出" || item === "收入");
      var isPayerNonPerson = (payer === "晚餐" || payer === "午餐" || payer === "早餐" || payer === "大全聯" || payer === "全聯" || payer === "好市多" || payer === "家樂福" || (payer.length > 0 && payer !== DEFAULT_USER_A_NAME && payer !== DEFAULT_USER_B_NAME && payer !== "共同帳戶" && payer.indexOf("廖") === -1 && payer.indexOf("周") === -1));

      if (isItemCategory && isPayerNonPerson) {
        var realItemName = payer;
        var realTypeName = (item.indexOf("公積金") !== -1 || item.indexOf("收入") !== -1) ? "收入-固定公積金" : "支出-日常代墊";
        var realPayerName = realTypeName === "收入-固定公積金" ? "共同帳戶" : DEFAULT_USER_A_NAME;
        var typeNum = parseFloat(String(type).replace(/[^0-9.]/g, ''));
        if ((!amount || amount === 0) && !isNaN(typeNum) && typeNum > 0) {
          amount = typeNum;
        }
        item = realItemName;
        type = realTypeName;
        payer = realPayerName;
      }

      var isDateLikeItem = item instanceof Date || String(item).indexOf("GMT") !== -1 || /^\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}/.test(String(item).trim());
      if (isDateLikeItem) {
        dateVal = item;
        var realItem = (payer && payer !== DEFAULT_USER_A_NAME && payer !== DEFAULT_USER_B_NAME && payer !== "共同帳戶") ? payer : "日常生活支出";
        var realAmount = parseFloat(String(type).replace(/[^0-9.]/g, '')) || amount || 0;
        var realPayer = DEFAULT_USER_A_NAME;
        if (String(amount).indexOf("周") !== -1 || String(type).indexOf("周") !== -1 || String(timestampVal).indexOf("周") !== -1) {
          realPayer = DEFAULT_USER_B_NAME;
        } else if (String(type).indexOf("收入") !== -1 || String(realItem).indexOf("公積金") !== -1) {
          realPayer = "共同帳戶";
        }
        item = realItem;
        amount = realAmount;
        payer = realPayer;
        type = String(timestampVal).indexOf("收入") !== -1 || String(realItem).indexOf("公積金") !== -1 ? "收入-固定公積金" : "支出-日常代墊";
      }

      if (payer && item && payer === item && payer !== DEFAULT_USER_A_NAME && payer !== DEFAULT_USER_B_NAME && payer !== "共同帳戶") {
        payer = DEFAULT_USER_A_NAME;
      }

      var month = monthVal instanceof Date ? Utilities.formatDate(monthVal, "GMT+8", "yyyy-MM") : String(monthVal || "").substring(0, 7);
      var dateStr = dateVal instanceof Date ? Utilities.formatDate(dateVal, "GMT+8", "yyyy-MM-dd") : String(dateVal || (month ? month + "-01" : ""));
      if (!month && dateStr && dateStr.length >= 7) month = dateStr.substring(0, 7);
      var timestampStr = timestampVal ? (timestampVal instanceof Date ? formatAmPmTime(timestampVal) : String(timestampVal)) : dateStr + " 上午 12:00";

      if (!type || (type.indexOf("支出") === -1 && type.indexOf("收入") === -1)) {
        type = (item.indexOf("公積金") !== -1 || item.indexOf("撥入") !== -1) ? "收入-固定公積金" : "支出-日常代墊";
      }
      if (!payer || payer === "未指定" || payer === "未填寫") {
        payer = type === "收入-固定公積金" ? "共同帳戶" : DEFAULT_USER_A_NAME;
      }

      recordsList.push({
        id: idVal,
        month: month,
        date: dateStr,
        item: item,
        payer: payer,
        amount: amount,
        type: type,
        timestamp: timestampStr
      });

      if (type.indexOf("支出") !== -1) {
        if (payer.indexOf(DEFAULT_USER_A_SHORT) !== -1 || payer.indexOf(DEFAULT_USER_A_NAME) !== -1 || payer.indexOf("廖") !== -1) liaoTotal += amount;
        else if (payer.indexOf(DEFAULT_USER_B_SHORT) !== -1 || payer.indexOf(DEFAULT_USER_B_NAME) !== -1 || payer.indexOf("周") !== -1) zhouTotal += amount;
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
  var firstHeader = String(sheet.getRange(1, 1).getValue() || "").trim();
  var hasIdCol = (firstHeader === "ID");

  var id = String(data.id || ("rec_" + new Date().getTime() + "_" + Math.floor(Math.random() * 10000)));
  var month = data.month || (data.date ? data.date.substring(0, 7) : Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM"));
  var date = data.date || Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd");
  var item = data.item || "未命名項目";
  var payer = data.payer || "廖";
  var amount = parseFloat(data.amount) || 0;
  var type = data.type || "支出";
  var timestamp = formatAmPmTime(new Date());

  if (hasIdCol) {
    sheet.appendRow([id, month, date, item, payer, amount, type, timestamp]);
  } else {
    sheet.appendRow([month, date, item, payer, amount, type, timestamp]);
  }
  return { success: true, id: id };
}

function updateRecordByRow(data) {
  var sheet = getDbSheet();
  var targetId = String(data.id || data.rowId || "");
  if (!targetId) throw new Error("無效的紀錄識別碼 ID");

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error("資料庫目前沒有任何紀錄可供更新");

  var firstHeader = String(sheet.getRange(1, 1).getValue() || "").trim();
  var hasIdCol = (firstHeader === "ID");

  var foundRow = -1;
  var values = sheet.getRange(2, 1, lastRow - 1, hasIdCol ? 8 : 7).getValues();

  for (var i = 0; i < values.length; i++) {
    var physicalRow = i + 2;
    if (hasIdCol) {
      if (String(values[i][0]).trim() === targetId) {
        foundRow = physicalRow;
        break;
      }
    } else {
      if (String(physicalRow) === targetId) {
        foundRow = physicalRow;
        break;
      }
    }
  }

  // 若依 UUID 沒找到且 targetId 為純數字，相容作為實體行號比對
  if (foundRow === -1 && /^\d+$/.test(targetId)) {
    var rowNum = parseInt(targetId, 10);
    if (rowNum >= 2 && rowNum <= lastRow) {
      foundRow = rowNum;
    }
  }

  if (foundRow === -1) {
    throw new Error("找不到對應識別碼的記帳紀錄: " + targetId);
  }

  var colOffset = hasIdCol ? 1 : 0;
  if (data.month) sheet.getRange(foundRow, 1 + colOffset).setValue(data.month);
  if (data.date) sheet.getRange(foundRow, 2 + colOffset).setValue(data.date);
  if (data.item) sheet.getRange(foundRow, 3 + colOffset).setValue(data.item);
  if (data.payer) sheet.getRange(foundRow, 4 + colOffset).setValue(data.payer);
  if (data.amount !== undefined) sheet.getRange(foundRow, 5 + colOffset).setValue(parseFloat(data.amount) || 0);
  if (data.type) sheet.getRange(foundRow, 6 + colOffset).setValue(data.type);

  return { success: true };
}

function deleteRecordByRow(data) {
  var sheet = getDbSheet();
  var targetId = String(typeof data === "object" ? (data.id || data.rowId || "") : data).trim();
  if (!targetId) throw new Error("無效的紀錄識別碼 ID");

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error("資料庫目前沒有任何紀錄可供刪除");

  var firstHeader = String(sheet.getRange(1, 1).getValue() || "").trim();
  var hasIdCol = (firstHeader === "ID");

  var foundRow = -1;
  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (var i = 0; i < values.length; i++) {
    var physicalRow = i + 2;
    if (hasIdCol) {
      if (String(values[i][0]).trim() === targetId) {
        foundRow = physicalRow;
        break;
      }
    } else {
      if (String(physicalRow) === targetId) {
        foundRow = physicalRow;
        break;
      }
    }
  }

  // 若依 UUID 沒找到且 targetId 為純數字，相容作為實體行號比對
  if (foundRow === -1 && /^\d+$/.test(targetId)) {
    var rowNum = parseInt(targetId, 10);
    if (rowNum >= 2 && rowNum <= lastRow) {
      foundRow = rowNum;
    }
  }

  if (foundRow === -1) {
    throw new Error("找不到欲刪除的紀錄 (ID: " + targetId + ")");
  }

  sheet.deleteRow(foundRow);
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
    if (!ss) return { success: false, items: [], splitItems: [] };
    var sheet = ss.getSheetByName("代墊明細");
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName("代墊明細");
    }
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: true, items: [], splitItems: [] };

    var maxCols = Math.max(sheet.getLastColumn(), 10);
    var headerRow = sheet.getRange(1, 1, 1, maxCols).getValues()[0];
    var values = sheet.getRange(2, 1, lastRow - 1, maxCols).getValues();

    // 智能標題解析（相容任意順序、有無 ID 欄位）
    var colMap = {
      id: -1,
      date: -1,
      payer: -1,
      splitMode: -1,
      description: -1,
      amount: -1,
      splitResult: -1,
      status: -1,
      settledAt: -1,
      note: -1
    };

    for (var c = 0; c < headerRow.length; c++) {
      var h = String(headerRow[c] || "").trim().toLowerCase();
      if (!h) continue;
      if (colMap.id === -1 && (h === "id" || h.indexOf("編號") !== -1 || h.indexOf("序號") !== -1 || h.indexOf("流水號") !== -1)) {
        colMap.id = c;
      } else if (colMap.date === -1 && (h.indexOf("時間") !== -1 || h.indexOf("日期") !== -1 || h.indexOf("建立") !== -1 || h.indexOf("date") !== -1 || h.indexOf("time") !== -1)) {
        colMap.date = c;
      } else if (colMap.payer === -1 && (h.indexOf("代墊人") !== -1 || h.indexOf("代墊者") !== -1 || h.indexOf("付款人") !== -1 || h.indexOf("出錢人") !== -1 || h.indexOf("誰付") !== -1 || h.indexOf("付款") !== -1 || h.indexOf("payer") !== -1 || h.indexOf("who") !== -1)) {
        colMap.payer = c;
      } else if (colMap.splitMode === -1 && (h.indexOf("分帳模式") !== -1 || h.indexOf("模式") !== -1 || h.indexOf("方式") !== -1 || h.indexOf("分攤") !== -1 || h.indexOf("mode") !== -1)) {
        colMap.splitMode = c;
      } else if (colMap.description === -1 && (h.indexOf("項目描述") !== -1 || h.indexOf("項目") !== -1 || h.indexOf("品項") !== -1 || h.indexOf("描述") !== -1 || h.indexOf("內容") !== -1 || h.indexOf("說明") !== -1 || h.indexOf("消費") !== -1 || h.indexOf("item") !== -1 || h.indexOf("desc") !== -1)) {
        colMap.description = c;
      } else if (colMap.amount === -1 && (h.indexOf("總金額") !== -1 || h.indexOf("金額") !== -1 || h.indexOf("費用") !== -1 || h.indexOf("花費") !== -1 || h.indexOf("台幣") !== -1 || h.indexOf("amount") !== -1 || h.indexOf("cost") !== -1 || h.indexOf("元") !== -1)) {
        colMap.amount = c;
      } else if (colMap.splitResult === -1 && (h.indexOf("結果") !== -1 || h.indexOf("分帳結果") !== -1 || h.indexOf("應付") !== -1 || h.indexOf("需付") !== -1 || h.indexOf("result") !== -1)) {
        colMap.splitResult = c;
      } else if (colMap.status === -1 && (h.indexOf("狀態") !== -1 || h.indexOf("結清狀態") !== -1 || h.indexOf("status") !== -1)) {
        colMap.status = c;
      } else if (colMap.settledAt === -1 && (h.indexOf("結清時間") !== -1 || h.indexOf("結清日") !== -1 || h.indexOf("settled") !== -1)) {
        colMap.settledAt = c;
      } else if (colMap.note === -1 && (h.indexOf("備註") !== -1 || h.indexOf("附註") !== -1 || h.indexOf("note") !== -1)) {
        colMap.note = c;
      }
    }

    var hasIdCol = (colMap.id !== -1);
    if (colMap.date === -1) colMap.date = hasIdCol ? 1 : 0;
    if (colMap.payer === -1) colMap.payer = hasIdCol ? 2 : 1;
    if (colMap.splitMode === -1) colMap.splitMode = hasIdCol ? 3 : 2;
    if (colMap.description === -1) colMap.description = hasIdCol ? 4 : 3;
    if (colMap.amount === -1) colMap.amount = hasIdCol ? 5 : 4;
    if (colMap.splitResult === -1) colMap.splitResult = hasIdCol ? 6 : 5;
    if (colMap.status === -1) colMap.status = hasIdCol ? 7 : 6;
    if (colMap.settledAt === -1) colMap.settledAt = hasIdCol ? 8 : 7;
    if (colMap.note === -1) colMap.note = hasIdCol ? 9 : 8;

    var items = [];
    for (var i = values.length - 1; i >= 0; i--) {
      var row = values[i];
      var rawId = colMap.id >= 0 ? row[colMap.id] : "";
      var rawDate = colMap.date >= 0 ? row[colMap.date] : "";
      var rawPayer = colMap.payer >= 0 ? String(row[colMap.payer] || "").trim() : "";
      var rawMode = colMap.splitMode >= 0 ? String(row[colMap.splitMode] || "").trim() : "AA";
      var rawDesc = colMap.description >= 0 ? String(row[colMap.description] || "").trim() : "";
      var rawAmount = colMap.amount >= 0 ? parseFloat(String(row[colMap.amount] || "").replace(/[^0-9.]/g, '')) || 0 : 0;
      var rawResult = colMap.splitResult >= 0 ? String(row[colMap.splitResult] || "").trim() : "";
      var rawStatus = colMap.status >= 0 ? String(row[colMap.status] || "").trim() : "未結清";
      var rawSettledAt = colMap.settledAt >= 0 ? row[colMap.settledAt] : null;
      var rawNote = colMap.note >= 0 ? String(row[colMap.note] || "").trim() : "";

      // 🛡️ 關鍵防錯：代墊人與項目顛倒辨識 (「代墊者變成晚餐、大全聯」的終極防護)
      var itemKeywords = /晚餐|早餐|午餐|全聯|超市|好市多|家樂福|飯|麵|飲料|咖啡|水費|電費|房租|門票|高鐵|計程車|uber|加油|機票|買|吃|點心|下午茶|生活/i;
      var personKeywords = /^(廖|周|尹丞|沛緹|廖尹丞|周沛緹|admin|使用者)$/i;
      if (itemKeywords.test(rawPayer) && (personKeywords.test(rawDesc) || rawDesc.length < rawPayer.length)) {
        var temp = rawPayer;
        rawPayer = rawDesc || "廖";
        rawDesc = temp;
      }

      if (!rawId && !rawDesc && !rawAmount) continue;

      var dateStr = rawDate instanceof Date 
        ? formatAmPmTime(rawDate) 
        : String(rawDate || "");
      var settledStr = rawSettledAt 
        ? (rawSettledAt instanceof Date ? formatAmPmTime(rawSettledAt) : String(rawSettledAt)) 
        : "";

      var obj = {
        id: String(rawId || "split-" + (i + 2)),
        date: dateStr,
        timestamp: dateStr,
        payer: rawPayer || "廖",
        splitMode: rawMode || "AA",
        mode: rawMode || "AA",
        description: rawDesc || "",
        desc: rawDesc || "",
        item: rawDesc || "",
        amount: rawAmount,
        splitResult: rawResult || "",
        result: rawResult || "",
        status: rawStatus || "未結清",
        settledAt: settledStr,
        note: rawNote || ""
      };
      items.push(obj);
    }
    return { success: true, items: items, splitItems: items };
  } catch (err) {
    return { success: false, error: err.toString(), items: [], splitItems: [] };
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
