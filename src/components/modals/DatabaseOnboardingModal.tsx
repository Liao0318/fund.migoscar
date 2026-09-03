import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Rocket, 
  Settings, 
  CheckCircle2, 
  Copy, 
  Check, 
  FileCode, 
  ExternalLink, 
  Heart, 
  Sparkles, 
  Lock, 
  Cloud, 
  Share2, 
  RefreshCw, 
  ArrowRight, 
  ArrowLeft,
  X,
  AlertCircle,
  Key,
  Crown
} from 'lucide-react';
import { AuthUser, PartnerInviteData } from '../../types';
import { resolveInviteCodeOrToken } from '../../utils/partnerInvite';

interface DatabaseOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  gasWebUrl: string;
  setGasWebUrl: (v: string) => void;
  deploySheetUrl: string;
  setDeploySheetUrl: (v: string) => void;
  saveDeployConfig: () => void;
  customizedCodeGs: string;
  inviteCode: string;
  onGenerateNewInviteCode?: () => void;
  onBindPartnerInvite?: (inviteInput: string) => Promise<{ success: boolean; message?: string }>;
  initialChoice?: 'partner' | 'admin';
}

export const DatabaseOnboardingModal: React.FC<DatabaseOnboardingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  gasWebUrl,
  setGasWebUrl,
  deploySheetUrl,
  setDeploySheetUrl,
  saveDeployConfig,
  customizedCodeGs,
  inviteCode,
  onGenerateNewInviteCode,
  onBindPartnerInvite,
  initialChoice = 'partner'
}) => {
  // 用戶選擇模式：'partner' (輸入伴侶邀請碼) 或 'admin' (自己建立並綁定 API 資料庫)
  const [onboardingMode, setOnboardingMode] = useState<'partner' | 'admin'>(initialChoice);

  // 伴侶邀請碼輸入與驗證狀態
  const [inviteInput, setInviteInput] = useState('');
  const [resolvedInvite, setResolvedInvite] = useState<PartnerInviteData | null>(null);
  const [partnerError, setPartnerError] = useState<string | null>(null);
  const [isPartnerBindingLoading, setIsPartnerBindingLoading] = useState(false);
  const [partnerBindSuccess, setPartnerBindSuccess] = useState(false);

  // 管理員 API 綁定 3 步驟狀態
  const [adminStep, setAdminStep] = useState<1 | 2 | 3>(1);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isAdminBindingLoading, setIsAdminBindingLoading] = useState(false);
  const [adminValidationError, setAdminValidationError] = useState<string | null>(null);

  // 本地輸入狀態
  const [inputSheetUrl, setInputSheetUrl] = useState(deploySheetUrl || '');
  const [inputGasUrl, setInputGasUrl] = useState(gasWebUrl || '');

  // 當使用者輸入邀請碼時即時解析
  useEffect(() => {
    const clean = inviteInput.trim();
    if (!clean) {
      setResolvedInvite(null);
      setPartnerError(null);
      return;
    }

    const found = resolveInviteCodeOrToken(clean);
    if (found) {
      setResolvedInvite(found);
      setPartnerError(null);
    } else if (clean.length >= 4) {
      setResolvedInvite(null);
      if (!clean.toUpperCase().startsWith('BB-') && !clean.includes('=')) {
        setPartnerError('邀請碼格式通常為「BB-XXXX」或完整邀請連結');
      } else {
        setPartnerError('找不到符合的邀請碼，請向伴侶索取最新 6 碼邀請碼或專屬連結');
      }
    }
  }, [inviteInput]);

  const handleCopyGsCode = () => {
    navigator.clipboard.writeText(customizedCodeGs);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleCopyShareCard = () => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const fullJoinUrl = `${origin}${pathname}#join=${inviteCode}`;
    const cardText = `【伴伴記 ❤️ 情侶共同記帳邀請】\n\n嗨！${currentUser?.name || '我'} 邀請你一起使用「伴伴記」共同記帳與管理支出！\n\n🔑 專屬伴侶邀請代碼：${inviteCode}\n📲 點擊專屬連結立即加入綁定：\n${fullJoinUrl}\n\n一起甜蜜記帳吧！💑✨`;
    navigator.clipboard.writeText(cardText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  /**
   * 伴侶模式：提交邀請碼完成綁定
   */
  const handlePartnerSubmit = async () => {
    const clean = inviteInput.trim();
    if (!clean) {
      setPartnerError('請輸入伴侶提供的 6 碼邀請代碼（例如 BB-XXXX）或貼上專屬連結');
      return;
    }

    setIsPartnerBindingLoading(true);
    setPartnerError(null);

    if (onBindPartnerInvite) {
      const res = await onBindPartnerInvite(clean);
      setIsPartnerBindingLoading(false);
      if (res.success) {
        setPartnerBindSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setPartnerError(res.message || '邀請碼綁定失敗，請確認代碼是否正確');
      }
    } else {
      setIsPartnerBindingLoading(false);
      onClose();
    }
  };

  /**
   * 管理員模式：驗證並綁定 Google Apps Script API
   */
  const handleVerifyAndBindAdmin = () => {
    setAdminValidationError(null);
    const cleanGas = inputGasUrl.trim();
    const cleanSheet = inputSheetUrl.trim();

    if (!cleanGas) {
      setAdminValidationError('請填入 Google Apps Script 網頁應用程式 (Web App) API 網址');
      return;
    }

    if (!cleanGas.startsWith('http')) {
      setAdminValidationError('API 網址格式錯誤，必須以 https://script.google.com/ 開頭');
      return;
    }

    setIsAdminBindingLoading(true);

    setGasWebUrl(cleanGas);
    setDeploySheetUrl(cleanSheet);

    try {
      localStorage.setItem('muji_gas_web_url', cleanGas);
      localStorage.setItem('muji_sheet_url', cleanSheet);
    } catch (e) {}

    setTimeout(() => {
      saveDeployConfig();
      setIsAdminBindingLoading(false);
      setAdminStep(3); // 進入綁定成功與邀請伴侶步驟
    }, 600);
  };

  const isBound = Boolean(gasWebUrl && gasWebUrl.startsWith('http'));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-[#FAF9F5] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-[#E5E0D2] max-h-[92vh] flex flex-col my-auto text-left font-sans"
          >
            {/* 標題欄 */}
            <div className="p-4 sm:p-5 border-b border-[#E8E4D9] flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-100/30 to-rose-500/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-bold shadow-sm">
                  <Sparkles className="w-5 h-5 text-amber-100" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#3E3A36] text-sm sm:text-base flex items-center gap-2">
                    <span>歡迎來到伴伴記❤️</span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                      {currentUser?.name || '新用戶'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#8C8475] font-medium">
                    請選擇您要加入伴侶的現有帳本，或是建立自己專屬的 API 資料庫
                  </p>
                </div>
              </div>

              {isBound && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-[#EFECE3] hover:bg-[#E5E1D5] flex items-center justify-center text-[#8C8475] transition-all cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 模式切換卡片：伴侶邀請碼 vs 建立 API */}
            <div className="bg-white p-3 border-b border-[#EDE7D9] shrink-0">
              <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setOnboardingMode('partner')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    onboardingMode === 'partner'
                      ? 'bg-rose-50/90 border-rose-400 text-rose-950 shadow-xs'
                      : 'bg-[#FAF9F5] border-[#E8E2D5] text-[#7A7366] hover:bg-rose-50/40'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    onboardingMode === 'partner' ? 'bg-rose-500 text-white' : 'bg-[#EAE4D7] text-[#7A7366]'
                  }`}>
                    <Heart className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <div className="text-xs font-black flex items-center gap-1">
                      <span>輸入伴侶邀請碼</span>
                    </div>
                    <div className="text-[10px] text-rose-800/80">加入另一半已建立的帳本</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOnboardingMode('admin')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    onboardingMode === 'admin'
                      ? 'bg-amber-50/90 border-amber-400 text-amber-950 shadow-xs'
                      : 'bg-[#FAF9F5] border-[#E8E2D5] text-[#7A7366] hover:bg-amber-50/40'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    onboardingMode === 'admin' ? 'bg-amber-800 text-white' : 'bg-[#EAE4D7] text-[#7A7366]'
                  }`}>
                    <Crown className="w-4 h-4 text-amber-100" />
                  </div>
                  <div>
                    <div className="text-xs font-black flex items-center gap-1">
                      <span>建立專屬 API 資料庫</span>
                    </div>
                    <div className="text-[10px] text-amber-800/80">主帳號部署並派發邀請碼</div>
                  </div>
                </button>
              </div>
            </div>

            {/* 內容區 */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-left">
              {/* ======================= 模式 1: 伴侶邀請碼綁定 ======================= */}
              {onboardingMode === 'partner' && (
                <motion.div
                  key="mode-partner"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 space-y-2">
                    <h4 className="text-xs font-black text-rose-950 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-600 fill-rose-500" />
                      <span>輸入伴侶邀請碼，一秒加入情侶共同帳本</span>
                    </h4>
                    <p className="text-[11px] text-rose-800 leading-relaxed">
                      若您的另一半已經建立好伴伴記帳本，請向對方索取 <strong>6 碼邀請碼（例如 BB-XXXX）</strong> 或專屬邀請連結，貼在下方即可自動綁定並同步記帳！
                    </p>
                  </div>

                  {/* 邀請碼輸入框 */}
                  <div className="bg-white rounded-2xl p-4 border border-[#E8E4D9] space-y-3 shadow-2xs">
                    <div>
                      <label className="block text-xs font-bold text-[#3E3A36] mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Key className="w-3.5 h-3.5 text-rose-600" />
                          <span>專屬伴侶邀請代碼 / 邀請連結</span>
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
                        value={inviteInput}
                        onChange={(e) => setInviteInput(e.target.value)}
                        placeholder="例如：BB-8924 或貼上邀請網址"
                        className="w-full px-3.5 py-2.5 text-xs bg-[#FAF9F5] border-2 border-rose-300 focus:border-rose-600 rounded-xl focus:outline-none transition-all font-mono font-bold tracking-wider uppercase text-[#3E3A36]"
                      />
                    </div>

                    {/* 即時解析展示卡 */}
                    {resolvedInvite && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1"
                      >
                        <div className="font-bold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>已識別伴侶帳本：{resolvedInvite.adminName || '主管理員'} ({resolvedInvite.adminEmail})</span>
                        </div>
                        <div className="text-[11px] text-emerald-700">
                          點擊下方按鈕即可立即綁定，自動繼承 Google 試算表雲端資料庫！
                        </div>
                      </motion.div>
                    )}

                    {partnerError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{partnerError}</span>
                      </div>
                    )}

                    {partnerBindSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>🎉 成功綁定伴侶帳本！正在為您開啟共同記帳...</span>
                      </div>
                    )}
                  </div>

                  {/* 提交按鈕 */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handlePartnerSubmit}
                      disabled={isPartnerBindingLoading || partnerBindSuccess}
                      className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98 disabled:opacity-50"
                    >
                      {isPartnerBindingLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>正在驗證並綁定伴侶帳本...</span>
                        </>
                      ) : partnerBindSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>綁定成功！</span>
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4 fill-white" />
                          <span>🚀 確認綁定並加入伴侶帳本</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ======================= 模式 2: 建立專屬 API 資料庫 ======================= */}
              {onboardingMode === 'admin' && (
                <motion.div
                  key="mode-admin"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* 步驟進度條 */}
                  <div className="bg-white px-3 py-2 rounded-2xl border border-[#EDE7D9] flex items-center justify-between text-xs">
                    <div className={`flex items-center gap-1.5 font-bold ${adminStep === 1 ? 'text-amber-900' : adminStep > 1 ? 'text-emerald-700' : 'text-[#A0988A]'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${adminStep === 1 ? 'bg-amber-800 text-white' : adminStep > 1 ? 'bg-emerald-600 text-white' : 'bg-[#EAE4D7] text-[#7A7366]'}`}>
                        {adminStep > 1 ? <Check className="w-3 h-3" /> : '1'}
                      </span>
                      <span>試算表與代碼</span>
                    </div>

                    <div className="h-[2px] flex-1 mx-2 bg-[#EFE9DD] relative">
                      <div 
                        className="h-full bg-amber-700 transition-all duration-300"
                        style={{ width: adminStep === 1 ? '0%' : adminStep === 2 ? '50%' : '100%' }}
                      />
                    </div>

                    <div className={`flex items-center gap-1.5 font-bold ${adminStep === 2 ? 'text-amber-900' : adminStep > 2 ? 'text-emerald-700' : 'text-[#A0988A]'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${adminStep === 2 ? 'bg-amber-800 text-white' : adminStep > 2 ? 'bg-emerald-600 text-white' : 'bg-[#EAE4D7] text-[#7A7366]'}`}>
                        {adminStep > 2 ? <Check className="w-3 h-3" /> : '2'}
                      </span>
                      <span>驗證與綁定 API</span>
                    </div>

                    <div className="h-[2px] flex-1 mx-2 bg-[#EFE9DD] relative">
                      <div 
                        className="h-full bg-amber-700 transition-all duration-300"
                        style={{ width: adminStep === 3 ? '100%' : '0%' }}
                      />
                    </div>

                    <div className={`flex items-center gap-1.5 font-bold ${adminStep === 3 ? 'text-rose-700 font-black' : 'text-[#A0988A]'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${adminStep === 3 ? 'bg-rose-600 text-white' : 'bg-[#EAE4D7] text-[#7A7366]'}`}>
                        <Heart className="w-3 h-3 fill-white" />
                      </span>
                      <span>派發邀請碼</span>
                    </div>
                  </div>

                  {/* 步驟 1: 試算表與代碼準備 */}
                  {adminStep === 1 && (
                    <div className="space-y-3">
                      <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-3.5 space-y-1.5">
                        <h4 className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                          <span>第 1 步：建立 Google 試算表並複製後端代碼</span>
                        </h4>
                        <p className="text-[11px] text-amber-900/80 leading-relaxed">
                          伴伴記使用 Google 試算表作為您與伴侶的私有資料庫。請在下方輸入您的試算表網址，並複製系統為您客製化產生的 Apps Script 後端程式碼。
                        </p>
                      </div>

                      {/* 試算表網址輸入 */}
                      <div className="bg-white rounded-2xl p-4 border border-[#E8E4D9] space-y-3 shadow-2xs">
                        <div>
                          <label className="block text-xs font-bold text-[#3E3A36] mb-1">
                            Google 試算表連線網址 (Spreadsheet URL / ID)
                          </label>
                          <input
                            type="url"
                            value={inputSheetUrl}
                            onChange={(e) => setInputSheetUrl(e.target.value)}
                            placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                            className="w-full px-3 py-2 text-xs bg-[#FAF9F5] border border-[#D8D2C5] focus:border-amber-700 rounded-xl focus:outline-none transition-all font-mono"
                          />
                        </div>

                        {/* 複製 Code.gs */}
                        <div className="pt-2 border-t border-[#F0EBE1] space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[#3E3A36] flex items-center gap-1">
                              <FileCode className="w-3.5 h-3.5 text-amber-800" />
                              <span>Google Apps Script 後端代碼 (Code.gs)</span>
                            </label>
                            <button
                              type="button"
                              onClick={handleCopyGsCode}
                              className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                            >
                              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedCode ? '已複製 Code.gs！' : '一鍵複製 Code.gs'}</span>
                            </button>
                          </div>

                          <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EDE7D9] text-[11px] text-[#5C564E] space-y-1">
                            <div className="font-bold text-[#3E3A36]">💡 部署快速 3 步驟：</div>
                            <ol className="list-decimal list-inside space-y-0.5 text-[10px] text-[#7A7366] pl-1">
                              <li>在試算表中點選上方選單 <strong>「擴充功能」➔「Apps Script」</strong></li>
                              <li>清空檔案並貼上剛複製的 <strong>Code.gs</strong></li>
                              <li>點選右上角 <strong>「部署」➔「新增部署作業」➔ 選取「網頁應用程式」</strong>，將存取權設為<strong>「所有人」</strong>並複製網址！</li>
                            </ol>
                          </div>
                        </div>
                      </div>

                      {/* 前往下一步 */}
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setAdminStep(2)}
                          className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                        >
                          <span>下一步：填寫 API 網址並驗證綁定</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 步驟 2: 輸入 Web App API 網址並綁定 */}
                  {adminStep === 2 && (
                    <div className="space-y-3">
                      <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-3.5 space-y-1.5">
                        <h4 className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                          <Cloud className="w-3.5 h-3.5 text-amber-700" />
                          <span>第 2 步：貼上 Apps Script 網頁應用程式 API 網址</span>
                        </h4>
                        <p className="text-[11px] text-amber-900/80 leading-relaxed">
                          請將部署完成後取得的 Web App 網址貼在下方，系統會將此 API 永久綁定在您的 Google 帳號中，換手機登入也能自動同步。
                        </p>
                      </div>

                      <div className="bg-white rounded-2xl p-4 border border-[#E8E4D9] space-y-3 shadow-2xs">
                        <div>
                          <label className="block text-xs font-bold text-[#3E3A36] mb-1">
                            Google Apps Script 網頁應用程式 (Web App) API 網址 *
                          </label>
                          <input
                            type="url"
                            value={inputGasUrl}
                            onChange={(e) => {
                              setInputGasUrl(e.target.value);
                              setAdminValidationError(null);
                            }}
                            placeholder="https://script.google.com/macros/s/.../exec"
                            className="w-full px-3 py-2.5 text-xs bg-[#FAF9F5] border-2 border-amber-300 focus:border-amber-700 rounded-xl focus:outline-none transition-all font-mono font-bold text-[#3E3A36]"
                          />
                        </div>

                        {adminValidationError && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{adminValidationError}</span>
                          </div>
                        )}
                      </div>

                      {/* 按鈕操作區 */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setAdminStep(1)}
                          className="px-4 py-2.5 bg-[#FAF8F3] hover:bg-[#F2EDE1] text-[#5C564E] rounded-xl text-xs font-bold border border-[#E6E0D2] flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>上一步</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleVerifyAndBindAdmin}
                          disabled={isAdminBindingLoading}
                          className="px-6 py-2.5 bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-900 hover:to-amber-950 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          {isAdminBindingLoading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>正在驗證並綁定資料庫...</span>
                            </>
                          ) : (
                            <>
                              <Rocket className="w-4 h-4 text-amber-200" />
                              <span>🚀 驗證連線並完成帳號綁定</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 步驟 3: 綁定成功 & 派發伴侶邀請碼 */}
                  {adminStep === 3 && (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 border-2 border-emerald-300 rounded-3xl p-4 text-center space-y-1.5 shadow-xs">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-black text-emerald-950">
                          🎉 恭喜！資料庫與 Google 帳號已成功綁定！
                        </h4>
                        <p className="text-[11px] text-emerald-800 max-w-sm mx-auto">
                          您的專屬 API 資料庫已永久同步至 <span className="font-bold underline">{currentUser?.email}</span>。現在您已正式取得伴侶邀請碼派發權限！
                        </p>
                      </div>

                      {/* 伴侶邀請碼卡片 */}
                      <div className="bg-gradient-to-br from-[#FFFDF9] to-[#FDF8EE] rounded-2xl p-4 border border-rose-200 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                              <Heart className="w-4 h-4 fill-rose-500 text-rose-600" />
                            </div>
                            <div>
                              <h5 className="text-xs font-black text-[#3E3A36] flex items-center gap-1">
                                <span>💌 伴侶專屬邀請代碼</span>
                                <span className="text-[10px] bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded font-bold">已解鎖</span>
                              </h5>
                              <p className="text-[10px] text-[#8C8475]">伴侶登入時輸入此代碼，即可自動共享同一份資料庫</p>
                            </div>
                          </div>

                          {onGenerateNewInviteCode && (
                            <button
                              type="button"
                              onClick={onGenerateNewInviteCode}
                              className="p-1.5 rounded-lg bg-white border border-amber-200 hover:bg-amber-50 text-amber-900 text-xs cursor-pointer shadow-2xs"
                              title="重新隨機派發新邀請碼"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* 代碼 display */}
                        <div className="bg-white rounded-xl p-3 border-2 border-rose-200 flex items-center justify-between gap-2 shadow-xs">
                          <div>
                            <div className="text-[10px] text-[#8C8475] font-bold">6 碼專屬邀請碼</div>
                            <div className="font-mono text-2xl font-black text-rose-900 tracking-wider">
                              {inviteCode}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleCopyInviteCode}
                            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            {copiedInvite ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedInvite ? '已複製！' : '複製代碼'}</span>
                          </button>
                        </div>

                        {/* 一鍵複製邀請卡 */}
                        <button
                          type="button"
                          onClick={handleCopyShareCard}
                          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                        >
                          {copiedShare ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>已複製邀請函與加入連結！</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5" />
                              <span>一鍵複製伴侶專屬邀請卡與連結 📲</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* 完成並開始記帳按鈕 */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={onClose}
                          className="w-full py-3 bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-900 hover:to-amber-950 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
                        >
                          <Sparkles className="w-4 h-4 text-amber-200" />
                          <span>太棒了！開始使用伴伴記記帳</span>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
