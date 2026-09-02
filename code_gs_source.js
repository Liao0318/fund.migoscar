var HARDCODED_TELEGRAM_TOKEN = "8940545345:AAGTJSX-EgRpbCGPfufxGhxEJTzAOvMw5I4";
var HARDCODED_TELEGRAM_CHAT_ID = "-5312205991";
var HARDCODED_SPREADSHEET_ID = "";
/**
 * 伴伴記❤️ - Google Apps Script 後端處理 (Code.gs)
 * 精通全端與 GAS 開發的資深工程師精心撰寫，包含完整防呆與即時結算邏輯。
 */

// 💡 Google 試算表 ID / 網址（選填）
// 如果您使用的是「獨立腳本」（非從試算表內『擴充功能 > Apps Script』建立），可直接貼上試算表完整網址或 ID 於此；留空則自動感應綁定的試算表
// 💡 LINE Messaging API / Notify Channel Access Token
// 如果您想直接寫死權杖，請貼在下方雙引號中（最優先採用）；若留空則會自動從 PropertiesService 讀取
// 1. 網頁部署：渲染 Index.html，強力支援行動端 PWA 獨立無網址列全螢幕與自訂網頁標題與分頁 Favicon
function doGet(e) {
  // 1. 如果前端以 GET 請求 API action
  if (e && e.parameter && e.parameter.action) {
    var action = e.parameter.action;
    if (action === "getTravelData") return ContentService.createTextOutput(JSON.stringify(getTravelData())).setMimeType(ContentService.MimeType.JSON);
    if (action === "getSplitData") return ContentService.createTextOutput(JSON.stringify(getSplitData())).setMimeType(ContentService.MimeType.JSON);
    if (action === "getDashboardData") return ContentService.createTextOutput(JSON.stringify(getDashboardData())).setMimeType(ContentService.MimeType.JSON);
    if (action === "getShoppingData") return ContentService.createTextOutput(JSON.stringify(getShoppingData())).setMimeType(ContentService.MimeType.JSON);
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "伴伴記後端 API 連線正常！" })).setMimeType(ContentService.MimeType.JSON);
  }

  // 2. 嘗試載入 Index.html（若有在 Apps Script 建立 Index 檔案）
  try {
    var output = HtmlService.createHtmlOutputFromFile('Index');
    output.addMetaTag('viewport', 'width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no, viewport-fit=cover');
    output.setTitle('伴伴記❤️');
    output.setFaviconUrl("https://img.icons8.com/color/180/cherry-blossom.png");
    output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    return output;
  } catch (err) {
    // 3. 若未在 Apps Script 建立 Index.html，返回 API 正常運作狀態頁面（不報錯）
    var fallbackHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>伴伴記後端 API</title><style>body{font-family:sans-serif;text-align:center;padding:40px;background:#fdfaf7;color:#333;}h2{color:#2b825b;}.card{background:#fff;border-radius:12px;padding:24px;max-width:500px;margin:20px auto;box-shadow:0 4px 12px rgba(0,0,0,0.05);line-height:1.6;}</style></head><body><h2>✨ 伴伴記 Google Apps Script 後端 API 運作中</h2><div class="card"><p>✅ 試算表資料庫與 LINE 機器人 Webhook 已就緒！</p><p>🚀 前端網頁可由 GitHub Pages 託管，或在 Apps Script 左側建立 <b>Index</b> (HTML) 檔案。</p></div></body></html>';
    return HtmlService.createHtmlOutput(fallbackHtml)
      .setTitle('伴伴記 後端 API 服務')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

// 輔助函式：鎖定為「yyyy-MM-dd 上午/下午 hh:mm」格式，不含時區或 ISO 字串
function formatAmPmTime(dateInput) {
  if (!dateInput) return "";
  if (typeof dateInput === 'string' && (dateInput.indexOf('上午') !== -1 || dateInput.indexOf('下午') !== -1)) {
    return dateInput;
  }
  
  var d;
  if (dateInput instanceof Date) {
    d = dateInput;
  } else {
    try {
      d = new Date(dateInput);
    } catch(e) {
      d = new Date();
    }
  }
  
  if (isNaN(d.getTime())) {
    d = new Date();
  }
  
  var timezone = "GMT+8";
  try {
    timezone = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  } catch(e) {}
  
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

// 輔助函式：計算當前公積金池剩餘金額
function calculateCurrentBalance() {
  try {
    var sheet = getDbSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return 0;
    
    var reconciledMonths = getReconciledMonthsFromSheet();
    var values = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    
    var totalIncome = 0;
    var reconciledExpense = 0;
    
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var amount = parseFloat(row[4]) || 0;
      var type = row[5] ? row[5].toString() : "";
      var monthVal = row[0];
      var month = "";
      if (monthVal) {
        if (monthVal instanceof Date) {
          month = Utilities.formatDate(monthVal, "GMT+8", "yyyy-MM");
        } else {
          month = monthVal.toString().trim().substring(0, 7);
        }
      }
      
      if (type.indexOf("收入") !== -1) {
        totalIncome += amount;
      } else if (type.indexOf("支出") !== -1) {
        if (reconciledMonths.indexOf(month) !== -1) {
          reconciledExpense += amount;
        }
      }
    }
    return totalIncome - reconciledExpense;
  } catch(e) {
    return 0;
  }
}

// 輔助函式：計算當前銷帳後預計剩餘額度 (總撥入公積金 - 總日常代墊)
function calculateEstimatedQuota() {
  try {
    var sheet = getDbSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return 0;
    
    var values = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    var totalIncome = 0;
    var totalExpense = 0;
    
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var amount = parseFloat(row[4]) || 0;
      var type = row[5] ? row[5].toString() : "";
      
      if (type.indexOf("收入") !== -1) {
        totalIncome += amount;
      } else if (type.indexOf("支出") !== -1) {
        totalExpense += amount;
      }
    }
    return totalIncome - totalExpense;
  } catch(e) {
    return 0;
  }
}

// 讀取 LINE 通知發送偏好設定
function getLineNotifySettings() {
  try {
    var jsonStr = PropertiesService.getScriptProperties().getProperty("LINE_NOTIFY_SETTINGS");
    if (jsonStr) {
      var s = JSON.parse(jsonStr);
      return { 
        success: true, 
        settings: {
          notifyOnAdd: s.notifyOnAdd !== false,
          notifyOnIncome: s.notifyOnIncome !== false,
          notifyOnEdit: s.notifyOnEdit !== false,
          notifyOnDelete: s.notifyOnDelete !== false,
          notifyOnSettle: s.notifyOnSettle !== false,
          showBalance: s.showBalance !== false,
          notifyOnShoppingAdd: s.notifyOnShoppingAdd !== false,
          notifyOnShoppingComplete: s.notifyOnShoppingComplete !== false,
          notifyOnShoppingDelete: s.notifyOnShoppingDelete !== false
        } 
      };
    }
  } catch(e) {}
  return { 
    success: true, 
    settings: {
      notifyOnAdd: true,
      notifyOnIncome: true,
      notifyOnEdit: true,
      notifyOnDelete: true,
      notifyOnSettle: true,
      showBalance: true,
      notifyOnShoppingAdd: true,
      notifyOnShoppingComplete: true,
      notifyOnShoppingDelete: true
    } 
  };
}

// 儲存 LINE 通知發送偏好設定
function saveLineNotifySettings(settings) {
  try {
    if (typeof settings === 'object' && settings !== null) {
      var payload = settings.settings ? settings.settings : settings;
      PropertiesService.getScriptProperties().setProperty("LINE_NOTIFY_SETTINGS", JSON.stringify(payload));
      return { success: true, settings: payload, message: "已成功儲存 LINE 通知項目偏好！" };
    }
    return { success: false, message: "設定資料格式不正確" };
  } catch(e) {
    return { success: false, message: "儲存設定失敗：" + e.toString() };
  }
}
function getDbSpreadsheet() {
  var ss = null;
  // 0. 如果有直接指定 HARDCODED_SPREADSHEET_ID，優先採用
  if (typeof HARDCODED_SPREADSHEET_ID !== 'undefined' && HARDCODED_SPREADSHEET_ID && HARDCODED_SPREADSHEET_ID.trim()) {
    var rawInput = HARDCODED_SPREADSHEET_ID.trim();
    var sheetId = rawInput;
    if (rawInput.indexOf("docs.google.com/spreadsheets") !== -1) {
      var match = rawInput.match(/\/d\/([a-zA-Z0-9_\-]+)/);
      if (match && match[1]) sheetId = match[1];
    }
    try {
      ss = SpreadsheetApp.openById(sheetId);
      if (ss) return ss;
    } catch (e) {}
  }

  // 1. 嘗試取得容器綁定的活動試算表
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {}
  if (ss) return ss;
  
  // 2. 如果失敗，嘗試從腳本屬性讀取使用者設定的 SPREADSHEET_ID
  try {
    var savedId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
    if (savedId) {
      ss = SpreadsheetApp.openById(savedId);
    }
  } catch (e) {}
  
  return ss;
}

// 儲存試算表設定 API (由前端管理者呼叫)
function saveSpreadsheetId(idOrUrl) {
  try {
    if (!idOrUrl) {
      PropertiesService.getScriptProperties().deleteProperty("SPREADSHEET_ID");
      return { success: true, message: "已清除自訂試算表綁定，改用預設綁定" };
    }
    
    // 解析 URL 取出 ID
    var id = idOrUrl;
    if (idOrUrl.indexOf("docs.google.com/spreadsheets") !== -1) {
      var matches = idOrUrl.match(/\/d\/([a-zA-Z0-9_\-]+)/);
      if (matches && matches[1]) {
        id = matches[1];
      }
    }
    
    // 測試開啟
    var testSs = SpreadsheetApp.openById(id);
    PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", id);
    
    // 初始化該試算表
    setupDatabase();
    
    return { success: true, message: "成功綁定 Google 試算表！已偵測到「" + testSs.getName() + "」" };
  } catch (e) {
    return { success: false, message: "綁定失敗：" + e.toString() };
  }
}

// 取得目前的試算表綁定狀態學 API
function getSpreadsheetConfig() {
  try {
    var ss = getDbSpreadsheet();
    if (ss) {
      return { 
        connected: true, 
        name: ss.getName(), 
        url: ss.getUrl(),
        isCustom: !SpreadsheetApp.getActiveSpreadsheet()
      };
    } else {
      return { connected: false, isCustom: false };
    }
  } catch(e) {
    return { connected: false, error: e.toString() };
  }
}

// 2. 資料庫初始化：檢查並建立「流水帳資料庫」與「月度核銷狀態」工作表，設定欄位標頭
function setupDatabase() {
  var ss = getDbSpreadsheet();
  if (!ss) {
    throw new Error("未連接任何試算表。請先至設定部署頁面綁定您的試算表。");
  }
  
  // 建立「流水帳資料庫」
  var sheetName = "流水帳資料庫";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var headers = ["月份", "日期", "項目", "出錢人", "出錢金額", "類型", "時間戳記"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange("A1:G1").setBackground("#F4F1EA")
                           .setFontColor("#4A4A4A")
                           .setFontWeight("bold")
                           .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    try {
      ss.toast("已成功初始化「" + sheetName + "」工作表！", "系統通知");
    } catch(e) {}
  }

  // 建立「月度核銷狀態」工作表
  var settleSheetName = "月度核銷狀態";
  var settleSheet = ss.getSheetByName(settleSheetName);
  if (!settleSheet) {
    settleSheet = ss.insertSheet(settleSheetName);
    var settleHeaders = ["月份", "已撥款核銷"];
    settleSheet.getRange(1, 1, 1, settleHeaders.length).setValues([settleHeaders]);
    settleSheet.getRange("A1:B1").setBackground("#F4F1EA")
                                 .setFontColor("#4A4A4A")
                                 .setFontWeight("bold")
                                 .setHorizontalAlignment("center");
    settleSheet.setFrozenRows(1);
    try {
      ss.toast("已成功初始化「" + settleSheetName + "」工作表！", "系統通知");
    } catch(e) {}
  }

  // 建立「購物清單」工作表
  var shopSheetName = "購物清單";
  var shopSheet = ss.getSheetByName(shopSheetName);
  if (!shopSheet) {
    shopSheet = ss.insertSheet(shopSheetName);
    var shopHeaders = ["ID", "分類", "品項名稱", "購買地點", "預計購買日期", "狀態", "建立者", "建立時間", "備註細項"];
    shopSheet.getRange(1, 1, 1, shopHeaders.length).setValues([shopHeaders]);
    shopSheet.getRange("A1:I1").setBackground("#F4F1EA")
                               .setFontColor("#4A4A4A")
                               .setFontWeight("bold")
                               .setHorizontalAlignment("center");
    shopSheet.setFrozenRows(1);
    try {
      ss.toast("已成功初始化「" + shopSheetName + "」工作表！", "系統通知");
    } catch(e) {}
  }

  // 建立「常用商店」工作表
    // 建立「代墊明細」工作表
  var splitSheetName = "代墊明細";
  var splitSheet = ss.getSheetByName(splitSheetName);
  if (!splitSheet) {
    splitSheet = ss.insertSheet(splitSheetName);
    var splitHeaders = ["ID", "時間", "代墊人", "分帳模式", "項目描述", "總金額", "分帳結果", "狀態", "結清時間", "備註"];
    splitSheet.getRange(1, 1, 1, splitHeaders.length).setValues([splitHeaders]);
    splitSheet.getRange("A1:J1").setBackground("#F4F1EA")
                                .setFontColor("#4A4A4A")
                                .setFontWeight("bold")
                                .setHorizontalAlignment("center");
    splitSheet.setFrozenRows(1);
    try {
      ss.toast("已成功初始化「" + splitSheetName + "」工作表！", "系統通知");
    } catch(e) {}
  }

  var storeSheetName = "常用商店";
  var storeSheet = ss.getSheetByName(storeSheetName);
  if (!storeSheet) {
    storeSheet = ss.insertSheet(storeSheetName);
    var storeHeaders = ["商店名稱", "備註"];
    storeSheet.getRange(1, 1, 1, storeHeaders.length).setValues([storeHeaders]);
    storeSheet.getRange("A1:B1").setBackground("#F4F1EA")
                                .setFontColor("#4A4A4A")
                                .setFontWeight("bold")
                                .setHorizontalAlignment("center");
    storeSheet.setFrozenRows(1);
    
    var defaultStores = [
      ["菜市場", "傳統市場生鮮食材"],
      ["全聯福利中心", "日常食品生鮮超市"],
      ["日日加", "生鮮肉品日用品"],
      ["家樂福", "量販超市"],
      ["好市多", "美式大包裝採購"],
      ["寶雅", "美妝生活雜貨"],
      ["7-ELEVEN", "超商急需"],
      ["蝦皮購物", "線上網購組"]
    ];
    storeSheet.getRange(2, 1, defaultStores.length, 2).setValues(defaultStores);
    try {
      ss.toast("已成功初始化「" + storeSheetName + "」工作表！", "系統通知");
    } catch(e) {}
  }

  // 建立「旅遊行程」工作表
  var travelTripSheetName = "旅遊行程";
  var travelTripSheet = ss.getSheetByName(travelTripSheetName);
  if (!travelTripSheet) {
    travelTripSheet = ss.insertSheet(travelTripSheetName);
    var travelTripHeaders = ["ID", "行程名稱", "目的地", "代表圖示", "開始日期", "結束日期", "幣別", "匯率", "預算台幣", "狀態", "主題顏色", "成員清單", "建立時間"];
    travelTripSheet.getRange(1, 1, 1, travelTripHeaders.length).setValues([travelTripHeaders]);
    travelTripSheet.getRange("A1:M1").setBackground("#F4F1EA")
                                    .setFontColor("#4A4A4A")
                                    .setFontWeight("bold")
                                    .setHorizontalAlignment("center");
    travelTripSheet.setFrozenRows(1);
    try {
      ss.toast("已成功初始化「" + travelTripSheetName + "」工作表！", "系統通知");
    } catch(e) {}
  }

  // 建立「旅遊支出明細」工作表
  var travelExpSheetName = "旅遊支出明細";
  var travelExpSheet = ss.getSheetByName(travelExpSheetName);
  if (!travelExpSheet) {
    travelExpSheet = ss.insertSheet(travelExpSheetName);
    var travelExpHeaders = ["ID", "行程ID", "日期", "分類", "品項名稱", "付款人", "幣別", "原幣金額", "匯率", "台幣總額", "分攤模式", "分攤成員", "成員分攤細項", "代墊人", "代墊金額", "地點", "備註", "已轉日常代墊", "建立時間"];
    travelExpSheet.getRange(1, 1, 1, travelExpHeaders.length).setValues([travelExpHeaders]);
    travelExpSheet.getRange("A1:S1").setBackground("#F4F1EA")
                                   .setFontColor("#4A4A4A")
                                   .setFontWeight("bold")
                                   .setHorizontalAlignment("center");
    travelExpSheet.setFrozenRows(1);
    try {
      ss.toast("已成功初始化「" + travelExpSheetName + "」工作表！", "系統通知");
    } catch(e) {}
  }

  // 建立「旅遊心願清單」工作表
  var travelWishSheetName = "旅遊心願清單";
  var travelWishSheet = ss.getSheetByName(travelWishSheetName);
  if (!travelWishSheet) {
    travelWishSheet = ss.insertSheet(travelWishSheetName);
    var travelWishHeaders = ["ID", "行程ID", "心願項目", "分類", "預估金額台幣", "提議人", "狀態", "備註"];
    travelWishSheet.getRange(1, 1, 1, travelWishHeaders.length).setValues([travelWishHeaders]);
    travelWishSheet.getRange("A1:H1").setBackground("#F4F1EA")
                                    .setFontColor("#4A4A4A")
                                    .setFontWeight("bold")
                                    .setHorizontalAlignment("center");
    travelWishSheet.setFrozenRows(1);
    try {
      ss.toast("已成功初始化「" + travelWishSheetName + "」工作表！", "系統通知");
    } catch(e) {}
  }
  
  return "工作表已準備就緒";
}

// 獲取當前的「流水帳資料庫」工作表
function getDbSheet() {
  var ss = getDbSpreadsheet();
  if (!ss) {
    throw new Error("未連結任何有效的 Google 試算表。\n如果您是建立「獨立腳本」，請至網頁右下角『設定部署』輸入您的 Google 試算表 ID/網址。");
  }
  var sheetName = "流水帳資料庫";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName(sheetName);
  }
  return sheet;
}

