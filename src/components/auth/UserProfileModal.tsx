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
  AlertCircle,
  LogIn,
  Clock
} from 'lucide-react';
import { AuthUser, CoupleBindingInfo, NicknameLengthPreference } from '../../types';
import { NicknameSettingsSection } from '../common/NicknameSettingsSection';
import { getActiveInviteCode, getInviteRemainingSeconds, formatRemainingTime } from '../../utils/partnerInvite';

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
  onBindPartnerInvite?: (inviteInput: string) => Promise<{ success: boolean; message?: string }>;
  hasDatabaseBound?: boolean;
  onOpenDatabaseOnboarding?: () => void;
  onUpdateNickname?: (
    nickname: string,
    lengthPreference?: NicknameLengthPreference,
    nickname1Char?: string,
    nickname2Char?: string
  ) => boolean;
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

  const [inviteRemainingSecs, setInviteRemainingSecs] = useState<number>(() => {
    const active = getActiveInviteCode();
    return getInviteRemainingSeconds(active);
  });

  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      const active = getActiveInviteCode();
      setInviteRemainingSecs(getInviteRemainingSeconds(active));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isOpen, currentInviteCode]);
  
  // 暱稱編輯狀態 (限文字，少於三個字：1~2 個字)
  const [nicknameInput, setNicknameInput] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setNicknameInput(currentUser.nickname || currentUser.name?.slice(0, 2) || '');
    }
  }, [currentUser, isOpen]);

  const cleanUserEmail = (currentUser?.email || '').trim().toLowerCase();
  const cleanAdminEmail = (partnerBindingInfo?.adminEmail || currentUser?.adminEmail || '').trim().toLowerCase();
  const cleanPartnerEmail = (partnerBindingInfo?.partnerEmail || '').trim().toLowerCase();

  const isPartner = currentUser?.userRole === 'partner' || 
    (Boolean(currentUser?.adminEmail) && currentUser?.adminEmail.toLowerCase() !== cleanUserEmail) || 
    (Boolean(cleanPartnerEmail) && cleanPartnerEmail === cleanUserEmail && cleanPartnerEmail !== cleanAdminEmail);

  const isAdmin = !isPartner;
  const isCoupleConnected = Boolean(cleanAdminEmail && cleanPartnerEmail && cleanAdminEmail !== cleanPartnerEmail);
  const hasValidPartner = isAdmin ? isCoupleConnected : Boolean(cleanAdminEmail && cleanAdminEmail !== cleanUserEmail);
  const partnerDisplayName = isPartner 
    ? (partnerBindingInfo?.adminName || currentUser?.adminName || '主管理員')
    : (partnerBindingInfo?.partnerName || '伴侶');

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

  const userFirstChar = currentUser?.name ? currentUser.name.charAt(0) : (isAdmin ? '主' : '伴');
  const userShort = currentUser?.name && currentUser.name.length >= 2 ? currentUser.name.slice(0, 2) : (isAdmin ? '管理' : '伴侶');
  const defaultPresets = currentUser?.userRole === 'partner'
    ? [userFirstChar, userShort, '寶貝', `小${userFirstChar}`, '隊友']
    : [userFirstChar, userShort, '主理', `小${userFirstChar}`, '寶貝'];
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
                        : (currentUser ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-stone-100 text-stone-700 border-stone-300')
                    }`}>
                      {isAdmin ? '👑 主管理員' : (currentUser ? '💖 伴侶身分' : '📱 訪客模式')}
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
              {!currentUser ? (
                /* 📱 本機訪客模式卡片 (未登入 Google) */
                <div className="bg-gradient-to-br from-amber-50/90 to-[#FFFDF9] rounded-2xl p-4 sm:p-5 border border-amber-200/90 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-2xl shrink-0 border border-amber-300 shadow-inner">
                        📱
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-base text-[#3E3A36]">本機離線訪客模式</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                            未登入 Google
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8C8475] mt-0.5">所有資料僅儲存在此裝置 (localStorage)</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSwitchAccount();
                      }}
                      className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-900 hover:to-amber-950 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 whitespace-nowrap"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>登入 Google 帳號</span>
                    </button>
                  </div>

                  <div className="bg-white/80 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-950 leading-relaxed space-y-1.5">
                    <div className="font-bold flex items-center gap-1 text-amber-900 text-xs">
                      <span>⚠️ 訪客模式重要說明與資料保存：</span>
                    </div>
                    <p className="text-[#5C564E]">
                      您目前可順暢使用公積金、代墊分帳與旅遊行程之所有本機記帳功能。因未登入 Google 帳戶，<b>系統完全不連接後端 Google 試算表資料庫</b>，亦<b>無雲端背景同步與伴侶配對功能</b>。
                    </p>
                    <p className="text-amber-800 font-medium">
                      ⚠️ 請注意：若清理手機瀏覽器暫存、開啟無痕模式或更換裝置，本機儲存之資料將無法復原。建議登入 Google 帳號以啟用專屬試算表掛接與伴侶雙向同步！
                    </p>
                  </div>
                </div>
              ) : (
                /* 目前登入帳號與 Google 大頭貼同步卡片 */
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
                            {currentUser?.nickname?.[0] || currentUser?.name?.[0] || (isAdmin ? '主' : '伴')}
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
                        <span className="font-bold text-[#3E3A36]">{currentUser?.email || currentUser?.id || '未登入 Google 帳號'}</span>
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
                  {onSyncGoogleAvatar && currentUser && !currentUser.isDevSandbox && currentUser.authMethod === 'google_oauth' && (
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
                        <span>重新抓取 Google 照片</span>
                      </button>
                    </div>
                  )}

                  {/* 🏷️ 稱呼顯示設定與字數選擇 (單字 vs 雙字) */}
                  <NicknameSettingsSection
                    currentUser={currentUser}
                    onUpdateNickname={onUpdateNickname}
                    accentColor="amber"
                  />

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
              )}

              {/* 💌 伴侶配對模式（暫停舊版，準備全新設計） */}
              {currentUser && (
                <div className="bg-gradient-to-br from-[#FFFDF9] to-[#FDF8EE] rounded-2xl p-4 border border-amber-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
                      <Heart className="w-4 h-4 text-rose-600 fill-rose-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1.5">
                        <span>💖 伴侶配對模式</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          重新設計中 🛠️
                        </span>
                      </h4>
                      <p className="text-[11px] text-[#8C8475] mt-0.5">
                        目前帳本採用獨立隔離與個人化雲端資料庫同步，伴侶互聯配對功能正在進行全新架構規劃與重構。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 🔑 試算表連線金鑰與同步中心 */}
              {!currentUser ? (
                /* 🔒 訪客模式：未連線 Google 試算表資料庫 */
                <div className="bg-white rounded-2xl p-4 border border-[#E8E4D9] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-stone-100 text-[#8C8475] flex items-center justify-center font-bold">
                        <Key className="w-4 h-4 text-stone-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1">
                          <span>Google 試算表資料庫連線</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-stone-100 text-stone-600">未連線</span>
                        </h4>
                        <p className="text-[10px] text-[#8C8475]">本機離線模式無掛接雲端資料庫</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-stone-100 text-stone-600 font-bold px-2 py-0.5 rounded-full">
                      ⚪ 本機單機模式
                    </span>
                  </div>

                  <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EDE7D9] space-y-1.5 text-xs">
                    <p className="text-[11px] text-[#7A7366] leading-relaxed">
                      🔒 未登入 Google 帳號時，系統不會對後端 Google 試算表發送任何請求或資料，所有記錄均保存在您的本機。若需啟用雲端資料庫存檔與對帳，請先登入 Google 帳戶。
                    </p>
                  </div>
                </div>
              ) : (
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
              )}

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
