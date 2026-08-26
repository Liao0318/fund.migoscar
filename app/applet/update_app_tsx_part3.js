import fs from 'fs';
import path from 'path';

const appPath = path.join(process.cwd(), 'src', 'App.tsx');
let appTsx = fs.readFileSync(appPath, 'utf8');

// 1. Update saveDeployConfig
const oldSaveDeploy = appTsx.indexOf("const saveDeployConfig = () => {");
if (oldSaveDeploy !== -1) {
  const newSaveDeployCode = `const saveDeployConfig = () => {
    const cleanSheet = deploySheetUrl.trim();
    const cleanToken = deployLineToken.trim();
    const cleanGas = gasWebUrl.trim();

    localStorage.setItem('muji_sheet_url', cleanSheet);
    localStorage.setItem('muji_line_token', cleanToken);
    localStorage.setItem('muji_gas_web_url', cleanGas);

    if (cleanSheet) {
      callGasApi('saveSpreadsheetId', { spreadsheetId: cleanSheet, url: cleanSheet });
    }
    if (cleanToken) {
      callGasApi('saveLineNotifyToken', { token: cleanToken });
    }

    showToast('連線設定與 Web App API URL 已儲存！正嘗試即時連線...', 'success');
    fetchDashboardData(true);
    fetchShoppingData();
  };`;

  const oldSaveDeployEnd = appTsx.indexOf("  };", oldSaveDeploy + 100);
  appTsx = appTsx.substring(0, oldSaveDeploy) + newSaveDeployCode + appTsx.substring(oldSaveDeployEnd + 4);
  console.log('Updated saveDeployConfig');
}

// 2. Insert Web App API URL field into Deploy Modal
const oldLineTokenField = appTsx.indexOf("用於發送記帳動態訊息廣播至您的 LINE 聊天室，輸入後將會寫入 Code.gs 的預設 Token。\n                      </p>\n                    </div>");
if (oldLineTokenField !== -1) {
  const webAppFieldCode = `\n                    {/* Google Apps Script Web App API URL */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-[#3E3A36]">
                          ⚡ Google Apps Script Web App API 網址 (雙向即時同步)
                        </label>
                        {gasWebUrl ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            🟢 Web App API 已連線
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                            🟠 本機沙盒模式
                          </span>
                        )}
                      </div>
                      <input
                        type="url"
                        value={gasWebUrl}
                        onChange={(e) => setGasWebUrl(e.target.value)}
                        placeholder="例如：https://script.google.com/macros/s/AKfycbx.../exec"
                        className="w-full px-3.5 py-2.5 text-xs bg-[#FAF9F5] border border-[#E5E0D2] rounded-xl focus:outline-none focus:border-amber-800 focus:bg-white transition-all font-mono"
                      />
                      <p className="text-[10px] text-[#8C8475] mt-1 leading-relaxed">
                        在 Google Apps Script 點選「發布 -> 部署為網路應用程式」，執行身分選「我 (Me)」，存取權限選「所有人 (Anyone)」，貼上發布網址，即可讓 AI Studio 預覽版與 Google Sheet 100% 雙向即時資料抓取與對帳！
                      </p>
                    </div>`;

  appTsx = appTsx.replace("用於發送記帳動態訊息廣播至您的 LINE 聊天室，輸入後將會寫入 Code.gs 的預設 Token。\n                      </p>\n                    </div>", "用於發送記帳動態訊息廣播至您的 LINE 聊天室，輸入後將會寫入 Code.gs 的預設 Token。\n                      </p>\n                    </div>" + webAppFieldCode);
  console.log('Inserted Web App API URL field into Deploy Modal');
}

// 3. Add Edit button to History cards
const historyTrashBtn = `<button
                              onClick={() => handleDelete(r.id)}
                              className="text-[#A59F94] hover:text-[#C55757] p-2 rounded-xl hover:bg-[#FAF9F5] hover:border-[#F4DFDF] transition-all border border-transparent cursor-pointer"
                              title="移除對帳紀錄"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>`;

const historyEditAndTrashBtn = `<button
                              onClick={() => handleEditRecord(r)}
                              className="text-[#8C8475] hover:text-[#4A4641] p-2 rounded-xl hover:bg-[#FAF9F5] hover:border-[#DDD9CE] transition-all border border-transparent cursor-pointer"
                              title="編輯對帳紀錄"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="text-[#A59F94] hover:text-[#C55757] p-2 rounded-xl hover:bg-[#FAF9F5] hover:border-[#F4DFDF] transition-all border border-transparent cursor-pointer"
                              title="移除對帳紀錄"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>`;

if (appTsx.includes(historyTrashBtn)) {
  appTsx = appTsx.replace(historyTrashBtn, historyEditAndTrashBtn);
  console.log('Added Edit button to history cards');
}

fs.writeFileSync(appPath, appTsx, 'utf8');
console.log('App.tsx part 3 updated!');