// 獲取所有已核銷月份 (具有對帳資料自動自我修復與相容功能)
function getReconciledMonthsFromSheet() {
  try {
    var ss = getDbSpreadsheet();
    if (!ss) return [];
    var sheetName = "月度核銷狀態";
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName(sheetName);
      if (!sheet) return [];
    }
    
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    
    var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    var reconciled = [];
    for (var i = 0; i < data.length; i++) {
      var cellVal = data[i][0];
      var monthStr = "";
      if (cellVal instanceof Date || (cellVal && typeof cellVal.getFullYear === 'function')) {
        var y = cellVal.getFullYear();
        var m = cellVal.getMonth() + 1;
        monthStr = y + "-" + (m < 10 ? "0" + m : m);
      } else if (cellVal) {
        var cleaned = cellVal.toString().replace(/['"]/g, "").trim();
        var parts = cleaned.split(/[-/]/);
        if (parts.length === 2) {
          var yearNum = parseInt(parts[0], 10);
          var monthNum = parseInt(parts[1], 10);
          if (!isNaN(yearNum) && !isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
            monthStr = yearNum + "-" + (monthNum < 10 ? "0" + monthNum : monthNum);
          } else {
            monthStr = cleaned;
          }
        } else {
          monthStr = cleaned;
        }
      }
      
      var isReconciled = data[i][1];
      if (isReconciled === true || isReconciled === "TRUE" || isReconciled === "true") {
        if (monthStr && reconciled.indexOf(monthStr) === -1) {
          reconciled.push(monthStr);
        }
      }
    }
    return reconciled;
  } catch(e) {
    return [];
  }
}

// 更新/新增月份核銷狀態 (防呆排除同一月份重複行、直接勾選試算表複選框)
function setMonthReconciled(month, isReconciled) {
  try {
    if (typeof month === 'object' && month !== null) {
      if (typeof month.isReconciled !== 'undefined') isReconciled = month.isReconciled;
      month = month.month || month.settlementMonth;
    }
    if (!month) return { success: false, message: "請指定月份" };

    var ss = getDbSpreadsheet();
    if (!ss) {
      return { success: false, message: "未連結試算表" };
    }
    var sheetName = "月度核銷狀態";
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName(sheetName);
    }
    
    var lastRow = sheet.getLastRow();
    var foundRow = -1;
    if (lastRow > 1) {
      var monthsRange = sheet.getRange(2, 1, lastRow - 1, 1);
      var monthsValues = monthsRange.getValues();
      // Also normalize the input month argument
      var inputMonthCleaned = month.toString().replace(/['"]/g, "").trim();
      var inputParts = inputMonthCleaned.split(/[-/]/);
      var normInputMonth = inputMonthCleaned;
      if (inputParts.length === 2) {
        var iy = parseInt(inputParts[0], 10);
        var im = parseInt(inputParts[1], 10);
        if (!isNaN(iy) && !isNaN(im) && im >= 1 && im <= 12) {
          normInputMonth = iy + "-" + (im < 10 ? "0" + im : im);
        }
      }

      for (var i = 0; i < monthsValues.length; i++) {
        var cellVal = monthsValues[i][0];
        var formattedCellVal = "";
        if (cellVal instanceof Date || (cellVal && typeof cellVal.getFullYear === 'function')) {
          var y = cellVal.getFullYear();
          var m = cellVal.getMonth() + 1;
          formattedCellVal = y + "-" + (m < 10 ? "0" + m : m);
        } else if (cellVal) {
          var cleaned = cellVal.toString().replace(/['"]/g, "").trim();
          var parts = cleaned.split(/[-/]/);
          if (parts.length === 2) {
            var yearNum = parseInt(parts[0], 10);
            var monthNum = parseInt(parts[1], 10);
            if (!isNaN(yearNum) && !isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
              formattedCellVal = yearNum + "-" + (monthNum < 10 ? "0" + monthNum : monthNum);
            } else {
              formattedCellVal = cleaned;
            }
          } else {
            formattedCellVal = cleaned;
          }
        }
        
        if (formattedCellVal === normInputMonth) {
          foundRow = i + 2;
          break;
        }
      }
    }
    
    // 如果 isReconciled 是字串則轉為 boolean
    var boolReconciled = (isReconciled === true || isReconciled === "true" || isReconciled === "TRUE");
    
    if (foundRow !== -1) {
      // 在現有列更新核銷狀態
      sheet.getRange(foundRow, 2).setValue(boolReconciled);
      
      // 自動自我修復/除重：如果之前因為多重觸發產生了重複列，自動刪除更後面的重複項目
      if (lastRow > foundRow) {
        for (var j = lastRow; j > foundRow; j--) {
          var checkVal = sheet.getRange(j, 1).getValue();
          var formattedCheckVal = "";
          if (checkVal instanceof Date || (checkVal && typeof checkVal.getFullYear === 'function')) {
            var y = checkVal.getFullYear();
            var m = checkVal.getMonth() + 1;
            formattedCheckVal = y + "-" + (m < 10 ? "0" + m : m);
          } else if (checkVal) {
            formattedCheckVal = checkVal.toString().trim();
          }
          if (formattedCheckVal === month.toString().trim()) {
            sheet.deleteRow(j);
          }
        }
      }
    } else {
      // 無歷史資料，新增一列，並在試算表強制前置 ' 避免 Google 轉換為日期
      var newRow = ["'" + month, boolReconciled];
      sheet.appendRow(newRow);
      var newLastRow = sheet.getLastRow();
      // 同時插入 Checkbox，若已填入 boolean 值它將呈現為選中/未選中
      sheet.getRange(newLastRow, 2).insertCheckboxes();
    }

    // 💡 串接 LINE 即時對帳狀態變動推播！
    try {
      var lineSettingsRes = getLineNotifySettings();
      var lineSettings = lineSettingsRes.settings || {};
      if (lineSettings.notifyOnSettle !== false) {
        var estimatedQuota = calculateEstimatedQuota();
        var now = new Date();
        var timeStr = formatAmPmTime(now);
        var statusText = boolReconciled ? "已撥款核銷結清 ✅" : "尚有代墊待結算 ⏳";
        
        var details = [
          { label: "對帳月份", value: month + " 月份" },
          { label: "核銷狀態", value: statusText, bold: true }
        ];
        if (lineSettings.showBalance !== false) {
          details.push({
            label: "銷帳後預計剩餘",
            value: "$" + estimatedQuota.toLocaleString() + " 元",
            bold: true,
            color: estimatedQuota >= 0 ? "#428564" : "#C55757"
          });
        }
        details.push({ label: "時間", value: timeStr });

        sendLineNotify({
          altText: "🤝月度對帳狀態更新囉～",
          titleText: "【對帳狀態更新】" + month + " 月份",
          badgeText: boolReconciled ? "已結清" : "待對帳",
          badgeBg: boolReconciled ? "#3A6D8C" : "#E58B23",
          details: details,
          targetUrl: "https://liao0318.github.io/fund.migoscar/"
        });
      }
    } catch(lineErr) {}

    return { success: true, message: "成功同步試算表！" + month + " 月度狀態已更新為 " + (boolReconciled ? "已核銷結清" : "待核銷狀態") };
  } catch(e) {
    return { success: false, message: "更新核銷狀態失敗：" + e.toString() };
  }
}

// 3. 寫入資料 API：附加新紀錄到試算表
function addRecord(data) {
  try {
    var sheet = getDbSheet();
    var now = new Date();
    var timezone = "GMT+8";
    try {
      timezone = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    } catch(e) {}
    
    // 使用前端傳過來的日期，若無則預設今天
    var dateStr = data.date || Utilities.formatDate(now, timezone, "yyyy-MM-dd");
    var monthStr = dateStr.substring(0, 7);
    var amount = parseFloat(data.amount) || 0;
    
    // 登錄流水清單的時間戳記
    var timestampStr = formatAmPmTime(now);
    var displayTimeStr = formatAmPmTime(now);
    
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
    
    // 💡 串接 LINE 即時新增通知功能 (國泰風格卡片式 Flex Message)！
    try {
      var lineSettingsRes = getLineNotifySettings();
      var lineSettings = lineSettingsRes.settings || {};
      var isIncome = (data.type || "").indexOf("收入") !== -1;
      var shouldSend = isIncome ? (lineSettings.notifyOnIncome !== false) : (lineSettings.notifyOnAdd !== false);

      if (shouldSend) {
        var altText = isIncome ? "💰公積金有一筆金額撥入囉～" : "💸你們有一筆金額支出囉～";
        var titleText = isIncome ? "【帳戶撥入】NT$" + amount.toLocaleString() + "元" : "【代墊支出】NT$" + amount.toLocaleString() + "元";
        var badgeText = isIncome ? "公積金撥入" : "代墊支出";
        var badgeBg = isIncome ? "#3A6D8C" : "#C55757";
        var payerLabel = isIncome ? "撥款人" : "出錢人";
        var estimatedQuota = calculateEstimatedQuota();
        
        var details = [
          { label: payerLabel, value: data.payer || "夥伴" },
          { label: "項目", value: (data.item || "未分類項目") + " (" + (data.type || "帳目") + ")" },
          { label: "記帳日期", value: dateStr }
        ];
        
        if (lineSettings.showBalance !== false) {
          details.push({
            label: "銷帳後預計剩餘",
            value: "$" + estimatedQuota.toLocaleString() + " 元",
            bold: true,
            color: estimatedQuota >= 0 ? "#428564" : "#C55757"
          });
        }
        details.push({ label: "時間", value: displayTimeStr });

        sendLineNotify({
          altText: altText,
          titleText: titleText,
          badgeText: badgeText,
          badgeBg: badgeBg,
          details: details,
          targetUrl: "https://liao0318.github.io/fund.migoscar/"
        });
      }
    } catch(lineErr) {
      console.error("LINE Notify failed:", lineErr.toString());
    }
    
    return { success: true, message: "成功寫入一筆記帳資料！" };
  } catch(e) {
    return { success: false, message: "寫入失敗：" + e.toString() };
  }
}

// 3-1. 更新既有流水帳紀錄 API
function updateRecordByRow(data) {
  try {
    var sheet = getDbSheet();
    var rowId = parseInt(data.id, 10);
    if (!rowId || isNaN(rowId) || rowId < 2) {
      return { success: false, message: "無效的紀錄列編號" };
    }
    var now = new Date();
    var timezone = "GMT+8";
    try {
      timezone = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    } catch(e) {}
    
    var dateStr = data.date || Utilities.formatDate(now, timezone, "yyyy-MM-dd");
    var monthStr = dateStr.substring(0, 7);
    var amount = parseFloat(data.amount) || 0;
    var timestampStr = formatAmPmTime(now);
    var currency = data.currency || "TWD";
    var originalAmount = parseFloat(data.originalAmount) || amount;
    var exchangeRate = parseFloat(data.exchangeRate) || 1;
    
    sheet.getRange(rowId, 1, 1, 6).setValues([[
      monthStr,
      dateStr,
      data.item || "未分類項目",
      data.payer || "廖尹丞",
      amount,
      data.type || "支出-日常代墊"
    ]]);
    
    // 💡 串接 LINE 即時修改通知
    try {
      var lineSettingsRes = getLineNotifySettings();
      var lineSettings = lineSettingsRes.settings || {};
      if (lineSettings.notifyOnEdit !== false) {
        var isIncome = (data.type || "").indexOf("收入") !== -1;
        var altText = "✏️ 伴伴記有一筆對帳項目已修改～";
        var titleText = "【項目修改】NT$" + amount.toLocaleString() + "元";
        var badgeText = "資料修改";
        var badgeBg = "#E58B23";
        var payerLabel = isIncome ? "撥款人" : "出錢人";
        var estimatedQuota = calculateEstimatedQuota();
        
        var details = [
          { label: payerLabel, value: data.payer || "夥伴" },
          { label: "項目", value: (data.item || "未分類項目") + " (" + (data.type || "帳目") + ")" },
          { label: "記帳日期", value: dateStr }
        ];
        
        if (currency !== "TWD") {
          details.push({ label: "外幣換算", value: originalAmount.toLocaleString() + " " + currency + " (匯率 " + exchangeRate + ")" });
        }
        if (lineSettings.showBalance !== false) {
          details.push({
            label: "銷帳後預計剩餘",
            value: "$" + estimatedQuota.toLocaleString() + " 元",
            bold: true,
            color: estimatedQuota >= 0 ? "#428564" : "#C55757"
          });
        }
        details.push({ label: "時間", value: timestampStr });

        sendLineNotify({
          altText: altText,
          titleText: titleText,
          badgeText: badgeText,
          badgeBg: badgeBg,
          details: details,
          targetUrl: "https://liao0318.github.io/fund.migoscar/"
        });
      }
    } catch(lineErr) {}
    
    return { success: true, message: "已成功更新對帳紀錄！" };
  } catch(e) {
    return { success: false, message: "更新紀錄失敗：" + e.toString() };
  }
}

// 4. 讀取與即時結算 API：獲取流水帳列表、統計廖尹丞與周沛緹的代墊支出總額
function getDashboardData() {
  try {
    var ss = getDbSpreadsheet();
    if (!ss) {
      return {
        success: false,
        needsConfig: true,
        message: "未連結任何有效的 Google 試算表。請至網頁右下角『設定部署』輸入並綁定您的 Google 試算表 ID / 網址。",
        records: [],
        liaoTotal: 0,
        zhouTotal: 0,
        reconciledMonths: []
      };
    }
    
    var sheet = getDbSheet();
    var lastRow = sheet.getLastRow();
    
    var response = {
      records: [],
      liaoTotal: 0,
      zhouTotal: 0,
      reconciledMonths: [],
      success: true
    };
    
    try {
      response.reconciledMonths = getReconciledMonthsFromSheet();
    } catch(reconcileErr) {
      response.reconciledMonths = [];
    }
    
    if (lastRow <= 1) {
      return response;
    }
    
    // 💡 自我修復：如果以前的工作表欄位數小於 7，自動在 G1 補上「時間戳記」
    try {
      if (sheet.getLastColumn() < 7) {
        sheet.getRange(1, 7).setValue("時間戳記");
        sheet.getRange("A1:G1").setBackground("#F4F1EA")
                               .setFontColor("#4A4A4A")
                               .setFontWeight("bold")
                               .setHorizontalAlignment("center");
      }
    } catch(errCol) {}

    var dataRange = sheet.getRange(2, 1, lastRow - 1, 7);
    var values = dataRange.getValues();
    
    var liaoTotal = 0;
    var zhouTotal = 0;
    var recordsList = [];
    var timezone = "GMT+8";
    try {
      timezone = ss.getSpreadsheetTimeZone();
    } catch(e) {}
    
    // 從最後一列往前讀取 (最新登錄在最前面)
    for (var i = values.length - 1; i >= 0; i--) {
      var row = values[i];
      var monthVal = row[0];
      var month = "";
      if (monthVal) {
        if (monthVal instanceof Date) {
          month = Utilities.formatDate(monthVal, timezone, "yyyy-MM");
        } else {
          var mStr = monthVal.toString().trim();
          if (/^\d{4}-\d{2}$/.test(mStr)) {
            month = mStr;
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(mStr)) {
            month = mStr.substring(0, 7);
          } else {
            var parsedMonthDate = new Date(mStr);
            if (!isNaN(parsedMonthDate.getTime())) {
              month = Utilities.formatDate(parsedMonthDate, timezone, "yyyy-MM");
            } else {
              month = mStr;
            }
          }
        }
      }
      
      // 處理日期格式，若是 Date 物件則轉為 YYYY-MM-DD
      var dateVal = row[1];
      var dateStr = "";
      if (dateVal) {
        if (dateVal instanceof Date) {
          dateStr = Utilities.formatDate(dateVal, timezone, "yyyy-MM-dd");
        } else {
          dateStr = dateVal.toString();
        }
      } else {
        dateStr = month ? month + "-01" : "";
      }
      
      var item = row[2] ? row[2].toString() : "";
      var payer = row[3] ? row[3].toString() : "";
      var amount = parseFloat(row[4]) || 0;
      var type = row[5] ? row[5].toString() : "";
      
      // 讀取時間戳記
      var timestampVal = row[6];
      var timestampStr = "";
      if (timestampVal) {
        if (timestampVal instanceof Date) {
          timestampStr = formatAmPmTime(timestampVal);
        } else {
          timestampStr = formatAmPmTime(timestampVal.toString());
        }
      } else {
        // 沒有則預設使用當天
        timestampStr = dateStr + " 上午 12:00";
      }
      
      recordsList.push({
        id: i + 2, // 試算表對應的 Row ID
        month: month,
        date: dateStr,
        item: item,
        payer: payer,
        amount: amount,
        type: type,
        timestamp: timestampStr
      });
      
      if (type && type.indexOf("支出") !== -1) {
        if (payer === "廖尹丞") {
          liaoTotal += amount;
        } else if (payer === "周沛緹") {
          zhouTotal += amount;
        }
      }
    }
    
    response.records = recordsList;
    response.liaoTotal = liaoTotal;
    response.zhouTotal = zhouTotal;
    
    return response;
  } catch(e) {
    return { success: false, message: "讀取錯誤：" + e.toString(), records: [], liaoTotal: 0, zhouTotal: 0, reconciledMonths: [] };
  }
}

// 刪除特定欄位紀錄 API
function deleteRecordByRow(rowId) {
  try {
    if (typeof rowId === 'object' && rowId !== null) {
      rowId = rowId.rowId || rowId.id;
    }
    rowId = parseInt(rowId, 10);
    if (!rowId || isNaN(rowId) || rowId < 2) {
      return { success: false, message: "無效的紀錄列編號" };
    }

    var sheet = getDbSheet();
    var item = "";
    var payer = "";
    var amount = 0;
    var dateStr = "";
    try {
      var rowValues = sheet.getRange(rowId, 1, 1, 6).getValues()[0];
      item = rowValues[2] ? rowValues[2].toString() : "";
      payer = rowValues[3] ? rowValues[3].toString() : "";
      amount = parseFloat(rowValues[4]) || 0;
      var rawDate = rowValues[1];
      if (rawDate instanceof Date) {
        dateStr = Utilities.formatDate(rawDate, "GMT+8", "yyyy-MM-dd");
      } else if (rawDate) {
        dateStr = rawDate.toString();
      }
    } catch(errGet) {}
    
    sheet.deleteRow(rowId);
    
    if (item && payer) {
      try {
        var lineSettingsRes = getLineNotifySettings();
        var lineSettings = lineSettingsRes.settings || {};
        if (lineSettings.notifyOnDelete !== false) {
          var estimatedQuota = calculateEstimatedQuota();
          var now = new Date();
          var timeStr = formatAmPmTime(now);
          
          var details = [
            { label: "操作者", value: payer },
            { label: "撤銷項目", value: item },
            { label: "原金額", value: "$" + amount.toLocaleString() + " 元" }
          ];
          if (dateStr) {
            details.push({ label: "原記帳日期", value: dateStr });
          }
          if (lineSettings.showBalance !== false) {
            details.push({
              label: "銷帳後預計剩餘",
              value: "$" + estimatedQuota.toLocaleString() + " 元",
              bold: true,
              color: estimatedQuota >= 0 ? "#428564" : "#C55757"
            });
          }
          details.push({ label: "時間", value: timeStr });

          sendLineNotify({
            altText: "🗑️有項目刪除撤銷囉～",
            titleText: "【撤銷代墊】NT$" + amount.toLocaleString() + "元",
            badgeText: "撤銷紀錄",
            badgeBg: "#706B62",
            details: details,
            targetUrl: "https://liao0318.github.io/fund.migoscar/"
          });
        }
      } catch(lineErr) {}
    }
    
    return { success: true, message: "已成功刪除記帳紀錄！" };
  } catch(e) {
    return { success: false, message: "刪除失敗：" + e.toString() };
  }
}

/**
 * 💡 LINE Messaging API 外掛通知核心機制 (支援國泰風格卡片式 Flex Message 廣播推播)
 */
/**
 * 💡 Telegram Bot 外掛通知核心機制 (支援精美卡片 Blockquote 排版與內嵌互動按鈕)
 */
function sendTelegramMessage(payload, customChatId, customToken) {
  try {
    var token = (customToken && customToken.trim())
      ? customToken.trim()
      : ((typeof HARDCODED_TELEGRAM_TOKEN !== 'undefined' && HARDCODED_TELEGRAM_TOKEN && HARDCODED_TELEGRAM_TOKEN.trim())
          ? HARDCODED_TELEGRAM_TOKEN.trim()
          : (PropertiesService.getScriptProperties().getProperty("TELEGRAM_BOT_TOKEN") || ""));
      
    var chatId = customChatId || "";
    if (!chatId) {
      if (typeof HARDCODED_TELEGRAM_CHAT_ID !== 'undefined' && HARDCODED_TELEGRAM_CHAT_ID && HARDCODED_TELEGRAM_CHAT_ID.trim()) {
        chatId = HARDCODED_TELEGRAM_CHAT_ID.trim();
      } else {
        chatId = PropertiesService.getScriptProperties().getProperty("TELEGRAM_CHAT_ID") || "";
      }
    }
       
    if (!token) return { success: false, message: "未設定 Telegram Bot Token" };
    if (!chatId) return { success: false, message: "未設定 Telegram Chat ID" };
    
    var textMessage = "";
    var webAppUrl = (typeof payload === 'object' && payload !== null && payload.targetUrl) ? payload.targetUrl : "https://liao0318.github.io/fund.migoscar/";
    var buttonText = (typeof payload === 'object' && payload !== null && payload.btnText) ? payload.btnText : "🌐 開啟伴伴記全螢幕網頁";
    
    if (typeof payload === 'object' && payload !== null) {
      var lines = [];
      var header = payload.titleText || payload.altText || "🔔【伴伴記通知】";
      
      // 頂部卡片標題列
      lines.push("<b>" + escapeHtml(header) + "</b>");
      
      // 標籤徽章列
      if (payload.badgeText) {
        lines.push("🏷️ <code>" + escapeHtml(payload.badgeText) + "</code>");
      }
      
      // 核心卡片內容 (使用 Telegram 官方 <blockquote> 營造優雅左側色條卡片)
      if (payload.details && payload.details.length > 0) {
        var cardLines = [];
        for (var i = 0; i < payload.details.length; i++) {
          var item = payload.details[i];
          var lbl = item.label || "";
          var rawVal = String(item.value || "");
          var val = escapeHtml(rawVal);
          
          // 如果是金額或重要數值，套用 code 標籤讓排版更工整
          if (rawVal.indexOf("$") !== -1 || rawVal.indexOf("NT") !== -1 || item.bold) {
            val = "<code>" + val + "</code>";
          }
          
          var icon = "▫️";
          if (lbl.indexOf("項目") !== -1 || lbl.indexOf("品項") !== -1) icon = "📦";
          else if (lbl.indexOf("金額") !== -1 || lbl.indexOf("支出") !== -1 || lbl.indexOf("存入") !== -1) icon = "💵";
          else if (lbl.indexOf("出資") !== -1 || lbl.indexOf("出錢") !== -1 || lbl.indexOf("人") !== -1 || lbl.indexOf("對象") !== -1 || lbl.indexOf("來源") !== -1) icon = "👤";
          else if (lbl.indexOf("日期") !== -1) icon = "📅";
          else if (lbl.indexOf("時間") !== -1) icon = "⏰";
          else if (lbl.indexOf("剩餘") !== -1 || lbl.indexOf("餘額") !== -1) icon = "💰";
          else if (lbl.indexOf("地點") !== -1 || lbl.indexOf("商店") !== -1) icon = "🏪";
          else if (lbl.indexOf("期限") !== -1) icon = "⏳";
          else if (lbl.indexOf("類型") !== -1) icon = "🏷️";
          else if (lbl.indexOf("狀態") !== -1 || lbl.indexOf("對帳") !== -1) icon = "📌";
          else if (lbl.indexOf("外幣") !== -1 || lbl.indexOf("匯率") !== -1) icon = "💱";
          else if (lbl.indexOf("測試") !== -1 || lbl.indexOf("連線") !== -1) icon = "✨";
          else if (lbl.indexOf("備註") !== -1) icon = "📝";
          
          cardLines.push(icon + " <b>" + escapeHtml(lbl) + "</b>： " + val);
        }
        
        lines.push("<blockquote>" + cardLines.join("\n") + "</blockquote>");
      }
      
      textMessage = lines.join("\n");
    } else {
      textMessage = String(payload);
    }
    
    var telegramApiUrl = "https://api.telegram.org/bot" + token.trim() + "/sendMessage";
    
    var requestBody = {
      "chat_id": chatId.trim(),
      "text": textMessage,
      "parse_mode": "HTML",
      "disable_web_page_preview": true,
      "reply_markup": {
        "inline_keyboard": [
          [
            {
              "text": buttonText,
              "url": webAppUrl
            }
          ]
        ]
      }
    };
    
    var options = {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(requestBody),
      "muteHttpExceptions": true
    };
    
    var response = UrlFetchApp.fetch(telegramApiUrl, options);
    var respCode = response.getResponseCode();
    var respText = response.getContentText();
    
    if (respCode >= 200 && respCode < 300) {
      return { success: true, message: "Telegram 卡片訊息推播成功！" };
    } else {
      console.warn("Telegram API error: " + respCode + ", " + respText);
      return { success: false, message: "Telegram 發送失敗 (" + respCode + ")：" + respText };
    }
  } catch(err) {
    console.error("sendTelegramMessage Exception: " + err.toString());
    return { success: false, message: "Telegram 發送異常：" + err.toString() };
  }
}

// 輔助函式：逸出 Telegram HTML 標籤
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sendLineNotify(payload) {
  return sendTelegramMessage(payload);
}


// 儲存 Telegram Bot Token 與 Chat ID
function saveTelegramCredentials(data) {
  try {
    var token = "";
    var chatId = "";
    if (typeof data === 'object' && data !== null) {
      token = data.token || "";
      chatId = data.chatId || "";
    } else if (typeof data === 'string') {
      token = data;
    }
    
    if (token) {
      PropertiesService.getScriptProperties().setProperty("TELEGRAM_BOT_TOKEN", token.trim());
    } else {
      PropertiesService.getScriptProperties().deleteProperty("TELEGRAM_BOT_TOKEN");
    }
    if (chatId) {
      PropertiesService.getScriptProperties().setProperty("TELEGRAM_CHAT_ID", chatId.trim());
    }
    
    return { success: true, message: "Telegram Bot Token 與 Chat ID 已成功儲存！" };
  } catch (e) {
    return { success: false, message: "儲存 Telegram 設定失敗：" + e.toString() };
  }
}

function saveLineNotifyToken(token) {
  return saveTelegramCredentials(token);
}

// 讀取已經遮罩的 Telegram 設定
function getTelegramCredentials() {
  try {
    var token = (typeof HARDCODED_TELEGRAM_TOKEN !== 'undefined' && HARDCODED_TELEGRAM_TOKEN && HARDCODED_TELEGRAM_TOKEN.trim())
      ? HARDCODED_TELEGRAM_TOKEN.trim()
      : PropertiesService.getScriptProperties().getProperty("TELEGRAM_BOT_TOKEN");
      
    var chatId = (typeof HARDCODED_TELEGRAM_CHAT_ID !== 'undefined' && HARDCODED_TELEGRAM_CHAT_ID && HARDCODED_TELEGRAM_CHAT_ID.trim())
      ? HARDCODED_TELEGRAM_CHAT_ID.trim()
      : PropertiesService.getScriptProperties().getProperty("TELEGRAM_CHAT_ID");
      
    var maskedToken = "";
    if (token) {
      maskedToken = token.length > 8
        ? token.substring(0, 4) + "********************" + token.substring(token.length - 4)
        : "********";
    }
    return { success: true, token: maskedToken, chatId: chatId || "", hasToken: !!token };
  } catch (e) {
    return { success: false, token: "", chatId: "" };
  }
}

function getLineNotifyToken() {
  return getTelegramCredentials();
}

// 測試發送 Telegram 訊息
function testTelegramNotify(customToken, customChatId) {
  try {
    var estimatedQuota = calculateEstimatedQuota();
    var now = new Date();
    var dateStr = Utilities.formatDate(now, "GMT+8", "yyyy-MM-dd");
    var timeStr = formatAmPmTime(now);

    var testDetails = [
      { label: "連線測試", value: "Telegram 群組推播連線成功！🎉" },
      { label: "測試日期", value: dateStr },
      { label: "銷帳後預計剩餘", value: "NT$ " + estimatedQuota.toLocaleString() + " 元", bold: true },
      { label: "時間", value: timeStr }
    ];

    var sendRes = sendTelegramMessage({
      altText: "🔔伴伴記 Telegram 群組推播測試成功～",
      titleText: "【Telegram 推播測試】連線成功 🎉",
      badgeText: "連線正常",
      badgeBg: "#38BDF8",
      details: testDetails,
      targetUrl: "https://liao0318.github.io/fund.migoscar/"
    }, customChatId, customToken);

    if (sendRes && sendRes.success) {
      return { success: true, message: "🎉 Telegram 測試訊息已發送至群組！請查看 Telegram。" };
    } else {
      return { success: false, message: sendRes ? sendRes.message : "發送失敗，請確認 Token 與 Chat ID" };
    }
  } catch(e) {
    return { success: false, message: "測試異常：" + e.toString() };
  }
}

function testLineNotify(token) {
  return testTelegramNotify(token);
}


function getShoppingSheet() {
  var ss = getDbSpreadsheet();
  if (!ss) throw new Error("未連結試算表");
  var sheet = ss.getSheetByName("購物清單");
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName("購物清單");
  }
  return sheet;
}

function getStoresSheet() {
  var ss = getDbSpreadsheet();
  if (!ss) throw new Error("未連結試算表");
  var sheet = ss.getSheetByName("常用商店");
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName("常用商店");
  }
  return sheet;
}

function getShoppingData() {
  try {
    var shopSheet = getShoppingSheet();
    var storeSheet = getStoresSheet();
    
    var items = [];
    var lastRowShop = shopSheet.getLastRow();
    if (lastRowShop > 1) {
      var shopValues = shopSheet.getRange(2, 1, lastRowShop - 1, 9).getValues();
      for (var i = 0; i < shopValues.length; i++) {
        var r = shopValues[i];
        if (r[0] || r[2]) {
          var rawTime = r[7];
          if (!rawTime && r[0]) {
            var idStr = String(r[0]);
            var match = idStr.match(/\d{10,13}/);
            if (match) {
              var ts = parseInt(match[0], 10);
              if (ts > 1500000000000 && ts < 2500000000000) {
                rawTime = new Date(ts);
              }
            }
          }
          var formattedTime = rawTime ? formatAmPmTime(rawTime) : "";
          items.push({
            id: r[0] ? String(r[0]) : ("shop-" + (i + 1)),
            category: r[1] ? String(r[1]) : "需要買",
            item: r[2] ? String(r[2]) : "未填品項",
            store: r[3] ? String(r[3]) : "隨意",
            deadline: r[4] ? String(r[4]) : "儘快",
            status: r[5] ? String(r[5]) : "待購買",
            creator: r[6] ? String(r[6]) : "夥伴",
            createdTime: formattedTime,
            timeStr: formattedTime,
            note: r[8] ? String(r[8]) : ""
          });
        }
      }
    }
    
    var stores = [];
    var lastRowStore = storeSheet.getLastRow();
    if (lastRowStore > 1) {
      var storeValues = storeSheet.getRange(2, 1, lastRowStore - 1, 2).getValues();
      for (var j = 0; j < storeValues.length; j++) {
        var stName = storeValues[j][0] ? String(storeValues[j][0]).trim() : "";
        if (stName && stores.indexOf(stName) === -1) {
          stores.push(stName);
        }
      }
    }
    if (stores.length === 0) {
      stores = ["菜市場", "全聯福利中心", "日日加", "家樂福", "好市多", "寶雅", "7-ELEVEN", "蝦皮購物"];
    }
    
    return { success: true, items: items, stores: stores };
  } catch(e) {
    return { success: false, message: e.toString(), items: [], stores: [] };
  }
}

function addShoppingItem(data, triggerBroadcast) {
  try {
    var sheet = getShoppingSheet();
    var now = new Date();
    var timeStr = formatAmPmTime(now);
    
    var id = (data && data.id) ? String(data.id) : ("shop-" + now.getTime());
    var category = (data && data.category) ? data.category : "需要買";
    var item = (data && data.item) ? data.item : "未具名品項";
    var store = (data && data.store) ? data.store : "隨意";
    var deadline = (data && data.deadline) ? data.deadline : "儘快";
    var status = (data && data.status) ? data.status : "待購買";
    var creator = (data && data.creator) ? data.creator : "夥伴";
    var note = (data && data.note) ? data.note : "";
    var createdTime = (data && data.createdTime) ? data.createdTime : timeStr;
    
    var newRow = [
      id,
      category,
      item,
      store,
      deadline,
      status,
      creator,
      createdTime,
      note
    ];
    
    sheet.appendRow(newRow);
    
    // 如果商店不在常用商店，自動記錄常用商店
    try {
      if (store && store !== "隨意" && store !== "不限") {
        var storeSheet = getStoresSheet();
        var lastStRow = storeSheet.getLastRow();
        var exists = false;
        if (lastStRow > 1) {
          var existingStores = storeSheet.getRange(2, 1, lastStRow - 1, 1).getValues();
          for (var s = 0; s < existingStores.length; s++) {
            if (existingStores[s][0] && existingStores[s][0].toString().trim() === store.trim()) {
              exists = true;
              break;
            }
          }
        }
        if (!exists) {
          storeSheet.appendRow([store.trim(), "自訂新增商店"]);
        }
      }
    } catch(stErr) {}
    
    // 發送 LINE 即時廣播
    if (triggerBroadcast !== false) {
      try {
        var lineSettingsRes = getLineNotifySettings();
        var lineSettings = lineSettingsRes.settings || {};
        if (lineSettings.notifyOnShoppingAdd !== false) {
          var badgeBg = category === "需要買" ? "#C55757" : "#E58B23";
          var details = [
            { label: "購買類型", value: category },
            { label: "品項名稱", value: item, bold: true },
            { label: "購買地點", value: store },
            { label: "預計期限", value: deadline, color: "#2B825B" },
            { label: "登記人", value: creator },
            { label: "時間", value: createdTime }
          ];
          if (note) {
            details.push({ label: "備註細項", value: note });
          }
          
          sendLineNotify({
            altText: "🛒 購物記事「" + item + "」已新增囉！",
            titleText: "【採購記事新增】🛒",
            badgeText: category,
            badgeBg: badgeBg,
            details: details,
            targetUrl: "https://liao0318.github.io/fund.migoscar/"
          });
        }
      } catch(lineErr) {}
    }
    
    return { 
      success: true, 
      id: id, 
      item: item, 
      category: category, 
      store: store, 
      deadline: deadline, 
      status: status,
      creator: creator, 
      createdTime: createdTime, 
      timeStr: createdTime, 
      note: note 
    };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function updateShoppingItem(data) {
  try {
    var sheet = getShoppingSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, message: "查無此項目" };
    
    var id = data.id;
    if (!id) return { success: false, message: "缺乏項目 ID" };
    
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    var foundRow = -1;
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        foundRow = i + 2;
        break;
      }
    }
    
    if (foundRow === -1) return { success: false, message: "找不到該採購項目" };
    
    if (data.category !== undefined) sheet.getRange(foundRow, 2).setValue(data.category);
    if (data.item !== undefined) sheet.getRange(foundRow, 3).setValue(data.item);
    if (data.store !== undefined) sheet.getRange(foundRow, 4).setValue(data.store);
    if (data.deadline !== undefined) sheet.getRange(foundRow, 5).setValue(data.deadline);
    if (data.status !== undefined) sheet.getRange(foundRow, 6).setValue(data.status);
    if (data.creator !== undefined) sheet.getRange(foundRow, 7).setValue(data.creator);
    if (data.createdTime !== undefined && data.createdTime) sheet.getRange(foundRow, 8).setValue(data.createdTime);
    if (data.note !== undefined) sheet.getRange(foundRow, 9).setValue(data.note);
    
    return { success: true, message: "採購項目與備註已成功更新！" };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function toggleShoppingItemStatus(id, newStatus) {
  try {
    if (typeof id === 'object' && id !== null) {
      newStatus = id.status || id.newStatus;
      id = id.id;
    }
    var sheet = getShoppingSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, message: "查無此項目" };
    
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    var foundRow = -1;
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        foundRow = i + 2;
        break;
      }
    }
    
    if (foundRow === -1) return { success: false, message: "找不到指定的採購項目" };
    
    sheet.getRange(foundRow, 6).setValue(newStatus);
    
    // 如果標記為已買到，推播 LINE 通知
    if (newStatus === "已買到") {
      try {
        var lineSettingsRes = getLineNotifySettings();
        var lineSettings = lineSettingsRes.settings || {};
        if (lineSettings.notifyOnShoppingComplete !== false) {
          var rowData = sheet.getRange(foundRow, 1, 1, 8).getValues()[0];
          var itemName = rowData[2] || "項目";
          var itemStore = rowData[3] || "門市";
          var now = new Date();
          var timeStr = formatAmPmTime(now);
          
          var details = [
            { label: "狀態", value: "🎉 已順利採購完成！", bold: true, color: "#428564" },
            { label: "品項", value: itemName },
            { label: "地點", value: itemStore },
            { label: "完成時間", value: timeStr }
          ];
          
          sendLineNotify({
            altText: "🎉 採購項目「" + itemName + "」已完成購買囉！",
            titleText: "【採購完成通知】✅",
            badgeText: "已完成",
            badgeBg: "#428564",
            details: details,
            targetUrl: "https://liao0318.github.io/fund.migoscar/"
          });
        }
      } catch(lineErr) {}
    }
    
    return { success: true, message: "已更新狀態為「" + newStatus + "」" };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function deleteShoppingItem(id) {
  try {
    if (typeof id === 'object' && id !== null) {
      id = id.id;
    }
    var sheet = getShoppingSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, message: "查無此項目" };
    
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    var foundRow = -1;
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        foundRow = i + 2;
        break;
      }
    }
    if (foundRow !== -1) {
      var itemName = "";
      try {
        itemName = sheet.getRange(foundRow, 3).getValue().toString();
      } catch(e) {}
      sheet.deleteRow(foundRow);
      
      // 💡 推播 LINE 採購項目刪除通知
      try {
        var lineSettingsRes = getLineNotifySettings();
        var lineSettings = lineSettingsRes.settings || {};
        if (lineSettings.notifyOnShoppingDelete !== false && itemName) {
          var now = new Date();
          var timeStr = formatAmPmTime(now);
          sendLineNotify({
            altText: "🗑️ 採購清單「" + itemName + "」已移除～",
            titleText: "【採購項目移除】🗑️",
            badgeText: "移除項目",
            badgeBg: "#706B62",
            details: [
              { label: "異動狀態", value: "已自清單移除" },
              { label: "品項名稱", value: itemName },
              { label: "移除時間", value: timeStr }
            ],
            targetUrl: "https://liao0318.github.io/fund.migoscar/"
          });
        }
      } catch(lineErr) {}

      return { success: true, message: "已成功刪除採購項目！" };
    }
    return { success: false, message: "找不到該項目" };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function clearDoneShoppingItems() {
  try {
    var sheet = getShoppingSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: true, count: 0, message: "沒有已買到的項目" };
    
    var values = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    var deletedCount = 0;
    for (var i = values.length - 1; i >= 0; i--) {
      var status = String(values[i][5]);
      if (status === "已買到") {
        sheet.deleteRow(i + 2);
        deletedCount++;
      }
    }
    
    // 💡 推播 LINE 一鍵清空已購通知
    if (deletedCount > 0) {
      try {
        var lineSettingsRes = getLineNotifySettings();
        var lineSettings = lineSettingsRes.settings || {};
        if (lineSettings.notifyOnShoppingDelete !== false) {
          var now = new Date();
          var timeStr = formatAmPmTime(now);
          sendLineNotify({
            altText: "🧹 已清空 " + deletedCount + " 項已購項目！",
            titleText: "【清空已購項目】🧹",
            badgeText: "清空已購",
            badgeBg: "#3A6D8C",
            details: [
              { label: "清理狀態", value: "一鍵清空已完成品項" },
              { label: "清空數量", value: deletedCount + " 項品項" },
              { label: "完成時間", value: timeStr }
            ],
            targetUrl: "https://liao0318.github.io/fund.migoscar/"
          });
        }
      } catch(lineErr) {}
    }

    return { success: true, count: deletedCount, message: "已成功清空 " + deletedCount + " 項已購項目！" };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function saveStoresList(storesArray) {
  try {
    if (typeof storesArray === 'object' && storesArray !== null && !Array.isArray(storesArray)) {
      storesArray = storesArray.stores || storesArray.storesList || storesArray.storesArray;
    }
    var sheet = getStoresSheet();
    sheet.clearContents();
    sheet.getRange(1, 1, 1, 2).setValues([["商店名稱", "備註"]]);
    sheet.getRange("A1:B1").setBackground("#F4F1EA")
                           .setFontColor("#4A4A4A")
                           .setFontWeight("bold")
                           .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    
    if (storesArray && storesArray.length > 0) {
      var rows = [];
      for (var i = 0; i < storesArray.length; i++) {
        var sName = String(storesArray[i]).trim();
        if (sName) {
          rows.push([sName, "常用商店"]);
        }
      }
      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, 2).setValues(rows);
      }
    }
    return { success: true, message: "常用商店清單已更新！" };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}


// ------------------- 情侶代墊與私人借還功能 (Split / Debt) -------------------

// 獲取「代墊明細」工作表
function getSplitSheet() {
  var ss = getDbSpreadsheet();
  if (!ss) {
    throw new Error("未連結任何有效的 Google 試算表。");
  }
  var sheetName = "代墊明細";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName(sheetName);
  }
  return sheet;
}

