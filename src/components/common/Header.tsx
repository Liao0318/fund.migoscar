import React from 'react';
import { Bell, LogIn, Menu } from 'lucide-react';
import { BrandLogo } from './BrandLogo.tsx';
import { AuthUser } from '../../types';
import { APP_VERSION } from '../../version';

interface HeaderProps {
  isOnline: boolean;
  isBackgroundSyncing: boolean;
  lastSyncedAt: string;
  appMode: 'fund' | 'split';
  setAppMode: (mode: 'fund' | 'split') => void;
  unsettledSplitCount: number;
  onOpenTravelCalculator: () => void;
  onOpenSettings: () => void;
  onReturnToLoginPortal?: () => void;
  pendingQueueCount?: number;
  currentUser?: AuthUser | null;
  isSandboxMode?: boolean;
  gasWebUrl?: string;
  onOpenNotifySettings?: () => void;
  onOpenDataBackup?: () => void;
  onOpenPwaInstall?: () => void;
  onOpenUserProfile?: () => void;
  onOpenGasDeploy?: () => void;
  unreadNotificationCount?: number;
  onOpenDevSettings?: () => void;
  onOpenVersionInfo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appMode,
  setAppMode,
  unsettledSplitCount,
  onOpenTravelCalculator,
  onOpenSettings,
  onReturnToLoginPortal,
  onOpenNotifySettings,
  unreadNotificationCount = 0,
  pendingQueueCount = 0,
  currentUser,
  isSandboxMode = false,
  gasWebUrl = '',
  onOpenDevSettings,
  onOpenVersionInfo
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full font-sans bg-[#FAF9F5]/95 backdrop-blur-xl border-b border-[#EAE6DC] shadow-[0_2px_12px_rgba(62,58,54,0.04)]">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-1.5 sm:py-2">
        
        {/* 頂部極簡主列：左邊選單 + Logo + 模式切換 + 簡潔右側 */}
        <div className="flex items-center justify-between gap-2">
          
          {/* 左側：側邊選單按鈕 (左側滑出) 與品牌 Logo */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 側邊選單 Hamburger 觸發鈕 (由左向右滑出抽屜) */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-xl bg-[#F4F0E6] hover:bg-[#EAE4D8] text-[#5C564E] hover:text-[#3E3A36] border border-[#E0DBD0] flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
              title="開啟左側選單設定"
              aria-label="開啟選單設定"
            >
              <Menu className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            <BrandLogo className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 select-none drop-shadow-2xs rounded-xl" />
            
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-black text-[#3E3A36] leading-tight flex items-center gap-1">
                伴伴記<span className="text-rose-500 text-xs sm:text-sm animate-pulse">❤️</span>
              </h1>
              
              {/* 🏷️ 系統版本號標籤 (點擊可查看版本與環境詳情) */}
              <button
                type="button"
                onClick={onOpenVersionInfo || onOpenSettings}
                className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#EDE8DC] hover:bg-[#E0DBD0] text-[#635B4E] hover:text-[#2C2824] border border-[#DDD6C8] transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0 select-none"
                title="點擊查看版本與運行環境"
              >
                {APP_VERSION}
              </button>

              {currentUser?.isDevSandbox && (
                <button
                  type="button"
                  onClick={onOpenDevSettings}
                  className="text-[9px] font-extrabold bg-purple-100 hover:bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded-md border border-purple-300 flex items-center gap-0.5 shrink-0 cursor-pointer shadow-2xs active:scale-95"
                  title="開啟 DEV 控制台"
                >
                  <span>🛠️ DEV</span>
                </button>
              )}
            </div>
          </div>

          {/* 桌機版中間：模式切換器 (在 sm 以上螢幕置中顯示) */}
          <div className="hidden sm:flex items-center p-1 bg-[#F0ECE1] rounded-2xl border border-[#E2DDD0] shadow-inner gap-1">
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                appMode === 'fund'
                  ? 'bg-white text-[#3E3A36] shadow-xs border border-[#DCD6C9]'
                  : 'text-[#8C8475] hover:text-[#3E3A36]'
              }`}
            >
              <span className="text-sm">🌸</span>
              <span>公積金模式</span>
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 relative whitespace-nowrap active:scale-95 ${
                appMode === 'split'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-xs'
                  : 'text-[#8C8475] hover:text-[#3E3A36]'
              }`}
            >
              <span className="text-sm">💳</span>
              <span>代墊借還</span>
              {unsettledSplitCount > 0 && (
                <span className={`min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center ${
                  appMode === 'split' ? 'bg-white text-rose-700' : 'bg-rose-500 text-white'
                }`}>
                  {unsettledSplitCount}
                </span>
              )}
            </button>
          </div>

          {/* 右側按鈕群：極簡化（僅保留匯率、通知與個人頭像） */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* ✈️ 💱 即時匯率按鈕 */}
            <button
              type="button"
              onClick={onOpenTravelCalculator}
              className="h-8.5 px-2.5 rounded-xl bg-[#F4F0E6] hover:bg-[#EAE4D8] text-[#5C564E] border border-[#E0DBD0] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95 text-xs font-bold"
              title="開啟出國各國即時匯率換算器"
              aria-label="即時匯率換算"
            >
              <span className="text-sm leading-none">💱</span>
              <span className="hidden min-[420px]:inline text-[11px] text-[#5C564E]">匯率</span>
            </button>

            {/* 🔔 通知按鈕 */}
            {onOpenNotifySettings && (
              <button
                type="button"
                onClick={onOpenNotifySettings}
                className="h-8.5 w-8.5 rounded-xl bg-[#F4F0E6] hover:bg-[#EAE4D8] text-[#5C564E] border border-[#E0DBD0] flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 relative"
                title="推播與通知中心"
                aria-label="通知中心"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
            )}

            {/* 👤 使用者頭像 (點擊打開左側抽屜設定) */}
            <button
              type="button"
              onClick={() => {
                if (!currentUser && onReturnToLoginPortal) {
                  onReturnToLoginPortal();
                } else {
                  onOpenSettings();
                }
              }}
              className="h-8.5 px-2 rounded-xl flex items-center justify-center gap-1.5 bg-white hover:bg-[#F7F5EE] text-[#3E3A36] border border-[#DDD7C9] transition-all cursor-pointer shadow-2xs active:scale-95 relative font-bold text-xs"
              title={currentUser ? '開啟設定與帳戶中心' : '點擊登入'}
              aria-label={currentUser ? '設定' : '登入'}
            >
              {currentUser?.avatar ? (
                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-[#D5D0C3]">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.nickname || currentUser.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : currentUser ? (
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-[10px] font-bold">
                  {(currentUser.nickname || currentUser.name || '我')[0]}
                </span>
              ) : (
                <LogIn className="w-3.5 h-3.5 text-amber-800 shrink-0" />
              )}
              
              <span className="hidden min-[460px]:inline-block text-xs font-bold truncate max-w-[70px]">
                {currentUser ? (currentUser.nickname || currentUser.name) : '登入'}
              </span>

              {(!gasWebUrl || pendingQueueCount > 0) && currentUser && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 border border-white animate-pulse" />
              )}
            </button>
          </div>

        </div>

        {/* 手機版專屬第二列：全寬精美 Segment 切換器 */}
        <div className="sm:hidden mt-2 pt-1.5 border-t border-[#ECE8DE]/70">
          <div className="grid grid-cols-2 p-1 bg-[#F0ECE1] rounded-xl border border-[#E2DDD0] shadow-inner gap-1">
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
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 min-w-0 ${
                appMode === 'fund'
                  ? 'bg-white text-[#3E3A36] shadow-xs border border-[#DCD6C9]'
                  : 'text-[#8C8475] hover:text-[#3E3A36]'
              }`}
            >
              <span className="shrink-0">🌸</span>
              <span className="truncate whitespace-nowrap">公積金模式</span>
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
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 relative active:scale-95 min-w-0 ${
                appMode === 'split'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-xs'
                  : 'text-[#8C8475] hover:text-[#3E3A36]'
              }`}
            >
              <span className="shrink-0">💳</span>
              <span className="truncate whitespace-nowrap">代墊借還</span>
              {unsettledSplitCount > 0 && (
                <span className={`min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center shrink-0 ${
                  appMode === 'split' ? 'bg-white text-rose-700' : 'bg-rose-500 text-white'
                }`}>
                  {unsettledSplitCount}
                </span>
              )}
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
