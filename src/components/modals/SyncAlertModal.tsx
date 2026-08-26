import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface SyncAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncAlertModal: React.FC<SyncAlertModalProps> = ({
  isOpen,
  onClose
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative z-60 border border-[#EBE8E0]"
          >
            <button 
              onClick={onClose}
              className="absolute right-5 top-5 p-2 rounded-xl text-[#A59F94] hover:bg-[#EEEDE9] hover:text-[#3E3A36] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pt-2 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200/50 flex items-center justify-center text-amber-700 mx-auto text-xl shadow-inner">
                ⚠️
              </div>
              <h3 className="text-base font-semibold text-[#4A4641]">您正使用「安全沙盒模擬模式」</h3>
              <div className="text-xs text-[#7A756E] leading-relaxed text-left bg-[#FAF9F5]/80 p-4 rounded-xl border border-[#EEEDE4] space-y-2">
                <p>
                  本記帳系統具備 100% 同步 Google 試算表架構。
                </p>
                <p>
                  目前您正處於本機模擬預覽狀態，您的記帳、篩選與刪除流水帳明細會安全的保存在<strong>本機瀏覽器快取 (LocalStorage)</strong> 中。
                </p>
              </div>
              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button 
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-[#4D4942] hover:bg-[#322F2A] text-white font-semibold tracking-wider transition-all cursor-pointer"
                >
                  我知道了
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
