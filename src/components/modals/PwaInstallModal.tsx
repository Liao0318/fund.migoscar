import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Smartphone, Share2, Check, Sparkles, X, PlusSquare, ArrowUpRight } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstalled?: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalled
}) => {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);
    setIsStandalone(!!isInStandaloneMode);
  }, []);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          if (onInstalled) onInstalled();
          onClose();
        }
      } catch (err) {
        console.error('PWA install prompt error:', err);
      } finally {
        setInstalling(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-[#FAF9F5] rounded-2xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-[#E5E0D2] my-auto flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E8E4D9] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold border border-rose-200/70">
                  <Smartphone className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#3E3A36] text-sm sm:text-base flex items-center gap-1.5">
                    <span>安裝至手機桌面 (PWA)</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold">
                      App 體驗
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#8C8475]">全螢幕無網址列・秒速開啟・離線記帳支援</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#F4EFE6] text-[#8C8475] hover:text-[#3E3A36] hover:bg-[#EAE4D7] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto font-sans text-xs text-[#5C564E]">
              {/* 應用預覽卡片 */}
              <div className="bg-white rounded-2xl p-4 border border-[#ECE7DC] shadow-2xs flex items-center gap-3.5">
                <img
                  src="/icon.svg"
                  alt="伴伴記"
                  className="w-14 h-14 rounded-2xl drop-shadow-xs border border-[#EAE4D7] shrink-0"
                />
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm text-[#3E3A36]">伴伴記❤️</span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">
                      情侶記帳
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8C8475] leading-relaxed">
                    公積金管理・代墊互抵・即時對帳・旅遊外幣
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                    <Check className="w-3 h-3" />
                    <span>已啟用離線快取與 Service Worker</span>
                  </div>
                </div>
              </div>

              {/* 已安裝狀態提示 */}
              {isStandalone ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
                  <div className="text-2xl">🎉</div>
                  <p className="text-xs font-bold text-emerald-900">
                    您目前正以獨立 App 模式（Standalone）運行！
                  </p>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    已成功安裝於手機桌面，享受全螢幕與最流暢的記帳操作體驗。
                  </p>
                </div>
              ) : deferredPrompt ? (
                /* Chrome / Edge / Android 原生安裝提示 */
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-1.5">
                    <p className="text-xs font-bold text-amber-950 flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-amber-800" />
                      <span>一鍵快速安裝</span>
                    </p>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      點擊下方按鈕即可直接將「伴伴記」添加到您的手機主畫面或電腦桌面。
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleNativeInstall}
                    disabled={installing}
                    className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{installing ? '正在安裝中...' : '立即安裝伴伴記 App'}</span>
                  </button>
                </div>
              ) : isIOS ? (
                /* iOS Safari 安裝教學步驟 */
                <div className="space-y-3">
                  <div className="bg-rose-50/70 border border-rose-200/70 rounded-2xl p-3.5 space-y-1">
                    <p className="text-xs font-bold text-rose-950 flex items-center gap-1">
                      <span>🍎 iPhone / iPad Safari 安裝教學</span>
                    </p>
                    <p className="text-[11px] text-rose-900 leading-relaxed">
                      iOS 系統僅需 2 個步驟即可將伴伴記加入主畫面：
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="bg-white p-3 rounded-xl border border-[#ECE7DC] flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 font-black text-xs flex items-center justify-center shrink-0">
                        1
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-[#3E3A36] text-xs flex items-center gap-1">
                          <span>點擊 Safari 底部的「分享」按鈕</span>
                          <Share2 className="w-3.5 h-3.5 text-blue-600 inline" />
                        </p>
                        <p className="text-[11px] text-[#8C8475]">
                          (若工具列隱藏，輕點螢幕底部即可浮現分享圖示)
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-[#ECE7DC] flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 font-black text-xs flex items-center justify-center shrink-0">
                        2
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-[#3E3A36] text-xs flex items-center gap-1">
                          <span>滑動選單並點選「加入主畫面」</span>
                          <PlusSquare className="w-3.5 h-3.5 text-gray-700 inline" />
                        </p>
                        <p className="text-[11px] text-[#8C8475]">
                          點擊右上角的「新增」後，桌面即會出現「伴伴記❤️」App 圖示！
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Android Chrome 手動教學 */
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-1">
                    <p className="text-xs font-bold text-amber-950 flex items-center gap-1">
                      <span>🤖 Android / Chrome 手動安裝方式</span>
                    </p>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      若未跳出自動提示，可透過瀏覽器選單新增：
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="bg-white p-3 rounded-xl border border-[#ECE7DC] flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center shrink-0">
                        1
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-[#3E3A36] text-xs">
                          點選 Chrome 右上角「選單 (三個點 ⋮)」
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-[#ECE7DC] flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center shrink-0">
                        2
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-[#3E3A36] text-xs">
                          點選「加到主畫面」或「安裝應用程式」
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 優勢特色清單 */}
              <div className="bg-[#FAF8F3] rounded-2xl p-3.5 border border-[#EDE8DC] space-y-2">
                <p className="text-[11px] font-bold text-[#6E6659]">📱 安裝桌面 App 的好處：</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#7A7366]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-rose-600">✓</span>
                    <span>全螢幕沉浸無網址列</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-rose-600">✓</span>
                    <span>離線無網路仍可記帳</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-rose-600">✓</span>
                    <span>一鍵即點即開秒記</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-rose-600">✓</span>
                    <span>不佔手機儲存空間</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 bg-white border-t border-[#E8E4D9] flex justify-end shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#F4EFE6] hover:bg-[#EAE4D7] text-[#5C564E] font-bold text-xs rounded-xl cursor-pointer transition-all"
              >
                我知道了
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