// 獲取所有代墊借還資料與即時試算總結
function getSplitData() {
  try {
    var sheet = getSplitSheet();
    var lastRow = sheet.getLastRow();
    
    var items = [];
    var liaoOwesZhou = 0; // 廖 欠 周 的總金額 (未結清)
    var zhouOwesLiao = 0; // 周 欠 廖 的總金額 (未結清)
    var unsettledCount = 0;
    var settledCount = 0;
    
    if (lastRow > 1) {
      var values = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
      for (var i = 0; i < values.length; i++) {
        var row = values[i];
        var id = String(row[0] || ("split-" + (i + 1)));
        var time = row[1] ? formatAmPmTime(row[1]) : "";
        var payer = String(row[2] || "").trim(); // 廖 / 周 / 廖尹丞 / 周沛緹
        var splitMode = String(row[3] || "AA平分").trim();
        var itemName = String(row[4] || "").trim();
        var totalAmount = parseFloat(row[5]) || 0;
        var splitResult = String(row[6] || "").trim();
        var status = String(row[7] || "未結清").trim();
        var settledTime = row[8] ? formatAmPmTime(row[8]) : "";
        var note = String(row[9] || "").trim();
        
        // 正規化 payer 名稱
        var payerNorm = (payer.indexOf("周") !== -1) ? "周" : "廖";
        var otherNorm = (payerNorm === "廖") ? "周" : "廖";
        
        // 計算分帳金額
        var debtorAmount = 0;
        if (splitMode === "AA平分") {
          debtorAmount = Math.round(totalAmount / 2);
        } else if (splitMode === "全額代付") {
          debtorAmount = totalAmount;
        } else {
          // 自訂分攤模式
          var amtMatch = splitResult.match(/\d+(\.\d+)?/);
          debtorAmount = amtMatch ? Math.round(parseFloat(amtMatch[0])) : Math.round(totalAmount / 2);
        }
        
        if (status === "未結清") {
          unsettledCount++;
          if (payerNorm === "廖") {
            zhouOwesLiao += debtorAmount;
          } else {
            liaoOwesZhou += debtorAmount;
          }
        } else {
          settledCount++;
        }
        
        items.push({
          id: id,
          rowNumber: i + 2,
          time: time,
          payer: payerNorm,
          splitMode: splitMode,
          itemName: itemName,
          totalAmount: totalAmount,
          splitResult: splitResult || (otherNorm + " 應返還 " + payerNorm + " NT$ " + debtorAmount),
          debtor: otherNorm,
          debtorAmount: debtorAmount,
          status: status,
          settledTime: settledTime,
          note: note
        });
      }
    }
    
    // 計算最終淨債務 (Net Debt)
    var netDebtor = "none";
    var netAmount = 0;
    var summaryText = "目前雙方已結清 💖";
    
    if (liaoOwesZhou > zhouOwesLiao) {
      netDebtor = "廖";
      netAmount = liaoOwesZhou - zhouOwesLiao;
      summaryText = "廖 應返還 周 NT$ " + netAmount.toLocaleString();
    } else if (zhouOwesLiao > liaoOwesZhou) {
      netDebtor = "周";
      netAmount = zhouOwesLiao - liaoOwesZhou;
      summaryText = "周 應返還 廖 NT$ " + netAmount.toLocaleString();
    }
    
    return {
      success: true,
      items: items,
      summary: {
        liaoOwesZhou: liaoOwesZhou,
        zhouOwesLiao: zhouOwesLiao,
        netDebtor: netDebtor,
        netAmount: netAmount,
        summaryText: summaryText,
        unsettledCount: unsettledCount,
        settledCount: settledCount
      }
    };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

// 新增代墊借還紀錄
function addSplitRecord(data, shouldNotify) {
  try {
    var sheet = getSplitSheet();
    var now = new Date();
    var timeStr = formatAmPmTime(data.time || now);
    var id = "split-" + now.getTime();
    
    var payer = String(data.payer || "廖").trim();
    var payerNorm = (payer.indexOf("周") !== -1) ? "周" : "廖";
    var otherNorm = (payerNorm === "廖") ? "周" : "廖";
    
    var splitMode = String(data.splitMode || "AA平分").trim();
    var itemName = String(data.itemName || data.item || "生活代墊").trim();
    var totalAmount = Math.max(0, parseFloat(data.totalAmount || data.amount) || 0);
    var note = String(data.note || "").trim();
    
    var debtorAmount = 0;
    if (splitMode === "AA平分") {
      debtorAmount = Math.round(totalAmount / 2);
    } else if (splitMode === "全額代付") {
      debtorAmount = totalAmount;
    } else if (splitMode === "自訂金額" || splitMode === "自訂分攤") {
      debtorAmount = Math.max(0, parseFloat(data.customOweAmount || data.debtorAmount) || Math.round(totalAmount / 2));
    } else {
      debtorAmount = Math.round(totalAmount / 2);
    }
    
    var splitResult = otherNorm + " 應返還 " + payerNorm + " NT$ " + debtorAmount;
    var status = "未結清";
    var settledTime = "";
    
    var rowData = [
      id,
      timeStr,
      payerNorm === "廖" ? "廖尹丞" : "周沛緹",
      splitMode,
      itemName,
      totalAmount,
      splitResult,
      status,
      settledTime,
      note
    ];
    
    // 插入至第 2 列 (最新在最上方)
    sheet.insertRowBefore(2);
    sheet.getRange(2, 1, 1, rowData.length).setValues([rowData]);
    
    // LINE 推播通知
    if (shouldNotify !== false) {
      try {
        var payerDisplayName = payerNorm === "廖" ? "廖尹丞" : "周沛緹";
        var otherDisplayName = otherNorm === "廖" ? "廖尹丞" : "周沛緹";
        sendLineNotify({
          altText: "💳【代墊記帳】" + payerDisplayName + " 幫忙代付 NT$ " + totalAmount + "（" + itemName + "）",
          titleText: "【情侶代墊記帳成功】💳",
          badgeText: payerDisplayName + " 先墊",
          badgeBg: payerNorm === "廖" ? "#2B825B" : "#8A5A36",
          details: [
            { label: "品項名稱", value: itemName, bold: true },
            { label: "代墊總額", value: "NT$ " + totalAmount.toLocaleString(), bold: true, color: "#C55757" },
            { label: "分帳模式", value: splitMode },
            { label: "分帳結果", value: otherDisplayName + " 需返還 NT$ " + debtorAmount.toLocaleString(), color: "#2B825B", bold: true },
            { label: "記錄時間", value: timeStr }
          ],
          targetUrl: "https://liao0318.github.io/fund.migoscar/split/"
        });
      } catch(lineErr) {}
    }
    
    return { success: true, id: id, message: "代墊紀錄已成功寫入！" };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

// 刪除代墊紀錄
function deleteSplitRecord(id) {
  try {
    var sheet = getSplitSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, message: "查無此代墊紀錄" };
    
    var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < values.length; i++) {
      if (String(values[i][0]) === String(id)) {
        sheet.deleteRow(i + 2);
        return { success: true, message: "已成功刪除代墊紀錄！" };
      }
    }
    return { success: false, message: "未找到對應的代墊紀錄" };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

// 一鍵結清所有未結清代墊款項
function settleAllSplitRecords() {
  try {
    var sheet = getSplitSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: true, settledCount: 0, message: "目前沒有任何代墊紀錄" };
    
    var values = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
    var settledCount = 0;
    var nowStr = formatAmPmTime(new Date());
    
    for (var i = 0; i < values.length; i++) {
      var status = String(values[i][7] || "");
      if (status === "未結清") {
        sheet.getRange(i + 2, 8).setValue("已結清");
        sheet.getRange(i + 2, 9).setValue(nowStr);
        settledCount++;
      }
    }
    
    if (settledCount > 0) {
      try {
        sendLineNotify({
          altText: "✅【伴伴記代墊已全數結清】雙方款項已清帳！",
          titleText: "【代墊借還款項已結清】✅",
          badgeText: "全數結清",
          badgeBg: "#2B825B",
          details: [
            { label: "結清狀態", value: "共結清 " + settledCount + " 筆代墊明細" },
            { label: "目前債務", value: "雙方已結清歸零 💖", color: "#2B825B", bold: true },
            { label: "結清時間", value: nowStr }
          ],
          targetUrl: "https://liao0318.github.io/fund.migoscar/split/"
        });
      } catch(lineErr) {}
    }
    
    return { success: true, settledCount: settledCount, message: "已成功結清 " + settledCount + " 筆代墊明細！" };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

// ------------------- 旅遊分帳與出國專案功能 (Travel Split & Expense) -------------------

// 獲取「旅遊行程」工作表
function getTravelSheet() {
  var ss = getDbSpreadsheet();
  if (!ss) {
    throw new Error("未連結任何有效的 Google 試算表。");
  }
  var sheetName = "旅遊行程";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName(sheetName);
  }
  return sheet;
}

// 獲取「旅遊支出明細」工作表
function getTravelExpenseSheet() {
  var ss = getDbSpreadsheet();
  if (!ss) {
    throw new Error("未連結任何有效的 Google 試算表。");
  }
  var sheetName = "旅遊支出明細";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName(sheetName);
  }
  return sheet;
}

// 獲取「旅遊心願清單」工作表
function getTravelWishlistSheet() {
  var ss = getDbSpreadsheet();
  if (!ss) {
    throw new Error("未連結任何有效的 Google 試算表。");
  }
  var sheetName = "旅遊心願清單";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName(sheetName);
  }
  return sheet;
}

// 輔助函式：將日期格式化為 YYYY-MM-DD
function formatDateForSheet(d) {
  if (!d) return "";
  if (d instanceof Date) {
    return Utilities.formatDate(d, "GMT+8", "yyyy-MM-dd");
  }
  var str = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  try {
    var parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return Utilities.formatDate(parsed, "GMT+8", "yyyy-MM-dd");
    }
  } catch(e) {}
  return str;
}

// 獲取所有旅遊行程、支出明細與心願清單
function getTravelData() {
  try {
    var tripSheet = getTravelSheet();
    var expSheet = getTravelExpenseSheet();
    var wishSheet = getTravelWishlistSheet();

    // 1. 讀取旅遊行程
    var trips = [];
    var tripLastRow = tripSheet.getLastRow();
    if (tripLastRow > 1) {
      var tripValues = tripSheet.getRange(2, 1, tripLastRow - 1, 13).getValues();
      for (var i = 0; i < tripValues.length; i++) {
        var row = tripValues[i];
        var id = String(row[0] || "").trim();
        if (!id) continue;
        var title = String(row[1] || "").trim();
        var destination = String(row[2] || "").trim();
        var coverEmoji = String(row[3] || "✈️").trim();
        var startDate = row[4] ? formatDateForSheet(row[4]) : "";
        var endDate = row[5] ? formatDateForSheet(row[5]) : "";
        var currency = String(row[6] || "JPY").trim();
        var exchangeRate = parseFloat(row[7]) || 0.215;
        var budgetTWD = row[8] !== "" && row[8] !== null && !isNaN(parseFloat(row[8])) ? parseFloat(row[8]) : undefined;
        var status = String(row[9] || "進行中").trim();
        var themeColor = String(row[10] || "rose").trim();
        var membersRaw = String(row[11] || "").trim();
        var members = ["廖", "周"];
        if (membersRaw) {
          try {
            if (membersRaw.startsWith("[") && membersRaw.endsWith("]")) {
              members = JSON.parse(membersRaw);
            } else {
              members = membersRaw.split(/[,，、]/).map(function(m) { return m.trim(); }).filter(Boolean);
            }
          } catch(e) {
            members = ["廖", "周"];
          }
        }
        var createdAt = row[12] ? formatDateForSheet(row[12]) : "";

        trips.push({
          id: id,
          title: title,
          destination: destination,
          coverEmoji: coverEmoji,
          startDate: startDate,
          endDate: endDate,
          currency: currency,
          exchangeRate: exchangeRate,
          budgetTWD: budgetTWD,
          status: status,
          themeColor: themeColor,
          members: members,
          createdAt: createdAt
        });
      }
    }

    // 2. 讀取旅遊支出明細
    var expenses = [];
    var expLastRow = expSheet.getLastRow();
    if (expLastRow > 1) {
      var expValues = expSheet.getRange(2, 1, expLastRow - 1, 19).getValues();
      for (var j = 0; j < expValues.length; j++) {
        var eRow = expValues[j];
        var eId = String(eRow[0] || "").trim();
        if (!eId) continue;
        var tripId = String(eRow[1] || "").trim();
        var date = eRow[2] ? formatDateForSheet(eRow[2]) : "";
        var category = String(eRow[3] || "其他雜支").trim();
        var itemName = String(eRow[4] || "").trim();
        var payer = String(eRow[5] || "廖").trim();
        var originalCurrency = String(eRow[6] || "JPY").trim();
        var originalAmount = parseFloat(eRow[7]) || 0;
        var exchangeRate = parseFloat(eRow[8]) || 1;
        var totalAmountTWD = parseFloat(eRow[9]) || 0;
        var splitMode = String(eRow[10] || "全體AA").trim();
        
        var participantsRaw = String(eRow[11] || "").trim();
        var participants = [];
        if (participantsRaw) {
          try {
            if (participantsRaw.startsWith("[")) {
              participants = JSON.parse(participantsRaw);
            } else {
              participants = participantsRaw.split(/[,，、]/).map(function(p) { return p.trim(); }).filter(Boolean);
            }
          } catch(e) {}
        }

        var memberSplitsRaw = String(eRow[12] || "").trim();
        var memberSplits = undefined;
        if (memberSplitsRaw) {
          try {
            if (memberSplitsRaw.startsWith("{")) {
              memberSplits = JSON.parse(memberSplitsRaw);
            }
          } catch(e) {}
        }

        var debtor = String(eRow[13] || "").trim();
        var debtorAmountTWD = parseFloat(eRow[14]) || 0;
        var location = String(eRow[15] || "").trim();
        var note = String(eRow[16] || "").trim();
        var syncedToSplit = (eRow[17] === true || String(eRow[17]).toUpperCase() === "TRUE");
        var createdAt = eRow[18] ? formatDateForSheet(eRow[18]) : "";

        expenses.push({
          id: eId,
          tripId: tripId,
          date: date,
          category: category,
          itemName: itemName,
          payer: payer,
          originalCurrency: originalCurrency,
          originalAmount: originalAmount,
          exchangeRate: exchangeRate,
          totalAmountTWD: totalAmountTWD,
          splitMode: splitMode,
          participants: participants,
          memberSplits: memberSplits,
          debtor: debtor,
          debtorAmountTWD: debtorAmountTWD,
          location: location,
          note: note,
          syncedToSplit: syncedToSplit,
          createdAt: createdAt
        });
      }
    }

    // 3. 讀取旅遊心願清單
    var wishlist = [];
    var wishLastRow = wishSheet.getLastRow();
    if (wishLastRow > 1) {
      var wishValues = wishSheet.getRange(2, 1, wishLastRow - 1, 8).getValues();
      for (var k = 0; k < wishValues.length; k++) {
        var wRow = wishValues[k];
        var wId = String(wRow[0] || "").trim();
        if (!wId) continue;
        var wTripId = String(wRow[1] || "").trim();
        var wItemName = String(wRow[2] || "").trim();
        var wCategory = String(wRow[3] || "美食餐廳").trim();
        var estimatedAmountTWD = wRow[4] !== "" && wRow[4] !== null && !isNaN(parseFloat(wRow[4])) ? parseFloat(wRow[4]) : undefined;
        var addedBy = String(wRow[5] || "廖").trim();
        var status = String(wRow[6] || "待預訂").trim();
        var note = String(wRow[7] || "").trim();

        wishlist.push({
          id: wId,
          tripId: wTripId,
          itemName: wItemName,
          category: wCategory,
          estimatedAmountTWD: estimatedAmountTWD,
          addedBy: addedBy,
          status: status,
          note: note
        });
      }
    }

    return {
      success: true,
      trips: trips,
      expenses: expenses,
      wishlist: wishlist
    };
  } catch(e) {
    return { success: false, message: "讀取旅遊分帳資料失敗：" + e.toString(), trips: [], expenses: [], wishlist: [] };
  }
}

// 儲存或更新旅遊行程
function saveTravelTrip(data) {
  try {
    var sheet = getTravelSheet();
    var id = String(data.id || ("trip-" + Date.now())).trim();
    var title = String(data.title || "東京自由行").trim();
    var destination = String(data.destination || "自由行").trim();
    var coverEmoji = String(data.coverEmoji || "✈️").trim();
    var startDate = formatDateForSheet(data.startDate || new Date());
    var endDate = formatDateForSheet(data.endDate || data.startDate || new Date());
    var currency = String(data.currency || "JPY").trim();
    var exchangeRate = parseFloat(data.exchangeRate) || 0.215;
    var budgetTWD = data.budgetTWD !== undefined && data.budgetTWD !== null && !isNaN(parseFloat(data.budgetTWD)) ? parseFloat(data.budgetTWD) : "";
    var status = String(data.status || "進行中").trim();
    var themeColor = String(data.themeColor || "rose").trim();
    var members = Array.isArray(data.members) ? JSON.stringify(data.members) : String(data.members || "[\"廖\",\"周\"]");
    var createdAt = formatDateForSheet(data.createdAt || new Date());

    var rowData = [
      id,
      title,
      destination,
      coverEmoji,
      startDate,
      endDate,
      currency,
      exchangeRate,
      budgetTWD,
      status,
      themeColor,
      members,
      createdAt
    ];

    var lastRow = sheet.getLastRow();
    var foundRow = -1;
    if (lastRow > 1) {
      var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]).trim() === id) {
          foundRow = i + 2;
          break;
        }
      }
    }

    if (foundRow > 0) {
      sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }

    return { success: true, message: "行程資料已成功同步儲存！", id: id };
  } catch(e) {
    return { success: false, message: "儲存行程失敗：" + e.toString() };
  }
}

