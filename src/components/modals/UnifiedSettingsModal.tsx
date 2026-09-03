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
  Edit3, 
  Check, 
  RefreshCw, 
  Terminal, 
  ExternalLink, 
  Share2, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  Cloud,
  Layers,
  ChevronRight,
  ShieldCheck,
  Camera
} from 'lucide-react';
import { AuthUser, CoupleBindingInfo } from '../../types';

interface UnifiedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  onSwitchAccount: () => void;
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
  onUpdateNickname?: (nickname: string) => boolean;
  onSyncGoogleAvatar?: () => Promise<boolean>;
  pendingQueueCount?: number;
  isOnline?: boolean;
  lastSyncedAt?: string;
}

export const UnifiedSettingsModal: React.FC<UnifiedSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onSwitchAccount,
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
  onUpdateNickname,
  onSyncGoogleAvatar,
  pendingQueueCount = 0,
  isOnline = true,
  lastSyncedAt = '剛剛'
}) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'gas' | 'backup' | 'pwa' | 'advanced'>('profile');
  const [nicknameInput, setNicknameInput] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSyncingAvatar, setIsSyncingAvatar] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setNicknameInput(currentUser.nickname || currentUser.name?.slice(0, 2) || '');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const isAdmin = currentUser?.userRole !== 'partner';

  // 暱稱驗證：限文字，少於 3 個字 (1~2 個字元)
  const trimmedNickname = nicknameInput.trim();
  const isPureText = trimmedNickname ? /^[\p{L}\p{N}]+$/u.test(trimmedNickname) : false;
  const isLengthValid = trimmedNickname.length > 0 && trimmedNickname.length < 3;
  const isNicknameValid = isPureText && isLengthValid;

  let validationMessage = '';
  if (!trimmedNickname) {
    validationMessage = '請輸入暱稱 (1~2 個文字)';
  } else if (trimmedNickname.length >= 3) {
    validationMessage = '暱稱需少於 3 個字 (最多 2 個字)';
  } else if (!isPureText) {
    validationMessage = '暱稱僅限純文字 (中文/英文/數字，不可含符號或空格)';
  }

  const handleSaveNickname = () => {
    if (!isNicknameValid || !onUpdateNickname) return;
    const ok = onUpdateNickname(trimmedNickname);
    if (ok) {
      setIsEditingNickname(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#FAF9F5] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-[#E8E4D9] max-h-[92vh] flex flex-col my-auto"
        >
          {/* Header 頂部 */}
          <div className="p-4 sm:p-5 border-b border-[#E8E4D9] flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3E3A36] to-[#5C564E] text-white flex items-center justify-center shadow-md">
                <Settings className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#3E3A36] text-base sm:text-lg flex items-center gap-1.5">
                  <span>系統設定與帳戶中心</span>
                  {currentUser && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                      {currentUser.nickname || currentUser.name || '已登入'}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-[#8C8475] font-light">
                  整合個人帳戶、試算表金鑰、資料備份與手機桌面設定
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

          {/* 橫向分頁導覽選單 */}
          <div className="flex items-center border-b border-[#E8E4D9] bg-[#F4F1EA] px-3 sm:px-5 pt-2 gap-1 sm:gap-2 shrink-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setActiveSection('profile')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 shrink-0 ${
                activeSection === 'profile'
                  ? 'border-rose-600 text-rose-700 bg-white/70 rounded-t-xl'
                  : 'border-transparent text-[#706B62] hover:text-[#3E3A36]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>個人與伴侶</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('gas')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 shrink-0 ${
                activeSection === 'gas'
                  ? 'border-amber-600 text-amber-800 bg-white/70 rounded-t-xl'
                  : 'border-transparent text-[#706B62] hover:text-[#3E3A36]'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>試算表金鑰</span>
              {gasWebUrl ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('backup')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 shrink-0 ${
                activeSection === 'backup'
                  ? 'border-blue-600 text-blue-800 bg-white/70 rounded-t-xl'
                  : 'border-transparent text-[#706B62] hover:text-[#3E3A36]'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>資料備份對帳</span>
              {pendingQueueCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                  {pendingQueueCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('pwa')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 shrink-0 ${
                activeSection === 'pwa'
                  ? 'border-rose-600 text-rose-700 bg-white/70 rounded-t-xl'
                  : 'border-transparent text-[#706B62] hover:text-[#3E3A36]'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>手機桌面 App</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('advanced')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 shrink-0 ${
                activeSection === 'advanced'
                  ? 'border-[#3E3A36] text-[#3E3A36] bg-white/70 rounded-t-xl'
                  : 'border-transparent text-[#706B62] hover:text-[#3E3A36]'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>進階與離線模式</span>
            </button>
          </div>

          {/* 內容區塊 */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-left">
            {/* 1. 個人與伴侶 */}
            {activeSection === 'profile' && (
              <div className="space-y-4">
                {/* 使用者 Google 資訊卡片 */}
                <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-[#E8E4D9] space-y-3 sm:space-y-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shadow-md flex items-center justify-center font-bold text-base sm:text-lg text-white ${
                          currentUser?.userRole === 'partner' || currentUser?.role === '周' ? 'bg-rose-500' : 'bg-amber-600'
                        }`}>
                          {currentUser?.avatar ? (
                            <img
                              src={currentUser.avatar}
                              alt={currentUser.nickname || currentUser.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{currentUser?.nickname?.[0] || currentUser?.name?.[0] || '我'}</span>
                          )}
                        </div>
                        {onSyncGoogleAvatar && (
                          <button
                            type="button"
                            onClick={handleSyncAvatar}
                            disabled={isSyncingAvatar}
                            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-[#E6E0D2] shadow-xs flex items-center justify-center text-[#5C564E] hover:text-rose-600 transition-all cursor-pointer"
                            title="重新同步 Google 大頭貼"
                          >
                            <RefreshCw className={`w-3 h-3 ${isSyncingAvatar ? 'animate-spin text-rose-500' : ''}`} />
                          </button>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-[#3E3A36] text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
                            {currentUser?.nickname || currentUser?.name || '使用者'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap ${
                            isAdmin 
                              ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {isAdmin ? <Crown className="w-2.5 h-2.5 shrink-0" /> : <Heart className="w-2.5 h-2.5 shrink-0" />}
                            <span>{isAdmin ? '主要管理者 (廖)' : '受邀伴侶 (周)'}</span>
                          </span>
                        </div>
                        <p className="text-xs text-[#8C8475] font-mono mt-0.5 truncate max-w-[200px] sm:max-w-none">
                          {currentUser?.email || 'oscargh3359@gmail.com'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditingNickname(!isEditingNickname)}
                      className="self-start sm:self-auto px-3 py-1.5 bg-[#FAF8F3] hover:bg-[#F2EFE7] border border-[#E6E0D2] rounded-xl text-xs font-bold text-[#5C564E] flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditingNickname ? '取消編輯' : '修改暱稱'}</span>
                    </button>
                  </div>

                  {/* 暱稱修改表單 */}
                  {isEditingNickname && (
                    <div className="bg-[#FAF9F5] p-3 sm:p-3.5 rounded-2xl border border-rose-200/90 space-y-2">
                      <label className="block text-xs font-bold text-[#3E3A36] break-words">
                        個人專屬暱稱（限文字，少於 3 個字：1~2 個字）
                      </label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <input
                          type="text"
                          value={nicknameInput}
                          onChange={(e) => setNicknameInput(e.target.value)}
                          maxLength={2}
                          placeholder="例如：廖、丞、寶"
                          className="w-full sm:flex-1 px-3 py-2 bg-white border border-[#DDD8CE] rounded-xl text-xs font-bold text-[#3E3A36] focus:outline-none focus:border-rose-500"
                        />
                        <button
                          type="button"
                          disabled={!isNicknameValid}
                          onClick={handleSaveNickname}
                          className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                        >
                          儲存暱稱
                        </button>
                      </div>
                      <p className={`text-[11px] ${isNicknameValid ? 'text-emerald-700' : 'text-rose-600 font-medium'}`}>
                        {validationMessage || '✓ 符合暱稱規範 (1~2 個文字)'}
                      </p>
                    </div>
                  )}

                  {savedSuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>個人專屬暱稱已成功更新並同步至雲端！</span>
                    </div>
                  )}
                </div>

                {/* 伴侶連線卡片 */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-3 shadow-2xs">
                  <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1.5 border-b border-[#F2EDE1] pb-2">
                    <Heart className="w-4 h-4 text-rose-600" />
                    <span>💖 伴侶連線與邀請分享</span>
                  </h4>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F3] p-3.5 rounded-2xl border border-[#EBE7DC]">
                    <div>
                      <div className="text-xs font-bold text-[#3E3A36] flex items-center gap-1.5">
                        <span>專屬伴侶配對代碼：</span>
                        <span className="font-mono bg-white px-2 py-0.5 rounded-lg border border-[#DDD8CE] text-rose-700 font-extrabold text-sm">
                          {currentInviteCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8C8475] mt-1">
                        伴侶登入後可透過此代碼即時雙向連線，共同記帳並即時接收推播
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="px-3 py-1.5 bg-white hover:bg-[#F2EFE7] border border-[#E6E0D2] rounded-xl text-xs font-bold text-[#5C564E] flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? '已複製' : '複製代碼'}</span>
                      </button>

                      {onCopyInviteShare && (
                        <button
                          type="button"
                          onClick={handleCopyShareText}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                        >
                          {copiedShare ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                          <span>{copiedShare ? '已複製連結' : '分享邀請'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. 試算表連線金鑰 */}
            {activeSection === 'gas' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[#F2EDE1] pb-2.5">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-600" />
                      <h4 className="text-xs font-extrabold text-[#3E3A36]">Google 試算表雲端資料庫連線</h4>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      gasWebUrl 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${gasWebUrl ? 'bg-emerald-600' : 'bg-amber-600 animate-ping'}`} />
                      <span>{gasWebUrl ? '已成功綁定' : '尚未綁定'}</span>
                    </span>
                  </div>

                  <p className="text-xs text-[#5C564E] leading-relaxed">
                    透過 Google Apps Script (GAS) 部署 Web App，伴伴記所有日常代墊、公積金存入與採購紀錄將自動同步存入您的個人 Google 雲端試算表，完全保有 100% 隱私與永續存取權。
                  </p>

                  <div className="bg-[#FAF8F3] p-3.5 rounded-2xl border border-[#EAE6DC] space-y-2">
                    <div className="text-[11px] font-bold text-[#8C8475]">當前 Web App URL 金鑰：</div>
                    <div className="font-mono text-[11px] text-[#3E3A36] break-all bg-white p-2.5 rounded-xl border border-[#DDD8CE]">
                      {gasWebUrl || '尚未設定任何 GAS Web App URL'}
                    </div>
                  </div>

                  {/* 📊 試算表 8 大工作頁清單 */}
                  <div className="bg-[#FAF8F3] rounded-2xl p-3.5 border border-[#EAE6DC] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#3E3A36] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>試算表已連線之 8 大工作頁</span>
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        8/8 完整支援
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[#5C564E]">
                      <div className="bg-white px-2.5 py-1.5 rounded-lg border border-[#EAE6DC] flex items-center gap-1.5">
                        <span>🌸</span> <span>1. 流水帳資料庫</span>
                      </div>
                      <div className="bg-white px-2.5 py-1.5 rounded-lg border border-[#EAE6DC] flex items-center gap-1.5">
                        <span>🗓️</span> <span>2. 月度核銷狀態</span>
                      </div>
                      <div className="bg-white px-2.5 py-1.5 rounded-lg border border-[#EAE6DC] flex items-center gap-1.5">
                        <span>💳</span> <span>3. 代墊明細</span>
                      </div>
                      <div className="bg-white px-2.5 py-1.5 rounded-lg border border-[#EAE6DC] flex items-center gap-1.5">
                        <span>🛒</span> <span>4. 購物清單</span>
                      </div>
                      <div className="bg-white px-2.5 py-1.5 rounded-lg border border-[#EAE6DC] flex items-center gap-1.5">
                        <span>🏪</span> <span>5. 常用商店</span>
                      </div>
                      <div className="bg-white px-2.5 py-1.5 rounded-lg border border-[#EAE6DC] flex items-center gap-1.5">
                        <span>✈️</span> <span>6. 旅遊行程</span>
                      </div>
                      <div className="bg-white px-2.5 py-1.5 rounded-lg border border-[#EAE6DC] flex items-center gap-1.5">
                        <span>🧾</span> <span>7. 旅遊支出明細</span>
                      </div>
                      <div className="bg-white px-2.5 py-1.5 rounded-lg border border-[#EAE6DC] flex items-center gap-1.5">
                        <span>💡</span> <span>8. 旅遊心願清單</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    {deploySheetUrl && (
                      <a
                        href={deploySheetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-white hover:bg-[#F2EFE7] border border-[#E0DCD3] rounded-xl text-xs font-bold text-[#5C564E] flex items-center gap-1.5 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>開啟 Google 雲端試算表</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenGasDeploy();
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 ml-auto"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>設定 / 更新 GAS 連線金鑰</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. 資料備份與對帳 */}
            {activeSection === 'backup' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[#F2EDE1] pb-2.5">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-extrabold text-[#3E3A36]">資料備份、還原與離線同步佇列</h4>
                    </div>
                    <span className="text-[10px] text-[#8C8475] font-mono">
                      最後同步：{lastSyncedAt}
                    </span>
                  </div>

                  <p className="text-xs text-[#5C564E] leading-relaxed">
                    伴伴記具備離線優先 (Offline-First) 架構。當網路不穩時，您的記帳操作會安全存於本地佇列，並在恢復網路時自動背景同步。
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#FAF8F3] p-3 rounded-xl border border-[#EAE6DC]">
                      <div className="text-[10px] text-[#8C8475] font-medium">離線暫存待同步佇列</div>
                      <div className="text-lg font-black text-[#3E3A36] mt-0.5">
                        {pendingQueueCount} 筆
                      </div>
                    </div>
                    <div className="bg-[#FAF8F3] p-3 rounded-xl border border-[#EAE6DC]">
                      <div className="text-[10px] text-[#8C8475] font-medium">連線狀態</div>
                      <div className={`text-xs font-extrabold mt-1.5 flex items-center gap-1.5 ${isOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                        <span>{isOnline ? '線上正常連線' : '離線模式中'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenDataBackup();
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>開啟資料備份與匯入匯出中心</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. 手機桌面 App (PWA) */}
            {activeSection === 'pwa' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-4 shadow-2xs">
                  <div className="flex items-center gap-2 border-b border-[#F2EDE1] pb-2.5">
                    <Smartphone className="w-4 h-4 text-rose-600" />
                    <h4 className="text-xs font-extrabold text-[#3E3A36]">將伴伴記安裝至手機桌面 (PWA)</h4>
                  </div>

                  <p className="text-xs text-[#5C564E] leading-relaxed">
                    安裝至手機主畫面後，伴伴記可如原生 App 一般全螢幕開啟、零延遲啟動，享有更佳的操作體驗與離線記帳能力。
                  </p>

                  <div className="bg-rose-50/70 border border-rose-200/90 rounded-2xl p-4 space-y-2">
                    <div className="text-xs font-bold text-rose-900">📲 快速安裝步驟：</div>
                    <ul className="text-xs text-[#5C564E] space-y-1.5 list-disc list-inside">
                      <li><strong>iOS (Safari)</strong>：點擊瀏覽器底部的「分享」圖示 ➔ 選擇「加入主畫面」。</li>
                      <li><strong>Android (Chrome)</strong>：點擊右上角「更多 (三個點)」 ➔ 選擇「安裝應用程式」或「加到主畫面」。</li>
                    </ul>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPwaInstall();
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>開啟手機安裝引導畫面</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. 進階與離線模式 */}
            {activeSection === 'advanced' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-4 shadow-2xs">
                  <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1.5 border-b border-[#F2EDE1] pb-2">
                    <Terminal className="w-4 h-4 text-[#3E3A36]" />
                    <span>本機離線試用與帳戶管理</span>
                  </h4>

                  {/* 沙盒開關 */}
                  <div className="flex items-center justify-between p-3.5 bg-[#FAF8F3] rounded-2xl border border-[#EAE6DC]">
                    <div>
                      <div className="text-xs font-bold text-[#3E3A36] flex items-center gap-1.5">
                        <span>本機離線試用模式</span>
                        {isSandboxMode && (
                          <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 rounded">啟用中</span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#8C8475] mt-0.5">
                        不需設定 Google 試算表，直接在本機快取中體驗所有記帳與代墊功能
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSandboxMode}
                        onChange={(e) => onToggleSandboxMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#DDD8CE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  {/* 帳號切換與登出 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F2EDE1]">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSwitchAccount();
                      }}
                      className="px-3.5 py-2 bg-[#FAF8F3] hover:bg-[#F2EFE7] border border-[#E0DCD3] rounded-xl text-xs font-bold text-[#5C564E] flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#8C8475]" />
                      <span>切換 Google 登入帳號</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLogout();
                      }}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>登出帳號</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal 頁尾 */}
          <div className="p-4 bg-white border-t border-[#E8E4D9] flex justify-between items-center shrink-0">
            <span className="text-[11px] text-[#8C8475]">
              {currentUser?.email ? `已同步：${currentUser.email}` : '本地設定已即時套用'}
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
    </AnimatePresence>
  );
};
