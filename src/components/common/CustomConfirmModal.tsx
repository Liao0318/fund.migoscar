import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomConfirmState } from '../../types';

interface CustomConfirmModalProps {
  state: CustomConfirmState | null;
  onClose: () => void;
}

export const CustomConfirmModal: React.FC<CustomConfirmModalProps> = ({ state, onClose }) => {
  return (
    <AnimatePresence>
      {state && state.isOpen && (
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
              <div className={`w-12 h-12 rounded-full border flex items-center justify-center mx-auto text-xl shadow-inner ${
                state.isDanger
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-amber-50 border-amber-200/40 text-amber-700'
              }`}>
                {state.isDanger ? '🗑️' : '❓'}
              </div>
              <h3 className="text-sm font-semibold text-[#3E3A36] leading-tight">
                {state.title}
              </h3>
              <p className="text-xs text-[#7A756E] leading-relaxed text-left bg-[#FAF9F5]/80 p-4 rounded-xl border border-[#EEEDE4]">
                {state.message}
              </p>
              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button 
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#DDD9CE] hover:bg-[#EEEDE9] text-[#706B62] font-semibold transition-colors cursor-pointer"
                >
                  {state.cancelText || '取消'}
                </button>
                <button 
                  onClick={() => {
                    state.onConfirm();
                    onClose();
                  }}
                  className={`px-5 py-2.5 rounded-xl text-white font-semibold transition-all cursor-pointer shadow-xs ${
                    state.isDanger
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-[#8C8475] hover:bg-[#726A5C]'
                  }`}
                >
                  {state.confirmText || '確定'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
