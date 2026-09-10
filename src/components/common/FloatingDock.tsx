import React from 'react';
import { Home, List, Plus, ShoppingBag, Plane, Wallet, Settings } from 'lucide-react';

interface FloatingDockProps {
  activeTab: 'home' | 'history' | 'settlement' | 'notebook' | string;
  setActiveTab: (tab: 'home' | 'history' | 'settlement' | 'notebook') => void;
  appMode: 'fund' | 'split';
  unsettledSplitCount?: number;
  uncompletedShoppingCount?: number;
  unsettledCount?: number;
  pendingShoppingCount?: number;
  onOpenAdd: () => void;
  onOpenSettings?: () => void;
  hasSettingsAlert?: boolean;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
  activeTab,
  setActiveTab,
  appMode,
  unsettledSplitCount,
  uncompletedShoppingCount,
  unsettledCount,
  pendingShoppingCount,
  onOpenAdd,
  onOpenSettings,
  hasSettingsAlert = false
}) => {
  const effectiveUnsettled = unsettledSplitCount ?? unsettledCount ?? 0;
  const effectiveShopping = uncompletedShoppingCount ?? pendingShoppingCount ?? 0;

  return (
    <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[calc(100%-1.25rem)] sm:w-[calc(100%-1.5rem)] bg-white/95 backdrop-blur-xl border border-[#EEEDE3] shadow-[0_12px_30px_rgba(140,132,117,0.15)] rounded-2xl sm:rounded-3xl py-2 sm:py-2.5 px-1 grid grid-cols-5 items-center justify-items-center">
      {/* Tab 1: 首頁 */}
      <button 
        type="button"
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all duration-200 cursor-pointer w-full py-1 ${
          activeTab === 'home' 
            ? (appMode === 'split' ? 'text-rose-600 scale-105 font-bold' : 'text-[#8C8475] scale-105 font-bold') 
            : 'text-[#A39E92] hover:text-[#5C564E]'
        }`}
      >
        <Home className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[10px] sm:text-[11px] font-medium leading-tight whitespace-nowrap px-0.5">首頁</span>
      </button>

      {/* Tab 2: 歷史流水帳 / 代墊明細 */}
      <button 
        type="button"
        onClick={() => setActiveTab('history')}
        className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all duration-200 cursor-pointer w-full py-1 relative ${
          activeTab === 'history' 
            ? (appMode === 'split' ? 'text-rose-600 scale-105 font-bold' : 'text-[#8C8475] scale-105 font-bold') 
            : 'text-[#A39E92] hover:text-[#5C564E]'
        }`}
      >
        <List className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[10px] sm:text-[11px] font-medium leading-tight whitespace-nowrap px-0.5">
          {appMode === 'split' ? '明細' : '明細'}
        </span>
        {appMode === 'split' && effectiveUnsettled > 0 && (
          <span className="absolute -top-0.5 right-1 sm:right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center leading-none shadow-xs">
            {effectiveUnsettled}
          </span>
        )}
      </button>

      {/* 中間大圓 + 號：新增款項 */}
      <div className="relative -mt-6 sm:-mt-7 mx-1 flex justify-center w-full">
        <button 
          type="button"
          onClick={onOpenAdd}
          className={`w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-full active:scale-95 text-[#F8F7F3] flex items-center justify-center transition-all duration-300 cursor-pointer ${
            appMode === 'split'
              ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-[0_6px_20px_rgba(225,29,72,0.35)]'
              : 'bg-[#4D4942] hover:bg-[#322F2A] shadow-[0_6px_18px_rgba(77,73,66,0.3)] hover:shadow-[0_8px_24px_rgba(77,73,66,0.4)]'
          }`}
          title={appMode === 'split' ? '快速新增代墊款項' : '新增公積金或支出項目'}
          aria-label="新增記帳"
        >
          <Plus className="w-5 h-5 sm:w-[22px] sm:h-[22px] stroke-[2.5]" />
        </button>
      </div>

      {/* Tab 3: 購物記事 (公積金) / 旅遊分帳 (代墊借還) */}
      <button 
        type="button"
        onClick={() => setActiveTab('notebook')}
        className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all duration-200 cursor-pointer w-full py-1 relative ${
          activeTab === 'notebook' 
            ? (appMode === 'split' ? 'text-rose-600 scale-105 font-bold' : 'text-amber-800 scale-105 font-bold') 
            : 'text-[#A39E92] hover:text-[#5C564E]'
        }`}
      >
        {appMode === 'split' ? (
          <Plane className="w-4 h-4 sm:w-5 sm:h-5" />
        ) : (
          <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
        )}
        <span className="text-[10px] sm:text-[11px] font-medium leading-tight whitespace-nowrap px-0.5">
          {appMode === 'split' ? '旅遊' : '購物'}
        </span>
        {appMode === 'fund' && effectiveShopping > 0 && (
          <span className="absolute -top-0.5 right-1 sm:right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center leading-none shadow-xs">
            {effectiveShopping}
          </span>
        )}
      </button>

      {/* Tab 4: 公積金銷帳 / 代墊對帳結算 */}
      <button 
        type="button"
        onClick={() => setActiveTab('settlement')}
        className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all duration-200 cursor-pointer w-full py-1 relative ${
          activeTab === 'settlement'
            ? (appMode === 'split' ? 'text-rose-600 scale-105 font-bold' : 'text-emerald-700 scale-105 font-bold') 
            : 'text-[#A39E92] hover:text-[#5C564E]'
        }`}
        title={appMode === 'split' ? '代墊借還對帳與清償' : '公積金月度銷帳與撥款'}
      >
        <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[10px] sm:text-[11px] font-medium leading-tight whitespace-nowrap px-0.5">
          {appMode === 'split' ? '結算' : '銷帳'}
        </span>
      </button>
    </div>
  );
};
