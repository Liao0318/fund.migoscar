import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Loader2,
  Heart,
  ExternalLink,
  Lock,
  KeyRound,
  ClipboardPaste,
  CheckCircle2,
  Sparkles,
  X
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { AuthUser, PartnerInviteData } from '../../types';
import { 
  signInWithGooglePopup, 
  requestGoogleOAuthToken
} from '../../utils/googleOAuthService';
import { resolveInviteCodeOrToken } from '../../utils/partnerInvite';
import { getUserCloudConfig } from '../../utils/userConfigService';

interface GoogleAuthPortalProps {
  onLogin: (user: AuthUser, partnerInvite?: PartnerInviteData | null, initialCloudGasUrl?: string, initialCloudSheetUrl?: string) => void;
  onEnterDevSandbox?: () => void;
  onEnterGuestMode?: () => void;
}

export const GoogleAuthPortal: React.FC<GoogleAuthPortalProps> = ({
  onLogin,
  onEnterGuestMode
}) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 伴侶邀請碼輸入與偵測狀態
  const [manualInviteCode, setManualInviteCode] = useState<string>('');
  const [detectedInvite, setDetectedInvite] = useState<PartnerInviteData | null>(null);
  const [inviteStatus, setInviteStatus] = useState<{
    valid: boolean;
    message: string;
    data: PartnerInviteData | null;
  } | null>(null);

  const handleCodeChange = (code: string) => {
    setManualInviteCode(code);
    if (!code.trim()) {
      setInviteStatus(null);
      setDetectedInvite(null);
      return;
    }
    const clean = code.trim();
    const resolved = resolveInviteCodeOrToken(clean);
    if (resolved) {
      setDetectedInvite(resolved);
      setInviteStatus({
        valid: true,
        message: `已成功識別伴侶【${resolved.adminName || '主管理員'}】的帳本邀請！`,
        data: resolved
      });
    } else {
      if (/^BB-[A-Z0-9]{4,8}$/i.test(clean) || /^[A-Z0-9]{4,8}$/i.test(clean)) {
        const formattedCode = clean.toUpperCase().startsWith('BB-') ? clean.toUpperCase() : `BB-${clean.toUpperCase()}`;
        const fallback: PartnerInviteData = {
          inviteCode: formattedCode,
          adminEmail: '',
          adminName: '另一半',
          gasWebUrl: '',
          deploySheetUrl: '',
          createdAt: new Date().toISOString()
        };
        setDetectedInvite(fallback);
        setInviteStatus({
          valid: true,
          message: `已填妥邀請碼 ${formattedCode}，完成登入後將自動配對！`,
          data: fallback
        });
      } else {
        setDetectedInvite(null);
        setInviteStatus({
          valid: false,
          message: '邀請碼格式不符（例如：BB-XXXX 或貼上專屬邀請連結）',
          data: null
        });
      }
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleCodeChange(text);
        }
      }
    } catch (e) {
      console.warn('Cannot read clipboard', e);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      const inviteParam = url.searchParams.get('invite') || url.searchParams.get('code');
      let hashCode = '';
      if (window.location.hash.includes('join=')) {
        hashCode = window.location.hash.split('join=')[1]?.split('&')[0] || '';
      }

      const candidate = inviteParam || hashCode;
      if (candidate) {
        handleCodeChange(candidate);
      }
    } catch (e) {}
  }, []);

  /**
   * 完成登入並同步使用者雲端資料庫設定與自訂暱稱
   */
  const processSuccessfulUser = async (rawUser: AuthUser) => {
    let cloudGas = '';
    let cloudSheet = '';
    let savedNickname = '';
    const cleanEmail = (rawUser.email || '').trim().toLowerCase();

    // 1. 本地讀取綁定的專屬暱稱
    try {
      if (cleanEmail) {
        savedNickname = localStorage.getItem(`banban_user_nickname_${cleanEmail}`) || '';
      }
    } catch (e) {}

    // 2. 雲端讀取 Firestore 個人專屬設定（跨裝置或重新登入）
    try {
      const existingConfig = await getUserCloudConfig(rawUser.email);
      if (existingConfig) {
        cloudGas = existingConfig.gasWebUrl || '';
        cloudSheet = existingConfig.deploySheetUrl || '';
        if (existingConfig.nickname) {
          savedNickname = existingConfig.nickname;
          if (cleanEmail) {
            try {
              localStorage.setItem(`banban_user_nickname_${cleanEmail}`, savedNickname);
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load user cloud config:', e);
    }

    const enhancedUser: AuthUser = {
      ...rawUser,
      nickname: savedNickname || rawUser.nickname,
      authMethod: 'google_oauth'
    };

    onLogin(enhancedUser, detectedInvite, cloudGas, cloudSheet);
  };

  /**
   * 觸發 Google 官方 OAuth 授權登入頁面
   */
  const handleGoogleOfficialOAuthLogin = async () => {
    setErrorMessage(null);
    setIsLoggingIn(true);

    try {
      // 1. 優先透過 Firebase Google 官方彈跳授權視窗登入
      const result = await signInWithGooglePopup();
      if (result && result.user) {
        await processSuccessfulUser(result.user);
        setIsLoggingIn(false);
        return;
      }
    } catch (fbErr: any) {
      console.warn('Firebase signInWithPopup info:', fbErr?.code || fbErr?.message || fbErr);
      
      // 使用者主動取消或關閉視窗
      if (fbErr?.code === 'auth/popup-closed-by-user' || fbErr?.message?.includes('closed-by-user')) {
        setErrorMessage('Google 登入視窗已關閉。請點擊按鈕重新開啟 Google 登入頁面完成驗證。');
        setIsLoggingIn(false);
        return;
      }

      // 2. 嘗試使用 Google GSI 官方授權視窗 (Google Identity Services)
      try {
        const gsiResult = await requestGoogleOAuthToken();
        if (gsiResult && gsiResult.user) {
          await processSuccessfulUser(gsiResult.user);
          setIsLoggingIn(false);
          return;
        }
      } catch (gsiErr: any) {
        console.warn('Google GSI Token Client error:', gsiErr);
        if (gsiErr?.message?.includes('popup_closed_by_user') || gsiErr?.type === 'popup_closed') {
          setErrorMessage('Google 登入視窗已關閉。請再次點擊登入。');
        } else {
          setErrorMessage('無法開啟 Google 授權頁面，請確認瀏覽器是否允許快顯視窗（Pop-up），並點擊按鈕重試。');
        }
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF9F5] via-[#F4EFE6] to-[#ECE6D8] text-[#3E3A36] flex flex-col justify-between p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* 裝飾背景柔光圓 */}
      <div className="absolute top-[-8%] right-[-8%] w-[380px] sm:w-[540px] h-[380px] sm:h-[540px] bg-rose-200/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-8%] left-[-8%] w-[320px] sm:w-[480px] h-[320px] sm:h-[480px] bg-amber-200/25 rounded-full blur-3xl pointer-events-none" />

      {/* 迎賓主要畫面區 (置中排版) */}
      <main className="max-w-md w-full mx-auto my-auto py-4 sm:py-6 z-10 space-y-5">
        {/* 🌟 去背置中迎賓品牌視覺 */}
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center flex flex-col items-center justify-center space-y-2.5"
        >
          {/* 去背 Logo 圖案 */}
          <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="cursor-default drop-shadow-md"
          >
            <BrandLogo transparent className="w-18 h-18 sm:w-22 sm:h-22" />
          </motion.div>

          {/* 去背字樣標題 */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#3E3A36] flex items-center justify-center">
              伴伴記<span className="text-rose-500 inline-block animate-pulse">❤️</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#7A7366] font-medium tracking-wide">
              情侶專屬生活記帳・Google 官方帳號安全登入
            </p>
          </div>
        </motion.div>

        {/* 登入操作卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-[#E8E2D5] shadow-[0_12px_40px_rgba(62,58,54,0.08)] space-y-4"
        >
          {/* 💌 伴侶邀請碼輸入/配對專屬區塊 */}
          <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl p-3.5 sm:p-4 text-left space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#4A4641] flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>伴侶邀請碼配對（選填）</span>
              </label>
              {manualInviteCode && (
                <button
                  type="button"
                  onClick={() => handleCodeChange('')}
                  className="text-[11px] text-[#8C8475] hover:text-rose-600 flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>清除</span>
                </button>
              )}
            </div>

            <div className="relative flex items-center">
              <div className="absolute left-3 text-[#8C8475] pointer-events-none">
                <KeyRound className="w-4 h-4 text-amber-700" />
              </div>
              <input
                type="text"
                value={manualInviteCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="輸入邀請碼 (如 BB-9X2K) 或貼上邀請連結"
                className="w-full bg-white border border-[#DDD6C8] focus:border-rose-400 focus:ring-2 focus:ring-rose-100 rounded-xl pl-9 pr-18 py-2.5 text-xs text-[#3E3A36] placeholder-[#A09A8F] tracking-wide transition-all font-mono"
              />
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="absolute right-2 px-2.5 py-1 bg-[#F4EFE6] hover:bg-[#EAE4D6] text-[#5C564E] rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                title="貼上剪貼簿內容"
              >
                <ClipboardPaste className="w-3 h-3 text-amber-800" />
                <span>貼上</span>
              </button>
            </div>

            {/* 驗證回饋提示 */}
            {inviteStatus && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                  inviteStatus.valid
                    ? 'bg-rose-50/90 text-rose-900 border border-rose-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}
              >
                {inviteStatus.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="text-[11px] leading-relaxed font-medium">
                  {inviteStatus.message}
                </div>
              </motion.div>
            )}

            {!inviteStatus && (
              <p className="text-[10px] text-[#8C8475] leading-relaxed">
                💡 若另一半已提供專屬邀請碼或邀請網址，請在此輸入。登入後將自動建立情侶帳本關聯！
              </p>
            )}
          </div>

          {/* 錯誤警示提示窗 */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-3.5 text-xs flex items-start gap-2.5 overflow-hidden shadow-2xs text-left"
              >
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="font-bold">Google 登入提示</div>
                  <div className="text-[11px] text-rose-700 leading-normal">{errorMessage}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 官方 Google 帳戶登入按鈕 */}
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={handleGoogleOfficialOAuthLogin}
              disabled={isLoggingIn}
              className="w-full py-3.5 px-4 rounded-2xl text-sm font-bold border-2 shadow-xs hover:shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-[0.99] group bg-white hover:bg-[#F8F9FA] text-[#3C4043] border-[#DADCE0] hover:border-[#4285F4] disabled:opacity-75"
            >
              {isLoggingIn ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              ) : (
                /* Google 4 色官方 Logo */
                <svg className="w-5 h-5 group-hover:scale-105 transition-transform shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span className="font-extrabold text-[#3C4043]">
                {isLoggingIn
                  ? '正在開啟 Google 授權視窗...'
                  : detectedInvite
                  ? '使用 Google 帳戶登入並配對'
                  : '使用 Google 帳戶登入'}
              </span>
            </button>

            {/* 安全登入提示 */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8C8475] pt-1">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>點擊後將開啟 Google 官方登入頁面選擇帳號</span>
            </div>

            {/* 分隔線 */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#E8E2D5]" />
              <span className="shrink-0 mx-3 text-[11px] text-[#A09A8F] font-bold">或</span>
              <div className="flex-grow border-t border-[#E8E2D5]" />
            </div>

            {/* 本機離線體驗模式按鈕 */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (onEnterGuestMode) {
                    onEnterGuestMode();
                  } else {
                    try {
                      localStorage.setItem('banban_is_guest_mode', 'true');
                    } catch (e) {}
                    window.location.reload();
                  }
                }}
                className="w-full py-3 px-4 rounded-2xl text-xs font-bold border border-[#DDD6C8] bg-[#F7F5F0] hover:bg-[#EFECE4] text-[#5C564E] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
              >
                <span>📱</span>
                <span>暫不登入，直接以本機模式體驗</span>
              </button>

              <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-2.5 text-[11px] text-amber-900 leading-relaxed text-left">
                <div className="font-bold flex items-center gap-1 mb-0.5 text-amber-950">
                  <span>💡 本機模式說明：</span>
                </div>
                <span>所有資料皆僅存在本機手機中。若需連接 Google 試算表雲端備份或啟用伴侶配對同步，登入 Google 帳號即可解鎖！</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* 底部頁腳 */}
      <footer className="max-w-md w-full mx-auto text-center py-2 text-[11px] text-[#9E9789] z-10">
        ©2026 伴伴記記帳系統｜Google 官方 OAuth 授權安全驗證
      </footer>
    </div>
  );
};
