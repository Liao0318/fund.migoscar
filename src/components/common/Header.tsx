import React from 'react';
import { BellRing, Database, Key, RefreshCw, Smartphone, Terminal, User, Crown, Heart } from 'lucide-react';
import { BrandLogo } from './BrandLogo.tsx';
import { AuthUser } from '../../types';

interface HeaderProps {
  isOnline: boolean;
  isBackgroundSyncing: boolean;
  lastSyncedAt: string;
  appMode: 'fund' | 'split';
  setAppMode: (mode: 'fund' | 'split') => void;
  unsettledSplitCount: number;
  onOpenNotifySettings: () => void;
  onOpenTravelCalculator: () => void;
  pendingQueueCount?: number;
  onOpenDataBackup?: () => void;
  onFlushQueue?: () => void;
  onOpenPwaInstall?: () => void;
  currentUser?: AuthUser | null;
  onOpenUserProfile?: () => void;
  onOpenGasDeploy?: () => void;
  isSandboxMode?: boolean;
  gasWebUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline,
  isBackgroundSyncing,
  lastSyncedAt,
  appMode,
  setAppMode,
  unsettledSplitCount,
  onOpenNotifySettings,
  onOpenTravelCalculator,
  pendingQueueCount = 0,
  onOpenDataBackup,
  onFlushQueue,
  onOpenPwaInstall,
  currentUser,
  onOpenUserProfile,
  onOpenGasDeploy,
  isSandboxMode = false,
  gasWebUrl = ''
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full font-sans bg-[#FAF9F5]/90 backdrop-blur-xl border-b border-[#EAE6DC]/80 shadow-[0_4px_20px_rgba(62,58,54,0.04)]">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center justify-between sm:justify-start space-x-3 w-full sm:w-auto">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <BrandLogo className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 select-none drop-shadow-2xs rounded-xl" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#3E3A36]">
                  伴伴記<span className="text-rose-500 text-sm sm:text-base">❤️</span>
                </h1>
                {isSandboxMode && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-0.5">
                    <Terminal className="w-2.5 h-2.5" />
                    <span>測試沙盒</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-[#8C8475] font-light truncate">公積金與代墊記帳</p>
            </div>
          </div>

          {/* 手機版右上角使用者按鈕 */}
          {currentUser && onOpenUserProfile && (
            <button
              type="button"
              onClick={onOpenUserProfile}
              className="sm:hidden flex items-center gap-1.5 px-2 py-1 bg-white hover:bg-[#FAF8F3] border border-[#E6E0D2] rounded-xl shadow-2xs text-xs font-bold text-[#3E3A36] cursor-pointer"
            >
              <div className={`w-5 h-5 rounded-lg ${
                currentUser.userRole === 'partner' || currentUser.role === '周' ? 'bg-rose-500' : 'bg-amber-600'
              } text-white text-[10px] flex items-center justify-center font-black relative`}>
                {currentUser.role || (currentUser.userRole === 'partner' ? '周' : '廖')}
              </div>
              <span className="text-[11px] truncate max-w-[60px]">{currentUser.name}</span>
              <span className="text-[10px]">{currentUser.userRole === 'partner' ? '💖' : '👑'}</span>
            </button>
          )}
        </div>

        {/* 頂部功能區：維持精準單列排版 (No-Wrap) */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto flex-nowrap justify-between sm:justify-end overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5">
          {/* 🌸 💳 雙模式核心切換器 (公積金 ↔ 代墊借還) */}
          <div className="p-1 bg-[#F4F0E6] rounded-xl sm:rounded-2xl border border-[#E4DFD3] flex items-center shadow-inner gap-0.5 sm:gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setAppMode('fund');
                try {
                  localStorage.setItem('banban_active_mode', 'fund');
                } catch (e) {}
                if (window.location.hash.includes('split')) {
                  window.location.hash = '';
                }
              }}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap ${
                appMode === 'fund'
                  ? 'bg-white text-[#3E3A36] shadow-xs border border-[#DFDAD0]'
                  : 'text-[#8C8475] hover:text-[#3E3A36]'
              }`}
            >
              <span className="text-xs sm:text-sm">🌸</span>
              <span>公積金<span className="hidden min-[390px]:inline">模式</span></span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAppMode('split');
                try {
                  localStorage.setItem('banban_active_mode', 'split');
                } catch (e) {}
                window.location.hash = '/split';
              }}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 relative shrink-0 whitespace-nowrap ${
                appMode === 'split'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-xs'
                  : 'text-[#8C8475] hover:text-[#3E3A36]'
              }`}
            >
              <span className="text-xs sm:text-sm">💳</span>
              <span>代墊借還</span>
              {unsettledSplitCount > 0 && (
                <span className={`min-w-[15px] h-3.5 sm:h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                  appMode === 'split' ? 'bg-white text-rose-700' : 'bg-rose-500 text-white'
                }`}>
                  {unsettledSplitCount}
                </span>
              )}
            </button>
          </div>

          {/* 快捷圖示按鈕組：在小手機維持同一列緊湊佈局 */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* 🔑 試算表連線金鑰 Quick Action */}
            {onOpenGasDeploy && (
              <button
                type="button"
                onClick={onOpenGasDeploy}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95 ${
                  gasWebUrl
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                }`}
                title={gasWebUrl ? 'Google 試算表連線金鑰已綁定 (點擊管理)' : '尚未綁定 Google 試算表金鑰 (點此綁定同步)'}
                aria-label="連線金鑰設定"
              >
                <Key className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700" />
              </button>
            )}

            {/* 🔔 App 內建通知與智慧指令 Quick Action (圖示版) */}
            <button
              type="button"
              onClick={onOpenNotifySettings}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200/90 flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
              title="App 內建通知提醒與智慧快捷記帳指令"
              aria-label="App 通知設定"
            >
              <BellRing className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
            </button>

            {/* ✈️ 即時匯率 / 出國換算 Quick Action (圖示版) */}
            <button
              type="button"
              onClick={onOpenTravelCalculator}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95 text-xs sm:text-sm"
              title="開啟各國即時匯率與出國換算器"
              aria-label="即時匯率換算"
            >
              <span>💱</span>
            </button>

            {/* 🗄️ 雲端備份 / 離線重試 Quick Action (圖示版) */}
            {onOpenDataBackup && (
              <button
                type="button"
                onClick={onOpenDataBackup}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/90 flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                title="資料備份、離線佇列與對帳中心"
                aria-label="資料備份對帳"
              >
                <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-700" />
              </button>
            )}

            {/* 📱 PWA 手機安裝 Quick Action (圖示版) */}
            {onOpenPwaInstall && (
              <button
                type="button"
                onClick={onOpenPwaInstall}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200/90 flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                title="將伴伴記安裝至手機桌面 (PWA App)"
                aria-label="安裝至桌面"
              >
                <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
              </button>
            )}

            {/* 👤 桌面版使用者帳戶入口 */}
            {currentUser && onOpenUserProfile && (
              <button
                type="button"
                onClick={onOpenUserProfile}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-[#FAF8F3] border border-[#E6E0D2] rounded-xl shadow-2xs text-xs font-bold text-[#3E3A36] cursor-pointer transition-all active:scale-95 shrink-0"
                title={`已登入 Google 帳號: ${currentUser.email}【${currentUser.userRole === 'partner' ? '伴侶身分' : '主管理員'}】 (點擊管理帳戶與金鑰)`}
              >
                <div className={`w-5 h-5 rounded-lg ${
                  currentUser.userRole === 'partner' || currentUser.role === '周' ? 'bg-rose-500' : 'bg-amber-600'
                } text-white text-[10px] flex items-center justify-center font-black`}>
                  {currentUser.role || (currentUser.userRole === 'partner' ? '周' : '廖')}
                </div>
                <span className="truncate max-w-[80px]">{currentUser.name}</span>
                <span className="text-[11px]">{currentUser.userRole === 'partner' ? '💖' : '👑'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
