import React from 'react';
import { Sparkles, Bell } from 'lucide-react';
import { BrandLogo } from './BrandLogo.tsx';
import { AuthUser } from '../../types';

interface HeaderProps {
  isOnline: boolean;
  isBackgroundSyncing: boolean;
  lastSyncedAt: string;
  appMode: 'fund' | 'split';
  setAppMode: (mode: 'fund' | 'split') => void;
  unsettledSplitCount: number;
  onOpenTravelCalculator: () => void;
  onOpenSettings: () => void;
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
}

export const Header: React.FC<HeaderProps> = ({
  appMode,
  setAppMode,
  unsettledSplitCount,
  onOpenTravelCalculator,
  onOpenSettings,
  onOpenNotifySettings,
  unreadNotificationCount = 0,
  pendingQueueCount = 0,
  currentUser,
  isSandboxMode = false,
  gasWebUrl = ''
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full font-sans bg-[#FAF9F5]/95 backdrop-blur-xl border-b border-[#EAE6DC] shadow-[0_2px_12px_rgba(62,58,54,0.04)]">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-1.5 sm:py-2.5">
        
        {/* 頂部主列：品牌識別與功能操作 */}
        <div className="flex items-center justify-between gap-2">
          
          {/* 左側：品牌 Logo 與名稱 */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <BrandLogo className="w-7.5 h-7.5 sm:w-9 sm:h-9 shrink-0 select-none drop-shadow-2xs rounded-xl" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-lg font-black tracking-tight text-[#3E3A36] leading-none flex items-center gap-1">
                  伴伴記<span className="text-rose-500 text-xs sm:text-base animate-pulse">❤️</span>
                </h1>
                {isSandboxMode && (
                  <span className="text-[9px] sm:text-[9.5px] font-extrabold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-md border border-amber-300 flex items-center gap-0.5 shrink-0" title="目前為本機離線試用模式">
                    <Sparkles className="w-2.5 h-2.5 text-amber-700" />
                    <span>試用</span>
                  </span>
                )}
              </div>
              <p className="hidden sm:block text-[10px] text-[#8C8475] font-medium tracking-wide mt-0.5">雙人公積金與代墊分帳</p>
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 relative whitespace-nowrap active:scale-95 ${
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

          {/* 右側按鈕群：匯率 + 通知 + 設定頭像 */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* ✈️ 💱 即時匯率按鈕 */}
            <button
              type="button"
              onClick={onOpenTravelCalculator}
              className="h-8.5 px-2.5 sm:px-3 rounded-xl bg-[#F4F0E6] hover:bg-[#EAE4D8] text-[#5C564E] border border-[#E0DBD0] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95 text-xs font-bold"
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

            {/* ⚙️ 設定 / 使用者頭像 */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="h-8.5 pl-1.5 pr-2.5 sm:px-3 rounded-xl bg-white hover:bg-[#F7F5EE] text-[#3E3A36] border border-[#DDD7C9] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 relative font-bold text-xs"
              title="開啟系統設定與帳戶中心 (Google帳號、金鑰、備份、手機安裝)"
              aria-label="系統設定"
            >
              {currentUser?.avatar ? (
                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-[#D5D0C3] ring-1 ring-rose-300">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.nickname || currentUser.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <span className="text-sm">⚙️</span>
              )}
              <span className="text-xs font-extrabold text-[#3E3A36]">
                {currentUser?.nickname || currentUser?.name || '設定'}
              </span>
              {(!gasWebUrl || pendingQueueCount > 0) && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white animate-pulse" />
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
              className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                appMode === 'fund'
                  ? 'bg-white text-[#3E3A36] shadow-xs border border-[#DCD6C9]'
                  : 'text-[#8C8475] hover:text-[#3E3A36]'
              }`}
            >
              <span>🌸</span>
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
              className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 relative active:scale-95 ${
                appMode === 'split'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-xs'
                  : 'text-[#8C8475] hover:text-[#3E3A36]'
              }`}
            >
              <span>💳</span>
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
        </div>

      </div>
    </header>
  );
};

