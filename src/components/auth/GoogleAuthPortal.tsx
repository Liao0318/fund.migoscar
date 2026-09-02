import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  ArrowRight, 
  Lock, 
  ShieldAlert, 
  KeyRound,
  Loader2,
  Heart,
  Crown,
  Key,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { AuthUser, PartnerInviteData } from '../../types';
import { 
  signInWithGooglePopup, 
  requestGoogleOAuthToken 
} from '../../utils/googleOAuthService';
import { resolveInviteCodeOrToken } from '../../utils/partnerInvite';

interface GoogleAuthPortalProps {
  onLogin: (user: AuthUser, partnerInvite?: PartnerInviteData | null) => void;
  onEnterDevSandbox: () => void;
}

export const GoogleAuthPortal: React.FC<GoogleAuthPortalProps> = ({
  onLogin,
  onEnterDevSandbox
}) => {
  const [authRoleMode, setAuthRoleMode] = useState<'admin' | 'partner'>('admin');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [resolvedInvite, setResolvedInvite] = useState<PartnerInviteData | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDevPanel, setShowDevPanel] = useState(false);

  // 網址參數偵測：若從管理員發送的邀請連結進入 (?invite=... 或 #partner-join)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      const inviteParam = url.searchParams.get('invite') || url.searchParams.get('code');
      const hashParam = window.location.hash.includes('partner') || window.location.hash.includes('invite');
      
      if (inviteParam || hashParam) {
        setAuthRoleMode('partner');
        if (inviteParam) {
          setInviteCodeInput(inviteParam);
          const resolved = resolveInviteCodeOrToken(inviteParam);
          if (resolved) {
            setResolvedInvite(resolved);
          }
        }
      }
    } catch (e) {}
  }, []);

  // 當使用者輸入邀請碼時即時解析
  useEffect(() => {
    if (authRoleMode !== 'partner') return;
    const clean = inviteCodeInput.trim();
    if (!clean) {
      setResolvedInvite(null);
      setInviteError(null);
      return;
    }

    const found = resolveInviteCodeOrToken(clean);
    if (found) {
      setResolvedInvite(found);
      setInviteError(null);
    } else if (clean.length >= 4) {
      setResolvedInvite(null);
      if (!clean.toUpperCase().startsWith('BB-') && !clean.includes('=')) {
        setInviteError('邀請碼格式通常為「BB-XXXX」或完整邀請連結');
      } else {
        setInviteError('找不到符合的邀請碼，請向主管理員索取最新 6 碼邀請碼或專屬連結');
      }
    }
  }, [inviteCodeInput, authRoleMode]);

  /**
   * 觸發 Google 官方 OAuth 授權視窗
   */
  const handleGoogleOfficialOAuthLogin = async () => {
    setErrorMessage(null);

    // 若為伴侶模式，必須先輸入並驗證邀請碼
    if (authRoleMode === 'partner' && !resolvedInvite && !inviteCodeInput.trim()) {
      setErrorMessage('請先輸入管理員派發的伴侶邀請碼（例如 BB-XXXX）或貼上邀請連結');
      return;
    }

    setIsLoggingIn(true);

    try {
      // 1. 優先使用 Firebase 官方 Google 彈跳視窗進行身分驗證與授權
      const result = await signInWithGooglePopup();
      if (result && result.user) {
        const enhancedUser: AuthUser = {
          ...result.user,
          userRole: authRoleMode,
          role: authRoleMode === 'admin' ? '廖' : '周',
          adminEmail: authRoleMode === 'partner' ? resolvedInvite?.adminEmail : result.user.email,
          adminName: authRoleMode === 'partner' ? resolvedInvite?.adminName : result.user.name,
          inviteCode: resolvedInvite?.inviteCode || (authRoleMode === 'partner' ? inviteCodeInput.trim().toUpperCase() : undefined),
          authMethod: authRoleMode === 'partner' ? 'partner_invite' : 'google_oauth'
        };
        onLogin(enhancedUser, authRoleMode === 'partner' ? resolvedInvite : null);
        setIsLoggingIn(false);
        return;
      }
    } catch (fbErr: any) {
      console.warn('Firebase signInWithPopup failed, attempting GSI token client...', fbErr);
      
      // 如果使用者主動關閉視窗
      if (fbErr?.code === 'auth/popup-closed-by-user' || fbErr?.message?.includes('closed-by-user')) {
        setErrorMessage('Google 登入視窗已關閉。若要登入，請點擊按鈕再次開啟 Google 授權視窗。');
        setIsLoggingIn(false);
        return;
      }

      // 2. 嘗試 GSI Token Client 流程
      try {
        const gsiResult = await requestGoogleOAuthToken();
        if (gsiResult && gsiResult.user) {
          const enhancedUser: AuthUser = {
            ...gsiResult.user,
            userRole: authRoleMode,
            role: authRoleMode === 'admin' ? '廖' : '周',
            adminEmail: authRoleMode === 'partner' ? resolvedInvite?.adminEmail : gsiResult.user.email,
            adminName: authRoleMode === 'partner' ? resolvedInvite?.adminName : gsiResult.user.name,
            inviteCode: resolvedInvite?.inviteCode || (authRoleMode === 'partner' ? inviteCodeInput.trim().toUpperCase() : undefined),
            authMethod: authRoleMode === 'partner' ? 'partner_invite' : 'google_oauth'
          };
          onLogin(enhancedUser, authRoleMode === 'partner' ? resolvedInvite : null);
          setIsLoggingIn(false);
          return;
        }
      } catch (gsiErr: any) {
        console.error('All Google OAuth methods failed:', gsiErr);
        setErrorMessage(
          fbErr?.message?.includes('popup-blocked')
            ? '瀏覽器封鎖了 Google 登入彈跳視窗，請允許本站快顯彈跳視窗後重試。'
            : `Google OAuth 授權失敗：${fbErr?.message || gsiErr?.message || '請確認網路連線'}`
        );
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
              雙人專屬生活記帳・情侶獨立 Google 帳戶綁定
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
          {/* 角色登入切換器：管理員 vs 伴侶邀請碼 */}
          <div className="p-1 bg-[#F5F1E8] rounded-2xl border border-[#E5E0D2] flex items-center gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setAuthRoleMode('admin');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authRoleMode === 'admin'
                  ? 'bg-white text-amber-900 shadow-xs border border-amber-200/80 font-extrabold'
                  : 'text-[#8C8475] hover:text-[#3E3A36]'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-700" />
              <span>👑 主管理員登入</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthRoleMode('partner');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
                authRoleMode === 'partner'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-xs font-extrabold'
                  : 'text-[#8C8475] hover:text-[#3E3A36]'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current text-white/90" />
              <span>💌 伴侶邀請碼綁定</span>
            </button>
          </div>

          {/* 模式說明與輸入區 */}
          {authRoleMode === 'admin' ? (
            <div className="bg-[#FAF8F3] rounded-2xl p-3.5 border border-[#EDE4D2] space-y-1.5 text-left">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#4A4641]">
                <Crown className="w-3.5 h-3.5 text-amber-700" />
                <span>主管理員模式 (控管 API 與資料庫)</span>
              </div>
              <p className="text-[11px] text-[#7A7366] leading-relaxed">
                以您的 Google 帳戶登入後，可完整管理 Google 試算表連線、複製 Code.gs，並可<strong>隨機派發 6 碼專屬邀請碼</strong>給伴侶綁定加入！
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-left">
              <div className="bg-rose-50/80 rounded-2xl p-3.5 border border-rose-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                  <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                  <span>伴侶加入共同帳本 (零難度自動同步)</span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  輸入管理員提供的 6 碼邀請碼，即可使用您自己的 Google 帳戶登入並自動綁定資料庫，無須手動設定 Code.gs！
                </p>
              </div>

              {/* 邀請碼輸入框 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#3E3A36] flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-rose-600" />
                    <span>伴侶專屬邀請碼 / 邀請連結</span>
                  </span>
                  {resolvedInvite && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>驗證有效</span>
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                  placeholder="例如：BB-8924 或貼上邀請連結"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF9F5] border-2 border-[#E5E0D2] focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none transition-all font-mono font-bold tracking-wider uppercase text-[#3E3A36]"
                />

                {/* 驗證結果卡片 */}
                {resolvedInvite && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 space-y-1"
                  >
                    <div className="font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>已確認邀請：{resolvedInvite.adminName || '主管理員'} ({resolvedInvite.adminEmail})</span>
                    </div>
                    <div className="text-[10px] text-emerald-700">
                      登入後將自動繼承管理員的 Google 試算表資料庫與雙向即時記帳。
                    </div>
                  </motion.div>
                )}

                {inviteError && (
                  <p className="text-[11px] text-rose-600 font-medium">{inviteError}</p>
                )}
              </div>
            </div>
          )}

          {/* 錯誤警示提示窗 */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-3 text-xs flex items-start gap-2.5 overflow-hidden shadow-2xs text-left"
              >
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">Google 授權提示</div>
                  <div className="text-[11px] text-rose-700 leading-normal mt-0.5">{errorMessage}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 核心登入按鈕：Google 帳戶登入 */}
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={handleGoogleOfficialOAuthLogin}
              disabled={isLoggingIn}
              className={`w-full py-3.5 px-4 rounded-2xl text-sm font-bold border-2 shadow-xs hover:shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-[0.99] group ${
                authRoleMode === 'partner'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white border-rose-600'
                  : 'bg-white hover:bg-[#F8F9FA] text-[#3C4043] border-[#DADCE0] hover:border-[#4285F4]'
              }`}
            >
              {isLoggingIn ? (
                <Loader2 className={`w-5 h-5 animate-spin ${authRoleMode === 'partner' ? 'text-white' : 'text-blue-600'}`} />
              ) : authRoleMode === 'partner' ? (
                <Heart className="w-5 h-5 text-white fill-white shrink-0 group-hover:scale-110 transition-transform" />
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
              <span>
                {isLoggingIn
                  ? '正在開啟 Google 授權視窗...'
                  : authRoleMode === 'partner'
                    ? '以 Google 帳戶登入並綁定伴侶帳本'
                    : '使用 Google 帳戶登入 (管理員)'}
              </span>
            </button>
          </div>

          {/* 🔒 Google 官方安全性與試算表雙向同步保障 */}
          <div className="bg-[#FAF8F3] rounded-2xl p-3.5 border border-[#EDE4D2] space-y-1.5 text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#4A4641]">
              <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
              <span>情侶雙方獨立 Google 帳戶 100% 安全隔離</span>
            </div>
            <p className="text-[11px] text-[#7A7366] leading-relaxed">
              情侶各自使用自己的 Gmail 進行身分驗證，由管理員集中授權 GAS API 與資料庫，雙方記帳皆即時同步至同一個 Google 試算表！
            </p>
          </div>
        </motion.div>

        {/* 🧪 開發人員 / 測試人員專區 (沙盒模式切換) */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3.5 border border-[#E8E2D5] text-center space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6E685E] flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-slate-600" />
              <span>開發者 / 離線測試專區</span>
            </span>
            <button
              type="button"
              onClick={() => setShowDevPanel(!showDevPanel)}
              className="text-[11px] font-bold text-sky-700 hover:text-sky-800 transition-colors cursor-pointer"
            >
              {showDevPanel ? '收起' : '展開沙盒測試'}
            </button>
          </div>

          <AnimatePresence>
            {showDevPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2 text-left space-y-2 border-t border-[#EAE4D8] overflow-hidden"
              >
                <p className="text-[11px] text-[#8C8475] leading-relaxed">
                  <strong>開發人員沙盒測試模式</strong>：專供本地介面除錯與離線演練使用，資料僅保存在瀏覽器 LocalStorage，不進行 Google 試算表雲端同步。
                </p>
                <button
                  type="button"
                  onClick={onEnterDevSandbox}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-slate-100 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span>切換為開發人員沙盒測試</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* 底部頁腳 */}
      <footer className="max-w-md w-full mx-auto text-center py-2 text-[11px] text-[#9E9789] z-10">
        ©2026 伴伴記記帳系統｜Google OAuth Verified Security
      </footer>
    </div>
  );
};
