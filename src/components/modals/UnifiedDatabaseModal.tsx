import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Key, 
  Crown, 
  Heart, 
  Sparkles, 
  FileCode, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Share2, 
  ArrowRight, 
  ArrowLeft, 
  ExternalLink, 
  ShieldCheck, 
  X, 
  Save, 
  Sliders, 
  ClipboardPaste,
  HelpCircle,
  Link as LinkIcon,
  PlayCircle,
  Unlink
} from 'lucide-react';
import { AuthUser, PartnerInviteData, CoupleBindingInfo } from '../../types';
import { resolveInviteCodeOrToken, fetchInviteCodeOnline } from '../../utils/partnerInvite';
import { INDEX_HTML_TEMPLATE, SPLIT_INDEX_HTML_TEMPLATE } from '../../data/gasTemplates';

interface UnifiedDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  gasWebUrl: string;
  setGasWebUrl: (v: string) => void;
  deploySheetUrl: string;
  setDeploySheetUrl: (v: string) => void;
  saveDeployConfig: () => void;
  customizedCodeGs: string;
  currentInviteCode: string;
  onGenerateNewInviteCode?: () => void;
  onCopyInviteShare?: () => void;
  onBindPartnerInvite?: (inviteInput: string) => Promise<{ success: boolean; message?: string }>;
  partnerBindingInfo?: CoupleBindingInfo | null;
  onUnbindPartner?: () => void;
  isSandboxMode?: boolean;
  onToggleSandboxMode?: (enabled: boolean) => void;
  initialTab?: 'wizard' | 'settings' | 'code' | 'partner';
  initialWizardRole?: 'admin' | 'partner';
}

