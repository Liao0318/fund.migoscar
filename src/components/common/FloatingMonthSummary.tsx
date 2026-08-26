import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet } from 'lucide-react';

interface FloatingMonthSummaryProps {
  activeTab: string;
  isFloatingBarDismissed: boolean;
  setIsFloatingBarDismissed: (val: boolean) => void;
  latestMonth: string;
  liaoLatestTotal: number;
  zhouLatestTotal: number;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const FloatingMonthSummary: React.FC<FloatingMonthSummaryProps> = ({
  activeTab,
  isFloatingBarDismissed,
  setIsFloatingBarDismissed,
  latestMonth,
  liaoLatestTotal,
  zhouLatestTotal,
  showToast
}) => {
  return (
    <>
      <AnimatePresence>
        {(activeTab === 'home' || activeTab === 'history') && !isFloatingBarDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 max-w-md w-[calc(100%-2rem)] bg-[#4D4942]/95 backdrop-blur-md border border-[#5C564E] shadow-[0_8px_25px_rgba(77,73,66,0.25)] rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3.5 flex items-center justify-between gap-2"
          >
            <div className="text-[10px] sm:text-xs text-[#DDD9CE] font-bold tracking-wider flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D5CDBC]" />
              <span>{latestMonth} 月當前累計代墊：</span>
            </div>
            <div className="flex gap-2 sm:gap-3.5 items-center shrink-0">
              <div className="text-[11px] sm:text-xs text-white whitespace-nowrap">
                L: <span className="font-mono font-bold text-[#EFC38E]">$ {liaoLatestTotal.toLocaleString('zh-TW')}</span>
              </div>
              <div className="text-[11px] sm:text-xs text-white whitespace-nowrap">
                P: <span className="font-mono font-bold text-[#EFC38E]">$ {zhouLatestTotal.toLocaleString('zh-TW')}</span>
              </div>
              
              <button
                onClick={() => {
                  setIsFloatingBarDismissed(true);
                  showToast('已暫時收合累計代墊，可點擊右下角錢包圖示重新展開', 'info');
                }}
                className="ml-1 text-white/50 hover:text-white transition-colors cursor-pointer text-xs font-bold leading-none p-1"
                title="暫時關閉看板"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(activeTab === 'home' || activeTab === 'history') && isFloatingBarDismissed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsFloatingBarDismissed(false)}
            className="fixed bottom-[88px] right-4 z-30 w-10 h-10 rounded-full bg-[#4D4942]/95 hover:bg-[#3E3A35] text-white flex items-center justify-center shadow-lg border border-[#5C564E] cursor-pointer"
            title="展開累計代墊"
          >
            <Wallet className="w-5 h-5 text-[#EFC38E]" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};
