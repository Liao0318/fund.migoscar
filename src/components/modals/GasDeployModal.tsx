import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileCode, Settings, BellRing, Save, Globe, Check, Copy, Sparkles, Info, X } from 'lucide-react';
import { INDEX_HTML_TEMPLATE, SPLIT_INDEX_HTML_TEMPLATE } from '../../data/gasTemplates';

interface GasDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  deploySheetUrl: string;
  setDeploySheetUrl: (v: string) => void;
  deployLineToken: string;
  setDeployLineToken: (v: string) => void;
  gasWebUrl: string;
  setGasWebUrl: (v: string) => void;
  onOpenLineSettings: () => void;
  saveDeployConfig: () => void;
  activeDeployCodeTab: 'codeGs' | 'indexHtml' | 'splitHtml';
  setActiveDeployCodeTab: (tab: 'codeGs' | 'indexHtml' | 'splitHtml') => void;
  copiedCodeType: string | null;
  copyDeployCode: (type: 'codeGs' | 'indexHtml' | 'splitHtml') => void;
  customizedCodeGs: string;
}

export const GasDeployModal: React.FC<GasDeployModalProps> = ({
  isOpen,
  onClose,
  deploySheetUrl,
  setDeploySheetUrl,
  deployLineToken,
  setDeployLineToken,
  gasWebUrl,
  setGasWebUrl,
  onOpenLineSettings,
  saveDeployConfig,
  activeDeployCodeTab,
  setActiveDeployCodeTab,
  copiedCodeType,
  copyDeployCode,
  customizedCodeGs
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-[#FAF9F5] rounded-2xl sm:rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-[#E5E0D2] max-h-[90vh] flex flex-col my-auto"
          >
            {/* Modal 標題區 */}
            <div className="p-4 sm:p-5 border-b border-[#E8E4D9] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <FileCode className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#3E3A36] text-sm sm:text-base flex items-center gap-2">
                    <span>系統部署與一鍵連線設定</span>
                    <span className="text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                      隱密進階區
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#8C8475] font-medium">
                    輸入連線網址與 Token 後將自動注入代碼，點擊一鍵複製即可快速完成 Google Apps Script 部署
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#EFECE3] hover:bg-[#E5E1D5] flex items-center justify-center text-[#8C8475] transition-all cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal 內容區 */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-left">
              {/* 輸入設定區卡片 */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-4 shadow-2xs">
                <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1.5 border-b border-[#F2EDE1] pb-2">
                  <Settings className="w-4 h-4 text-amber-800" />
                  <span>伺服器與 API 連線設定</span>
                </h4>

                <div className="space-y-3">
                  {/* Google Sheet URL */}
                  <div>
                    <label className="block text-xs font-bold text-[#3E3A36] mb-1">
                      Google 試算表連線網址 (Spreadsheet URL)
                    </label>
                    <input
                      type="text"
                      value={deploySheetUrl}
                      onChange={(e) => setDeploySheetUrl(e.target.value)}
                      placeholder="例如：https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKbB.../edit"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FAF9F5] border border-[#E5E0D2] rounded-xl focus:outline-none focus:border-amber-800 focus:bg-white transition-all font-mono"
                    />
                    <p className="text-[10px] text-[#8C8475] mt-1">
                      貼上您的 Google 試算表完整網址或 ID，Code.gs 將會自動綁定此資料庫。
                    </p>
                  </div>

                  {/* LINE Messaging API Token */}
                  <div>
                    <label className="block text-xs font-bold text-[#3E3A36] mb-1">
                      LINE Messaging API Channel Access Token
                    </label>
                    <input
                      type="text"
                      value={deployLineToken}
                      onChange={(e) => setDeployLineToken(e.target.value)}
                      placeholder="貼上您的 Channel Access Token"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FAF9F5] border border-[#E5E0D2] rounded-xl focus:outline-none focus:border-amber-800 focus:bg-white transition-all font-mono"
                    />
                    <p className="text-[10px] text-[#8C8475] mt-1">
                      用於發送記帳動態訊息廣播至您的 LINE 聊天室，輸入後將會寫入 Code.gs 的預設 Token。
                    </p>
                  </div>

                  {/* Google Apps Script Web App API URL */}
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
                      在 Google Apps Script 點選「發布 ➔ 部署為網路應用程式」，執行身分選「我 (Me)」，存取權限選「所有人 (Anyone)」，貼上發布網址，即可讓 AI Studio 預覽版與 Google Sheet 100% 雙向即時資料抓取與對帳！
                    </p>
                  </div>

                  {/* LINE 通知開關快速入口 */}
                  <div className="bg-[#FAF8F3] rounded-2xl p-3.5 border border-emerald-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                        <BellRing className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-[#3E3A36]">LINE 推播項目自訂開關 (共 9 項)</h5>
                        <p className="text-[10px] text-[#8C8475]">可個別開啟或關閉支出代墊、充值、採購清單、月度結算等通知</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenLineSettings}
                      className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
                    >
                      前往自訂開關
                    </button>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={saveDeployConfig}
                      className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>儲存並即時更新代碼</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 代碼複製與預覽區 */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F2EDE1] pb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setActiveDeployCodeTab('codeGs')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        activeDeployCodeTab === 'codeGs'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-[#FAF9F5] text-[#8C8475] hover:text-[#3E3A36]'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Code.gs (後端)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveDeployCodeTab('indexHtml')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        activeDeployCodeTab === 'indexHtml'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-[#FAF9F5] text-[#8C8475] hover:text-[#3E3A36]'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>index.html (公積金首頁)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveDeployCodeTab('splitHtml')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        activeDeployCodeTab === 'splitHtml'
                          ? 'bg-rose-100 text-rose-900 border border-rose-300'
                          : 'bg-[#FAF9F5] text-[#8C8475] hover:text-[#3E3A36]'
                      }`}
                    >
                      <span>💳</span>
                      <span>split/index.html (代墊子頁面)</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyDeployCode(activeDeployCodeTab)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 ${
                      copiedCodeType === activeDeployCodeTab
                        ? 'bg-emerald-700 text-white'
                        : activeDeployCodeTab === 'splitHtml'
                          ? 'bg-gradient-to-r from-rose-700 to-rose-800 text-white hover:from-rose-800 hover:to-rose-900'
                          : 'bg-gradient-to-r from-amber-800 to-amber-900 text-white hover:from-amber-900 hover:to-amber-950'
                    }`}
                  >
                    {copiedCodeType === activeDeployCodeTab ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>已複製 {activeDeployCodeTab === 'codeGs' ? 'Code.gs' : activeDeployCodeTab === 'indexHtml' ? 'index.html' : 'split/index.html'}！</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>一鍵複製 {activeDeployCodeTab === 'codeGs' ? 'Code.gs' : activeDeployCodeTab === 'indexHtml' ? 'index.html' : 'split/index.html'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 提示訊息 */}
                {activeDeployCodeTab === 'codeGs' && (
                  <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      代碼已為您自動注入：
                      {deploySheetUrl ? ' ✅ 試算表 ID' : ' ⚠️ 未設定試算表'} ｜ 
                      {deployLineToken ? ' ✅ LINE Token' : ' ⚠️ 未設定 LINE Token'}
                    </span>
                  </div>
                )}

                {activeDeployCodeTab === 'splitHtml' && (
                  <div className="bg-rose-50/80 p-2.5 rounded-xl border border-rose-200/80 text-[11px] text-rose-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>
                      💡 GitHub 設定方法：在您的倉庫中建立資料夾 <code>split</code> 並新增 <code>index.html</code>，貼上此代碼即可透過 <code>https://liao0318.github.io/migoscar.fund/split/</code> 瀏覽獨立代墊頁面！
                    </span>
                  </div>
                )}

                {/* Code Box */}
                <div className="relative rounded-xl overflow-hidden border border-[#2d333b]">
                  <pre className="p-4 bg-[#22272e] text-[#adbac7] font-mono text-[11px] max-h-64 overflow-y-auto overflow-x-auto whitespace-pre selection:bg-amber-500 selection:text-black">
                    {activeDeployCodeTab === 'codeGs' 
                      ? customizedCodeGs 
                      : activeDeployCodeTab === 'indexHtml' 
                        ? INDEX_HTML_TEMPLATE 
                        : SPLIT_INDEX_HTML_TEMPLATE}
                  </pre>
                </div>
              </div>

              {/* 快速部署步驟說明 */}
              <div className="bg-[#FAF8F3] rounded-2xl p-4 border border-[#E5E0D2] space-y-2">
                <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-800" />
                  <span>GitHub Pages 部署與獨立子頁面 (/split/) 設定步驟</span>
                </h4>
                <ol className="text-xs text-[#6C675F] space-y-2 list-decimal list-inside font-medium leading-relaxed">
                  <li><strong>Google Apps Script 後端</strong>：複製 <code>Code.gs</code> 貼入 GAS 編輯器，點擊「部署」➔「管理部署作業」➔「編輯」並建立<strong>新版本</strong>發布。</li>
                  <li><strong>主頁面 (公積金)</strong>：複製 <code>index.html</code> 更新到 GitHub 根目錄的 <code>index.html</code>。</li>
                  <li><strong>代墊子頁面 (/split/)</strong>：在 GitHub 倉庫中點選「Add file」➔「Create new file」，檔名輸入 <code>split/index.html</code>，貼上 <code>split/index.html</code> 代碼並 Commit！</li>
                </ol>
              </div>
            </div>

            {/* Modal 頁尾 */}
            <div className="p-4 bg-white border-t border-[#E8E4D9] flex justify-end shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-[#4D4942] hover:bg-[#322F2A] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                完成並關閉
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
