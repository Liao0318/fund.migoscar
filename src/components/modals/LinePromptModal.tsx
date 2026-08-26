import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LinePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkJoined: () => void;
}

export const LinePromptModal: React.FC<LinePromptModalProps> = ({
  isOpen,
  onClose,
  onMarkJoined
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#3E3A36]/40 backdrop-blur-xs transition-opacity"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative z-60 border border-[#EBE8E0]"
          >
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-[#06C755] mx-auto text-2xl shadow-inner">
                💬
              </div>
              <h3 className="text-sm font-semibold text-[#3E3A36] leading-tight">
                歡迎使用伴伴記！記得加入官方 LINE 帳號
              </h3>
              <p className="text-xs text-[#7A756E] leading-relaxed text-left bg-[#FAF9F5]/80 p-4 rounded-xl border border-[#EEEDE4]">
                初次使用提醒：請記得加入我們的官方 LINE 帳號，掌握第一手代墊登錄、款項撥付與月底對帳即時通知！
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 text-xs">
                <a 
                  href="https://lin.ee/tHfDgoL" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#06C755] hover:bg-[#05AB49] text-white font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  👉 點我加入官方 LINE
                </a>
                <button 
                  onClick={onMarkJoined}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#8C8475] hover:bg-[#726A5C] text-white font-semibold transition-all cursor-pointer shadow-xs whitespace-nowrap"
                >
                  已加入！
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