// 刪除旅遊行程 (連帶刪除關聯支出與心願)
function deleteTravelTrip(id) {
  try {
    var tripSheet = getTravelSheet();
    var expSheet = getTravelExpenseSheet();
    var wishSheet = getTravelWishlistSheet();
    var targetId = String(id || "").trim();
    if (!targetId) return { success: false, message: "請指定要刪除的行程 ID" };

    // 1. 刪除行程列
    var tripLastRow = tripSheet.getLastRow();
    if (tripLastRow > 1) {
      var tripIds = tripSheet.getRange(2, 1, tripLastRow - 1, 1).getValues();
      for (var i = tripIds.length - 1; i >= 0; i--) {
        if (String(tripIds[i][0]).trim() === targetId) {
          tripSheet.deleteRow(i + 2);
        }
      }
    }

    // 2. 刪除該行程對應之所有支出列
    var expLastRow = expSheet.getLastRow();
    if (expLastRow > 1) {
      var expTripIds = expSheet.getRange(2, 2, expLastRow - 1, 1).getValues();
      for (var j = expTripIds.length - 1; j >= 0; j--) {
        if (String(expTripIds[j][0]).trim() === targetId) {
          expSheet.deleteRow(j + 2);
        }
      }
    }

    // 3. 刪除該行程對應之所有心願列
    var wishLastRow = wishSheet.getLastRow();
    if (wishLastRow > 1) {
      var wishTripIds = wishSheet.getRange(2, 2, wishLastRow - 1, 1).getValues();
      for (var k = wishTripIds.length - 1; k >= 0; k--) {
        if (String(wishTripIds[k][0]).trim() === targetId) {
          wishSheet.deleteRow(k + 2);
        }
      }
    }

    return { success: true, message: "已成功刪除行程及關聯支出資料！" };
  } catch(e) {
    return { success: false, message: "刪除行程失敗：" + e.toString() };
  }
}

