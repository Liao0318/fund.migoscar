import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'Code.gs');
let codeGs = fs.readFileSync(filePath, 'utf8');

// 1. Add updateRecordByRow function if not exists
if (!codeGs.includes('function updateRecordByRow')) {
  const updateRecordCode = `
function updateRecordByRow(data) {
  try {
    var sheet = getDbSheet();
    var rowId = parseInt(data.id || data.rowId);
    if (!rowId || isNaN(rowId)) {
      return { success: false, message: "無效的資料列 rowId" };
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

    var updatedRow = [
      monthStr,
      dateStr,
      data.item || "未分類項目",
      data.payer || "廖尹丞",
      amount,
      data.type || "支出-日常代墊",
      timestampStr
    ];

    sheet.getRange(rowId, 1, 1, 7).setValues([updatedRow]);

    try {
      var lineSettingsRes = getLineNotifySettings();
      var lineSettings = lineSettingsRes.settings || {};
      if (lineSettings.notifyOnAdd !== false) {
        var notifyTitle = "✏️ " + (data.payer || "有人") + " 修改了對帳紀錄";
        var notifyDesc = "修改為「" + (data.item || "") + "」：金額 $" + amount.toLocaleString("zh-TW") + " 元 (" + monthStr + " 月份)";
        sendLineNotify("\\n" + notifyTitle + "\\n" + notifyDesc);
      }
    } catch(errLine) {}

    return { success: true, message: "資料列修改成功" };
  } catch(err) {
    return { success: false, message: "修改失敗: " + err.toString() };
  }
}
`;
  codeGs += "\n" + updateRecordCode;
  console.log("Added updateRecordByRow to Code.gs");
}

// 2. Update doGet
if (codeGs.includes("function doGet() {")) {
  codeGs = codeGs.replace("function doGet() {", "function doGet(e) {\n  if (e && e.parameter && e.parameter.action) {\n    var action = e.parameter.action;\n    var result = handleApiAction(action, e.parameter);\n    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);\n  }\n");
  console.log("Updated doGet in Code.gs");
}

// 3. Add handleApiAction
if (!codeGs.includes("function handleApiAction")) {
  const handleApiActionCode = `
function handleApiAction(action, data) {
  try {
    switch(action) {
      case 'getDashboardData':
        return getDashboardData();
      case 'addRecord':
        return addRecord(data);
      case 'updateRecordByRow':
      case 'updateRecord':
        return updateRecordByRow(data);
      case 'deleteRecordByRow':
      case 'deleteRecord':
        return deleteRecordByRow(data.rowId || data.id);
      case 'setMonthReconciled':
        return setMonthReconciled(data.month, data.reconciled);
      case 'getShoppingData':
        return getShoppingData();
      case 'addShoppingItem':
        return addShoppingItem(data);
      case 'updateShoppingItem':
        return updateShoppingItem(data);
      case 'toggleShoppingItemStatus':
        return toggleShoppingItemStatus(data.id, data.status);
      case 'deleteShoppingItem':
        return deleteShoppingItem(data.id);
      case 'clearDoneShoppingItems':
        return clearDoneShoppingItems();
      case 'saveStoresList':
        return saveStoresList(data.stores);
      case 'saveSpreadsheetId':
      case 'setupDatabase':
        return saveSpreadsheetId(data.spreadsheetId || data.url);
      case 'getSpreadsheetConfig':
        return getSpreadsheetConfig();
      case 'getLineNotifyToken':
        return getLineNotifyToken();
      case 'saveLineNotifyToken':
        return saveLineNotifyToken(data.token);
      case 'testLineNotify':
        return testLineNotify();
      case 'getLineNotifySettings':
        return getLineNotifySettings();
      case 'saveLineNotifySettings':
        return saveLineNotifySettings(data.settings);
      default:
        return { success: false, message: "未知 action: " + action };
    }
  } catch(err) {
    return { success: false, message: "API 執行錯誤: " + err.toString() };
  }
}
`;
  codeGs += "\n" + handleApiActionCode;
  console.log("Added handleApiAction to Code.gs");
}

// 4. Update doPost
if (codeGs.includes("var data = JSON.parse(e.postData.contents);") && !codeGs.includes("if (data && data.action)")) {
  codeGs = codeGs.replace("var data = JSON.parse(e.postData.contents);", "var data = JSON.parse(e.postData.contents);\n    if (data && data.action) {\n      var apiRes = handleApiAction(data.action, data);\n      return ContentService.createTextOutput(JSON.stringify(apiRes)).setMimeType(ContentService.MimeType.JSON);\n    }");
  console.log("Updated doPost in Code.gs");
}

fs.writeFileSync(filePath, codeGs, "utf8");
console.log("Code.gs successfully updated!");
