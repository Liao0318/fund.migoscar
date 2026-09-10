import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Settings, 
  User, 
  Key, 
  Database, 
  Smartphone, 
  LogOut, 
  Crown, 
  Heart, 
  RefreshCw, 
  ExternalLink, 
  Share2, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  LogIn,
  Unlink,
  KeyRound,
  ClipboardPaste,
  Loader2,
  ChevronLeft,
  Check,
  Sparkles,
  Layers,
  ArrowRight,
  Laptop,
  Bell,
  SlidersHorizontal,
  Sliders
} from 'lucide-react';
import { AuthUser, CoupleBindingInfo, NicknameLengthPreference, AppNotifySettings } from '../../types';
import { APP_VERSION, APP_BUILD_DATE, APP_NAME } from '../../version';

interface UnifiedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  isGuestMode?: boolean;
  onLogout: () => void;
  onSwitchAccount: () => void;
  onLoginGoogle?: () => void;
  onOpenGasDeploy: () => void;
  gasWebUrl: string;
  deploySheetUrl: string;
  isSandboxMode: boolean;
  onToggleSandboxMode: (enabled: boolean) => void;
  onOpenDataBackup: () => void;
  onOpenPwaInstall: () => void;
  currentInviteCode?: string;
  onGenerateNewInviteCode?: () => void;
  onCopyInviteShare?: () => void;
  partnerBindingInfo?: CoupleBindingInfo | null;
  onUnbindPartner?: () => void;
  onBindPartnerInvite?: (inviteInput: string) => Promise<{ success: boolean; message?: string }>;
  onUpdateNickname?: (
    nickname: string,
    lengthPreference?: NicknameLengthPreference,
    nickname1Char?: string,
    nickname2Char?: string
  ) => boolean;
  onSyncGoogleAvatar?: () => Promise<boolean>;
  pendingQueueCount?: number;
  isOnline?: boolean;
  lastSyncedAt?: string;
  notifySettings?: AppNotifySettings;
  setAllNotifySettings?: (val: boolean) => void;
  toggleNotifySetting?: (key: keyof AppNotifySettings) => void;
  onTestNotification?: () => void;
  onOpenVersionInfo?: () => void;
}

type SettingsSubView = null | 'nickname' | 'partner' | 'gas' | 'backup' | 'pwa' | 'advanced' | 'notify';