// 新增或更新旅遊支出
function addTravelExpense(data) {
  try {
    var sheet = getTravelExpenseSheet();
    var id = String(data.id || ("exp-" + Date.now())).trim();
    var tripId = String(data.tripId || "").trim();
    var date = formatDateForSheet(data.date || new Date());
    var category = String(data.category || "其他雜支").trim();
    var itemName = String(data.itemName || "旅費支出").trim();
    var payer = String(data.payer || "廖").trim();
    var originalCurrency = String(data.originalCurrency || "JPY").trim();
    var originalAmount = parseFloat(data.originalAmount) || 0;
    var exchangeRate = parseFloat(data.exchangeRate) || 1;
    var totalAmountTWD = parseFloat(data.totalAmountTWD) || 0;
    var splitMode = String(data.splitMode || "全體AA").trim();
    var participants = Array.isArray(data.participants) ? JSON.stringify(data.participants) : String(data.participants || "");
    var memberSplits = data.memberSplits && typeof data.memberSplits === 'object' ? JSON.stringify(data.memberSplits) : String(data.memberSplits || "");
    var debtor = String(data.debtor || "").trim();
    var debtorAmountTWD = parseFloat(data.debtorAmountTWD) || 0;
    var location = String(data.location || "").trim();
    var note = String(data.note || "").trim();
    var syncedToSplit = (data.syncedToSplit === true || String(data.syncedToSplit).toUpperCase() === "TRUE") ? "TRUE" : "FALSE";
    var createdAt = formatDateForSheet(data.createdAt || new Date());

    var rowData = [
      id,
      tripId,
      date,
      category,
      itemName,
      payer,
      originalCurrency,
      originalAmount,
      exchangeRate,
      totalAmountTWD,
      splitMode,
      participants,
      memberSplits,
      debtor,
      debtorAmountTWD,
      location,
      note,
      syncedToSplit,
      createdAt
    ];

    var lastRow = sheet.getLastRow();
    var foundRow = -1;
    if (lastRow > 1) {
      var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]).trim() === id) {
          foundRow = i + 2;
          break;
        }
      }
    }

    if (foundRow > 0) {
      sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.insertRowBefore(2);
      sheet.getRange(2, 1, 1, rowData.length).setValues([rowData]);
    }

    return { success: true, message: "已成功記錄旅遊支出！", id: id };
  } catch(e) {
    return { success: false, message: "記錄旅遊支出失敗：" + e.toString() };
  }
}

