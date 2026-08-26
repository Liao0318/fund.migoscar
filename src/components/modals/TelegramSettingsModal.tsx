import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BellRing, X, RefreshCw, Send, Wallet, Target, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { TelegramNotifySettings } from '../../types';

interface TelegramSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTestingTelegram: boolean;
  handleTestTelegramNotify: () => void;
  notifySettings: TelegramNotifySettings;
  setAllNotifySettings: (val: boolean) => void;
  toggleNotifySetting: (key: keyof TelegramNotifySettings) => void;
}

export const TelegramSettingsModal: React.FC<TelegramSettingsModalProps> = ({
  isOpen,
  onClose,
  isTestingTelegram,
  handleTestTelegramNotify,
  notifySettings,
  setAllNotifySettings,
  toggleNotifySetting
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
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold shadow-2xs">
                  <Send className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#3E3A36] text-sm sm:text-base flex items-center gap-2">
                    <span>Telegram 即時通知推播開關</span>
                    <span className="text-[10px] text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded-full font-bold border border-sky-200">
                      永久 100% 免費無上限
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#8C8475] font-medium">
                    自訂伴伴記每一項代墊記帳、公積金存入與採購事件是否推播至 Telegram 群組
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
              {/* 1. Telegram 情侶群組連線狀態與即時測試卡片 */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-3.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#F2EDE1] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                    <span className="text-xs font-bold text-[#3E3A36]">Telegram「伴伴記❤️」群組</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 連線正常
                    </span>
                  </div>

                  {/* 測試發送按鈕 */}
                  <button
                    type="button"
                    onClick={handleTestTelegramNotify}
                    disabled={isTestingTelegram}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isTestingTelegram ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>發送測試中...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>🔔 發送群組測試通知</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 群組綁定說明 */}
                <div className="space-y-1.5 bg-sky-50/70 p-3.5 rounded-xl border border-sky-100 text-sky-900">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>機器人帳號：@fund_migoscar_bot</span>
                    <span className="font-mono text-[11px] bg-white/80 px-2 py-0.5 rounded border border-sky-200">Chat ID: -5312205991</span>
                  </div>
                  <p className="text-[11px] text-sky-800 leading-relaxed">
                    💡 雙向智能記帳已就緒！在 Telegram 群組中直接輸入「<code>廖 50 早餐</code>」、「<code>存 10000</code>」或「<code>查</code>」，機器人會自動完成記帳並回傳結算卡片。
                  </p>
                </div>
              </div>

              {/* 2. 批量控制與啟用統計 */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#3E3A36]">推播項目開關</span>
                  <span className="text-[10px] bg-[#EAE7DC] text-[#5C564E] font-bold px-2 py-0.5 rounded-full">
                    已啟用 {Object.values(notifySettings || {}).filter(Boolean).length} / 9 項
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAllNotifySettings(true)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 transition-all cursor-pointer"
                  >
                    全部開啟
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllNotifySettings(false)}
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
                    <Wallet className="w-4 h-4 text-sky-600" />
                    <span>💳 記帳與帳目異動通知</span>
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
                          當登記一筆新的支出代墊時發送推播卡片（含出資者、品項、金額與時間）
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleNotifySetting('notifyOnAdd')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 ${
                          notifySettings.notifyOnAdd ? 'bg-sky-500' : 'bg-[#D6D1C7]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            notifySettings.notifyOnAdd ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* notifyOnIncome */}
                    <div className="pt-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">💰</span>
                          <span className="text-xs font-bold text-[#3E3A36]">公積金存入通知</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">
                          當有人存入公積金時，推播存入對象、來源與金額卡片
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleNotifySetting('notifyOnIncome')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 ${
                          notifySettings.notifyOnIncome ? 'bg-sky-500' : 'bg-[#D6D1C7]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            notifySettings.notifyOnIncome ? 'translate-x-5' : 'translate-x-0'
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
                          當修改既有帳目的金額、品項或出資者時，推播更新後的帳目內容
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleNotifySetting('notifyOnEdit')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 ${
                          notifySettings.notifyOnEdit ? 'bg-sky-500' : 'bg-[#D6D1C7]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            notifySettings.notifyOnEdit ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* notifyOnDelete */}
                    <div className="pt-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🗑️</span>
                          <span className="text-xs font-bold text-[#3E3A36]">刪除/撤銷代墊通知</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">
                          當刪除一筆代墊紀錄時，發送撤銷提醒，確保雙方知情
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleNotifySetting('notifyOnDelete')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 ${
                          notifySettings.notifyOnDelete ? 'bg-sky-500' : 'bg-[#D6D1C7]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            notifySettings.notifyOnDelete ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 分類二：核銷結算與卡片顯示 */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-3 shadow-2xs">
                  <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1.5 border-b border-[#F2EDE1] pb-2">
                    <Target className="w-4 h-4 text-sky-600" />
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
                          當標記某月份為「已撥款核銷」或「待結算狀態」時，發送清帳進度
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleNotifySetting('notifyOnSettle')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 ${
                          notifySettings.notifyOnSettle ? 'bg-sky-500' : 'bg-[#D6D1C7]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            notifySettings.notifyOnSettle ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* showBalance */}
                    <div className="pt-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">📊</span>
                          <span className="text-xs font-bold text-[#3E3A36]">附帶公積金預計剩餘額度</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">
                          推播通知時，是否包含「銷帳後預計剩餘公積金」試算金額
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleNotifySetting('showBalance')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 ${
                          notifySettings.showBalance ? 'bg-sky-500' : 'bg-[#D6D1C7]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            notifySettings.showBalance ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 分類三：採購記事與清單 */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-3 shadow-2xs">
                  <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1.5 border-b border-[#F2EDE1] pb-2">
                    <ShoppingBag className="w-4 h-4 text-sky-600" />
                    <span>🛒 購物清單與採購通知</span>
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
                          登記需要買或想要買的品項時，推播待買清單通知
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleNotifySetting('notifyOnShoppingAdd')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 ${
                          notifySettings.notifyOnShoppingAdd ? 'bg-sky-500' : 'bg-[#D6D1C7]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            notifySettings.notifyOnShoppingAdd ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* notifyOnShoppingComplete */}
                    <div className="pt-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">✅</span>
                          <span className="text-xs font-bold text-[#3E3A36]">標記採購完成通知</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">
                          在採購清單勾選品項為「已買到」時，發送採購完成歡呼通知
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleNotifySetting('notifyOnShoppingComplete')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 ${
                          notifySettings.notifyOnShoppingComplete ? 'bg-sky-500' : 'bg-[#D6D1C7]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            notifySettings.notifyOnShoppingComplete ? 'translate-x-5' : 'translate-x-0'
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
                          單項刪除或清空已購項目時發送通知，確保清單保持最新
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleNotifySetting('notifyOnShoppingDelete')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer shrink-0 ${
                          notifySettings.notifyOnShoppingDelete ? 'bg-sky-500' : 'bg-[#D6D1C7]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            notifySettings.notifyOnShoppingDelete ? 'translate-x-5' : 'translate-x-0'
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
                ✨ 所有推播開關設定均即時套用生效
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-[#3E3A36] hover:bg-[#2B2724] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
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
