import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info, X } from 'lucide-react';

export interface ToastData {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface CenterToastProps {
  toast: ToastData | null;
}

export const CenterToast: React.FC<CenterToastProps> = ({ toast }) => {
  return (
    <AnimatePresence>
      {toast && (
        <div 
          id="center-toast-overlay"
          className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center p-4 select-none"
          aria-live="assertive"
        >
          <motion.div
            id="center-toast-card"
            initial={{ opacity: 0, scale: 0.75, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -10, transition: { duration: 0.15 } }}
            transition={{ 
              type: 'spring', 
              stiffness: 420, 
              damping: 24,
              mass: 0.8
            }}
            className="flex flex-col items-center justify-center min-w-[160px] max-w-[320px] sm:max-w-[380px] bg-[#2C2925]/92 backdrop-blur-md text-white px-5 py-4 sm:px-6 sm:py-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] border border-white/15"
          >
            {/* 🎯 頂部動畫圖示區 */}
            <div className="mb-2.5 flex items-center justify-center">
              {toast.type === 'success' && (
                <motion.div
                  initial={{ scale: 0.5, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                  className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400/80 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.35)]"
                >
                  <svg 
                    className="w-7 h-7" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3.2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <motion.path
                      d="M4.5 12.5L9.5 17.5L19.5 6.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.28, ease: 'easeOut', delay: 0.08 }}
                    />
                  </svg>
                </motion.div>
              )}

              {toast.type === 'error' && (
                <motion.div
                  initial={{ scale: 0.5, rotate: 20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                  className="w-12 h-12 rounded-full bg-rose-500/20 border-2 border-rose-400/80 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(251,113,133,0.35)]"
                >
                  <X className="w-7 h-7 stroke-[3]" />
                </motion.div>
              )}

              {toast.type === 'info' && (
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                  className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-400/80 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.35)]"
                >
                  <Info className="w-6 h-6 stroke-[2.5]" />
                </motion.div>
              )}
            </div>

            {/* 📝 訊息內容 */}
            <p className="text-[13px] sm:text-sm font-medium text-neutral-100 text-center tracking-wide leading-relaxed break-words">
              {toast.message}
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