export const UnifiedDatabaseModal: React.FC<UnifiedDatabaseModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  gasWebUrl,
  setGasWebUrl,
  deploySheetUrl,
  setDeploySheetUrl,
  saveDeployConfig,
  customizedCodeGs,
  currentInviteCode,
  onGenerateNewInviteCode,
  onCopyInviteShare,
  onBindPartnerInvite,
  partnerBindingInfo,
  onUnbindPartner,
  isSandboxMode = false,
  onToggleSandboxMode,
  initialTab = 'wizard',
  initialWizardRole
}) => {
  // 主分頁：'wizard' (引導小精靈) ｜ 'settings' (直接輸入與設定) ｜ 'code' (部署代碼庫) ｜ 'partner' (伴侶邀請與綁定)
  const [activeTab, setActiveTab] = useState<'wizard' | 'settings' | 'code' | 'partner'>(initialTab);

  // 引導小精靈內部狀態：'select_role' | 'admin_flow' | 'partner_flow'
  const [wizardRole, setWizardRole] = useState<'select_role' | 'admin_flow' | 'partner_flow'>(() => {
    if (initialWizardRole === 'admin') return 'admin_flow';
    if (initialWizardRole === 'partner') return 'partner_flow';
    return 'select_role';
  });

  // 管理員小精靈步驟：1 (試算表與代碼) | 2 (驗證與綁定 API) | 3 (派發邀請碼)
  const [adminWizardStep, setAdminWizardStep] = useState<1 | 2 | 3>(1);

  // 本地輸入狀態
  const [inputSheetUrl, setInputSheetUrl] = useState(deploySheetUrl || '');
  const [inputGasUrl, setInputGasUrl] = useState(gasWebUrl || '');

  // 伴侶邀請碼輸入與驗證狀態
  const [inviteInput, setInviteInput] = useState('');
  const [resolvedInvite, setResolvedInvite] = useState<PartnerInviteData | null>(null);
  const [partnerError, setPartnerError] = useState<string | null>(null);
  const [isPartnerBindingLoading, setIsPartnerBindingLoading] = useState(false);
  const [partnerBindSuccess, setPartnerBindSuccess] = useState(false);

  // 代碼預覽切換：'codeGs' | 'indexHtml' | 'splitHtml'
  const [codeTab, setCodeTab] = useState<'codeGs' | 'indexHtml' | 'splitHtml'>('codeGs');
  const [copiedCodeType, setCopiedCodeType] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const [isAdminBindingLoading, setIsAdminBindingLoading] = useState(false);
  const [adminValidationError, setAdminValidationError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // 同步外部傳入的初始設定
  useEffect(() => {
    if (isOpen) {
      if (deploySheetUrl) setInputSheetUrl(deploySheetUrl);
      if (gasWebUrl) setInputGasUrl(gasWebUrl);
      if (initialTab) setActiveTab(initialTab);
      if (initialWizardRole === 'admin') setWizardRole('admin_flow');
      else if (initialWizardRole === 'partner') setWizardRole('partner_flow');
      else if (gasWebUrl && gasWebUrl.startsWith('http')) {
        // 若已連線，預設開啟設定分頁或引導管理者
        setWizardRole('admin_flow');
        setAdminWizardStep(3);
      } else {
        setWizardRole('select_role');
        setAdminWizardStep(1);
      }
      setPartnerError(null);
      setAdminValidationError(null);
      setSaveSuccessMsg(false);
    }
  }, [isOpen, deploySheetUrl, gasWebUrl, initialTab, initialWizardRole]);

  // 即時聯網解析伴侶邀請碼
  useEffect(() => {
    let isMounted = true;
    const clean = inviteInput.trim();
    if (!clean) {
      setResolvedInvite(null);
      setPartnerError(null);
      return;
    }

    const found = resolveInviteCodeOrToken(clean);
    if (found && found.gasWebUrl && found.adminEmail) {
      setResolvedInvite(found);
      setPartnerError(null);
      return;
    }

    const isCodePattern = /^BB-[A-Z0-9]{4,8}$/i.test(clean) || /^[A-Z0-9]{4,8}$/i.test(clean) || clean.includes('http') || clean.includes('#join=') || clean.includes('invite=');
    if (isCodePattern) {
      fetchInviteCodeOnline(clean).then(cloudResolved => {
        if (!isMounted) return;
        if (cloudResolved && cloudResolved.adminEmail && cloudResolved.gasWebUrl) {
          setResolvedInvite(cloudResolved);
          setPartnerError(null);
        } else {
          setResolvedInvite(null);
          setPartnerError(`查無此邀請碼【${clean.length <= 12 ? clean.toUpperCase() : '代碼'}】，請確認代碼或向伴侶索取最新邀請碼`);
        }
      }).catch(() => {
        if (!isMounted) return;
        setResolvedInvite(null);
      });
    } else if (clean.length >= 3) {
      setResolvedInvite(null);
      setPartnerError('邀請碼格式通常為「BB-XXXX」或完整邀請連結');
    }

    return () => {
      isMounted = false;
    };
  }, [inviteInput]);

  const handleCopyCode = (type: 'codeGs' | 'indexHtml' | 'splitHtml') => {
    let text = customizedCodeGs;
    if (type === 'indexHtml') text = INDEX_HTML_TEMPLATE;
    if (type === 'splitHtml') text = SPLIT_INDEX_HTML_TEMPLATE;

    navigator.clipboard.writeText(text);
    setCopiedCodeType(type);
    setTimeout(() => setCopiedCodeType(null), 2000);
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(currentInviteCode);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleCopyShareCard = () => {
    if (onCopyInviteShare) {
      onCopyInviteShare();
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
      return;
    }
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const fullJoinUrl = `${origin}${pathname}#join=${currentInviteCode}`;
    const cardText = `【伴伴記 ❤️ 情侶共同記帳邀請】\n\n嗨！${currentUser?.name || '我'} 邀請你一起使用「伴伴記」共同記帳與管理支出！\n\n🔑 專屬伴侶邀請代碼：${currentInviteCode}\n📲 點擊專屬連結立即加入綁定：\n${fullJoinUrl}\n\n一起甜蜜記帳吧！💑✨`;
    navigator.clipboard.writeText(cardText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handlePasteClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInviteInput(text.trim());
        }
      }
    } catch (e) {
      console.warn('Cannot read clipboard', e);
    }
  };

  /**
   * 伴侶模式：提交邀請碼完成綁定
   */
  const handlePartnerSubmit = async () => {
    if (!currentUser) {
      setPartnerError('🔒 請先登入 Google 帳號！');
      return;
    }
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
    if (!currentUser) {
      setAdminValidationError('🔒 請先登入 Google 帳號！');
      return;
    }
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
      setAdminWizardStep(3); // 進入綁定成功與邀請伴侶步驟
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    }, 500);
  };

  const handleDirectSave = () => {
    const cleanGas = inputGasUrl.trim();
    const cleanSheet = inputSheetUrl.trim();
    setGasWebUrl(cleanGas);
    setDeploySheetUrl(cleanSheet);

    try {
      localStorage.setItem('muji_gas_web_url', cleanGas);
      localStorage.setItem('muji_sheet_url', cleanSheet);
    } catch (e) {}

    saveDeployConfig();
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const isConnected = Boolean(gasWebUrl && gasWebUrl.startsWith('http'));
  const isPartner = currentUser?.userRole === 'partner' || Boolean(currentUser?.adminEmail) || Boolean(partnerBindingInfo?.partnerEmail && partnerBindingInfo.partnerEmail.toLowerCase() === currentUser?.email?.toLowerCase());

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-[#FAF9F5] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-[#E5E0D2] max-h-[94vh] flex flex-col my-auto text-left font-sans"
          >
            {/* Modal 頂部 Header */}
            <div className="p-4 sm:p-5 border-b border-[#E8E4D9] bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shadow-inner">
                  <Database className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-[#3E3A36] text-sm sm:text-base">
                      資料庫設定與引導小精靈
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isConnected 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-600' : 'bg-amber-600 animate-ping'}`} />
                      <span>{isConnected ? (isPartner ? '伴侶連線中' : '資料庫已連通') : '初始待連線'}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8C8475] font-medium mt-0.5">
                    整合 Google 試算表連線、Web App API 設定、代碼部署與伴侶邀請
                  </p>
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

            {/* 4 大功能分頁切換列 */}
            <div className="bg-[#F5F2EA] px-4 py-2 border-b border-[#E8E4D9] flex items-center justify-between gap-1 overflow-x-auto shrink-0">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('wizard')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'wizard'
                      ? 'bg-white text-amber-900 shadow-2xs'
                      : 'text-[#7A7366] hover:text-[#3E3A36]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>引導小精靈</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'settings'
                      ? 'bg-white text-amber-900 shadow-2xs'
                      : 'text-[#7A7366] hover:text-[#3E3A36]'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-700" />
                  <span>資料庫與 API 設定</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('code')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'code'
                      ? 'bg-white text-amber-900 shadow-2xs'
                      : 'text-[#7A7366] hover:text-[#3E3A36]'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-amber-700" />
                  <span>後端代碼庫</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('partner')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'partner'
                      ? 'bg-white text-rose-900 shadow-2xs'
                      : 'text-[#7A7366] hover:text-[#3E3A36]'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                  <span>伴侶邀請</span>
                </button>
              </div>

              {saveSuccessMsg && (
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 animate-fade-in">
                  <Check className="w-3 h-3" /> 已儲存並同步
                </span>
              )}
            </div>

            {/* Modal 內容滾動區 */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">

              {/* ======================= Tab 1: 引導小精靈 ======================= */}
              {activeTab === 'wizard' && (
                <div className="space-y-4">
                  {wizardRole === 'select_role' && (
                    <div className="space-y-4">
                      <div className="text-center space-y-1.5 py-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                          <span>請選擇您的帳本使用身分</span>
                        </div>
                        <h4 className="text-lg font-black text-[#3E3A36]">
                          您好 {currentUser?.nickname || currentUser?.name || '朋友'}！想如何開始記帳？
                        </h4>
                        <p className="text-xs text-[#7A7366]">
                          情侶共同記帳只需其中一人建立 Google 試算表，另一半透過邀請碼即可加入！
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                        {/* 選擇 1: 我是主管理者 */}
                        <div 
                          onClick={() => {
                            setWizardRole('admin_flow');
                            setAdminWizardStep(1);
                          }}
                          className="bg-white p-5 rounded-2xl border-2 border-amber-200/80 hover:border-amber-500 transition-all cursor-pointer shadow-2xs hover:shadow-md flex flex-col justify-between group"
                        >
                          <div className="space-y-2.5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-700 to-amber-500 text-white flex items-center justify-center shadow-xs">
                              <Crown className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="font-extrabold text-[#3E3A36] text-sm group-hover:text-amber-900">
                                👑 我是帳本主管理者
                              </h5>
                              <p className="text-[11px] text-[#7A7366] leading-relaxed mt-1">
                                由我提供 Google 試算表，小精靈將引導我部署 Web App API，並產生專屬 6 碼邀請碼給伴侶。
                              </p>
                            </div>
                          </div>
                          <div className="pt-3 flex items-center text-xs font-bold text-amber-800 gap-1 group-hover:translate-x-1 transition-transform">
                            <span>開始管理者引導流程</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        {/* 選擇 2: 我是伴侶 */}
                        <div 
                          onClick={() => setWizardRole('partner_flow')}
                          className="bg-white p-5 rounded-2xl border-2 border-rose-200/80 hover:border-rose-500 transition-all cursor-pointer shadow-2xs hover:shadow-md flex flex-col justify-between group"
                        >
                          <div className="space-y-2.5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center shadow-xs">
                              <Heart className="w-5 h-5 fill-white" />
                            </div>
                            <div>
                              <h5 className="font-extrabold text-[#3E3A36] text-sm group-hover:text-rose-900">
                                💖 我是伴侶
                              </h5>
                              <p className="text-[11px] text-[#7A7366] leading-relaxed mt-1">
                                另一半已建立好帳本！我只需輸入對方派發的 6 碼邀請碼或點擊專屬連結，免設 API 即時連線。
                              </p>
                            </div>
                          </div>
                          <div className="pt-3 flex items-center text-xs font-bold text-rose-700 gap-1 group-hover:translate-x-1 transition-transform">
                            <span>輸入邀請碼加入</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 管理員 3 步驟小精靈 */}
                  {wizardRole === 'admin_flow' && (
                    <div className="space-y-4">
                      {/* 步驟指示器 */}
                      <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-3">
                        <button
                          type="button"
                          onClick={() => setWizardRole('select_role')}
                          className="text-xs text-[#7A7366] hover:text-[#3E3A36] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>重選身分</span>
                        </button>

                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {[
                            { num: 1, label: '試算表與代碼' },
                            { num: 2, label: '驗證 API' },
                            { num: 3, label: '邀請伴侶' }
                          ].map((s) => (
                            <button
                              key={s.num}
                              type="button"
                              onClick={() => setAdminWizardStep(s.num as any)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                adminWizardStep === s.num
                                  ? 'bg-amber-800 text-white shadow-2xs'
                                  : adminWizardStep > s.num
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-[#EFECE3] text-[#8C8475]'
                              }`}
                            >
                              <span>{s.num}.</span>
                              <span>{s.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Step 1: 試算表設定與 Code.gs */}
                      {adminWizardStep === 1 && (
                        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-4 shadow-2xs">
                          <div className="space-y-1">
                            <h4 className="text-sm font-extrabold text-[#3E3A36] flex items-center gap-2">
                              <span>第 1 步：輸入 Google 試算表網址並複製 Code.gs</span>
                            </h4>
                            <p className="text-xs text-[#7A7366] leading-relaxed">
                              請於下方填入您的專屬 Google 試算表網址。系統會自動將試算表 ID 寫入 Code.gs 代碼中。
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#5C564E]">
                              Google 試算表網址或 Spreadsheet ID
                            </label>
                            <input
                              type="text"
                              value={inputSheetUrl}
                              onChange={(e) => setInputSheetUrl(e.target.value)}
                              placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFBF] bg-[#FAF8F3] text-xs font-mono text-[#3E3A36] focus:outline-none focus:ring-2 focus:ring-amber-700/30"
                            />
                          </div>

                          {/* 複製代碼區 */}
                          <div className="bg-[#FAF8F3] p-3.5 rounded-2xl border border-[#EAE6DC] space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#3E3A36] flex items-center gap-1.5">
                                <FileCode className="w-4 h-4 text-amber-700" />
                                <span>Code.gs 後端腳本代碼 (已自動注入試算表 ID)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode('codeGs')}
                                className="px-3 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                              >
                                {copiedCodeType === 'codeGs' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedCodeType === 'codeGs' ? '已複製 Code.gs' : '一鍵複製 Code.gs'}</span>
                              </button>
                            </div>
                            <pre className="text-[10px] font-mono text-[#5C564E] bg-white p-2.5 rounded-xl border border-[#DDD8CE] max-h-24 overflow-y-auto">
                              {customizedCodeGs.slice(0, 300)}...
                            </pre>
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => setAdminWizardStep(2)}
                              className="px-5 py-2.5 bg-gradient-to-r from-amber-800 to-amber-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                            >
                              <span>前往第 2 步：驗證並綁定 API</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Step 2: 驗證與綁定 Web App API */}
                      {adminWizardStep === 2 && (
                        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-4 shadow-2xs">
                          <div className="space-y-1">
                            <h4 className="text-sm font-extrabold text-[#3E3A36] flex items-center gap-2">
                              <span>第 2 步：貼上 GAS 網頁應用程式 (Web App) 網址</span>
                            </h4>
                            <p className="text-xs text-[#7A7366] leading-relaxed">
                              在 Google Apps Script 點擊「部署」→「新增部署」→ 類型選擇「網頁應用程式」，將存取權設為「所有人」，並將產生的網址貼於下方：
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#5C564E]">
                              Google Apps Script Web App API 網址
                            </label>
                            <input
                              type="text"
                              value={inputGasUrl}
                              onChange={(e) => setInputGasUrl(e.target.value)}
                              placeholder="https://script.google.com/macros/s/.../exec"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFBF] bg-[#FAF8F3] text-xs font-mono text-[#3E3A36] focus:outline-none focus:ring-2 focus:ring-amber-700/30"
                            />
                          </div>

                          {adminValidationError && (
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                              <span>{adminValidationError}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2">
                            <button
                              type="button"
                              onClick={() => setAdminWizardStep(1)}
                              className="px-3.5 py-2 rounded-xl border border-[#D5CFBF] text-xs font-bold text-[#5C564E] hover:bg-[#F2EFE7] cursor-pointer"
                            >
                              上一步
                            </button>

                            <button
                              type="button"
                              onClick={handleVerifyAndBindAdmin}
                              disabled={isAdminBindingLoading}
                              className="px-5 py-2.5 bg-gradient-to-r from-amber-800 to-amber-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                              {isAdminBindingLoading ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>正在驗證連線並綁定帳號...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>驗證連線並完成帳號綁定</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Step 3: 綁定成功與派發伴侶邀請碼 */}
                      {adminWizardStep === 3 && (
                        <div className="bg-gradient-to-br from-emerald-50/70 via-white to-amber-50/50 rounded-2xl p-4 sm:p-5 border border-emerald-200 space-y-4 shadow-2xs">
                          <div className="flex items-center gap-2.5 border-b border-emerald-100 pb-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                            </div>
                            <div>
                              <h4 className="text-sm font-extrabold text-emerald-950">
                                🎉 恭喜！Google 試算表資料庫已成功綁定
                              </h4>
                              <p className="text-[11px] text-[#7A7366]">
                                已綁定至帳號 {currentUser?.email}，換機登入即刻生效。現在快邀請另一半加入吧！
                              </p>
                            </div>
                          </div>

                          {/* 伴侶邀請代碼卡片 */}
                          <div className="bg-white p-4 rounded-2xl border border-rose-200 space-y-3 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-rose-900 flex items-center gap-1.5">
                                <Heart className="w-4 h-4 text-rose-600 fill-rose-500" />
                                <span>專屬伴侶配對代碼：</span>
                              </span>
                              <div className="flex items-center gap-1">
                                {onGenerateNewInviteCode && (
                                  <button
                                    type="button"
                                    onClick={onGenerateNewInviteCode}
                                    className="p-1.5 rounded-lg bg-[#FAF8F3] hover:bg-[#F2EFE7] border border-[#E0DCD3] text-[#5C564E] transition-all cursor-pointer"
                                    title="重新產生隨機代碼"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between bg-[#FFF8F8] p-3 rounded-xl border border-rose-100">
                              <span className="font-mono text-xl font-black text-rose-700 tracking-wider">
                                {currentInviteCode}
                              </span>
                              <button
                                type="button"
                                onClick={handleCopyInviteCode}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                              >
                                {copiedInvite ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedInvite ? '已複製代碼' : '複製代碼'}</span>
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={handleCopyShareCard}
                              className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-98"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>{copiedShare ? '已複製浪漫邀請函卡片！' : '一鍵複製浪漫邀請卡與專屬連結'}</span>
                            </button>
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              type="button"
                              onClick={onClose}
                              className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                            >
                              完成並開啟帳本 🚀
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 伴侶輸入邀請碼小精靈 */}
                  {wizardRole === 'partner_flow' && (
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-3">
                        <button
                          type="button"
                          onClick={() => setWizardRole('select_role')}
                          className="text-xs text-[#7A7366] hover:text-[#3E3A36] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>重選身分</span>
                        </button>
                        <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          💖 伴侶加入模式
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#5C564E] flex items-center justify-between">
                          <span>請輸入另一半提供的 6 碼伴侶邀請碼或貼上專屬連結：</span>
                          <button
                            type="button"
                            onClick={handlePasteClipboard}
                            className="text-[11px] text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer font-bold"
                          >
                            <ClipboardPaste className="w-3.5 h-3.5" />
                            <span>從剪貼簿貼上</span>
                          </button>
                        </label>
                        <input
                          type="text"
                          value={inviteInput}
                          onChange={(e) => setInviteInput(e.target.value)}
                          placeholder="例如：BB-8924 或完整邀請網址"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFBF] bg-[#FAF8F3] text-sm font-mono text-[#3E3A36] uppercase focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                        />
                      </div>

                      {/* 聯網即時識別結果 */}
                      {resolvedInvite && (
                        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>成功辨識到伴侶帳本！</span>
                          </div>
                          <div className="text-[11px] text-emerald-800">
                            👑 主管理者：<strong>{resolvedInvite.adminName}</strong> ({resolvedInvite.adminEmail})
                          </div>
                        </div>
                      )}

                      {partnerError && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                          <span>{partnerError}</span>
                        </div>
                      )}

                      {partnerBindSuccess && (
                        <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-xs text-emerald-950 font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>🎉 成功綁定並加入伴侶帳本！正在載入數據...</span>
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handlePartnerSubmit}
                          disabled={isPartnerBindingLoading || partnerBindSuccess}
                          className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-2xs active:scale-98 cursor-pointer disabled:opacity-50"
                        >
                          {isPartnerBindingLoading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>正在連線驗證伴侶帳本...</span>
                            </>
                          ) : (
                            <>
                              <Heart className="w-4 h-4 fill-white" />
                              <span>確認綁定並加入伴侶帳本</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ======================= Tab 2: 資料庫與 API 詳細設定 ======================= */}
              {activeTab === 'settings' && (
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[#F2EDE1] pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-amber-800" />
                      <h4 className="text-xs font-extrabold text-[#3E3A36]">Google 試算表與 Web App 連線設定</h4>
                    </div>
                    {deploySheetUrl && (
                      <a
                        href={deploySheetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-amber-800 hover:underline flex items-center gap-1 font-bold"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>開啟試算表</span>
                      </a>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#5C564E]">
                        1. Google 試算表網址 (Spreadsheet URL / ID)
                      </label>
                      <input
                        type="text"
                        value={inputSheetUrl}
                        onChange={(e) => setInputSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/your-id/edit"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFBF] bg-[#FAF8F3] text-xs font-mono text-[#3E3A36] focus:outline-none focus:ring-2 focus:ring-amber-700/30"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#5C564E]">
                        2. Google Apps Script Web App API 網址
                      </label>
                      <input
                        type="text"
                        value={inputGasUrl}
                        onChange={(e) => setInputGasUrl(e.target.value)}
                        placeholder="https://script.google.com/macros/s/.../exec"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFBF] bg-[#FAF8F3] text-xs font-mono text-[#3E3A36] focus:outline-none focus:ring-2 focus:ring-amber-700/30"
                      />
                    </div>
                  </div>

                  {/* 8 大工作頁清單 */}
                  <div className="bg-[#FAF8F3] rounded-2xl p-3.5 border border-[#EAE6DC] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#3E3A36] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>試算表已連線之 8 大工作頁支援度</span>
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

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('wizard');
                        setWizardRole('admin_flow');
                      }}
                      className="text-xs text-amber-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>開啟引導小精靈逐步設定</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDirectSave}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-800 to-amber-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>儲存並同步至 Google 帳號</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ======================= Tab 3: 後端代碼庫 ======================= */}
              {activeTab === 'code' && (
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[#F2EDE1] pb-2.5">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-amber-800" />
                      <h4 className="text-xs font-extrabold text-[#3E3A36]">Google Apps Script 後端部署代碼庫</h4>
                    </div>

                    <div className="flex items-center gap-1 bg-[#F5F2EA] p-0.5 rounded-xl border border-[#E6E0D2]">
                      {(['codeGs', 'indexHtml', 'splitHtml'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setCodeTab(tab)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            codeTab === tab
                              ? 'bg-white text-amber-900 shadow-2xs'
                              : 'text-[#7A7366] hover:text-[#3E3A36]'
                          }`}
                        >
                          {tab === 'codeGs' ? 'Code.gs' : tab === 'indexHtml' ? 'index.html' : 'split.html'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#FAF8F3] p-3 rounded-2xl border border-[#EAE6DC] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#3E3A36]">
                        {codeTab === 'codeGs' ? 'Code.gs (主要後端 API)' : codeTab === 'indexHtml' ? 'index.html (獨立網頁)' : 'split.html (代墊分頁)'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCopyCode(codeTab)}
                        className="px-3 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        {copiedCodeType === codeTab ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCodeType === codeTab ? '已複製代碼' : '一鍵複製代碼'}</span>
                      </button>
                    </div>

                    <pre className="text-[11px] font-mono text-[#5C564E] bg-white p-3 rounded-xl border border-[#DDD8CE] max-h-56 overflow-y-auto leading-relaxed">
                      {codeTab === 'codeGs' ? customizedCodeGs : codeTab === 'indexHtml' ? INDEX_HTML_TEMPLATE : SPLIT_INDEX_HTML_TEMPLATE}
                    </pre>
                  </div>
                </div>
              )}

              {/* ======================= Tab 4: 伴侶邀請與綁定 ======================= */}
              {activeTab === 'partner' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-[#F2EDE1] pb-2.5">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
                        <h4 className="text-xs font-extrabold text-[#3E3A36]">伴侶配對與雙向即時連線</h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        {isPartner ? '伴侶模式' : '主管理者模式'}
                      </span>
                    </div>

                    {!isPartner ? (
                      /* 管理員專屬：派發邀請碼 */
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F3] p-3.5 rounded-2xl border border-[#EBE7DC]">
                          <div>
                            <div className="text-xs font-bold text-[#3E3A36] flex items-center gap-1.5">
                              <span>您的伴侶配對邀請代碼：</span>
                              <span className="font-mono bg-white px-2 py-0.5 rounded-lg border border-[#DDD8CE] text-rose-700 font-extrabold text-sm">
                                {currentInviteCode}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#8C8475] mt-1">
                              伴侶登入後輸入此代碼，即可自動共享您的 Google 雲端試算表並雙向即時推播！
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {onGenerateNewInviteCode && (
                              <button
                                type="button"
                                onClick={onGenerateNewInviteCode}
                                className="p-2 rounded-xl bg-white hover:bg-[#F2EFE7] border border-[#DDD8CE] text-[#5C564E] transition-all cursor-pointer shadow-2xs"
                                title="重新隨機派發新邀請碼"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={handleCopyInviteCode}
                              className="px-3 py-1.5 bg-white hover:bg-[#F2EFE7] border border-[#DDD8CE] rounded-xl text-xs font-bold text-[#5C564E] flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                            >
                              {copiedInvite ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedInvite ? '已複製' : '複製代碼'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleCopyShareCard}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>分享邀請函</span>
                            </button>
                          </div>
                        </div>

                        {/* 伴侶綁定狀態 */}
                        <div className="bg-[#FAF8F3] p-3 rounded-xl border border-[#EBE7DC] text-xs flex items-center justify-between">
                          <span className="text-[11px] text-[#8C8475] font-bold">伴侶連線狀態：</span>
                          {partnerBindingInfo?.partnerEmail ? (
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>已綁定 ({partnerBindingInfo.partnerName || '伴侶'})</span>
                              </span>
                              {onUnbindPartner && (
                                <button
                                  type="button"
                                  onClick={onUnbindPartner}
                                  className="text-[10px] text-rose-600 hover:text-rose-800 underline font-bold cursor-pointer"
                                >
                                  解除綁定
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10px]">
                              ⏳ 等待伴侶輸入邀請碼加入
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* 伴侶專屬狀態 */
                      <div className="bg-gradient-to-br from-rose-50/70 to-white rounded-2xl p-4 border border-rose-200 space-y-3">
                        <div className="text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[#8C8475]">👑 帳本主管理者：</span>
                            <span className="font-bold text-[#3E3A36]">
                              {partnerBindingInfo?.adminName || currentUser?.adminName || '主管理員'} ({partnerBindingInfo?.adminEmail || currentUser?.adminEmail})
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#8C8475]">🔑 邀請代碼：</span>
                            <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                              {partnerBindingInfo?.inviteCode || currentUser?.inviteCode}
                            </span>
                          </div>
                        </div>

                        {onUnbindPartner && (
                          <button
                            type="button"
                            onClick={onUnbindPartner}
                            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs border border-rose-300 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                            <span>解除伴侶綁定</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Modal 底部關閉列 */}
            <div className="p-3.5 sm:p-4 bg-white border-t border-[#E8E4D9] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {onToggleSandboxMode && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleSandboxMode(!isSandboxMode);
                      onClose();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      isSandboxMode 
                        ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                        : 'bg-[#F2EFE7] text-[#5C564E] hover:bg-[#EAE5D7]'
                    }`}
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>{isSandboxMode ? '關閉測試沙盒' : '體驗測試沙盒'}</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-[#EFECE3] hover:bg-[#E5E1D5] text-[#3E3A36] rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                關閉視窗
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