// 批次新增多筆旅遊支出 (支援 Excel 匯入與整張收據連記)
function addBatchTravelExpenses(data) {
  try {
    var sheet = getTravelExpenseSheet();
    var items = Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []);
    if (!items || items.length === 0) {
      return { success: false, message: "未提供任何支出資料" };
    }

    var rowsToAdd = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var id = String(it.id || ("exp-" + Date.now() + "-" + i)).trim();
      var tripId = String(it.tripId || "").trim();
      var date = formatDateForSheet(it.date || new Date());
      var category = String(it.category || "其他雜支").trim();
      var itemName = String(it.itemName || "旅費支出").trim();
      var payer = String(it.payer || "廖").trim();
      var originalCurrency = String(it.originalCurrency || "KRW").trim();
      var originalAmount = parseFloat(it.originalAmount) || 0;
      var exchangeRate = parseFloat(it.exchangeRate) || 1;
      var totalAmountTWD = parseFloat(it.totalAmountTWD) || 0;
      var splitMode = String(it.splitMode || "全體AA").trim();
      var participants = Array.isArray(it.participants) ? JSON.stringify(it.participants) : String(it.participants || "");
      var memberSplits = it.memberSplits && typeof it.memberSplits === 'object' ? JSON.stringify(it.memberSplits) : String(it.memberSplits || "");
      var debtor = String(it.debtor || "").trim();
      var debtorAmountTWD = parseFloat(it.debtorAmountTWD) || 0;
      var location = String(it.location || "").trim();
      var note = String(it.note || "").trim();
      var syncedToSplit = (it.syncedToSplit === true || String(it.syncedToSplit).toUpperCase() === "TRUE") ? "TRUE" : "FALSE";
      var createdAt = formatDateForSheet(it.createdAt || new Date());

      rowsToAdd.push([
        id,
        tripId,
        date,
        category,
        itemName,
        payer,
        originalCurrency,
        originalAmount,
        exchangeRate,
        totalAmountTWD,
        splitMode,
        participants,
        memberSplits,
        debtor,
        debtorAmountTWD,
        location,
        note,
        syncedToSplit,
        createdAt
      ]);
    }

    if (rowsToAdd.length > 0) {
      // 依序插入到開頭第 2 列
      sheet.insertRowsBefore(2, rowsToAdd.length);
      sheet.getRange(2, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);
    }

    return { success: true, message: "已成功批次寫入 " + rowsToAdd.length + " 筆旅遊支出！", count: rowsToAdd.length };
  } catch(e) {
    return { success: false, message: "批次記錄旅遊支出失敗：" + e.toString() };
  }
}

