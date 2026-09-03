import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BellRing, 
  X, 
  RefreshCw, 
  Wallet, 
  ShoppingBag, 
  CheckCircle2, 
  Bell, 
  Sliders, 
  Heart, 
  Send, 
  Trash2, 
  CheckCheck,
  UserCheck,
  Smartphone,
  ShieldCheck,
  Volume2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { AppNotifySettings, AppNotification, AuthUser } from '../../types';
import { formatAmPmTime, isIncomingFromPartner } from '../../utils/formatters';
import { 
  getNativeNotificationPermission, 
  requestNativeNotificationPermission, 
  sendNativeNotification,
  NativeNotificationStatus
} from '../../utils/nativeNotify';

interface AppNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTestingNotify: boolean;
  handleTestNotify: () => void;
  notifySettings: AppNotifySettings;
  setAllNotifySettings: (val: boolean) => void;
  toggleNotifySetting: (key: keyof AppNotifySettings) => void;
  notifications?: AppNotification[];
  currentUser?: AuthUser | null;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onDeleteNotification?: (id: string) => void;
  onClearAllNotifications?: () => void;
}

export const AppNotificationModal: React.FC<AppNotificationModalProps> = ({
  isOpen,
  onClose,
  isTestingNotify,
  handleTestNotify,
  notifySettings,
  setAllNotifySettings,
  toggleNotifySetting,
  notifications = [],
  currentUser,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
  onClearAllNotifications
}) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');
  const [filterMode, setFilterMode] = useState<'partner' | 'all' | 'unread'>('partner');
  const [nativePermission, setNativePermission] = useState<NativeNotificationStatus>('default');
  const [isRequestingPerm, setIsRequestingPerm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNativePermission(getNativeNotificationPermission());
    }
  }, [isOpen]);

  const handleRequestNativePermission = async () => {
    setIsRequestingPerm(true);
    try {
      const result = await requestNativeNotificationPermission();
      setNativePermission(result);
      if (result === 'granted') {
        sendNativeNotification({
          title: '伴伴記❤️ 手機系統通知已成功啟用',
          body: '當伴侶新增記帳或採購時，您的手機將直接收到系統即時通知！',
          playSound: true
        });
      }
    } finally {
      setIsRequestingPerm(false);
    }
  };

  const handleNativeTest = async () => {
    handleTestNotify();
    if (nativePermission === 'granted') {
      await sendNativeNotification({
        title: '伴伴記❤️ 手機系統推播測試',
        body: '測試成功！當伴侶記帳、存入公積金或更新採購時，手機皆會收到此通知。',
        playSound: true
      });
    }
  };

  const activeCount = Object.values(notifySettings || {}).filter(Boolean).length;

  // 判斷是否為「伴侶發送給我的通知」
  const checkIsIncoming = (n: AppNotification) => isIncomingFromPartner(n, currentUser);

  // 篩選通知列表
  const filteredNotifications = notifications.filter(n => {
    if (filterMode === 'partner') {
      return checkIsIncoming(n);
    }
    if (filterMode === 'unread') {
      return !n.read && checkIsIncoming(n);
    }
    return true;
  });

  const incomingUnreadCount = notifications.filter(n => !n.read && checkIsIncoming(n)).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-[#FAF9F5] rounded-2xl sm:rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-[#E5E0D2] max-h-[90vh] flex flex-col my-auto"
          >
            {/* Modal 標題區 */}
            <div className="p-4 sm:p-5 border-b border-[#E8E4D9] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold shadow-2xs">
                  <BellRing className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#3E3A36] text-sm sm:text-base flex items-center gap-1.5">
                    <span>即時通知與個人化偏好</span>
                    {currentUser && (
                      <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                        {currentUser.nickname || currentUser.name || currentUser.email}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-[#8C8475] font-medium">
                    雙向通知路由（我記帳通知伴侶，伴侶記帳通知我）與獨立設定管理
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#EFECE3] hover:bg-[#E5E1D5] flex items-center justify-center text-[#8C8475] transition-all cursor-pointer shrink-0"
                title="關閉"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 頁籤切換器 */}
            <div className="flex items-center border-b border-[#E8E4D9] bg-[#F4F1EA] px-4 pt-2 gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
                  activeTab === 'notifications'
                    ? 'border-rose-600 text-rose-700 bg-white/70 rounded-t-xl'
                    : 'border-transparent text-[#706B62] hover:text-[#3E3A36]'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>即時動態中心</span>
                {incomingUnreadCount > 0 && (
                  <span className="min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                    {incomingUnreadCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
                  activeTab === 'settings'
                    ? 'border-rose-600 text-rose-700 bg-white/70 rounded-t-xl'
                    : 'border-transparent text-[#706B62] hover:text-[#3E3A36]'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>我的專屬推播設定</span>
                <span className="text-[10px] bg-[#EAE7DC] text-[#5C564E] font-bold px-1.5 py-0.2 rounded-full">
                  {activeCount}/9
                </span>
              </button>
            </div>

            {/* Modal 內容區 */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-left">
              {activeTab === 'notifications' ? (
                <>
                  {/* 伴侶雙向通知提示說明條 */}
                  <div className="bg-rose-50/80 border border-rose-200/90 rounded-2xl p-3.5 flex items-start gap-2.5 shadow-2xs">
                    <Heart className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-[#5C564E] space-y-1">
                      <p className="font-bold text-[#3E3A36]">
                        💖 雙向伴侶通知機制已生效
                      </p>
                      <p className="text-[11px] text-[#7A756E] leading-relaxed">
                        當您記帳或操作時，通知會自動發送給伴侶；當伴侶記帳、存入公積金或新增採購時，您會在此即時收到專屬通知提醒。
                      </p>
                    </div>
                  </div>

                  {/* 篩選與批量操作工具列 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-[#E8E4D9]">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFilterMode('partner')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          filterMode === 'partner'
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-[#F2EFE7] text-[#706B62] hover:bg-[#EAE5D9]'
                        }`}
                      >
                        💖 伴侶即時通知
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterMode('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          filterMode === 'all'
                            ? 'bg-[#4D4942] text-white shadow-2xs'
                            : 'bg-[#F2EFE7] text-[#706B62] hover:bg-[#EAE5D9]'
                        }`}
                      >
                        全部動態
                      </button>
                      {incomingUnreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setFilterMode('unread')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            filterMode === 'unread'
                              ? 'bg-rose-500 text-white shadow-2xs'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          僅看未讀 ({incomingUnreadCount})
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                      {onMarkAllRead && incomingUnreadCount > 0 && (
                        <button
                          type="button"
                          onClick={onMarkAllRead}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#EFECE3] hover:bg-[#E5E1D5] text-[#5C564E] transition-all cursor-pointer flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>全部標為已讀</span>
                        </button>
                      )}
                      {onClearAllNotifications && notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={onClearAllNotifications}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>清空今日動態</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 通知列表清單 */}
                  <div className="space-y-2.5">
                    {filteredNotifications.length === 0 ? (
                      <div className="bg-white rounded-2xl p-8 border border-[#E8E4D9] text-center text-[#8C8475] space-y-2">
                        <div className="w-12 h-12 rounded-full bg-[#FAF9F5] flex items-center justify-center mx-auto text-xl text-[#BCB8B0]">
                          📭
                        </div>
                        <p className="text-xs font-bold text-[#4A4641]">目前尚無任何通知</p>
                        <p className="text-[11px] text-[#8C8475]">（每日結束自動清空歸零，我記帳對方收到通知，伴侶記帳您將在此收到即時提醒）</p>
                      </div>
                    ) : (
                      filteredNotifications.map(n => {
                        const isFromPartner = isIncomingFromPartner(n, currentUser);
                        return (
                          <div
                            key={n.id}
                            onClick={() => onMarkRead && onMarkRead(n.id)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex items-start gap-3 ${
                              !n.read 
                                ? 'bg-white border-rose-200 shadow-xs' 
                                : 'bg-[#FAF9F5] border-[#E8E4D9] opacity-90'
                            }`}
                          >
                            {!n.read && (
                              <span className="absolute top-4 left-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            )}
                            
                            <div className="flex-1 min-w-0 pl-2">
                              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-xs font-bold text-[#3E3A36] truncate">
                                    {n.title}
                                  </h4>
                                  {isFromPartner ? (
                                    <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded-md">
                                      伴侶動態
                                    </span>
                                  ) : (
                                    <span className="text-[9px] bg-[#EAE7DC] text-[#706B62] font-medium px-1.5 py-0.2 rounded-md">
                                      由我送出
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-[#A39E92] font-mono">
                                  {formatAmPmTime(n.time)}
                                </span>
                              </div>
                              <p className="text-xs text-[#5C564E] leading-relaxed break-words">
                                {n.desc}
                              </p>
                            </div>

                            {onDeleteNotification && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteNotification(n.id);
                                }}
                                className="w-6 h-6 rounded-lg text-[#A39E92] hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                title="刪除此通知"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* 測試通知按鈕 */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#7A756E]">
                      <Smartphone className="w-3.5 h-3.5 text-rose-600" />
                      <span>{nativePermission === 'granted' ? '🟢 手機系統推播已啟用' : '🟡 建議開啟手機系統推播權限'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleNativeTest}
                      disabled={isTestingNotify}
                      className="px-3.5 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isTestingNotify ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>發送測試中...</span>
                        </>
                      ) : (
                        <>
                          <Bell className="w-3.5 h-3.5" />
                          <span>🔔 發送手機 / App 系統通知測試</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* 📱 手機/裝置原生系統推播權限卡片 */}
                  <div className="bg-gradient-to-br from-white to-[#F9F7F1] rounded-2xl p-4 sm:p-5 border border-rose-200/80 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-[#F2EDE1] pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-[#3E3A36]">手機 / 裝置原生系統通知推播</h4>
                          <p className="text-[10px] text-[#8C8475]">免綁定任何通訊軟體，雙方手機安裝 App 後直接接收通知</p>
                        </div>
                      </div>

                      {nativePermission === 'granted' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>已允許推播</span>
                        </span>
                      ) : nativePermission === 'denied' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-50 text-red-800 border border-red-200">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span>已被阻擋</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                          <Info className="w-3 h-3 text-amber-600" />
                          <span>尚未授權</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#5C564E] leading-relaxed space-y-2">
                      {nativePermission === 'granted' ? (
                        <p className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-[11px] text-emerald-900 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>系統通知已生效：</strong>當伴侶登記代墊、充值公積金或勾選採購清單時，您的手機與瀏覽器將直接彈出系統推播與震動提醒！</span>
                        </p>
                      ) : nativePermission === 'denied' ? (
                        <div className="bg-red-50/70 border border-red-200/80 rounded-xl p-3 text-[11px] text-red-900 space-y-1">
                          <p className="font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            <span>通知權限已被瀏覽器或手機系統封鎖</span>
                          </p>
                          <p className="text-[10px] text-red-800">
                            請在手機瀏覽器網址列點擊「設定 / 鎖頭」圖示，將「通知」改為「允許」，即可正常收到伴侶通知。
                          </p>
                        </div>
                      ) : (
                        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-900 space-y-1.5">
                          <p className="font-bold flex items-center gap-1">
                            <Smartphone className="w-3.5 h-3.5 text-amber-700" />
                            <span>直接接收手機系統通知（免綁 LINE）</span>
                          </p>
                          <p className="text-[10px] text-amber-800">
                            只要雙方手機安裝了伴伴記（加到主畫面），點擊下方按鈕允許通知，對方記帳時您的手機就會跳出提醒！
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="text-[10px] text-[#8C8475]">
                        💡 <strong>iPhone 用戶</strong>：在 Safari 點擊「分享 ➔ 加入主畫面」後開啟即可接收推播。
                      </div>

                      <div className="flex items-center gap-2">
                        {nativePermission !== 'granted' && (
                          <button
                            type="button"
                            onClick={handleRequestNativePermission}
                            disabled={isRequestingPerm}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>{isRequestingPerm ? '請求中...' : '📲 一鍵開啟手機通知權限'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleNativeTest}
                          className="px-3 py-1.5 bg-[#EFECE6] hover:bg-[#E5E1D7] text-[#3E3A36] rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 border border-[#DDD8CE]"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>測試響鈴與推播</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 個人化獨立設定提示卡片 */}
                  <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 space-y-2 shadow-2xs">
                    <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                      <UserCheck className="w-4 h-4 text-amber-700" />
                      <span>使用者獨立專屬偏好設定</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      當前設定僅針對您的 Google 帳號（<span className="font-bold underline">{currentUser?.email || '當前登入者'}</span>）生效並自動儲存至雲端。即使您關閉或調整特定推播，伴侶的個人推播設定與偏好也完全不會受到任何影響。
                    </p>
                  </div>

                  {/* 批量控制與啟用統計 */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#3E3A36]">推播項目開關</span>
                      <span className="text-[10px] bg-[#EAE7DC] text-[#5C564E] font-bold px-2 py-0.5 rounded-full">
                        已啟用 {activeCount} / 9 項
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAllNotifySettings(true)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
                      >
                        全部開啟
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllNotifySettings(false)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#EFECE6] text-[#7A756E] border border-[#DDD8CE] hover:bg-[#E5E1D7] transition-all cursor-pointer"
                      >
                        全部關閉
                      </button>
                    </div>
                  </div>

                  {/* 分類通知開關項目 */}
                  <div className="space-y-4">
                    {/* 分類一：記帳與代墊事件 */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-3 shadow-2xs">
                      <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1.5 border-b border-[#F2EDE1] pb-2">
                        <Wallet className="w-4 h-4 text-rose-600" />
                        <span>💳 記帳與帳目異動通知</span>
                      </h4>

                      <div className="space-y-3 divide-y divide-[#F5F3ED]">
                        {/* notifyOnAdd */}
                        <div className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">💸</span>
                              <span className="text-xs font-bold text-[#3E3A36]">新增代墊支出通知</span>
                            </div>
                            <p className="text-[10px] text-[#8C8475] mt-0.5">伴侶新增任一筆日常代墊支出時，立即接收通知</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifySettings?.notifyOnAdd !== false}
                              onChange={() => toggleNotifySetting('notifyOnAdd')}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-[#DDD8CE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                          </label>
                        </div>

                        {/* notifyOnIncome */}
                        <div className="pt-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">💰</span>
                              <span className="text-xs font-bold text-[#3E3A36]">公積金存入充值通知</span>
                            </div>
                            <p className="text-[10px] text-[#8C8475] mt-0.5">伴侶撥入公積金款項時發送通知</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifySettings?.notifyOnIncome !== false}
                              onChange={() => toggleNotifySetting('notifyOnIncome')}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-[#DDD8CE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                          </label>
                        </div>

                        {/* notifyOnEdit */}
                        <div className="pt-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">✏️</span>
                              <span className="text-xs font-bold text-[#3E3A36]">帳目修改通知</span>
                            </div>
                            <p className="text-[10px] text-[#8C8475] mt-0.5">修改已有紀錄的金額、品項或出資人時發送通知</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifySettings?.notifyOnEdit !== false}
                              onChange={() => toggleNotifySetting('notifyOnEdit')}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-[#DDD8CE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                          </label>
                        </div>

                        {/* notifyOnDelete */}
                        <div className="pt-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">🗑️</span>
                              <span className="text-xs font-bold text-[#3E3A36]">帳目刪除撤銷通知</span>
                            </div>
                            <p className="text-[10px] text-[#8C8475] mt-0.5">刪除任一筆記帳時發送防呆撤銷通知</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifySettings?.notifyOnDelete !== false}
                              onChange={() => toggleNotifySetting('notifyOnDelete')}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-[#DDD8CE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                          </label>
                        </div>

                        {/* notifyOnSettle */}
                        <div className="pt-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">🤝</span>
                              <span className="text-xs font-bold text-[#3E3A36]">月度對帳核銷通知</span>
                            </div>
                            <p className="text-[10px] text-[#8C8475] mt-0.5">勾選核銷月份或進行結算時發送通知</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifySettings?.notifyOnSettle !== false}
                              onChange={() => toggleNotifySetting('notifyOnSettle')}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-[#DDD8CE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                          </label>
                        </div>

                        {/* showBalance */}
                        <div className="pt-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">📊</span>
                              <span className="text-xs font-bold text-[#3E3A36]">顯示即時剩餘公積金額度</span>
                            </div>
                            <p className="text-[10px] text-[#8C8475] mt-0.5">在通知卡片中一併附帶最新公積金剩餘額度</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifySettings?.showBalance !== false}
                              onChange={() => toggleNotifySetting('showBalance')}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-[#DDD8CE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* 分類二：購物清單事件 */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-3 shadow-2xs">
                      <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1.5 border-b border-[#F2EDE1] pb-2">
                        <ShoppingBag className="w-4 h-4 text-amber-700" />
                        <span>🛒 購物採購清單通知</span>
                      </h4>

                      <div className="space-y-3 divide-y divide-[#F5F3ED]">
                        {/* notifyOnShoppingAdd */}
                        <div className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">🛍️</span>
                              <span className="text-xs font-bold text-[#3E3A36]">購物清單新增通知</span>
                            </div>
                            <p className="text-[10px] text-[#8C8475] mt-0.5">伴侶建立「需要買」或「想要買」品項時發送通知</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifySettings?.notifyOnShoppingAdd !== false}
                              onChange={() => toggleNotifySetting('notifyOnShoppingAdd')}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-[#DDD8CE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                          </label>
                        </div>

                        {/* notifyOnShoppingComplete */}
                        <div className="pt-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">🎉</span>
                              <span className="text-xs font-bold text-[#3E3A36]">購物清單完成採購通知</span>
                            </div>
                            <p className="text-[10px] text-[#8C8475] mt-0.5">伴侶標記品項已買到時接收通知</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifySettings?.notifyOnShoppingComplete !== false}
                              onChange={() => toggleNotifySetting('notifyOnShoppingComplete')}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-[#DDD8CE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                          </label>
                        </div>

                        {/* notifyOnShoppingDelete */}
                        <div className="pt-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">❌</span>
                              <span className="text-xs font-bold text-[#3E3A36]">購物清單刪除通知</span>
                            </div>
                            <p className="text-[10px] text-[#8C8475] mt-0.5">伴侶移除採購清單品項時發送通知</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifySettings?.notifyOnShoppingDelete !== false}
                              onChange={() => toggleNotifySetting('notifyOnShoppingDelete')}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-[#DDD8CE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal 頁尾 */}
            <div className="p-4 bg-white border-t border-[#E8E4D9] flex justify-between items-center shrink-0">
              <span className="text-[11px] text-[#8C8475]">
                {currentUser?.email ? `已同步至雲端帳號：${currentUser.email}` : '本地設定已即時套用'}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-[#4D4942] hover:bg-[#322F2A] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                關閉
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
