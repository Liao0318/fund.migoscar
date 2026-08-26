import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Sliders } from 'lucide-react';
import { AppNotification } from '../../types';
import { formatAmPmTime } from '../../utils/formatters';

interface NotificationDropdownProps {
  notifications: AppNotification[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenLineSettings: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications = [],
  isOpen,
  setIsOpen,
  onMarkAllRead,
  onMarkRead,
  onDelete,
  onOpenLineSettings
}) => {
  const safeNotifications = notifications || [];
  const unreadCount = safeNotifications.filter(n => !n.read).length;

  return (
    <div className="fixed top-4 right-4 md:top-6 md:right-6 z-[100] select-none">
      <div className="relative">
        <button 
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-white/95 hover:bg-[#EEEDE9] border border-[#E1DDD3]/90 text-[#706B62] hover:text-[#3E3A36] rounded-2xl transition duration-200 flex items-center justify-center relative cursor-pointer shadow-[0_8px_20px_rgba(140,132,117,0.1)] focus:outline-none backdrop-blur-md active:scale-95"
          title="即時系統通知"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center border border-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* 下拉通知選單 */}
        <AnimatePresence>
          {isOpen && (
            <>
              <div 
                className="fixed inset-0 z-[90]" 
                onClick={() => setIsOpen(false)} 
              />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2.5 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#EEEDE3] z-[100] overflow-hidden text-left"
              >
                <div className="p-4 border-b border-[#EEEDE3] bg-[#FAF9F5] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-[#3E3A36]">
                    <span>🔔</span>
                    <span>通知紀錄 ({unreadCount})</span>
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => {
                        onMarkAllRead();
                        setIsOpen(false);
                      }}
                      className="text-[10px] text-[#8C8475] hover:text-[#5C564E] font-medium underline cursor-pointer"
                    >
                      全部標示已讀
                    </button>
                  )}
                </div>
                
                <div className="max-h-64 overflow-y-auto divide-y divide-[#F5F4EE] max-w-full">
                  {safeNotifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#BCB8B0]">
                      目前沒有任何通知
                    </div>
                  ) : (
                    safeNotifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          onMarkRead(n.id);
                        }}
                        className={`p-3 hover:bg-[#FAF9F5] transition-all cursor-pointer relative flex items-start gap-2.5 ${!n.read ? 'bg-[#FDFCF7]/95' : ''}`}
                      >
                        {!n.read && (
                          <span className="absolute top-4 left-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                        )}
                        <div className="flex-1 min-w-0 pl-1.5">
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="text-[11px] font-semibold text-[#4A4641] truncate">{n.title}</h4>
                            <span className="text-[9px] text-[#BCB8B0] font-mono whitespace-nowrap">
                              {formatAmPmTime(n.time)}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#7A756E] mt-0.5 leading-relaxed break-words">{n.desc}</p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(n.id);
                          }}
                          className="text-[10px] text-[#A39E92] hover:text-red-500 p-1 hover:bg-red-50 rounded-md transition-colors"
                          title="移除通知"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* 底部功能按鈕：自訂 LINE 通知開關 */}
                <div className="p-2.5 bg-[#FAF8F3] border-t border-[#EEEDE3] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenLineSettings();
                    }}
                    className="w-full py-1.5 px-3 bg-white hover:bg-[#F2EFE7] text-[#4A4641] text-[11px] font-bold rounded-xl border border-[#E0DCD3] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                    <span>設定各項 LINE 推播開關</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