// 刪除旅遊支出
function deleteTravelExpense(id) {
  try {
    var sheet = getTravelExpenseSheet();
    var targetId = String(id || "").trim();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, message: "查無此支出紀錄" };

    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === targetId) {
        sheet.deleteRow(i + 2);
        return { success: true, message: "已成功刪除旅遊支出！" };
      }
    }
    return { success: false, message: "未找到對應的旅遊支出" };
  } catch(e) {
    return { success: false, message: "刪除旅遊支出失敗：" + e.toString() };
  }
}

// 新增或更新心願項目
function addTravelWishItem(data) {
  try {
    var sheet = getTravelWishlistSheet();
    var id = String(data.id || ("wish-" + Date.now())).trim();
    var tripId = String(data.tripId || "").trim();
    var itemName = String(data.itemName || "心願項目").trim();
    var category = String(data.category || "美食餐廳").trim();
    var estimatedAmountTWD = data.estimatedAmountTWD !== undefined && data.estimatedAmountTWD !== null && !isNaN(parseFloat(data.estimatedAmountTWD)) ? parseFloat(data.estimatedAmountTWD) : "";
    var addedBy = String(data.addedBy || "廖").trim();
    var status = String(data.status || "待預訂").trim();
    var note = String(data.note || "").trim();

    var rowData = [
      id,
      tripId,
      itemName,
      category,
      estimatedAmountTWD,
      addedBy,
      status,
      note
    ];

    var lastRow = sheet.getLastRow();
    var foundRow = -1;
    if (lastRow > 1) {
      var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]).trim() === id) {
          foundRow = i + 2;
          break;
        }
      }
    }

    if (foundRow > 0) {
      sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.insertRowBefore(2);
      sheet.getRange(2, 1, 1, rowData.length).setValues([rowData]);
    }

    return { success: true, message: "已成功記錄心願項目！", id: id };
  } catch(e) {
    return { success: false, message: "記錄心願項目失敗：" + e.toString() };
  }
}

// 更新心願狀態
function toggleTravelWishStatus(data) {
  try {
    var sheet = getTravelWishlistSheet();
    var targetId = String(data.id || "").trim();
    var nextStatus = String(data.status || "已完成").trim();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, message: "查無心願項目" };

    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === targetId) {
        sheet.getRange(i + 2, 7).setValue(nextStatus);
        return { success: true, message: "心願狀態已更新為「" + nextStatus + "」！" };
      }
    }
    return { success: false, message: "未找到對應心願項目" };
  } catch(e) {
    return { success: false, message: "更新心願狀態失敗：" + e.toString() };
  }
}

// 刪除心願項目
function deleteTravelWishItem(id) {
  try {
    var sheet = getTravelWishlistSheet();
    var targetId = String(id || "").trim();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: false, message: "查無此心願紀錄" };

    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === targetId) {
        sheet.deleteRow(i + 2);
        return { success: true, message: "已成功刪除心願項目！" };
      }
    }
    return { success: false, message: "未找到對應的心願項目" };
  } catch(e) {
    return { success: false, message: "刪除心願項目失敗：" + e.toString() };
  }
}

