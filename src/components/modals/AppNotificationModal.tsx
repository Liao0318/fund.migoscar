import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BellRing, X, RefreshCw, Sparkles, Wallet, ShoppingBag, CheckCircle2, Sliders, Bell, Play, Info } from 'lucide-react';
import { AppNotifySettings, AppNotification, SmartCommandResult } from '../../types';

interface AppNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTestingNotify: boolean;
  handleTestNotify: () => void;
  notifySettings: AppNotifySettings;
  setAllNotifySettings: (val: boolean) => void;
  toggleNotifySetting: (key: keyof AppNotifySettings) => void;
  notifications?: AppNotification[];
  onExecuteSmartCommand?: (cmd: string) => Promise<SmartCommandResult | boolean> | SmartCommandResult | boolean;
}

export const AppNotificationModal: React.FC<AppNotificationModalProps> = ({
  isOpen,
  onClose,
  isTestingNotify,
  handleTestNotify,
  notifySettings,
  setAllNotifySettings,
  toggleNotifySetting,
  notifications = [],
  onExecuteSmartCommand
}) => {
  const [smartCmdInput, setSmartCmdInput] = useState('');
  const [isExecutingCmd, setIsExecutingCmd] = useState(false);
  const [cmdFeedback, setCmdFeedback] = useState<{ msg: string; success: boolean } | null>(null);

  const activeCount = Object.values(notifySettings || {}).filter(Boolean).length;

  const handleRunCommand = async (cmdToRun?: string) => {
    const text = (cmdToRun || smartCmdInput).trim();
    if (!text) return;
    if (onExecuteSmartCommand) {
      setIsExecutingCmd(true);
      setCmdFeedback(null);
      try {
        const ok = await onExecuteSmartCommand(text);
        if (ok) {
          setCmdFeedback({ msg: `✅ 已成功執行指令：「${text}」`, success: true });
          setSmartCmdInput('');
        } else {
          setCmdFeedback({ msg: `⚠️ 指令格式無法辨識或執行失敗，請參考下方範例`, success: false });
        }
      } catch (err: any) {
        setCmdFeedback({ msg: `❌ 執行錯誤：${err?.message || '未知錯誤'}`, success: false });
      } finally {
        setIsExecutingCmd(false);
      }
    }
  };

  const sampleCommands = [
    { label: '廖代墊晚餐', cmd: '廖 1200 晚餐' },
    { label: '周代墊飲料', cmd: '周 85 珍奶' },
    { label: '存入公積金', cmd: '存 10000 薪資固定公積金' },
    { label: '日常生活支出', cmd: '支出 450 全聯日用品' },
    { label: '購物清單', cmd: '需要買 衛生紙 好市多' },
    { label: '即時查帳', cmd: '查代墊' },
  ];

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
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold shadow-2xs">
                  <BellRing className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#3E3A36] text-sm sm:text-base">
                    App 內建通知中心與智慧指令
                  </h3>
                  <p className="text-[11px] text-[#8C8475] font-medium">
                    管理各項記帳、存入、結算與採購的即時通知，並支援 App 內建自然語言快速記帳
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
              {/* 1. App 內建智慧自然語言記帳助理卡片 */}
              <div className="bg-gradient-to-br from-rose-50/70 via-amber-50/40 to-white rounded-2xl p-4 sm:p-5 border border-rose-200/80 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  <span className="text-xs sm:text-sm font-bold text-[#3E3A36]">App 內建智慧快捷記帳指令</span>
                </div>

                <p className="text-[11px] text-[#7A756E] leading-relaxed">
                  直接在下方輸入自然語言快捷指令（如「<code>廖 1200 晚餐</code>」、「<code>周 85 珍奶</code>」、「<code>存 10000 薪資</code>」或「<code>需要買 衛生紙 好市多</code>」），App 將自動辨識金額、代墊人與品項並完成記帳！
                </p>

                {/* 輸入框與執行按鈕 */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={smartCmdInput}
                      onChange={(e) => setSmartCmdInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleRunCommand();
                        }
                      }}
                      placeholder="例如：廖 1200 晚餐、存 10000 薪資、需要買 鮮奶 全聯"
                      className="w-full px-3.5 py-2 text-xs bg-white border border-[#DDD8CE] focus:border-rose-500 focus:ring-1 focus:ring-rose-200 rounded-xl focus:outline-none font-sans shadow-2xs transition-all"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRunCommand()}
                    disabled={isExecutingCmd || !smartCmdInput.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    {isExecutingCmd ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-white" />
                    )}
                    <span>執行記帳</span>
                  </button>
                </div>

                {/* 執行回饋訊息 */}
                {cmdFeedback && (
                  <div className={`p-2.5 rounded-xl text-xs font-medium border ${cmdFeedback.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                    {cmdFeedback.msg}
                  </div>
                )}

                {/* 快捷常用範例按鈕 */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-[#8C8475]">常用指令範例（點擊直接填入）：</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {sampleCommands.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSmartCmdInput(s.cmd);
                          handleRunCommand(s.cmd);
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white/90 hover:bg-white text-[#4A4641] border border-[#E5E0D2] shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                      >
                        <span className="text-rose-500 font-bold">{s.label}:</span>
                        <code className="text-[#6C675F] text-[10px]">{s.cmd}</code>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. 即時通知狀態與測試卡片 */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-3.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#F2EDE1] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-[#3E3A36]">App 內建即時通知服務</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 原生支援
                    </span>
                  </div>

                  {/* 測試發送按鈕 */}
                  <button
                    type="button"
                    onClick={handleTestNotify}
                    disabled={isTestingNotify}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isTestingNotify ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>發送測試中...</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-3.5 h-3.5" />
                        <span>🔔 發送 App 內建通知測試</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-1.5 bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E8E4D9] text-[#5C564E]">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>通知管道：App 右上角鈴鐺通知中心 ＋ 即時彈出卡片</span>
                    <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-[#DDD8CE]">即時觸發</span>
                  </div>
                  <p className="text-[11px] text-[#7A756E] leading-relaxed">
                    💡 當您在 App 內進行新增記帳、修改金額、刪除項目、結算對帳或完成購物清單時，系統將自動寫入通知中心並即時回饋提示。
                  </p>
                </div>
              </div>

              {/* 3. 批量控制與啟用統計 */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#3E3A36]">推播項目開關</span>
                  <span className="text-[10px] bg-[#EAE7DC] text-[#5C564E] font-bold px-2 py-0.5 rounded-full">
                    已啟用 {activeCount} / 9 項
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAllNotifySettings(true)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
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

              {/* 4. 分類通知開關項目 */}
              <div className="space-y-4">
                {/* 分類一：記帳與代墊事件 */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-3 shadow-2xs">
                  <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1.5 border-b border-[#F2EDE1] pb-2">
                    <Wallet className="w-4 h-4 text-rose-600" />
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
                        <p className="text-[10px] text-[#8C8475] mt-0.5">新增任一筆日常代墊支出時，立即發送通知</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifySettings?.notifyOnAdd !== false}
                          onChange={() => toggleNotifySetting('notifyOnAdd')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#DDD8CE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                      </label>
                    </div>

                    {/* notifyOnIncome */}
                    <div className="pt-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">💰</span>
                          <span className="text-xs font-bold text-[#3E3A36]">公積金存入充值通知</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">撥入公積金款項時發送通知</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifySettings?.notifyOnIncome !== false}
                          onChange={() => toggleNotifySetting('notifyOnIncome')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#DDD8CE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                      </label>
                    </div>

                    {/* notifyOnEdit */}
                    <div className="pt-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">✏️</span>
                          <span className="text-xs font-bold text-[#3E3A36]">帳目修改通知</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">修改已有紀錄的金額、品項或出資人時發送通知</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifySettings?.notifyOnEdit !== false}
                          onChange={() => toggleNotifySetting('notifyOnEdit')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#DDD8CE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                      </label>
                    </div>

                    {/* notifyOnDelete */}
                    <div className="pt-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🗑️</span>
                          <span className="text-xs font-bold text-[#3E3A36]">帳目刪除撤銷通知</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">刪除任一筆記帳時發送防呆撤銷通知</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifySettings?.notifyOnDelete !== false}
                          onChange={() => toggleNotifySetting('notifyOnDelete')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#DDD8CE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                      </label>
                    </div>

                    {/* notifyOnSettle */}
                    <div className="pt-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🤝</span>
                          <span className="text-xs font-bold text-[#3E3A36]">月度對帳核銷通知</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">勾選核銷月份或進行結算時發送通知</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifySettings?.notifyOnSettle !== false}
                          onChange={() => toggleNotifySetting('notifyOnSettle')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#DDD8CE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                      </label>
                    </div>

                    {/* showBalance */}
                    <div className="pt-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">📊</span>
                          <span className="text-xs font-bold text-[#3E3A36]">顯示即時剩餘公積金額度</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">在通知卡片中一併附帶最新公積金剩餘額度</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifySettings?.showBalance !== false}
                          onChange={() => toggleNotifySetting('showBalance')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#DDD8CE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 分類二：購物清單事件 */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-3 shadow-2xs">
                  <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1.5 border-b border-[#F2EDE1] pb-2">
                    <ShoppingBag className="w-4 h-4 text-amber-700" />
                    <span>🛒 購物採購清單通知</span>
                  </h4>

                  <div className="space-y-3 divide-y divide-[#F5F3ED]">
                    {/* notifyOnShoppingAdd */}
                    <div className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🛍️</span>
                          <span className="text-xs font-bold text-[#3E3A36]">購物清單新增通知</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">有人建立「需要買」或「想要買」品項時發送通知</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifySettings?.notifyOnShoppingAdd !== false}
                          onChange={() => toggleNotifySetting('notifyOnShoppingAdd')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#DDD8CE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                      </label>
                    </div>

                    {/* notifyOnShoppingComplete */}
                    <div className="pt-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🎉</span>
                          <span className="text-xs font-bold text-[#3E3A36]">購物清單完成採購通知</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">標記品項已買到時發送通知</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifySettings?.notifyOnShoppingComplete !== false}
                          onChange={() => toggleNotifySetting('notifyOnShoppingComplete')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#DDD8CE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                      </label>
                    </div>

                    {/* notifyOnShoppingDelete */}
                    <div className="pt-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">❌</span>
                          <span className="text-xs font-bold text-[#3E3A36]">購物清單刪除通知</span>
                        </div>
                        <p className="text-[10px] text-[#8C8475] mt-0.5">移除採購清單品項時發送通知</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifySettings?.notifyOnShoppingDelete !== false}
                          onChange={() => toggleNotifySetting('notifyOnShoppingDelete')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#DDD8CE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal 頁尾 */}
            <div className="p-4 bg-white border-t border-[#E8E4D9] flex justify-end shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-[#4D4942] hover:bg-[#322F2A] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                儲存並關閉
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
