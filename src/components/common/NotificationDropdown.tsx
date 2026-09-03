import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Sliders, Heart } from 'lucide-react';
import { AppNotification, AuthUser } from '../../types';
import { formatAmPmTime, isIncomingFromPartner } from '../../utils/formatters';

interface NotificationDropdownProps {
  notifications: AppNotification[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenNotifySettings: () => void;
  currentUser?: AuthUser | null;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications = [],
  isOpen,
  setIsOpen,
  onMarkAllRead,
  onMarkRead,
  onDelete,
  onOpenNotifySettings,
  currentUser
}) => {
  const safeNotifications = notifications || [];

  const checkIsIncoming = (n: AppNotification) => isIncomingFromPartner(n, currentUser);

  const incomingUnreadCount = safeNotifications.filter(n => !n.read && checkIsIncoming(n)).length;

  return (
    <div className="fixed top-4 right-4 md:top-6 md:right-6 z-[100] select-none">
      <div className="relative">
        <button 
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-white/95 hover:bg-[#EEEDE9] border border-[#E1DDD3]/90 text-[#706B62] hover:text-[#3E3A36] rounded-2xl transition duration-200 flex items-center justify-center relative cursor-pointer shadow-[0_8px_20px_rgba(140,132,117,0.1)] focus:outline-none backdrop-blur-md active:scale-95"
          title="即時系統通知"
        >
          <Bell className="w-4 h-4 text-rose-600" />
          {incomingUnreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center border border-white animate-pulse">
              {incomingUnreadCount}
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
                className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#EEEDE3] z-[100] overflow-hidden text-left"
              >
                <div className="p-4 border-b border-[#EEEDE3] bg-[#FAF9F5] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-[#3E3A36]">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>伴侶與系統通知 ({incomingUnreadCount} 未讀)</span>
                  </div>
                  {incomingUnreadCount > 0 && (
                    <button 
                      onClick={() => {
                        onMarkAllRead();
                      }}
                      className="text-[10px] text-[#8C8475] hover:text-[#5C564E] font-medium underline cursor-pointer"
                    >
                      全部標示已讀
                    </button>
                  )}
                </div>
                
                <div className="max-h-64 overflow-y-auto divide-y divide-[#F5F4EE] max-w-full">
                  {safeNotifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#8C8475] space-y-1">
                      <div className="text-xl mb-1">📭</div>
                      <p className="font-bold text-[#4A4641]">目前尚無任何通知</p>
                      <p className="text-[10px] text-[#A39E92] font-light">（每天結束自動清除歸零，伴侶記帳時您將在此收到即時通知）</p>
                    </div>
                  ) : (
                    safeNotifications.map(n => {
                      const fromPartner = isIncomingFromPartner(n, currentUser);
                      return (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            onMarkRead(n.id);
                          }}
                          className={`p-3 hover:bg-[#FAF9F5] transition-all cursor-pointer relative flex items-start gap-2.5 ${!n.read ? 'bg-[#FDFCF7]/95' : ''}`}
                        >
                          {!n.read && fromPartner && (
                            <span className="absolute top-4 left-1.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          )}
                          <div className="flex-1 min-w-0 pl-1.5">
                            <div className="flex justify-between items-start gap-1">
                              <div className="flex items-center gap-1 min-w-0">
                                <h4 className="text-[11px] font-semibold text-[#4A4641] truncate">{n.title}</h4>
                                {fromPartner ? (
                                  <span className="text-[8px] bg-rose-100 text-rose-800 font-bold px-1 rounded shrink-0">伴侶</span>
                                ) : (
                                  <span className="text-[8px] bg-[#EAE7DC] text-[#706B62] font-medium px-1 rounded shrink-0">我</span>
                                )}
                              </div>
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
                      );
                    })
                  )}
                </div>

                {/* 底部功能按鈕：自訂 App 內建通知開關 */}
                <div className="p-2.5 bg-[#FAF8F3] border-t border-[#EEEDE3] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenNotifySettings();
                    }}
                    className="w-full py-1.5 px-3 bg-white hover:bg-[#F2EFE7] text-[#4A4641] text-[11px] font-bold rounded-xl border border-[#E0DCD3] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Sliders className="w-3.5 h-3.5 text-rose-600" />
                    <span>App 內建通知與個人偏好設定</span>
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
