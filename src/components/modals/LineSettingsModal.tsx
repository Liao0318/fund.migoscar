import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BellRing, X, RefreshCw, MessageSquare, Wallet, Target, ShoppingBag } from 'lucide-react';
import { LineNotifySettings } from '../../types';

interface LineSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasLineToken: boolean;
  deployLineToken: string;
  lineNotifyToken: string;
  setLineNotifyToken: (v: string) => void;
  maskedLineToken: string;
  isTestingLine: boolean;
  isSavingLineToken: boolean;
  handleTestLineNotify: () => void;
  handleSaveLineNotifyToken: () => void;
  lineNotifySettings: LineNotifySettings;
  setAllLineNotifySettings: (val: boolean) => void;
  toggleLineNotifySetting: (key: keyof LineNotifySettings) => void;
}

export const LineSettingsModal: React.FC<LineSettingsModalProps> = ({
  isOpen,
  onClose,
  hasLineToken,
  deployLineToken,
  lineNotifyToken,
  setLineNotifyToken,
  maskedLineToken,
  isTestingLine,
  isSavingLineToken,
  handleTestLineNotify,
  handleSaveLineNotifyToken,
  lineNotifySettings,
  setAllLineNotifySettings,
  toggleLineNotifySetting
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
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <BellRing className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#3E3A36] text-sm sm:text-base flex items-center gap-2">
                    <span>LINE 即時通知項目開關與設定</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                      推播偏好
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#8C8475] font-medium">
                    自訂每一項記帳、代墊與採購事件是否發送 LINE 叮咚通知卡片，避免過多訊息打擾
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
              {/* 1. 權杖狀態與即時測試卡片 */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-3.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#F2EDE1] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#06C755] animate-pulse" />
                    <span className="text-xs font-bold text-[#3E3A36]">LINE 廣播連線狀態</span>
                    {hasLineToken || deployLineToken ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                        已配置 Token
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-200">
                        未設定 Token
                      </span>
                    )}
                  </div>

                  {/* 測試發送按鈕 */}
                  <button
                    type="button"
                    onClick={handleTestLineNotify}
                    disabled={isTestingLine}
                    className="px-3.5 py-1.5 bg-[#06C755] hover:bg-[#05B34C] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isTestingLine ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>發送測試中...</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>🔔 立即發送 LINE 測試卡片</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 權杖輸入與管理 */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-[#5C564E]">
                    LINE Messaging API Channel Access Token (權杖)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={lineNotifyToken}
                      onChange={(e) => setLineNotifyToken(e.target.value)}
                      placeholder={maskedLineToken || "貼上 Channel Access Token"}
                      className="flex-1 px-3 py-2 text-xs bg-[#FAF9F5] border border-[#E5E0D2] rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSaveLineNotifyToken}
                      disabled={isSavingLineToken}
                      className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                    >
                      {isSavingLineToken ? '儲存中...' : (hasLineToken && !lineNotifyToken.trim() ? '清除權杖' : '儲存權杖')}
                    </button>
                  </div>
                  {maskedLineToken && (
                    <p className="text-[10px] text-[#8C8475] font-mono">
                      目前使用的 Token：{maskedLineToken}
                    </p>
                  )}
                </div>
              </div>

              {/* 2. 批量控制與啟用統計 */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#3E3A36]">通知開關列表</span>
                  <span className="text-[10px] bg-[#EAE7DC] text-[#5C564E] font-bold px-2 py-0.5 rounded-full">
                    已啟用 {Object.values(lineNotifySettings || {}).filter(Boolean).length} / 9 項
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAllLineNotifySettings(true)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer"
                  >
                    全部開啟
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllLineNotifySettings(false)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#EFECE6] text-[#7A756E] border border-[#DDD8CE] hover:bg-[#E5E1D7] transition-all cursor-pointer"
                  >
                    全部關閉
                  </button>
                </div>
              </div>

              {/* 3. 分類通知開關項目 */}
              <div className="space-y-4">
                {/* 分類一：記帳與代墊事件 */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-3 shadow-2xs">
                  <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1.5 border-b border-[#F2EDE1] pb-2">
                    <Wallet className="w-4 h-4 text-emerald-700" />
                    <span>💳 記帳與帳目異動通知 (核心)</span>
                  </h4>

                  <div className="space-y-3 divide-y divide-[#F5F3ED]">
                    {/* notifyOnAdd */}
                    <div className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">💸</span>
                          <span className="text-xs font-bold text-[#3E3A36]">新增代墊支出通知</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">
                          當登記一筆新的支出代墊時發送通知卡片（含出錢人、品項、金額與分攤明細）
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleLineNotifySetting('notifyOnAdd')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 ${
                          lineNotifySettings.notifyOnAdd ? 'bg-[#06C755]' : 'bg-[#D6D1C7]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            lineNotifySettings.notifyOnAdd ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* notifyOnIncome */}
                    <div className="pt-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">💰</span>
                          <span className="text-xs font-bold text-[#3E3A36]">公積金充值撥入通知</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">
                          當有人充值或撥入固定公積金時，推播充值成功與金額卡片
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleLineNotifySetting('notifyOnIncome')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 ${
                          lineNotifySettings.notifyOnIncome ? 'bg-[#06C755]' : 'bg-[#D6D1C7]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            lineNotifySettings.notifyOnIncome ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* notifyOnEdit */}
                    <div className="pt-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">✏️</span>
                          <span className="text-xs font-bold text-[#3E3A36]">修改帳目資料通知</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">
                          當修改既有帳目的金額、品項或出錢人時，推播更新後的帳目內容
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleLineNotifySetting('notifyOnEdit')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 ${
                          lineNotifySettings.notifyOnEdit ? 'bg-[#06C755]' : 'bg-[#D6D1C7]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            lineNotifySettings.notifyOnEdit ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* notifyOnDelete */}
                    <div className="pt-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🗑️</span>
                          <span className="text-xs font-bold text-[#3E3A36]">撤銷/刪除代墊通知</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">
                          當刪除一筆代墊紀錄時，發送撤銷提醒卡片，確保雙方知情
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleLineNotifySetting('notifyOnDelete')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 ${
                          lineNotifySettings.notifyOnDelete ? 'bg-[#06C755]' : 'bg-[#D6D1C7]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            lineNotifySettings.notifyOnDelete ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 分類二：核銷結算與卡片顯示 */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-3 shadow-2xs">
                  <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1.5 border-b border-[#F2EDE1] pb-2">
                    <Target className="w-4 h-4 text-emerald-700" />
                    <span>🤝 核銷結算與卡片顯示偏好</span>
                  </h4>

                  <div className="space-y-3 divide-y divide-[#F5F3ED]">
                    {/* notifyOnSettle */}
                    <div className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🤝</span>
                          <span className="text-xs font-bold text-[#3E3A36]">月度核銷結算通知</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">
                          當標記某月份為「已撥款核銷」或「待結算狀態」時，發送清帳進度廣播
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleLineNotifySetting('notifyOnSettle')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 ${
                          lineNotifySettings.notifyOnSettle ? 'bg-[#06C755]' : 'bg-[#D6D1C7]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            lineNotifySettings.notifyOnSettle ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* showBalance */}
                    <div className="pt-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">📊</span>
                          <span className="text-xs font-bold text-[#3E3A36]">卡片附帶公積金剩餘 Quota</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">
                          發送記帳通知卡片時，底部是否顯示「銷帳後預計剩餘公積金」即時試算
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleLineNotifySetting('showBalance')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 ${
                          lineNotifySettings.showBalance ? 'bg-[#06C755]' : 'bg-[#D6D1C7]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            lineNotifySettings.showBalance ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 分類三：採購記事與清單 */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-3 shadow-2xs">
                  <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1.5 border-b border-[#F2EDE1] pb-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-700" />
                    <span>🛒 採購記事與清單通知 (購物筆記)</span>
                  </h4>

                  <div className="space-y-3 divide-y divide-[#F5F3ED]">
                    {/* notifyOnShoppingAdd */}
                    <div className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🛒</span>
                          <span className="text-xs font-bold text-[#3E3A36]">新增採購項目通知</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">
                          登記需要買或想要買的採購清單品項時，發送採購廣播卡片
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleLineNotifySetting('notifyOnShoppingAdd')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 ${
                          lineNotifySettings.notifyOnShoppingAdd ? 'bg-[#06C755]' : 'bg-[#D6D1C7]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            lineNotifySettings.notifyOnShoppingAdd ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* notifyOnShoppingComplete */}
                    <div className="pt-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">✅</span>
                          <span className="text-xs font-bold text-[#3E3A36]">標記採購已完成通知</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">
                          在採購清單勾選或標記品項為「已買到」時，發送採購完成歡呼通知
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleLineNotifySetting('notifyOnShoppingComplete')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 ${
                          lineNotifySettings.notifyOnShoppingComplete ? 'bg-[#06C755]' : 'bg-[#D6D1C7]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            lineNotifySettings.notifyOnShoppingComplete ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* notifyOnShoppingDelete */}
                    <div className="pt-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🧹</span>
                          <span className="text-xs font-bold text-[#3E3A36]">移除/清空採購清單通知</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">
                          單項刪除或一鍵清空所有已購項目時發送通知，確保清單保持最新
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleLineNotifySetting('notifyOnShoppingDelete')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 ${
                          lineNotifySettings.notifyOnShoppingDelete ? 'bg-[#06C755]' : 'bg-[#D6D1C7]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            lineNotifySettings.notifyOnShoppingDelete ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal 頁尾 */}
            <div className="p-4 bg-white border-t border-[#E8E4D9] flex items-center justify-between shrink-0">
              <span className="text-[11px] text-[#8C8475] font-light">
                ✨ 所有開關變更均自動即時儲存至雲端
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
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
