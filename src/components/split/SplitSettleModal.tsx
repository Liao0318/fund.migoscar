import React, { useState } from 'react';
import { 
  CheckCircle2, 
  X, 
  Sparkles, 
  AlertCircle, 
  Receipt,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SplitSummary } from '../../types';

interface SplitSettleModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: SplitSummary;
  onConfirmSettle?: (settleNote?: string) => void;
  onSettle?: (settleNote?: string) => void;
}

export const SplitSettleModal: React.FC<SplitSettleModalProps> = ({
  isOpen,
  onClose,
  summary,
  onConfirmSettle,
  onSettle,
}) => {
  const [settleNote, setSettleNote] = useState('');

  const handleConfirm = () => {
    const noteText = settleNote.trim();
    if (onConfirmSettle) {
      onConfirmSettle(noteText);
    } else if (onSettle) {
      onSettle(noteText);
    }
    onClose();
    setSettleNote('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-[#FAF9F5] rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col border border-[#E8E4D9] shadow-2xl overflow-hidden"
          >
            {/* Header (固定頂部) */}
            <div className="flex items-center justify-between border-b border-[#EDE8DC] p-5 sm:px-7 pb-4 shrink-0 bg-[#FAF9F5]">
              <h3 className="text-base font-bold text-[#3E3A36] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>確認一鍵全部結清歸零</span>
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-[#8C8475] hover:text-[#3E3A36] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content (可滑動區域) */}
            <div className="p-5 sm:p-7 flex-1 overflow-y-auto space-y-4 text-xs text-[#6E6659]">
              <p className="leading-relaxed">
                您即將結清目前所有 <strong>{summary?.unsettledCount || 0} 筆</strong> 待結算之代墊款項。確認後，系統將自動於 Google 試算表蓋印結清狀態，並將雙方債務歸零！
              </p>

              {/* 金額統計卡 */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-center space-y-1">
                <div className="text-[11px] font-bold text-emerald-800">
                  {!summary || summary.netDebtor === 'none'
                    ? '目前無須返還款項'
                    : `應由 ${summary.netDebtor === '廖' ? '廖廖' : '周周'} 返還給 ${summary.netDebtor === '廖' ? '周周' : '廖廖'}`}
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-700">
                  NT$ {(Number(summary?.netAmount) || 0).toLocaleString()} 元
                </div>
              </div>

              {/* 備註輸入 */}
              <div>
                <label className="block text-xs font-bold text-[#6E6659] mb-1">
                  結清備註說明 (選填)
                </label>
                <input
                  type="text"
                  value={settleNote}
                  onChange={(e) => setSettleNote(e.target.value)}
                  placeholder="例：已透過 LINE Pay / 網銀轉帳結清"
                  className="w-full px-3 py-2 bg-white border border-[#DDD8CD] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Actions (固定底部操作列) */}
            <div className="p-4 sm:px-7 border-t border-[#EDE8DC] bg-[#FAF9F5] shrink-0 flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-[#DDD8CD] text-[#6E6659] text-xs font-bold hover:bg-[#F2EEE6] transition-colors cursor-pointer"
              >
                返回
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>確認已結清！</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
