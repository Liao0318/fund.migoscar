import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  LogOut, 
  Key, 
  Terminal, 
  User, 
  Crown, 
  Heart, 
  Copy, 
  Check, 
  RefreshCw, 
  Sparkles, 
  Share2, 
  Unlink, 
  Lock, 
  ShieldCheck,
  CheckCircle2,
  Cloud,
  Edit3,
  Camera,
  AlertCircle
} from 'lucide-react';
import { AuthUser, CoupleBindingInfo } from '../../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  onSwitchAccount: () => void;
  onOpenGasDeploy: () => void;
  isSandboxMode: boolean;
  onToggleSandboxMode: (enabled: boolean) => void;
  gasWebUrl: string;
  deploySheetUrl: string;
  currentInviteCode?: string;
  onGenerateNewInviteCode?: () => void;
  onCopyInviteShare?: () => void;
  partnerBindingInfo?: CoupleBindingInfo | null;
  onUnbindPartner?: () => void;
  hasDatabaseBound?: boolean;
  onOpenDatabaseOnboarding?: () => void;
  onUpdateNickname?: (nickname: string) => boolean;
  onSyncGoogleAvatar?: () => Promise<boolean>;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onSwitchAccount,
  onOpenGasDeploy,
  isSandboxMode,
  onToggleSandboxMode,
  gasWebUrl,
  deploySheetUrl,
  currentInviteCode = 'BB-8924',
  onGenerateNewInviteCode,
  onCopyInviteShare,
  partnerBindingInfo,
  onUnbindPartner,
  hasDatabaseBound = false,
  onOpenDatabaseOnboarding,
  onUpdateNickname,
  onSyncGoogleAvatar
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isSyncingAvatar, setIsSyncingAvatar] = useState(false);
  
  // 暱稱編輯狀態 (限文字，少於三個字：1~2 個字)
  const [nicknameInput, setNicknameInput] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setNicknameInput(currentUser.nickname || currentUser.name?.slice(0, 2) || '');
    }
  }, [currentUser, isOpen]);

  const isAdmin = currentUser?.userRole !== 'partner';

  // 驗證暱稱：限文字且少於 3 個字 (即 1~2 個字元)
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

  const handleSaveNickname = (nameToSave?: string) => {
    const val = (nameToSave !== undefined ? nameToSave : trimmedNickname).trim();
    if (!val || val.length >= 3 || !/^[\p{L}\p{N}]+$/u.test(val)) {
      return;
    }
    if (onUpdateNickname) {
      const ok = onUpdateNickname(val);
      if (ok) {
        setNicknameInput(val);
        setIsEditingNickname(false);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    }
  };

  const handleSyncAvatarClick = async () => {
    if (!onSyncGoogleAvatar || isSyncingAvatar) return;
    setIsSyncingAvatar(true);
    try {
      await onSyncGoogleAvatar();
    } finally {
      setIsSyncingAvatar(false);
    }
  };

  const handleCopyCodeOnly = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentInviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyShareClick = () => {
    if (onCopyInviteShare) {
      onCopyInviteShare();
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const defaultPresets = currentUser?.role === '周' || currentUser?.userRole === 'partner'
    ? ['沛', '周', '沛緹', '小周', '寶貝']
    : ['丞', '廖', '尹丞', '小廖', '主理'];
  const quickPresets = defaultPresets.filter(p => p.length < 3);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-[#FAF9F5] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-[#E5E0D2] flex flex-col my-auto"
          >
            {/* 標題列 */}
            <div className="p-4 sm:p-5 border-b border-[#E8E4D9] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl ${
                  isAdmin ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200'
                } border flex items-center justify-center font-bold`}>
                  {isAdmin ? <Crown className="w-4 h-4 text-amber-700" /> : <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-[#3E3A36] text-sm sm:text-base flex items-center gap-1.5">
                    <span>Google 帳戶與暱稱管理</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isAdmin 
                        ? 'bg-amber-100 text-amber-900 border-amber-300' 
                        : 'bg-rose-100 text-rose-900 border-rose-300'
                    }`}>
                      {isAdmin ? '👑 主管理員' : '💖 伴侶身分'}
                    </span>
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#EFECE3] hover:bg-[#E5E1D5] flex items-center justify-center text-[#8C8475] transition-all cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 內容區 */}
            <div className="p-4 sm:p-5 space-y-4 text-left overflow-y-auto max-h-[82vh]">
              {/* 目前登入帳號與 Google 大頭貼同步卡片 */}
              <div className="bg-white rounded-2xl p-4 border border-[#E8E4D9] shadow-2xs space-y-4">
                <div className="flex items-center gap-3.5">
                  {/* Google 大頭貼相片 (同步 Google 帳戶) */}
                  <div className="relative group shrink-0">
                    <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 ${
                      isAdmin ? 'border-amber-300 shadow-amber-100' : 'border-rose-300 shadow-rose-100'
                    } shadow-md bg-[#FAF8F5] flex items-center justify-center`}>
                      {currentUser?.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.nickname || currentUser.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full ${
                          isAdmin
                            ? 'bg-gradient-to-br from-amber-600 to-amber-700'
                            : 'bg-gradient-to-br from-rose-500 to-rose-600'
                        } text-white font-black text-xl flex items-center justify-center`}>
                          {currentUser?.nickname?.[0] || currentUser?.role || (isAdmin ? '廖' : '周')}
                        </div>
                      )}
                    </div>

                    {/* Google 徽章圖示 */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center p-0.5" title="Google 帳戶已同步照片">
                      <span className="text-[11px] leading-none">🔍</span>
                    </div>
                  </div>

                  {/* 帳戶資訊與暱稱顯示 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-base text-[#3E3A36]">
                        {currentUser?.nickname || currentUser?.name || (isAdmin ? '主管理員' : '甜蜜伴侶')}
                      </span>
                      {currentUser?.nickname && (
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded border border-amber-200">
                          自訂暱稱
                        </span>
                      )}
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Google 官方授權</span>
                      </span>
                    </div>

                    <div className="text-xs text-[#5C564E] font-mono truncate mt-0.5 flex items-center gap-1">
                      <span className="text-[10px] text-[#8C8475] bg-[#F2EDE2] px-1.5 py-0.2 rounded font-sans font-semibold">
                        用戶 ID (Gmail)
                      </span>
                      <span className="font-bold text-[#3E3A36]">{currentUser?.email || currentUser?.id || 'user@gmail.com'}</span>
                    </div>

                    {/* 原始 Google 帳號姓名 */}
                    {currentUser?.name && currentUser.nickname && currentUser.name !== currentUser.nickname && (
                      <div className="text-[11px] text-[#A8A295] truncate mt-0.5">
                        Google 姓名：{currentUser.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* 🔄 同步 Google 大頭貼按鈕 */}
                {onSyncGoogleAvatar && (
                  <div className="flex items-center justify-between p-2.5 bg-[#FAF8F3] rounded-xl border border-[#EDE7D9] text-xs">
                    <div className="flex items-center gap-1.5 text-[#5C564E]">
                      <Camera className="w-3.5 h-3.5 text-amber-700" />
                      <span className="text-[11px] font-medium">照片大頭貼自動同步 Google 帳戶</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSyncAvatarClick}
                      disabled={isSyncingAvatar}
                      className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-900 font-bold text-[11px] rounded-lg border border-amber-200/90 flex items-center gap-1 shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 text-amber-700 ${isSyncingAvatar ? 'animate-spin' : ''}`} />
                      <span>{isSyncingAvatar ? '同步中...' : '重新抓取 Google 照片'}</span>
                    </button>
                  </div>
                )}

                {/* ✏️ 暱稱自訂設定區 (限文字，少於三個字：1~2 個字) */}
                <div className="bg-gradient-to-br from-[#FFFDF9] to-[#FBF7EE] p-3.5 rounded-xl border border-amber-200/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#3E3A36]">
                      <Edit3 className="w-3.5 h-3.5 text-amber-800" />
                      <span>右上角顯示暱稱設定</span>
                      <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-semibold">
                        限文字・少於 3 個字 (1~2 字)
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono font-bold ${
                      trimmedNickname.length >= 3 ? 'text-rose-600 font-black' : 'text-[#8C8475]'
                    }`}>
                      {trimmedNickname.length} / 2 字
                    </span>
                  </div>

                  {/* 暱稱輸入列 */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={nicknameInput}
                        maxLength={2}
                        onChange={(e) => {
                          setNicknameInput(e.target.value);
                          setIsEditingNickname(true);
                        }}
                        placeholder="例如: 丞、沛、小廖"
                        className={`w-full bg-white border ${
                          trimmedNickname && !isNicknameValid ? 'border-rose-400 focus:ring-rose-200' : 'border-[#D9D3C7] focus:ring-amber-200'
                        } rounded-xl px-3 py-2 text-xs font-bold text-[#3E3A36] placeholder-[#A8A295] focus:outline-hidden focus:ring-2 transition-all`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveNickname()}
                      disabled={!isNicknameValid}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                        isNicknameValid
                          ? 'bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white shadow-2xs cursor-pointer active:scale-95'
                          : 'bg-[#EAE5D9] text-[#A8A295] cursor-not-allowed'
                      }`}
                    >
                      {savedSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>已儲存！</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>儲存暱稱</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 驗證提示文字 */}
                  {validationMessage && (
                    <div className={`text-[11px] flex items-center gap-1 ${
                      isNicknameValid ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-medium'
                    }`}>
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{validationMessage}</span>
                    </div>
                  )}

                  {/* 快捷推薦暱稱 (符合 < 3 字限制) */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-[#8C8475]">推薦快選：</span>
                    {quickPresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setNicknameInput(preset);
                          handleSaveNickname(preset);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold shadow-2xs transition-all cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 帳戶切換與登出 */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#F2EDE1]">
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchAccount();
                      onClose();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#FAF8F3] hover:bg-[#F2EDE1] text-[#5C564E] text-xs font-bold transition-all border border-[#E6E0D2] cursor-pointer text-center"
                  >
                    切換 Google 帳號
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    className="py-2 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200 cursor-pointer flex items-center gap-1 shrink-0"
                    title="登出目前 Google 帳號"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>登出帳戶</span>
                  </button>
                </div>
              </div>

              {/* 💌 伴侶邀請與情侶帳本綁定區 */}
              {isAdmin ? (
                /* 管理員專屬：派發伴侶邀請碼卡片 */
                <div className="bg-gradient-to-br from-[#FFFDF9] to-[#FDF8EE] rounded-2xl p-4 border border-amber-300/80 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                        <Heart className="w-4 h-4 text-rose-600 fill-rose-500" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1">
                          <span>💌 派發伴侶專屬邀請碼</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${hasDatabaseBound ? 'bg-rose-100 text-rose-800' : 'bg-amber-200 text-amber-900'}`}>
                            {hasDatabaseBound ? '已解鎖' : '未解鎖'}
                          </span>
                        </h4>
                        <p className="text-[10px] text-[#8C8475]">
                          {hasDatabaseBound ? '伴侶登入輸入此碼即可自動綁定並同步資料庫' : '需先完成 Google 試算表與 API 資料庫綁定'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!hasDatabaseBound ? (
                    /* 🔒 未完成資料庫綁定時的鎖定提示卡 */
                    <div className="bg-amber-50/80 rounded-xl p-3.5 border border-amber-300 space-y-2.5">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                          <Lock className="w-4 h-4 text-amber-900" />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-amber-950">尚未完成資料庫與 API 綁定</div>
                          <p className="text-[11px] text-amber-900/80 leading-relaxed">
                            主帳號需先將 Google 試算表與 Apps Script API 綁定至此 Google 帳號，系統建立好私有雲端資料庫後，才能為伴侶派發專屬邀請代碼。
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenDatabaseOnboarding) {
                            onOpenDatabaseOnboarding();
                          } else {
                            onOpenGasDeploy();
                          }
                        }}
                        className="w-full py-2 px-3 bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-900 hover:to-amber-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-98"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                        <span>🚀 立即綁定資料庫與 API (解鎖邀請碼)</span>
                      </button>
                    </div>
                  ) : (
                    /* ✅ 已完成資料庫綁定：展示邀請代碼 */
                    <>
                      {/* 邀請碼展示卡片 */}
                      <div className="bg-white rounded-xl p-3 border-2 border-amber-200/90 flex items-center justify-between gap-2 shadow-xs">
                        <div>
                          <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>專屬伴侶邀請代碼 (資料庫已就緒)</span>
                          </div>
                          <div className="font-mono text-xl sm:text-2xl font-black text-amber-900 tracking-wider">
                            {currentInviteCode}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {onGenerateNewInviteCode && (
                            <button
                              type="button"
                              onClick={onGenerateNewInviteCode}
                              className="p-2 rounded-xl bg-[#FAF8F3] hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all cursor-pointer shadow-2xs"
                              title="重新隨機派發新邀請碼"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={handleCopyCodeOnly}
                            className="px-3 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedCode ? '已複製！' : '複製代碼'}</span>
                          </button>
                        </div>
                      </div>

                      {/* 一鍵複製專屬邀請卡與連結 */}
                      <button
                        type="button"
                        onClick={handleCopyShareClick}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                      >
                        {copiedShare ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>已複製邀請函與專屬加入連結！</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5" />
                            <span>一鍵複製伴侶專屬邀請卡與連結 📲</span>
                          </>
                        )}
                      </button>

                      {/* 伴侶綁定狀態 */}
                      <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#8C8475] font-bold">伴侶綁定狀態：</span>
                          {partnerBindingInfo?.partnerEmail ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>已綁定 ({partnerBindingInfo.partnerName || '伴侶'})</span>
                            </span>
                          ) : (
                            <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              ⏳ 等待伴侶輸入邀請碼加入
                            </span>
                          )}
                        </div>
                        {partnerBindingInfo?.partnerEmail && (
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#F4EFE6]">
                            <span className="text-[#8C8475] font-mono">{partnerBindingInfo.partnerEmail}</span>
                            {onUnbindPartner && (
                              <button
                                type="button"
                                onClick={onUnbindPartner}
                                className="text-[10px] text-rose-600 hover:text-rose-800 underline font-bold cursor-pointer"
                              >
                                解除伴侶綁定
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* 伴侶專屬：帳本綁定資訊卡片 */
                <div className="bg-gradient-to-br from-rose-50/70 to-[#FFF9F9] rounded-2xl p-4 border border-rose-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                      <Heart className="w-4 h-4 fill-rose-600 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-rose-900">
                        💖 已加入情侶共同帳本
                      </h4>
                      <p className="text-[10px] text-rose-700">記帳資料已雙向即時同步</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-rose-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-[#7A7366]">
                      <span>👑 帳本主管理者：</span>
                      <span className="font-bold text-[#3E3A36]">
                        {currentUser?.adminName || '主管理員'} ({currentUser?.adminEmail || 'admin@gmail.com'})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#7A7366]">
                      <span>🔑 使用邀請碼：</span>
                      <span className="font-mono font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded">
                        {currentUser?.inviteCode || currentInviteCode}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#7A7366]">
                      <span>🟢 資料庫狀態：</span>
                      <span className="font-bold text-emerald-700">即時雙向連動中</span>
                    </div>
                  </div>

                  <div className="bg-rose-100/60 p-2.5 rounded-xl border border-rose-200 text-[11px] text-rose-900 flex items-start gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      API 與試算表連線設定由主管理員統一維護，伴侶端可無憂進行日常記帳、借還代墊與採購清單！
                    </span>
                  </div>

                  {onUnbindPartner && (
                    <button
                      type="button"
                      onClick={() => {
                        onUnbindPartner();
                        onClose();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs border border-rose-300 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>更換邀請碼或解除綁定</span>
                    </button>
                  )}
                </div>
              )}

              {/* 🔑 試算表連線金鑰與同步中心 */}
              <div className="bg-white rounded-2xl p-4 border border-[#E8E4D9] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-bold">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1">
                        <span>Google 試算表資料庫連線</span>
                        {!isAdmin && <span className="text-[10px] text-slate-500 font-normal">(由管理員控管)</span>}
                      </h4>
                      <p className="text-[10px] text-[#8C8475]">雙向即時對帳引擎</p>
                    </div>
                  </div>

                  {gasWebUrl ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      🟢 已連線同步
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                      🟡 尚未綁定金鑰
                    </span>
                  )}
                </div>

                <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EDE7D9] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-[#7A7366]">
                    <span>GAS Web App API：</span>
                    <span className="font-mono text-[#3E3A36] font-semibold truncate max-w-[180px]">
                      {gasWebUrl ? 'AKfycb... (已啟用)' : '未設定 (請由管理員綁定)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#7A7366]">
                    <span>試算表資料庫：</span>
                    <span className="font-mono text-[#3E3A36] font-semibold truncate max-w-[180px]">
                      {deploySheetUrl ? '已綁定專屬工作表' : '預設資料庫'}
                    </span>
                  </div>

                  {/* ☁️ 雲端漫遊狀態提示 */}
                  {isAdmin && gasWebUrl && (
                    <div className="pt-1.5 border-t border-[#EAE3D2] flex items-center gap-1.5 text-[10px] text-emerald-800 font-bold">
                      <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>已永久綁定至您的 Google 帳號，日後更換手機或電腦登入自動生效！</span>
                    </div>
                  )}
                </div>

                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenGasDeploy();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-200" />
                    <span>管理 / 變更 Google 試算表連線設定 (管理員)</span>
                  </button>
                ) : (
                  <div className="text-[11px] text-[#8C8475] bg-[#FAF8F3] p-2.5 rounded-xl border border-[#E5E0D2] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>雲端試算表連線由主管理員統一設定，伴侶無需手動設定即可直接同步記帳。</span>
                  </div>
                )}
              </div>

              {/* 🧪 本機離線試用模式切換 */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-800">
                      本機離線試用模式
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleSandboxMode(!isSandboxMode)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                      isSandboxMode ? 'bg-amber-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        isSandboxMode ? 'translate-x-4.5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  開啟後無需連線 Google 試算表，直接在本機快取中體驗雙人記帳、採購清單與出國換算。
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