export const UnifiedSettingsModal: React.FC<UnifiedSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isGuestMode = false,
  onLogout,
  onSwitchAccount,
  onLoginGoogle,
  onOpenGasDeploy,
  gasWebUrl,
  deploySheetUrl,
  isSandboxMode,
  onToggleSandboxMode,
  onOpenDataBackup,
  onOpenPwaInstall,
  currentInviteCode = 'BB-8924',
  onGenerateNewInviteCode,
  onCopyInviteShare,
  partnerBindingInfo,
  onUnbindPartner,
  onBindPartnerInvite,
  onUpdateNickname,
  onSyncGoogleAvatar,
  pendingQueueCount = 0,
  isOnline = true,
  lastSyncedAt = '剛剛',
  notifySettings,
  setAllNotifySettings,
  toggleNotifySetting,
  onTestNotification,
  onOpenVersionInfo
}) => {
  const [subView, setSubView] = useState<SettingsSubView>(null);
  const [isSyncingAvatar, setIsSyncingAvatar] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [partnerSubTab, setPartnerSubTab] = useState<'share' | 'join'>('share');
  const [manualJoinCode, setManualJoinCode] = useState('');
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [joinErrorMessage, setJoinErrorMessage] = useState('');

  // 稱呼偏好表單狀態
  const isPartner = currentUser?.userRole === 'partner' || Boolean(currentUser?.adminEmail) || Boolean(partnerBindingInfo?.partnerEmail && partnerBindingInfo.partnerEmail.toLowerCase() === currentUser?.email?.toLowerCase());
  const isAdmin = !isPartner && (currentUser?.userRole === 'admin' || !currentUser?.adminEmail);
  const userFirstChar = currentUser?.name ? currentUser.name.charAt(0) : (isAdmin ? '我' : '伴');
  const userShort = currentUser?.name && currentUser.name.length >= 2 ? currentUser.name.slice(0, 2) : (isAdmin ? '管理' : '伴侶');

  const [lengthPref, setLengthPref] = useState<NicknameLengthPreference>('2-char');
  const [n1Input, setN1Input] = useState<string>(userFirstChar);
  const [n2Input, setN2Input] = useState<string>(userShort);
  const [nicknameSavedToast, setNicknameSavedToast] = useState(false);

  // 開啟選單時鎖定背景滾動，避免滾輪滾動到底層畫面
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

  // 當開啟彈窗或 currentUser 變更時重設
  useEffect(() => {
    if (isOpen) {
      setSubView(null);
      setJoinErrorMessage('');
    }
    if (currentUser) {
      const pref = currentUser.nicknameLengthPreference || (currentUser.nickname && currentUser.nickname.length === 1 ? '1-char' : '2-char');
      setLengthPref(pref);
      setN1Input(currentUser.nickname1Char || (currentUser.nickname?.length === 1 ? currentUser.nickname : userFirstChar));
      setN2Input(currentUser.nickname2Char || (currentUser.nickname?.length === 2 ? currentUser.nickname : userShort));
    }
  }, [currentUser, isOpen, userFirstChar, userShort]);

  const handleCopyCode = () => {
    if (!currentInviteCode) return;
    navigator.clipboard.writeText(currentInviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyShareText = () => {
    if (onCopyInviteShare) {
      onCopyInviteShare();
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleSyncAvatar = async () => {
    if (!onSyncGoogleAvatar) return;
    setIsSyncingAvatar(true);
    try {
      await onSyncGoogleAvatar();
    } finally {
      setIsSyncingAvatar(false);
    }
  };

  const handleSaveNickname = (newPref?: NicknameLengthPreference, newN1?: string, newN2?: string) => {
    const targetPref = newPref || lengthPref;
    const targetN1 = (newN1 !== undefined ? newN1 : n1Input).trim() || userFirstChar;
    const targetN2 = (newN2 !== undefined ? newN2 : n2Input).trim() || userShort;
    const chosenName = targetPref === '1-char' ? targetN1 : targetN2;

    if (onUpdateNickname) {
      onUpdateNickname(chosenName, targetPref, targetN1, targetN2);
      setNicknameSavedToast(true);
      setTimeout(() => setNicknameSavedToast(false), 2000);
    }
  };

  // 當前顯示的稱呼名稱
  const currentDisplayName = currentUser?.nickname || currentUser?.name || '使用者';

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 overflow-hidden flex justify-start pointer-events-none"
          onWheel={(e) => {
            // 防止滾輪穿透到背景
            if ((e.target as HTMLElement).closest('.modal-scroll-area')) {
              e.stopPropagation();
            } else {
              e.preventDefault();
            }
          }}
        >
          {/* 背景遮罩 */}
          <motion.div
            key="settings-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto cursor-pointer touch-none"
          />

          {/* 現代左側抽屜面板 (由左向右滑出，符合使用者習慣) */}
          <motion.aside
            key="settings-drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="relative w-full sm:w-[400px] max-w-[420px] bg-[#F8F7F4] shadow-2xl z-50 flex flex-col h-full overflow-hidden text-[#3E3A36] pointer-events-auto border-r border-[#E8E4D9]"
          >
            {/* 1. Header 頂部導覽列 */}
            <div className="px-4 py-3.5 border-b border-[#E8E4D9] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                {subView ? (
                  <button
                    type="button"
                    onClick={() => setSubView(null)}
                    className="p-1.5 -ml-1 rounded-full hover:bg-[#F2EFE7] text-[#5C564E] transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span>返回設定</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                      <Settings className="w-4 h-4 text-amber-700" />
                    </div>
                    <h2 className="font-bold text-[#3E3A36] text-base">設定與帳戶中心</h2>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#EFECE3] hover:bg-[#E5E1D5] flex items-center justify-center text-[#8C8475] hover:text-[#3E3A36] transition-colors cursor-pointer"
                aria-label="關閉"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2. 主內容區 (支援一級列表與子頁面切換) */}
            <div className="modal-scroll-area flex-1 overflow-y-auto px-4 py-4 space-y-4 overscroll-contain">
              {/* =========================================================================
                  A. 一級主選單 (iOS Settings 清單風格)
                  ========================================================================= */}
              {!subView && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* 使用者個人 Profile 頂部卡片 */}
                  <div className="bg-white rounded-2xl p-4 border border-[#E8E4D9] shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className={`w-12 h-12 rounded-2xl overflow-hidden shadow-xs flex items-center justify-center font-bold text-base text-white ${
                          currentUser ? (isPartner ? 'bg-rose-500' : 'bg-amber-600') : 'bg-stone-500'
                        }`}>
                          {currentUser?.avatar ? (
                            <img
                              src={currentUser.avatar}
                              alt={currentDisplayName}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{currentUser ? currentDisplayName[0] : '訪'}</span>
                          )}
                        </div>
                        {onSyncGoogleAvatar && currentUser && !currentUser.isDevSandbox && currentUser.authMethod === 'google_oauth' && (
                          <button
                            type="button"
                            onClick={handleSyncAvatar}
                            disabled={isSyncingAvatar}
                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-[#E6E0D2] shadow-xs flex items-center justify-center text-[#5C564E] hover:text-amber-600 cursor-pointer"
                            title="重新同步 Google 大頭貼"
                          >
                            <RefreshCw className={`w-2.5 h-2.5 ${isSyncingAvatar ? 'animate-spin text-amber-600' : ''}`} />
                          </button>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[#3E3A36] text-base truncate">
                            {currentDisplayName}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                            !currentUser
                              ? 'bg-stone-100 text-stone-700'
                              : isAdmin 
                              ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {!currentUser ? '訪客' : isAdmin ? '主要管理者' : '伴侶'}
                          </span>
                        </div>
                        <p className="text-xs text-[#8C8475] truncate mt-0.5 font-mono flex items-center gap-1">
                          <span className="text-[10px] bg-[#FAF8F3] border border-[#E8E4D9] text-[#78716C] px-1 py-0.2 rounded font-sans font-bold">ID</span>
                          <span>{currentUser?.email || currentUser?.id || '本機訪客體驗中'}</span>
                        </p>
                      </div>
                    </div>

                    {!currentUser && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onLoginGoogle) onLoginGoogle();
                          else onSwitchAccount();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5 text-amber-300" />
                        <span>登入</span>
                      </button>
                    )}
                  </div>

                  {/* 分組清單 1：帳號與伴侶 */}
                  <div className="space-y-1.5">
                    <div className="px-1 text-[11px] font-bold text-[#8C8475] tracking-wider uppercase">
                      個人與伴侶偏好
                    </div>
                    <div className="bg-white rounded-2xl border border-[#E8E4D9] divide-y divide-[#F0EDE6] overflow-hidden shadow-xs">
                      {/* 1. 稱呼與顯示模式 */}
                      <button
                        type="button"
                        onClick={() => setSubView('nickname')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs">
                            🏷️
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#3E3A36]">稱呼顯示設定</div>
                            <div className="text-xs text-[#8C8475]">全站優先顯示之暱稱與單/雙字</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#8C8475]">
                          <span className="font-bold text-[#3E3A36] bg-[#F4F1EA] px-2 py-0.5 rounded-md">
                            {currentDisplayName} ({lengthPref === '1-char' ? '單字' : '雙字'})
                          </span>
                          <ChevronRight className="w-4 h-4 text-[#B5AFA6] group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>

                      {/* 2. 伴侶共同記帳 */}
                      <button
                        type="button"
                        onClick={() => setSubView('partner')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs">
                            💖
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#3E3A36]">情侶連線與邀請</div>
                            <div className="text-xs text-[#8C8475]">
                              {partnerBindingInfo?.partnerEmail ? `已綁定：${partnerBindingInfo.partnerName || '伴侶'}` : '邀請代碼與雙向連動'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          {partnerBindingInfo?.partnerEmail ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              已連線
                            </span>
                          ) : (
                            <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              未連線
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-[#B5AFA6] group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>

                      {/* 3. 個人化推播與提醒設定 */}
                      <button
                        type="button"
                        onClick={() => setSubView('notify')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs">
                            🔔
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#3E3A36]">系統提醒與推播偏好</div>
                            <div className="text-xs text-[#8C8475]">個人獨立開關、記帳與採購推播</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          {notifySettings && (
                            <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded-md">
                              {Object.values(notifySettings).filter(Boolean).length}/9 項開啟
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-[#B5AFA6] group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 分組清單 2：雲端與資料 */}
                  <div className="space-y-1.5">
                    <div className="px-1 text-[11px] font-bold text-[#8C8475] tracking-wider uppercase">
                      雲端資料庫與備份
                    </div>
                    <div className="bg-white rounded-2xl border border-[#E8E4D9] divide-y divide-[#F0EDE6] overflow-hidden shadow-xs">
                      {/* 3. Google 試算表連線 */}
                      <button
                        type="button"
                        onClick={() => setSubView('gas')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs">
                            📊
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#3E3A36]">Google 試算表連線</div>
                            <div className="text-xs text-[#8C8475]">Web App API 金鑰與工作表</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1 ${
                            gasWebUrl 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${gasWebUrl ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                            <span>{gasWebUrl ? '已連線' : '待綁定'}</span>
                          </span>
                          <ChevronRight className="w-4 h-4 text-[#B5AFA6] group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>

                      {/* 4. 資料備份與還原 */}
                      <button
                        type="button"
                        onClick={() => setSubView('backup')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold text-xs">
                            💾
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#3E3A36]">資料備份與匯出</div>
                            <div className="text-xs text-[#8C8475]">匯出 CSV、離線暫存佇列</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#8C8475]">
                          {pendingQueueCount > 0 && (
                            <span className="bg-amber-500 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                              {pendingQueueCount} 筆待同步
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-[#B5AFA6] group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 分組清單 3：偏好與進階 */}
                  <div className="space-y-1.5">
                    <div className="px-1 text-[11px] font-bold text-[#8C8475] tracking-wider uppercase">
                      應用程式與裝置
                    </div>
                    <div className="bg-white rounded-2xl border border-[#E8E4D9] divide-y divide-[#F0EDE6] overflow-hidden shadow-xs">
                      {/* 5. 手機桌面 App (PWA) */}
                      <button
                        type="button"
                        onClick={() => setSubView('pwa')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center font-bold text-xs">
                            📱
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#3E3A36]">安裝至手機桌面 (PWA)</div>
                            <div className="text-xs text-[#8C8475]">全螢幕原生體驗與離線支援</div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#B5AFA6] group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {/* 6. 進階與帳號管理 */}
                      <button
                        type="button"
                        onClick={() => setSubView('advanced')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAF8F3] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-stone-100 text-[#5C564E] flex items-center justify-center font-bold text-xs">
                            ⚙️
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#3E3A36]">進階模式與帳號管理</div>
                            <div className="text-xs text-[#8C8475]">本機沙盒、切換帳號、登出</div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#B5AFA6] group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  B. 子頁面 1：稱呼設定 (輕量現代化卡片)
                  ========================================================================= */}
              {subView === 'nickname' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-white rounded-2xl p-4 border border-[#E8E4D9] space-y-4 shadow-xs">
                    <div>
                      <h3 className="font-bold text-sm text-[#3E3A36]">稱呼字數偏好</h3>
                      <p className="text-xs text-[#8C8475] mt-0.5">選擇在導覽列、代墊紀錄與推播中優先顯示的長度：</p>
                    </div>

                    {/* 模式切換 Segment Control */}
                    <div className="grid grid-cols-2 gap-2 bg-[#F4F1EA] p-1 rounded-xl border border-[#E8E4D9]">
                      <button
                        type="button"
                        onClick={() => {
                          setLengthPref('1-char');
                          handleSaveNickname('1-char', n1Input, n2Input);
                        }}
                        className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          lengthPref === '1-char'
                            ? 'bg-white text-amber-900 shadow-xs'
                            : 'text-[#706B62] hover:text-[#3E3A36]'
                        }`}
                      >
                        <span>單字模式</span>
                        <span className="font-mono bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded text-[11px]">
                          {n1Input.trim() || userFirstChar}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLengthPref('2-char');
                          handleSaveNickname('2-char', n1Input, n2Input);
                        }}
                        className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          lengthPref === '2-char'
                            ? 'bg-white text-amber-900 shadow-xs'
                            : 'text-[#706B62] hover:text-[#3E3A36]'
                        }`}
                      >
                        <span>雙字模式</span>
                        <span className="font-mono bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded text-[11px]">
                          {n2Input.trim() || userShort}
                        </span>
                      </button>
                    </div>

                    {/* 輸入表單 */}
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-[#5C564E] mb-1">
                          單字稱呼（限 1 個字）：
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={1}
                            value={n1Input}
                            onChange={(e) => {
                              const val = e.target.value.trim();
                              setN1Input(val);
                              if (val.length === 1) handleSaveNickname(lengthPref, val, n2Input);
                            }}
                            className="w-16 text-center font-bold text-base py-1.5 bg-[#FAF8F3] border border-[#DDD6C8] rounded-xl focus:border-amber-600 focus:bg-white focus:outline-none"
                          />
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[userFirstChar, '廖', '周', '寶'].filter(Boolean).map((char) => (
                              <button
                                key={char}
                                type="button"
                                onClick={() => {
                                  setN1Input(char);
                                  handleSaveNickname(lengthPref, char, n2Input);
                                }}
                                className="px-2.5 py-1 text-xs bg-[#F5F2EA] hover:bg-amber-100 text-[#5C564E] font-bold rounded-lg border border-[#E6E0D2] transition-colors cursor-pointer"
                              >
                                {char}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#5C564E] mb-1">
                          雙字暱稱（限 2 個字）：
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={2}
                            value={n2Input}
                            onChange={(e) => {
                              const val = e.target.value.trim();
                              setN2Input(val);
                              if (val.length === 2) handleSaveNickname(lengthPref, n1Input, val);
                            }}
                            className="w-24 text-center font-bold text-sm py-1.5 bg-[#FAF8F3] border border-[#DDD6C8] rounded-xl focus:border-amber-600 focus:bg-white focus:outline-none"
                          />
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[userShort, '寶貝', '阿寶'].filter(Boolean).map((pair) => (
                              <button
                                key={pair}
                                type="button"
                                onClick={() => {
                                  setN2Input(pair);
                                  handleSaveNickname(lengthPref, n1Input, pair);
                                }}
                                className="px-2.5 py-1 text-xs bg-[#F5F2EA] hover:bg-amber-100 text-[#5C564E] font-bold rounded-lg border border-[#E6E0D2] transition-colors cursor-pointer"
                              >
                                {pair}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {nicknameSavedToast && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>稱呼設定已即時儲存並生效！</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* =========================================================================
                  B. 子頁面 2：伴侶邀請與連線
                  ========================================================================= */}
              {subView === 'partner' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {isAdmin ? (
                    <div className="bg-white rounded-2xl p-4 border border-[#E8E4D9] space-y-3.5 shadow-xs">
                      <div className="flex items-center justify-between border-b border-[#F2EDE1] pb-2">
                        <div className="flex items-center gap-1 bg-[#F5F2EA] p-0.5 rounded-xl border border-[#E6E0D2]">
                          <button
                            type="button"
                            onClick={() => setPartnerSubTab('share')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              partnerSubTab === 'share' ? 'bg-white text-rose-800 shadow-xs' : 'text-[#7A7366]'
                            }`}
                          >
                            💌 派發邀請碼
                          </button>
                          <button
                            type="button"
                            onClick={() => setPartnerSubTab('join')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              partnerSubTab === 'join' ? 'bg-white text-rose-800 shadow-xs' : 'text-[#7A7366]'
                            }`}
                          >
                            🔗 加入伴侶帳本
                          </button>
                        </div>
                      </div>

                      {partnerSubTab === 'share' ? (
                        <div className="space-y-3">
                          <div className="bg-[#FAF8F3] p-3.5 rounded-xl border border-[#EBE7DC] space-y-2">
                            <div className="text-xs font-bold text-[#3E3A36]">專屬伴侶配對代碼</div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-lg font-extrabold text-rose-700 bg-white px-3 py-1 rounded-lg border border-[#DDD8CE]">
                                {currentInviteCode}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {onGenerateNewInviteCode && (
                                  <button
                                    type="button"
                                    onClick={onGenerateNewInviteCode}
                                    className="p-2 rounded-xl bg-white border border-[#E6E0D2] hover:bg-[#F2EFE7] cursor-pointer"
                                    title="重新生成邀請碼"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5 text-[#5C564E]" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={handleCopyCode}
                                  className="px-3 py-1.5 bg-white border border-[#E6E0D2] rounded-xl text-xs font-bold text-[#5C564E] flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{copiedCode ? '已複製' : '複製'}</span>
                                </button>
                                {onCopyInviteShare && (
                                  <button
                                    type="button"
                                    onClick={handleCopyShareText}
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                    <span>{copiedShare ? '已複製' : '分享'}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-[#FAF8F3] rounded-xl border border-[#EBE7DC] flex items-center justify-between text-xs">
                            <span className="text-[#8C8475]">伴侶連線狀態：</span>
                            {partnerBindingInfo?.partnerEmail ? (
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-700 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>已綁定 ({partnerBindingInfo.partnerName || '伴侶'})</span>
                                </span>
                                {onUnbindPartner && (
                                  <button
                                    type="button"
                                    onClick={onUnbindPartner}
                                    className="text-[11px] text-rose-600 underline font-bold cursor-pointer"
                                  >
                                    解除
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px]">
                                ⏳ 等待伴侶加入
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-[#5C564E]">輸入伴侶發給您的 6 碼邀請碼 (如 BB-8924)：</p>
                          <div className="relative">
                            <input
                              type="text"
                              value={manualJoinCode}
                              onChange={(e) => {
                                setManualJoinCode(e.target.value);
                                setJoinErrorMessage('');
                              }}
                              placeholder="輸入邀請碼"
                              className="w-full bg-[#FAF8F3] border border-[#DDD6C8] rounded-xl px-3 py-2 text-xs font-mono"
                            />
                          </div>
                          {joinErrorMessage && (
                            <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                              {joinErrorMessage}
                            </div>
                          )}
                          <button
                            type="button"
                            disabled={!manualJoinCode.trim() || isSubmittingJoin}
                            onClick={async () => {
                              if (!onBindPartnerInvite || !manualJoinCode.trim()) return;
                              setIsSubmittingJoin(true);
                              try {
                                const res = await onBindPartnerInvite(manualJoinCode.trim());
                                if (res.success) {
                                  setManualJoinCode('');
                                  setSubView(null);
                                } else {
                                  setJoinErrorMessage(res.message || '驗證失敗');
                                }
                              } catch (e: any) {
                                setJoinErrorMessage(e?.message || '發生錯誤');
                              } finally {
                                setIsSubmittingJoin(false);
                              }
                            }}
                            className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {isSubmittingJoin ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Heart className="w-3.5 h-3.5" />}
                            <span>驗證並加入</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-4 border border-[#E8E4D9] space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                        <span className="font-bold text-sm text-rose-900 flex items-center gap-1.5">
                          <Heart className="w-4 h-4 text-rose-600 fill-rose-500" />
                          <span>已加入情侶帳本</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          伴侶端
                        </span>
                      </div>
                      <div className="text-xs text-[#5C564E] space-y-1.5 bg-[#FAF8F3] p-3 rounded-xl">
                        <div>👑 主管理者：<strong>{currentUser?.adminName || partnerBindingInfo?.adminName || '主管理員'}</strong></div>
                        <div>🔑 邀請代碼：<span className="font-mono font-bold text-rose-700">{currentUser?.inviteCode || partnerBindingInfo?.inviteCode || currentInviteCode}</span></div>
                      </div>
                      {onUnbindPartner && (
                        <button
                          type="button"
                          onClick={() => {
                            onUnbindPartner();
                            setSubView(null);
                          }}
                          className="w-full py-2 border border-rose-300 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-50 cursor-pointer"
                        >
                          解除綁定或更換帳本
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* =========================================================================
                  B. 子頁面 3：Google 試算表連線
                  ========================================================================= */}
              {subView === 'gas' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-white rounded-2xl p-4 border border-[#E8E4D9] space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[#F2EDE1] pb-2">
                      <span className="font-bold text-sm text-[#3E3A36]">Google 試算表 API 連線</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          gasWebUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {gasWebUrl ? '已連線' : '尚未設定'}
                        </span>
                        {!isAdmin && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>伴侶受保護模式</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[#5C564E] leading-relaxed">
                      {isAdmin 
                        ? '透過 Google Apps Script Web App 連結私有試算表，享有 100% 個人隱私與永續存取權。'
                        : '您已透過伴侶邀請共用此私有試算表資料庫。為維護帳本穩定，金鑰由主管理者統一管理。'}
                    </p>

                    <div className="bg-[#FAF8F3] p-3 rounded-xl border border-[#EAE6DC] space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#8C8475]">
                        <span>目前 Web App URL 金鑰：</span>
                        {!isAdmin && (
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">🔒 僅管理者可變更</span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-[#3E3A36] break-all bg-white p-2 rounded-lg border border-[#DDD8CE]">
                        {gasWebUrl || '尚未設定 URL'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2">
                      {deploySheetUrl && (
                        <a
                          href={deploySheetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 bg-[#FAF8F3] hover:bg-[#F2EFE7] border border-[#DDD6C8] rounded-xl text-xs font-bold text-[#5C564E] flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>開啟試算表</span>
                        </a>
                      )}
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenGasDeploy();
                          }}
                          className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ml-auto"
                        >
                          <Key className="w-3.5 h-3.5 text-amber-300" />
                          <span>設定 / 更新金鑰</span>
                        </button>
                      ) : (
                        <div className="text-[11px] text-[#8C8475] italic ml-auto">
                          由主管理者 ({currentUser?.adminName || partnerBindingInfo?.adminName || '主管理員'}) 掌控金鑰
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  B. 子頁面 4：資料備份與還原
                  ========================================================================= */}
              {subView === 'backup' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-white rounded-2xl p-4 border border-[#E8E4D9] space-y-3.5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[#F2EDE1] pb-2">
                      <span className="font-bold text-sm text-[#3E3A36]">資料備份與對帳</span>
                      <span className="text-[10px] text-[#8C8475]">最後同步：{lastSyncedAt}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 bg-[#FAF8F3] rounded-xl border border-[#EAE6DC]">
                        <div className="text-[10px] text-[#8C8475]">待同步佇列</div>
                        <div className="text-base font-bold text-[#3E3A36] mt-0.5">{pendingQueueCount} 筆</div>
                      </div>
                      <div className="p-3 bg-[#FAF8F3] rounded-xl border border-[#EAE6DC]">
                        <div className="text-[10px] text-[#8C8475]">連線狀態</div>
                        <div className={`text-xs font-bold mt-1 ${isOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {isOnline ? '● 在線正常' : '○ 離線模式'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenDataBackup();
                      }}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>開啟資料備份與匯出中心</span>
                    </button>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  B. 子頁面 5：手機桌面 App (PWA)
                  ========================================================================= */}
              {subView === 'pwa' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-white rounded-2xl p-4 border border-[#E8E4D9] space-y-3.5 shadow-xs">
                    <div className="font-bold text-sm text-[#3E3A36] border-b border-[#F2EDE1] pb-2">
                      安裝至手機桌面 (PWA)
                    </div>
                    <p className="text-xs text-[#5C564E] leading-relaxed">
                      免下載安裝包，將伴伴記加入主畫面，即可享有全螢幕與無延遲快速啟動體驗。
                    </p>
                    <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900 space-y-1">
                      <div>• <strong>iOS (Safari)</strong>：點底部「分享」圖示 ➔ 選擇「加入主畫面」。</div>
                      <div>• <strong>Android (Chrome)</strong>：點右上角三個點 ➔ 選擇「加到主畫面」。</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPwaInstall();
                      }}
                      className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>查看詳細安裝引導</span>
                    </button>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  B. 子頁面 6：進階與帳號管理
                  ========================================================================= */}
              {subView === 'advanced' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-white rounded-2xl p-4 border border-[#E8E4D9] space-y-4 shadow-xs">
                    <div className="font-bold text-sm text-[#3E3A36] border-b border-[#F2EDE1] pb-2">
                      進階與本機沙盒
                    </div>

                    <div className="p-3 bg-[#FAF8F3] rounded-xl border border-[#EAE6DC] space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-[#3E3A36]">
                        <span>系統識別碼 ID (Gmail 帳號)</span>
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {currentUser ? '已綁定' : '未登入'}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-[#5C564E] break-all bg-white px-2 py-1 rounded-lg border border-[#E8E4D9]">
                        {currentUser?.email || currentUser?.id || '未登入 Google 帳戶 (以訪客模式執行)'}
                      </div>
                      <p className="text-[11px] text-[#8C8475] leading-relaxed">
                        系統中所有行程、支出紀錄、心願清單與雲端權限，皆以此 Gmail 地址作為唯一識別碼。
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#FAF8F3] rounded-xl border border-[#EAE6DC]">
                      <div>
                        <div className="text-xs font-bold text-[#3E3A36]">本機離線試用模式</div>
                        <div className="text-[11px] text-[#8C8475]">不發送雲端請求，以本機資料體驗</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleSandboxMode(!isSandboxMode)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isSandboxMode ? 'bg-amber-600' : 'bg-stone-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            isSandboxMode ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-[#F0EDE6] space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSwitchAccount();
                        }}
                        className="w-full py-2.5 bg-[#FAF8F3] hover:bg-[#F2EFE7] border border-[#DDD6C8] text-[#5C564E] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>切換或更換帳號</span>
                      </button>

                      {currentUser && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onLogout();
                          }}
                          className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-600" />
                          <span>登出目前帳戶</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* =========================================================================
                  B. 子頁面 7：推播與系統提醒設定 (各自獨立儲存)
                  ========================================================================= */}
              {subView === 'notify' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-white rounded-2xl p-4 border border-[#E8E4D9] space-y-3.5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[#F2EDE1] pb-2">
                      <div>
                        <div className="font-bold text-sm text-[#3E3A36] flex items-center gap-1.5">
                          <Bell className="w-4 h-4 text-amber-600" />
                          <span>系統提醒與推播偏好</span>
                        </div>
                        <p className="text-[11px] text-[#8C8475] mt-0.5">
                          獨立綁定於 <span className="font-mono font-bold text-[#3E3A36]">{currentUser?.email || '本地訪客'}</span>
                        </p>
                      </div>

                      {setAllNotifySettings && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setAllNotifySettings(true)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            全開
                          </button>
                          <button
                            type="button"
                            onClick={() => setAllNotifySettings(false)}
                            className="px-2 py-1 bg-[#F2EDE1] hover:bg-[#E8E2D2] text-[#706B62] rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            全關
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs text-amber-900 leading-relaxed">
                      💡 <strong>雙方獨立設定</strong>：您與伴侶可各自選擇想收到的即時推播通知，不互相干擾，且登出切換帳號時自動切換為該使用者的專屬偏好。
                    </div>

                    {notifySettings && toggleNotifySetting && (
                      <div className="space-y-2 pt-1">
                        {[
                          {
                            key: 'notifyOnAdd' as keyof AppNotifySettings,
                            title: '日常代墊記帳推播',
                            desc: '伴侶或自己在代墊分帳新增支出時即時通知',
                            icon: '💳'
                          },
                          {
                            key: 'notifyOnIncome' as keyof AppNotifySettings,
                            title: '公積金存入通知',
                            desc: '存入公積金款項時發送推播與金額提醒',
                            icon: '💰'
                          },
                          {
                            key: 'notifyOnEdit' as keyof AppNotifySettings,
                            title: '帳目修改更新通知',
                            desc: '品名、金額或分攤比例被編輯時提醒',
                            icon: '✏️'
                          },
                          {
                            key: 'notifyOnDelete' as keyof AppNotifySettings,
                            title: '帳目刪除警示通知',
                            desc: '既有支出或公積金被刪除時安全提醒',
                            icon: '🗑️'
                          },
                          {
                            key: 'notifyOnSettle' as keyof AppNotifySettings,
                            title: '代墊平帳結算完成通知',
                            desc: '進行月度對帳清償時推播結算確認報告',
                            icon: '⚖️'
                          },
                          {
                            key: 'showBalance' as keyof AppNotifySettings,
                            title: '公積金剩餘額度警戒',
                            desc: '公積金結餘低於設定水位時警示推播',
                            icon: '⚠️'
                          },
                          {
                            key: 'notifyOnShoppingAdd' as keyof AppNotifySettings,
                            title: '採購待買清單新增',
                            desc: '加入想要或需要購買的食材與日用品時推播',
                            icon: '🛒'
                          },
                          {
                            key: 'notifyOnShoppingComplete' as keyof AppNotifySettings,
                            title: '採購物品已買回勾選',
                            desc: '物品被標記為已購買或轉代墊時推播',
                            icon: '✅'
                          },
                          {
                            key: 'notifyOnShoppingDelete' as keyof AppNotifySettings,
                            title: '採購清單項目刪除',
                            desc: '採購記事內的品項被移除時通知',
                            icon: '📝'
                          }
                        ].map((item) => {
                          const isChecked = !!notifySettings[item.key];
                          return (
                            <label
                              key={item.key}
                              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                isChecked
                                  ? 'bg-white border-[#DDD7C9] shadow-2xs'
                                  : 'bg-[#FAF8F3] border-[#EAE6DC] opacity-70'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                                <div className="min-w-0">
                                  <div className="text-xs font-extrabold text-[#3E3A36]">
                                    {item.title}
                                  </div>
                                  <p className="text-[11px] text-[#8C8475] mt-0.5 leading-snug">
                                    {item.desc}
                                  </p>
                                </div>
                              </div>

                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleNotifySetting(item.key)}
                                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer shrink-0"
                              />
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {onTestNotification && (
                      <button
                        type="button"
                        onClick={onTestNotification}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>發送測試推播與鈴聲</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Footer 底部版本資訊 */}
            <div className="px-4 py-2.5 border-t border-[#E8E4D9] bg-white flex items-center justify-between text-[11px] text-[#8C8475] font-mono shrink-0 select-none">
              <div className="flex items-center gap-1.5">
                <span>{APP_NAME}</span>
                <span className="font-bold text-[#3E3A36]">{APP_VERSION}</span>
                <span className="text-[#DDD6C8]">|</span>
                <span className="text-[10px] text-[#A8A194]">{APP_BUILD_DATE}</span>
              </div>
              {onOpenVersionInfo && (
                <button
                  type="button"
                  onClick={onOpenVersionInfo}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF8F5] hover:bg-[#EAE5D9] text-[#5C5549] border border-[#DDD6C8] transition-all cursor-pointer font-sans font-bold active:scale-95"
                  title="點擊查看版本與更新紀錄"
                >
                  版本詳情
                </button>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