// ------------------- TELEGRAM WEBHOOK & HTTP API (doPost) 處理 -------------------

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = null;
    try {
      data = JSON.parse(e.postData.contents);
    } catch(parseErr) {
      return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. 如果前端以 HTTP POST 呼叫 API action
    if (data && data.action) {
      var result = { success: false, message: "未知操作" };
      if (data.action === "getDashboardData") result = getDashboardData();
      else if (data.action === "addRecord") result = addRecord(data);
      else if (data.action === "updateRecordByRow") result = updateRecordByRow(data);
      else if (data.action === "deleteRecordByRow") result = deleteRecordByRow(data.rowId || data.id);
      else if (data.action === "setMonthReconciled") result = setMonthReconciled(data.month, data.isReconciled);
      else if (data.action === "getShoppingData") result = getShoppingData();
      else if (data.action === "addShoppingItem") result = addShoppingItem(data);
      else if (data.action === "updateShoppingItem") result = updateShoppingItem(data);
      else if (data.action === "toggleShoppingItemStatus") result = toggleShoppingItemStatus(data.id, data.status || data.newStatus);
      else if (data.action === "deleteShoppingItem") result = deleteShoppingItem(data.id);
      else if (data.action === "clearDoneShoppingItems") result = clearDoneShoppingItems();
      else if (data.action === "saveStoresList") result = saveStoresList(data.stores || data);
      else if (data.action === "saveSpreadsheetId") result = saveSpreadsheetId(data.spreadsheetId || data.url || data);
      else if (data.action === "getSpreadsheetConfig") result = getSpreadsheetConfig();
      else if (data.action === "getLineNotifySettings" || data.action === "getTelegramNotifySettings") result = getLineNotifySettings();
      else if (data.action === "saveLineNotifySettings" || data.action === "saveTelegramNotifySettings") result = saveLineNotifySettings(data.settings || data);
      else if (data.action === "getLineNotifyToken" || data.action === "getTelegramCredentials") result = getTelegramCredentials();
      else if (data.action === "saveLineNotifyToken" || data.action === "saveTelegramCredentials") result = saveTelegramCredentials(data);
      else if (data.action === "testLineNotify" || data.action === "testTelegramNotify") result = testTelegramNotify(data.token, data.chatId);
      else if (data.action === "getSplitData") result = getSplitData();
      else if (data.action === "addSplitRecord") result = addSplitRecord(data);
      else if (data.action === "deleteSplitRecord") result = deleteSplitRecord(data.id || data.splitId);
      else if (data.action === "settleAllSplitRecords") result = settleAllSplitRecords();
      else if (data.action === "getTravelData") result = getTravelData();
      else if (data.action === "saveTravelTrip" || data.action === "addTravelPlan" || data.action === "updateTravelPlan") result = saveTravelTrip(data);
      else if (data.action === "deleteTravelTrip" || data.action === "deleteTravelPlan") result = deleteTravelTrip(data.id || data.tripId);
      else if (data.action === "addTravelExpense" || data.action === "saveTravelExpense") result = addTravelExpense(data);
      else if (data.action === "addBatchTravelExpenses" || data.action === "saveBatchTravelExpenses") result = addBatchTravelExpenses(data);
      else if (data.action === "deleteTravelExpense") result = deleteTravelExpense(data.id || data.expId);
      else if (data.action === "addTravelWishItem" || data.action === "saveTravelWishItem") result = addTravelWishItem(data);
      else if (data.action === "toggleTravelWishStatus") result = toggleTravelWishStatus(data);
      else if (data.action === "deleteTravelWishItem") result = deleteTravelWishItem(data.id || data.wishId);

      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. Telegram Webhook 訊息處理 (支援群組或私訊發送指令記帳)
    if (data.message && data.message.text) {
      var userText = data.message.text.trim();
      var incomingChatId = String(data.message.chat.id);
      handleTelegramBotMessage(userText, incomingChatId);
      return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    console.error("doPost error: " + err.toString());
    return ContentService.createTextOutput(JSON.stringify({ status: "ok", error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 輔助函式：解析 Telegram 輸入的彈性日期格式 (如 8/12, 8-12, 8月12日, 2026-08-12, 昨天, 今天)
function parseTelegramCommandDate(dateStr) {
  var now = new Date();
  var timezone = "GMT+8";
  var curYear = parseInt(Utilities.formatDate(now, timezone, "yyyy"), 10);
  
  if (!dateStr || !dateStr.trim()) {
    return Utilities.formatDate(now, timezone, "yyyy-MM-dd");
  }
  
  var clean = dateStr.trim();
  if (clean === "今天" || clean === "今日") {
    return Utilities.formatDate(now, timezone, "yyyy-MM-dd");
  }
  if (clean === "昨天" || clean === "昨日") {
    var d = new Date(now.getTime() - 86400000);
    return Utilities.formatDate(d, timezone, "yyyy-MM-dd");
  }
  if (clean === "前天") {
    var d2 = new Date(now.getTime() - 172800000);
    return Utilities.formatDate(d2, timezone, "yyyy-MM-dd");
  }
  
  // YYYY-MM-DD or YYYY/MM/DD
  var matchFull = clean.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (matchFull) {
    var y = matchFull[1];
    var m = ("0" + matchFull[2]).slice(-2);
    var d = ("0" + matchFull[3]).slice(-2);
    return y + "-" + m + "-" + d;
  }
  
  // MM/DD or M/D or MM-DD or M-D (可帶「日」、「號」、「前」)
  var matchMD = clean.match(/^(\d{1,2})[\/-](\d{1,2})(?:日|號|前)?$/);
  if (matchMD) {
    var m = ("0" + matchMD[1]).slice(-2);
    var d = ("0" + matchMD[2]).slice(-2);
    return curYear + "-" + m + "-" + d;
  }
  
  // M月D日 or M月D
  var matchChineseMD = clean.match(/^(\d{1,2})月(\d{1,2})(?:日|號)?$/);
  if (matchChineseMD) {
    var m = ("0" + matchChineseMD[1]).slice(-2);
    var d = ("0" + matchChineseMD[2]).slice(-2);
    return curYear + "-" + m + "-" + d;
  }
  
  return Utilities.formatDate(now, timezone, "yyyy-MM-dd");
}

function handleTelegramBotMessage(text, chatId) {
  if (!text || !chatId) return;
  var cleanText = text.trim();
  
  // 1. 指令說明 / 幫助懶人包
  if (/^(說明|指令|幫助|功能|選單|help|\?|？|\/start|\/help)$/i.test(cleanText)) {
    var helpMsg = "🤖<b>【伴伴記・Telegram 智能指令】</b>\n\n" +
      "📌<b>【查詢功能】</b>\n" +
      "• 輸入「<code>查帳</code>」或「<code>公積金</code>」：查看本月收支與餘額\n" +
      "• 輸入「<code>購物清單</code>」或「<code>買什麼</code>」：查看待採購項目\n\n" +
      "💰<b>【支出記帳 / 代墊】</b>\n" +
      "• 格式：[出資人] [金額] [品項] (選填日期)\n" +
      "  範例：\n" +
      "  <code>廖 20 便當</code> （廖尹丞代墊，今天）\n" +
      "  <code>廖 20 糖果 8/12</code> （廖尹丞代墊，8/12）\n" +
      "  <code>周 150 飲料</code> （周沛緹代墊，今天）\n" +
      "  <code>公積金 500 衛生紙</code> （公積金支出）\n\n" +
      "📥<b>【收入 / 存入公積金】</b>\n" +
      "• 格式：存入 [金額] 公積金 (選填日期)\n" +
      "  範例：\n" +
      "  <code>存入 20000 公積金</code> （今天存入）\n" +
      "  <code>廖 存入 10000 公積金</code> （由廖尹丞存入）\n\n" +
      "🛒<b>【快速新增採購清單】</b>\n" +
      "• 1. 品項-地點 期限 (需要買)\n" +
      "  範例：<code>1. 高麗菜-菜市場 8/13前</code>\n" +
      "• 2. 品項-地點 期限 (想要買)\n" +
      "  範例：<code>2. 雞塊-全聯 8/15前</code>\n\n" +
      "🔗 <a href=\"https://liao0318.github.io/fund.migoscar/\">點我開啟伴伴記全螢幕網頁</a>";
    sendTelegramMessage(helpMsg, chatId);
    return;
  }

  // 2. 查詢公積金與帳本餘額
  if (cleanText === "查帳" || cleanText === "公積金" || cleanText === "餘額" || cleanText === "帳本" || cleanText === "對帳" || cleanText === "本月" || cleanText === "/status") {
    try {
      var dashRes = getDashboardData();
      var summary = dashRes.summary || {};
      var now = new Date();
      var curMonth = Utilities.formatDate(now, "GMT+8", "yyyy-MM");
      
      var fundBalance = Math.round(summary.fundBalance || 0);
      var currentBalance = Math.round(summary.currentBalance || 0);
      var totalLiao = Math.round(summary.totalLiaoAdv || 0);
      var totalChou = Math.round(summary.totalChouAdv || 0);

      var statusText = "";
      if (currentBalance > 0) {
        statusText = "✅ 沛緹 應向 尹丞 撥款 NT$ " + currentBalance.toLocaleString();
      } else if (currentBalance < 0) {
        statusText = "✅ 尹丞 應向 沛緹 撥款 NT$ " + Math.abs(currentBalance).toLocaleString();
      } else {
        statusText = "🎉 目前雙方收支已完全平帳！";
      }

      sendTelegramMessage({
        altText: "📊【伴伴記・本月帳務總覽】",
        titleText: "【帳本總覽・" + curMonth + "】📊",
        badgeText: "即時結算",
        badgeBg: "#4A7C59",
        details: [
          { label: "公積金餘額", value: "NT$ " + fundBalance.toLocaleString(), bold: true },
          { label: "廖尹丞 代墊", value: "NT$ " + totalLiao.toLocaleString() },
          { label: "周沛緹 代墊", value: "NT$ " + totalChou.toLocaleString() },
          { label: "結算狀態", value: statusText, bold: true }
        ],
        targetUrl: "https://liao0318.github.io/fund.migoscar/"
      }, chatId);
      return;
    } catch(e) {
      sendTelegramMessage("⚠️ 查詢帳務失敗：" + e.toString(), chatId);
      return;
    }
  }

  // 3. 查詢待買清單
  if (cleanText === "購物清單" || cleanText === "清單" || cleanText === "買什麼" || cleanText === "購物" || cleanText === "待買" || cleanText === "/shopping") {
    var dataRes = getShoppingData();
    var pending = (dataRes && dataRes.items) ? dataRes.items.filter(function(x) { return x.status === "待購買"; }) : [];
    
    if (pending.length === 0) {
      sendTelegramMessage("🛒<b>【伴伴記・購物清單】</b>\n尚無待採購項目！🎉\n\n💡 輸入範例新增：\n<code>1. 高麗菜-菜市場 8/13前</code> (需要買)\n<code>2. 雞塊-全聯 8/15前</code> (想要買)", chatId);
      return;
    }
    
    var needs = [];
    var wants = [];
    for (var i = 0; i < pending.length; i++) {
      var item = pending[i];
      var str = "• <b>" + escapeHtml(item.item) + "</b> (📍" + escapeHtml(item.store || "隨意") + " / ⏰" + escapeHtml(item.deadline || "無期限") + ")";
      if (item.category === "需要買") {
        needs.push(str);
      } else {
        wants.push(str);
      }
    }
    
    var outLines = ["🛒<b>【伴伴記・待採購清單】</b>\n"];
    if (needs.length > 0) {
      outLines.push("🔴<b>【需要買】：</b>");
      outLines.push(needs.join("\n"));
      outLines.push("");
    }
    if (wants.length > 0) {
      outLines.push("🟡<b>【想要買 (觀望)】：</b>");
      outLines.push(wants.join("\n"));
      outLines.push("");
    }
    outLines.push("━━━━━━━━━━━━━━━━━━");
    outLines.push("🔗 <a href=\"https://liao0318.github.io/fund.migoscar/\">點我開啟網頁版全螢幕管理</a>");
    
    sendTelegramMessage(outLines.join("\n"), chatId);
    return;
  }
  
  // 4. 收入 / 存入公積金 指令解析：
  var incomeMatch = cleanText.match(/^(?:(廖|尹丞|周|沛緹|公積金|公費)\s+)?(?:存入|存|入帳|收入|公積金存入|公費存入)\s*([0-9\.]+)\s*(?:元|NT|NTD)?\s*(.*)$/i)
    || cleanText.match(/^(?:存入|存|入帳|收入|公積金存入|公費存入)\s*([0-9\.]+)\s*(?:元|NT|NTD)?\s*(.*)$/i);
    
  if (incomeMatch) {
    var payerKey = incomeMatch[1];
    var amt = parseFloat(incomeMatch[2]) || 0;
    var rest = incomeMatch[3] ? incomeMatch[3].trim() : "";
    
    var payerName = "共同帳戶";
    if (payerKey === "廖" || payerKey === "尹丞") payerName = "廖尹丞";
    else if (payerKey === "周" || payerKey === "沛緹") payerName = "周沛緹";
    
    var itemTitle = "固定公積金存入";
    var dateStr = "";
    
    if (rest) {
      var tokens = rest.split(/[\s，,]+/);
      var nonDateTokens = [];
      for (var tIdx = 0; tIdx < tokens.length; tIdx++) {
        var t = tokens[tIdx];
        if (!dateStr && (/^\d{1,2}[\/-]\d{1,2}/.test(t) || /^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}/.test(t) || /\d{1,2}月\d{1,2}/.test(t) || t === "今天" || t === "昨天" || t === "前天")) {
          dateStr = t;
        } else {
          nonDateTokens.push(t);
        }
      }
      var cleanRest = nonDateTokens.filter(function(t) { return t !== "公積金" && t !== "公費"; }).join(" ").trim();
      if (cleanRest) {
        itemTitle = cleanRest;
      }
    }
    
    var recordDate = parseTelegramCommandDate(dateStr);
    
    if (amt > 0) {
      var addIncRes = addRecord({
        date: recordDate,
        item: itemTitle,
        amount: amt,
        payer: payerName,
        type: "收入-固定公積金"
      });
      
      if (addIncRes && addIncRes.success) {
        sendTelegramMessage({
          altText: "💰 已為您存入公積金 NT$ " + amt.toLocaleString() + "（" + recordDate + "）",
          titleText: "【公積金存入成功】📥",
          badgeText: "公積金存入",
          badgeBg: "#3A6D8C",
          details: [
            { label: "項目名稱", value: itemTitle, bold: true },
            { label: "存入金額", value: "NT$ " + amt.toLocaleString(), bold: true },
            { label: "存入對象/來源", value: payerName },
            { label: "記帳日期", value: recordDate },
            { label: "記錄時間", value: formatAmPmTime(new Date()) }
          ],
          targetUrl: "https://liao0318.github.io/fund.migoscar/"
        }, chatId);
      } else {
        sendTelegramMessage("⚠️ 存入公積金失敗：" + (addIncRes ? addIncRes.message : "連線異常"), chatId);
      }
      return;
    }
  }

  // 5. 支出代墊指令解析：
  var expenseMatch = cleanText.match(/^(廖|尹丞|周|沛緹|公積金|公費|記帳|支出)\s+([0-9\.]+)\s*(?:元|NT|NTD)?\s*(.*)$/i);
  if (expenseMatch) {
    var payerKey = expenseMatch[1];
    var amt = parseFloat(expenseMatch[2]) || 0;
    var rest = expenseMatch[3] ? expenseMatch[3].trim() : "";
    
    var payerName = "廖尹丞";
    var expType = "支出-日常代墊";
    
    if (payerKey === "周" || payerKey === "沛緹") {
      payerName = "周沛緹";
      expType = "支出-日常代墊";
    } else if (payerKey === "公積金" || payerKey === "公費") {
      payerName = "公積金";
      expType = "支出-日常代墊";
    } else {
      payerName = "廖尹丞";
      expType = "支出-日常代墊";
    }
    
    var itemTitle = rest || "日常支出";
    var dateStr = "";
    
    if (rest) {
      var tokens = rest.split(/[\s，,]+/);
      if (tokens.length > 1) {
        var lastToken = tokens[tokens.length - 1];
        if (/^\d{1,2}[\/-]\d{1,2}/.test(lastToken) || /^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}/.test(lastToken) || /\d{1,2}月\d{1,2}/.test(lastToken) || lastToken === "今天" || lastToken === "昨天" || lastToken === "前天") {
          dateStr = lastToken;
          itemTitle = tokens.slice(0, -1).join(" ").trim() || "日常支出";
        }
      } else if (/^\d{1,2}[\/-]\d{1,2}/.test(rest) || /^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}/.test(rest) || /\d{1,2}月\d{1,2}/.test(rest) || rest === "今天" || rest === "昨天" || rest === "前天") {
        dateStr = rest;
        itemTitle = "日常支出";
      }
    }
    
    var recordDate = parseTelegramCommandDate(dateStr);
    
    if (amt > 0) {
      var addRecRes = addRecord({
        date: recordDate,
        item: itemTitle,
        amount: amt,
        payer: payerName,
        type: expType
      });
      
      if (addRecRes && addRecRes.success) {
        sendTelegramMessage({
          altText: "💰 已為您同步記帳 NT$ " + amt.toLocaleString() + "（" + itemTitle + "）",
          titleText: "【Telegram 記帳成功】💰",
          badgeText: payerName + " 代墊",
          badgeBg: payerName === "廖尹丞" ? "#2B825B" : (payerName === "周沛緹" ? "#8A5A36" : "#4A7C59"),
          details: [
            { label: "品項名稱", value: itemTitle, bold: true },
            { label: "支出金額", value: "NT$ " + amt.toLocaleString(), bold: true },
            { label: "出資代墊", value: payerName },
            { label: "記帳日期", value: recordDate },
            { label: "記錄時間", value: formatAmPmTime(new Date()) }
          ],
          targetUrl: "https://liao0318.github.io/fund.migoscar/"
        }, chatId);
      } else {
        sendTelegramMessage("⚠️ 記帳寫入失敗：" + (addRecRes ? addRecRes.message : "連線異常"), chatId);
      }
      return;
    }
  }

  // 6. 購物清單指令解析新增：
  var category = "";
  var content = cleanText;
  
  if (/^(1[\.,\s]|需要買|需要)/.test(cleanText)) {
    category = "需要買";
    content = cleanText.replace(/^(1[\.,\s]|需要買|需要)\s*/, "").trim();
  } else if (/^(2[\.,\s]|想要買|想要|觀望)/.test(cleanText)) {
    category = "想要買";
    content = cleanText.replace(/^(2[\.,\s]|想要買|想要|觀望)\s*/, "").trim();
  }
  
  if (category && content) {
    var itemName = "";
    var storeName = "隨意";
    var deadlineStr = "儘快";
    
    if (content.indexOf("-") !== -1) {
      var dashParts = content.split("-");
      itemName = dashParts[0].trim();
      var restStr = dashParts.slice(1).join("-").trim();
      if (restStr) {
        var restTokens = restStr.split(/[\s，,]+/);
        storeName = restTokens[0] ? restTokens[0].trim() : "隨意";
        if (restTokens.length > 1) {
          deadlineStr = restTokens.slice(1).join(" ").trim();
        }
        if (/^\d{1,2}[\/-]\d{1,2}/.test(storeName) || storeName.indexOf("前") !== -1 || storeName.indexOf("月") !== -1 || storeName.indexOf("日") !== -1) {
          deadlineStr = restTokens.join(" ").trim();
          storeName = "隨意";
        }
      }
    } else {
      var tokens = content.trim().split(/[\s，,]+/);
      itemName = tokens[0] ? tokens[0].trim() : "";
      if (tokens.length >= 3) {
        storeName = tokens[1] ? tokens[1].trim() : "隨意";
        deadlineStr = tokens.slice(2).join(" ").trim() || "儘快";
      } else if (tokens.length === 2) {
        var second = tokens[1].trim();
        if (/^\d{1,2}[\/-]\d{1,2}/.test(second) || second.indexOf("前") !== -1 || second.indexOf("月") !== -1 || second.indexOf("日") !== -1 || second === "今天" || second === "明天" || second === "儘快" || second === "盡快" || second === "無期限") {
          deadlineStr = second;
          storeName = "隨意";
        } else {
          storeName = second;
          deadlineStr = "儘快";
        }
      }
    }
    
    if (!itemName) return;
    
    var addRes = addShoppingItem({
      category: category,
      item: itemName,
      store: storeName,
      deadline: deadlineStr,
      creator: "Telegram 訊息寫入"
    }, false);
    
    if (addRes && addRes.success) {
      sendTelegramMessage({
        altText: "🛒 已為您同步至【伴伴記購物清單】！",
        titleText: "【購物清單同步成功】🛒",
        badgeText: category,
        badgeBg: category === "需要買" ? "#C55757" : "#E58B23",
        details: [
          { label: "類型", value: category },
          { label: "品項名稱", value: itemName, bold: true },
          { label: "購買地點", value: storeName },
          { label: "預計期限", value: deadlineStr },
          { label: "資料庫", value: "已成功寫入 Google 試算表" }
        ],
        targetUrl: "https://liao0318.github.io/fund.migoscar/"
      }, chatId);
    } else {
      sendTelegramMessage("⚠️ 寫入購物清單失敗：" + (addRes ? addRes.message : "連線錯誤"), chatId);
    }
  }
}
