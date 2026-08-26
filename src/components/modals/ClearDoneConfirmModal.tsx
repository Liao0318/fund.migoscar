import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { ShoppingItem } from '../../types';

interface ClearDoneConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  doneCount?: number;
  shoppingItems?: ShoppingItem[];
  onConfirm: () => void;
}

export const ClearDoneConfirmModal: React.FC<ClearDoneConfirmModalProps> = ({
  isOpen,
  onClose,
  doneCount,
  shoppingItems = [],
  onConfirm
}) => {
  const displayCount = doneCount !== undefined ? doneCount : (shoppingItems ? shoppingItems.filter(i => i.status === '已買到').length : 0);

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
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#3E3A36]">清空已購項目？</h3>
            <p className="text-xs text-[#7A7469] mt-2 leading-relaxed">
              確定要一次性刪除所有已標記為「已買到」的 <span className="font-bold text-rose-600">{displayCount}</span> 個品項嗎？清空後將無法復原。
            </p>
            <div className="flex items-center gap-2.5 mt-6 pt-2 border-t border-[#F2F0E8]">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-[#DDD8CC] text-[#706B62] font-semibold text-xs transition-colors hover:bg-[#FAF9F5] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
              >
                確定清空
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
