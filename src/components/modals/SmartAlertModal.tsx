import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface SmartAlert {
  id: string;
  title: string;
  message: string;
}

interface SmartAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts?: SmartAlert[];
  smartAlerts?: SmartAlert[];
}

export const SmartAlertModal: React.FC<SmartAlertModalProps> = ({
  isOpen,
  onClose,
  alerts,
  smartAlerts
}) => {
  const displayAlerts = alerts || smartAlerts || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#3E3A36]/50 backdrop-blur-xs transition-opacity"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative z-60 border border-red-100"
          >
            <button 
              onClick={onClose}
              className="absolute right-5 top-5 p-2 rounded-xl text-[#A59F94] hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pt-2 space-y-3.5">
              <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mx-auto text-xl shadow-inner animate-bounce">
                🚨
              </div>
              <h3 className="text-base font-bold text-red-900 whitespace-nowrap">入不敷出！收支警示提醒</h3>
              
              <div className="text-xs text-[#625E56] text-left bg-red-50/50 p-4 rounded-xl border border-red-100/50 space-y-2.5 max-h-60 overflow-y-auto">
                <p className="font-semibold text-red-800 whitespace-nowrap">偵測到部分月份支出大於公積金撥款：</p>
                {displayAlerts.map((alert) => (
                  <div key={alert.id} className="border-b border-red-100/30 pb-2 last:border-0 last:pb-0">
                    <strong className="text-red-900 text-[11px] block whitespace-nowrap">{alert.title}</strong>
                    <span className="text-[10px] leading-relaxed text-[#7A756C] block mt-0.5">{alert.message}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-red-900 hover:bg-red-950 text-white font-semibold text-xs tracking-wider transition-all cursor-pointer whitespace-nowrap"
                >
                  我已瞭解，會格外注意省錢做好預算管理！
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
