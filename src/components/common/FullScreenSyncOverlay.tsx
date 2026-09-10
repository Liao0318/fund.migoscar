import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, CheckCircle2, Database, ShieldCheck, ArrowRight } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export interface FullScreenSyncOverlayProps {
  isVisible: boolean;
  step?: number; // 1: 帳號驗證, 2: 雲端連線, 3: 帳本同步, 4: 完成
  statusText?: string;
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
  onSkip?: () => void;
}

export const FullScreenSyncOverlay: React.FC<FullScreenSyncOverlayProps> = ({
  isVisible,
  step = 1,
  statusText = '正在同步雲端帳本資料...',
  userEmail,
  userName,
  userAvatar,
  onSkip
}) => {
  const [showSkip, setShowSkip] = useState(false);

  // 若網路較慢超過 4 秒，提供「直接進入」的按鈕，防止使用者卡住
  useEffect(() => {
    if (!isVisible) {
      setShowSkip(false);
      return;
    }
    const timer = setTimeout(() => {
      setShowSkip(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, [isVisible]);

  const stepsList = [
    { num: 1, label: '驗證身分' },
    { num: 2, label: '連線資料庫' },
    { num: 3, label: '載入帳本' }
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="fullscreen-sync-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.35, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FBF9F5]/98 backdrop-blur-xl select-none px-6 text-center font-sans overflow-hidden"
        >
          {/* 背景柔和流動漸層光暈 */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] bg-gradient-to-tr from-amber-200/25 via-emerald-100/20 to-orange-100/25 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />

          {/* 中央同步視覺卡片 */}
          <div className="relative flex flex-col items-center max-w-sm sm:max-w-md w-full">
            
            {/* 旋轉外圈光環 + 伴伴記核心 Logo */}
            <div className="relative mb-7 flex items-center justify-center">
              {/* 外圈光環擴散動畫 */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.7, 0.35] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-amber-400/20 via-emerald-400/20 to-amber-500/20 blur-md pointer-events-none"
              />

              {/* 旋轉微粒軌道環 */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-dashed border-amber-600/30"
              />

              {/* 旋轉發光指示點 */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                className="absolute w-24 h-24 sm:w-28 sm:h-28"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-amber-600 shadow-sm shadow-amber-500 -top-1 left-1/2 -translate-x-1/2 absolute" />
              </motion.div>

              {/* 核心 Logo 卡片 */}
              <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-xl shadow-amber-900/5 border border-[#EDE8DE] flex items-center justify-center p-3.5 z-10">
                <BrandLogo className="w-full h-full" />
              </div>
            </div>

            {/* 標題與即時動態提示 */}
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl sm:text-2xl font-bold tracking-tight text-[#3E3A36] mb-2 flex items-center gap-2"
            >
              <span>正在同步雲端帳本</span>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="inline-block text-amber-700"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.span>
            </motion.h2>

            {/* 狀態說明文字 */}
            <motion.p
              key={statusText}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="text-xs sm:text-sm text-[#736B5E] min-h-[22px] font-medium tracking-wide mb-6"
            >
              {statusText}
            </motion.p>

            {/* 動態進度條 */}
            <div className="w-full bg-[#EAE5DA] h-1.5 rounded-full overflow-hidden mb-6 relative">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-600 rounded-full"
                initial={{ width: '25%' }}
                animate={{
                  width: step === 1 ? '35%' : step === 2 ? '68%' : step >= 3 ? '95%' : '100%'
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </div>

            {/* 3 階段狀態標籤 */}
            <div className="grid grid-cols-3 gap-2 w-full mb-7">
              {stepsList.map((item) => {
                const isPassed = step > item.num;
                const isCurrent = step === item.num;
                return (
                  <div
                    key={item.num}
                    className={`py-2 px-2.5 rounded-xl text-center border transition-all duration-300 flex flex-col items-center gap-1 ${
                      isCurrent
                        ? 'bg-amber-50/90 border-amber-300/80 text-amber-900 shadow-xs'
                        : isPassed
                        ? 'bg-emerald-50/70 border-emerald-300/60 text-emerald-800'
                        : 'bg-white/60 border-[#E8E2D6] text-[#A69E90]'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[11px] font-semibold">
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : isCurrent ? (
                        <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
                      ) : (
                        <span className="w-3 h-3 rounded-full bg-[#DCD5C9] text-white text-[9px] flex items-center justify-center font-bold">
                          {item.num}
                        </span>
                      )}
                      <span>{item.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 登入身分資訊小標籤 */}
            {(userEmail || userName) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-[#E8E2D5] shadow-2xs mb-5"
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt="avatar"
                    className="w-4 h-4 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center">
                    {(userName || userEmail || 'G').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-[#595247] font-medium truncate max-w-[210px]">
                  {userName ? `${userName} (${userEmail})` : userEmail}
                </span>
              </motion.div>
            )}

            {/* 安全提示標籤 */}
            <div className="flex items-center gap-1.5 text-[11px] text-[#8C8474]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>直連您的 Google 雲端試算表與個人空間，數據絕不外流</span>
            </div>

            {/* 連線若久未回應時出現的「直接進入」按鈕 */}
            {showSkip && onSkip && (
              <motion.button
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={onSkip}
                className="mt-6 inline-flex items-center gap-1.5 text-xs text-amber-800 font-medium py-1.5 px-4 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-200 transition-colors cursor-pointer"
              >
                <span>連線稍慢？點擊直接進入帳本</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            )}

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
