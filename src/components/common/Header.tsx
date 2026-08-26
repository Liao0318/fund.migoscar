import React from 'react';
import { BellRing, Database, RefreshCw, Smartphone } from 'lucide-react';

interface HeaderProps {
  isOnline: boolean;
  isBackgroundSyncing: boolean;
  lastSyncedAt: string;
  appMode: 'fund' | 'split';
  setAppMode: (mode: 'fund' | 'split') => void;
  unsettledSplitCount: number;
  onOpenLineSettings: () => void;
  onOpenTravelCalculator: () => void;
  pendingQueueCount?: number;
  onOpenDataBackup?: () => void;
  onFlushQueue?: () => void;
  onOpenPwaInstall?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline,
  isBackgroundSyncing,
  lastSyncedAt,
  appMode,
  setAppMode,
  unsettledSplitCount,
  onOpenLineSettings,
  onOpenTravelCalculator,
  pendingQueueCount = 0,
  onOpenDataBackup,
  onFlushQueue,
  onOpenPwaInstall
}) => {
  return (
    <header className="w-full max-w-4xl mx-auto px-3 sm:px-4 mt-4 sm:mt-6 md:mt-8 mb-4 sm:mb-6 font-sans">
      <div className="bg-white/70 backdrop-blur-md border border-white/50 rounded-2xl p-3.5 sm:px-6 sm:py-5 flex flex-col sm:flex-row items-center justify-between shadow-2xs border-[#E9E6E0] gap-3 sm:gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 select-none drop-shadow-2xs">
            <rect width="44" height="44" rx="12" fill="#E26D6C" />
            <path d="M 22,33 C 22,33 11,25 11,17 C 11,13 14,10 18,10 C 20.5,10 21.5,11.5 22,13.5 C 22.5,11.5 23.5,10 26,10 C 30,10 33,13 33,17 C 33,25 22,33 22,33 Z" fill="#FFFDF8" opacity="0.95" />
            <circle cx="22" cy="20" r="4.5" fill="#E26D6C" />
            <rect x="20.2" y="18.2" width="3.6" height="3.6" rx="0.8" fill="#FFFDF8" />
          </svg>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#3E3A36] flex items-center gap-1">
                伴伴記<span className="text-rose-500 text-base sm:text-lg">❤️</span>
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-[#8C8475] font-light mt-0.5 truncate">公積金與代墊記帳</p>
          </div>
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
            {/* 💬 LINE 通知開關 Quick Action (圖示版) */}
            <button
              type="button"
              onClick={onOpenLineSettings}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/90 flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
              title="自訂各項 LINE 即時通知推播開關"
              aria-label="LINE 通知設定"
            >
              <BellRing className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
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
          </div>
        </div>
      </div>
    </header>
  );
};
