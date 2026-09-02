import React from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface FloatingChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
  unreadCount?: number;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ 
  onClick, 
  isOpen,
  unreadCount = 0 
}) => {
  if (isOpen) return null;

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: -420, bottom: 60 }}
      dragElastic={0.15}
      dragMomentum={false}
      whileDrag={{ scale: 1.08 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 260 }}
      className="fixed bottom-40 sm:bottom-32 right-3.5 sm:right-6 z-40 touch-none"
    >
      <button
        type="button"
        onClick={onClick}
        className="group relative flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-[0_8px_25px_rgba(16,185,129,0.45)] hover:shadow-[0_10px_30px_rgba(16,185,129,0.6)] hover:scale-108 active:scale-95 transition-all duration-300 cursor-pointer border-2 border-white/80 select-none"
        title="開啟智慧對話記帳小秘書與今日通知（可上下拖移位置）"
      >
        {/* 動態波紋光暈 */}
        <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-30 animate-ping pointer-events-none" />

        {/* 圖示 */}
        <div className="relative flex items-center justify-center">
          <MessageCircle className="w-6 h-6 sm:w-6.5 sm:h-6.5 stroke-[2.2]" />
          
          {unreadCount > 0 ? (
            <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 bg-red-500 rounded-full text-[10px] text-white font-extrabold flex items-center justify-center border-2 border-white shadow-md animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400 border border-white"></span>
            </span>
          )}
        </div>

        {/* 桌面版 Hover 提示標籤 */}
        <div className="hidden sm:group-hover:flex absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-[#2C3E50]/95 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xl border border-white/10 whitespace-nowrap items-center gap-1.5 pointer-events-none transition-all">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>對話記帳 & 今日通知 {unreadCount > 0 ? `(${unreadCount})` : ''}</span>
        </div>
      </button>
    </motion.div>
  );
};

