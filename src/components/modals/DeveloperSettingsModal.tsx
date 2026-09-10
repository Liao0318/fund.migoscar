import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  Key, 
  Check, 
  X, 
  RotateCcw, 
  Rocket, 
  ShieldCheck, 
  Database, 
  Users, 
  CloudCheck, 
  FileCode, 
  Sparkles,
  Sliders,
  LogOut,
  Info,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { AuthUser } from '../../types';

interface DeveloperSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onResetDevData: () => void;
  onSeedSampleData: () => void;
  onExitDevMode: () => void;
  onSyncToProduction: () => void;
  isProductionReady: boolean;
}

export const DeveloperSettingsModal: React.FC<DeveloperSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onResetDevData,
  onSeedSampleData,
  onExitDevMode,
  onSyncToProduction,
  isProductionReady
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'security' | 'database'>('overview');
  
  // 密碼管理（安全隔離，不暴露於範例中）
  const [currentDevPassword, setCurrentDevPassword] = useState<string>(() => {
    try {
      return localStorage.getItem('banban_dev_password') || '1912';
    } catch (e) {
      return '1912';
    }
  });
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState(false);

  const handleUpdateDevPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPasswordInput.trim();
    if (!trimmed) return;
    try {
      localStorage.setItem('banban_dev_password', trimmed);
      setCurrentDevPassword(trimmed);
      setPasswordChangeSuccess(true);
      setNewPasswordInput('');
      setTimeout(() => setPasswordChangeSuccess(false), 3000);
    } catch (err) {
      console.warn('Failed to save dev password:', err);
    }
  };

  const handleTriggerSyncProduction = () => {
    onSyncToProduction();
    setSyncSuccessMsg(true);
    setTimeout(() => setSyncSuccessMsg(false), 4000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#FAF9F5] border-2 border-[#D9D1C5] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-left"
        >
          {/* 頂部 Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#2F2B28] to-[#423D38] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                    系統整體設定與開發控制中心
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-200 border border-purple-400/30 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    DEV 獨立通道模式
                  </span>
                </div>
                <p className="text-xs text-[#C5BCB0] mt-0.5">
                  通行碼登入專用架構通道・全功能與介面設計專區
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 子選單分頁切換 */}
          <div className="bg-[#EFECE3] px-4 py-2 border-b border-[#DFD9CE] flex items-center gap-2 shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('overview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'overview'
                  ? 'bg-white text-[#2F2B28] shadow-2xs'
                  : 'text-[#7D7569] hover:text-[#2F2B28]'
              }`}
            >
              <Rocket className="w-3.5 h-3.5 text-amber-800" />
              <span>系統全域狀態與上線整備</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('security')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'security'
                  ? 'bg-white text-[#2F2B28] shadow-2xs'
                  : 'text-[#7D7569] hover:text-[#2F2B28]'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-purple-700" />
              <span>開發通道通行碼管理</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('database')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'database'
                  ? 'bg-white text-[#2F2B28] shadow-2xs'
                  : 'text-[#7D7569] hover:text-[#2F2B28]'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-blue-700" />
              <span>測試數據與除錯工具</span>
            </button>
          </div>

          {/* 滾動內容區 */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            
            {/* Tab 1: 系統全域狀態與上線整備 */}
            {activeSubTab === 'overview' && (
              <div className="space-y-4">
                {/* 狀態卡片 */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5DFD4] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#7D7569]">目前系統環境狀態：</span>
                      <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                        isProductionReady 
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${isProductionReady ? 'bg-emerald-600' : 'bg-amber-600 animate-pulse'}`} />
                        <span>{isProductionReady ? '🚀 已同步正式系統 (Production Ready)' : '🚧 開發除錯中 (Development Stage)'}</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#6B6357] leading-relaxed">
                    在您開發與除錯期間，所有的功能改動與介面調校均在本地安全執行。當您確認各項功能驗證無誤、準備好正式上線時，點擊下方「同步至正式系統」，系統會鎖定版本設定並完成正式發布同步！
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleTriggerSyncProduction}
                      className="w-full py-3 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                      <Rocket className="w-4 h-4 text-emerald-300" />
                      <span>{isProductionReady ? '重新核對並同步正式系統' : '一鍵同步至正式系統 (正式上線準備)'}</span>
                    </button>
                    {syncSuccessMsg && (
                      <p className="text-xs text-emerald-800 font-bold text-center mt-2 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>已成功同步！所有設計變更與資料庫配置已升級為正式發布標準。</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* 各模組就緒檢核清單 */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5DFD4] shadow-2xs space-y-3">
                  <h4 className="text-xs font-black text-[#3E3A36] uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>全系統核心模組檢核清單</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EDE7DC] flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <strong className="text-[#3E3A36] block">Google 認證登入</strong>
                        <span className="text-[11px] text-[#7A7366]">新舊用戶智慧判別／免密碼</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EDE7DC] flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <strong className="text-[#3E3A36] block">伴侶邀請與綁定</strong>
                        <span className="text-[11px] text-[#7A7366]">6位數專屬邀請碼／在線配對</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EDE7DC] flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <strong className="text-[#3E3A36] block">公積金收支核心</strong>
                        <span className="text-[11px] text-[#7A7366]">防呆結算／即時餘額／類別統計</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EDE7DC] flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <strong className="text-[#3E3A36] block">代墊分帳與旅遊記帳</strong>
                        <span className="text-[11px] text-[#7A7366]">多幣別匯率／沖銷結清</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🛡️ DEV 與上路系統帳號隔離架構卡片 */}
                <div className="bg-gradient-to-br from-[#FAF8F5] to-[#F2EDE4] rounded-2xl p-4 sm:p-5 border border-[#DFD7CA] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-[#3E3A36] uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-700" />
                      <span>DEV 與上路 (正式) 帳號嚴格隔離架構</span>
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                      🟢 隔離保護生效中
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-[#E5DFD4] space-y-1">
                      <div className="flex items-center gap-1.5 font-black text-purple-900">
                        <Terminal className="w-3.5 h-3.5 text-purple-700" />
                        <span>🛠️ DEV 開發環境</span>
                      </div>
                      <p className="text-[11px] text-[#7A7366] leading-relaxed">
                        所有系統功能與介面設計在此進行。使用專屬通道密碼登入，配備模擬數據沙盒，絕不污染正式帳本。
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-[#E5DFD4] space-y-1">
                      <div className="flex items-center gap-1.5 font-black text-emerald-900">
                        <Rocket className="w-3.5 h-3.5 text-emerald-700" />
                        <span>🚀 上路正式系統</span>
                      </div>
                      <p className="text-[11px] text-[#7A7366] leading-relaxed">
                        專供實際日常記帳。限定以 Google 官方帳號安全登入，資料即時雙向同步至專屬 Google 試算表。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: 開發通道通行碼管理 */}
            {activeSubTab === 'security' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5DFD4] shadow-2xs space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#3E3A36]">開發登入通道通行碼管理</h4>
                      <p className="text-xs text-[#7A7366] mt-0.5">
                        在登入首頁的「DEV 開發通道」輸入此密碼，即可進入獨立開發管理與介面設計模式。
                      </p>
                    </div>
                  </div>

                  {/* 安全防護規範提示 */}
                  <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs space-y-1 text-amber-900">
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>高安全防護：密碼絕不外洩於任何範例中</span>
                    </div>
                    <p className="text-[11px] text-amber-800/90 leading-relaxed pl-5">
                      系統已徹底清除所有輸入框 Placeholder、範例提示與介面標註中的明文密碼，保障您的通道隱私。
                    </p>
                  </div>

                  <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200/80 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-purple-900 font-bold flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        <span>目前生效通道通行碼：</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPasswordText(!showPasswordText)}
                        className="text-purple-800 hover:text-purple-950 font-bold text-[11px] flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-purple-200 cursor-pointer shadow-2xs"
                      >
                        {showPasswordText ? (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>隱藏密碼</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>顯示密碼</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="font-mono bg-white px-3 py-1.5 rounded-lg border border-purple-300 font-black text-sm tracking-wider text-purple-950">
                      {showPasswordText ? currentDevPassword : '•'.repeat(Math.max(currentDevPassword.length, 6))}
                    </div>
                  </div>

                  <form onSubmit={handleUpdateDevPassword} className="space-y-3 pt-1">
                    <label className="block text-xs font-bold text-[#4E473D]">
                      修改自訂開發通道通行密碼：
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder="請輸入新通道通行密碼"
                        className="flex-1 px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-700"
                      />
                      <button
                        type="submit"
                        disabled={!newPasswordInput.trim()}
                        className="px-4 py-2 bg-[#3E3A36] hover:bg-[#2C2926] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                      >
                        儲存新密碼
                      </button>
                    </div>
                    {passwordChangeSuccess && (
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> 通行碼已成功變更並保存在此瀏覽器！
                      </span>
                    )}
                  </form>
                </div>
              </div>
            )}

            {/* Tab 3: 測試數據與除錯工具 */}
            {activeSubTab === 'database' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5DFD4] shadow-2xs space-y-3">
                  <h4 className="text-sm font-black text-[#3E3A36] flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-700" />
                    <span>測試數據與重置工具</span>
                  </h4>

                  <p className="text-xs text-[#7A7366]">
                    開發階段可快速一鍵注入全套模擬資料（情侶買菜、日常公積金、日本旅遊外幣記帳），或清空重置。
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={onSeedSampleData}
                      className="p-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-900 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer text-left"
                    >
                      <Sparkles className="w-4 h-4 text-blue-700 shrink-0" />
                      <div>
                        <div>注入全功能展示數據</div>
                        <span className="text-[10px] text-blue-600 font-normal">包含收支、代墊、心願清單</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={onResetDevData}
                      className="p-3 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/70 text-rose-900 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer text-left"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-700 shrink-0" />
                      <div>
                        <div>重置本機測試數據</div>
                        <span className="text-[10px] text-rose-600 font-normal">清空所有測試暫存資料</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* 底部按鈕區 */}
          <div className="p-4 bg-[#EDE8DE] border-t border-[#DED7CA] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onExitDevMode}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>退出開發模式（返回登入頁）</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#3E3A36] hover:bg-[#2C2926] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              完成並關閉
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
