import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Heart, 
  Mail, 
  QrCode, 
  Link2, 
  Copy, 
  Check, 
  Share2, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  UserCheck, 
  ShieldCheck, 
  X,
  KeyRound,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { AuthUser, CoupleBindingInfo, PartnerInviteData } from '../../types';
import { 
  getMagicPairingUrl, 
  generatePartnerInviteShare, 
  sendDirectPartnerEmailInvite, 
  checkPendingDirectInvite, 
  cancelDirectPartnerEmailInvite,
  createFreshInvite,
  saveActiveInviteCode
} from '../../utils/partnerInvite';

interface PartnerPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  partnerBindingInfo: CoupleBindingInfo | null;
  gasWebUrl: string;
  deploySheetUrl: string;
  onBindPartner: (input: string) => Promise<{ success: boolean; message?: string }>;
  onUnbindPartner: () => Promise<void> | void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  activeInvite?: PartnerInviteData | null;
  onRefreshActiveInvite?: () => void;
}

export const PartnerPairingModal: React.FC<PartnerPairingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  partnerBindingInfo,
  gasWebUrl,
  deploySheetUrl,
  onBindPartner,
  onUnbindPartner,
  showToast,
  activeInvite,
  onRefreshActiveInvite
}) => {
  const [activeTab, setActiveTab] = useState<'email' | 'qrcode' | 'link' | 'code'>('email');
  
  // Direct Email Invite State
  const [targetEmail, setTargetEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [pendingSentInvite, setPendingSentInvite] = useState<PartnerInviteData | null>(null);
  const [isCancelingSent, setIsCancelingSent] = useState(false);

  // QR Code State
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // Manual Code Input State
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);

  // Copy Feedback
  const [copiedType, setCopiedType] = useState<'link' | 'card' | 'code' | null>(null);

  // Confirm Unbind Dialog
  const [showUnbindConfirm, setShowUnbindConfirm] = useState(false);
  const [isUnbinding, setIsUnbinding] = useState(false);

  // 當前有效的邀請物件（若外部未提供，使用當前登入者資訊即時生成）
  const [currentInvite, setCurrentInvite] = useState<PartnerInviteData | null>(null);

  // 初始化或更新邀請資訊
  useEffect(() => {
    if (!isOpen) return;

    if (activeInvite && activeInvite.inviteCode && activeInvite.adminEmail) {
      setCurrentInvite(activeInvite);
    } else if (currentUser?.email) {
      const fresh = createFreshInvite(
        currentUser.email,
        currentUser.name || '主管理員',
        gasWebUrl,
        deploySheetUrl,
        30 * 24 * 60 // 30 天
      );
      saveActiveInviteCode(fresh);
      setCurrentInvite(fresh);
    }

    // 檢查是否有正在等待伴侶接受的邀請
    if (currentUser?.email) {
      checkPendingDirectInvite(currentUser.email).then(({ sentInvite }) => {
        if (sentInvite) {
          setPendingSentInvite(sentInvite);
        }
      }).catch(() => {});
    }
  }, [isOpen, activeInvite, currentUser, gasWebUrl, deploySheetUrl]);

  // 生成 QR Code
  useEffect(() => {
    if (!isOpen || !currentInvite) return;

    let isMounted = true;
    setIsGeneratingQr(true);

    const shareUrl = getMagicPairingUrl(currentInvite);

    QRCode.toDataURL(shareUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGeneratingQr(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate QR Code:', err);
        if (isMounted) {
          setIsGeneratingQr(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentInvite]);

  if (!isOpen) return null;

  const isBound = Boolean(
    partnerBindingInfo && 
    partnerBindingInfo.partnerEmail && 
    partnerBindingInfo.adminEmail && 
    partnerBindingInfo.partnerEmail.toLowerCase() !== partnerBindingInfo.adminEmail.toLowerCase()
  );

  const handleSendEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.email) {
      showToast('請先登入 Google 帳號後再發送邀請', 'warning');
      return;
    }

    const cleanInput = targetEmail.trim().toLowerCase();
    if (!cleanInput) {
      showToast('請輸入伴侶的 Google Email', 'warning');
      return;
    }

    if (cleanInput === currentUser.email.toLowerCase()) {
      showToast('伴侶 Email 不可與自己的 Email 相同', 'warning');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanInput)) {
      showToast('Email 格式不正確，請輸入有效的 Gmail', 'warning');
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await sendDirectPartnerEmailInvite(
        currentUser.email,
        currentUser.name || '主管理員',
        cleanInput,
        gasWebUrl,
        deploySheetUrl,
        currentUser.picture || currentUser.avatar || ''
      );

      if (res.success && res.invite) {
        setPendingSentInvite(res.invite);
        setCurrentInvite(res.invite);
        setTargetEmail('');
        showToast(`💌 已成功發送邀請給 ${cleanInput}！伴侶登入時將自動收到配對通知！`, 'success');
      } else {
        showToast(res.message || '發送邀請失敗，請重試', 'error');
      }
    } catch (err: any) {
      showToast('發送邀請失敗：' + (err.message || '請檢查網路連線'), 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCancelSentInvite = async () => {
    if (!currentUser?.email) return;
    setIsCancelingSent(true);
    try {
      await cancelDirectPartnerEmailInvite(currentUser.email, pendingSentInvite?.partnerEmail);
      setPendingSentInvite(null);
      showToast('已取消此伴侶邀請', 'info');
    } catch (e) {
      showToast('取消失敗，請重試', 'error');
    } finally {
      setIsCancelingSent(false);
    }
  };

  const handleCopyLink = async () => {
    if (!currentInvite) return;
    const url = getMagicPairingUrl(currentInvite);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedType('link');
      showToast('🎉 專屬配對連結已複製！可直接貼給伴侶！', 'success');
      setTimeout(() => setCopiedType(null), 2500);
    } catch (e) {
      showToast('複製失敗，請手動選取複製', 'warning');
    }
  };

  const handleCopyShareCard = async () => {
    if (!currentInvite) return;
    const share = generatePartnerInviteShare(currentInvite);
    try {
      await navigator.clipboard.writeText(share.shareText);
      setCopiedType('card');
      showToast('📋 完整邀請卡內容已複製！可直接傳給伴侶！', 'success');
      setTimeout(() => setCopiedType(null), 2500);
    } catch (e) {
      showToast('複製失敗，請手動選取複製', 'warning');
    }
  };

  const handleShareToLine = () => {
    if (!currentInvite) return;
    const share = generatePartnerInviteShare(currentInvite);
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(share.shareText)}`;
    window.open(lineUrl, '_blank');
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualCodeInput.trim();
    if (!clean) {
      showToast('請輸入 6 碼邀請碼或專屬連結', 'warning');
      return;
    }

    setIsSubmittingCode(true);
    try {
      const res = await onBindPartner(clean);
      if (res.success) {
        showToast('💖 伴侶配對成功！已同步雙方共同帳本！', 'success');
        setManualCodeInput('');
        onClose();
      } else {
        showToast(res.message || '配對失敗，請確認代碼是否正確', 'error');
      }
    } catch (err: any) {
      showToast('配對過程發生錯誤：' + (err.message || '請稍後重試'), 'error');
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const handleExecuteUnbind = async () => {
    setIsUnbinding(true);
    try {
      await onUnbindPartner();
      setShowUnbindConfirm(false);
      showToast('已解除伴侶綁定', 'info');
      onClose();
    } catch (e) {
      showToast('解除綁定失敗，請重試', 'error');
    } finally {
      setIsUnbinding(false);
    }
  };

  return (
    <div 
      id="partner-pairing-modal-overlay" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        id="partner-pairing-modal-card"
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-rose-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 p-6 text-white relative">
          <button 
            id="close-pairing-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            title="關閉"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Heart className="w-7 h-7 text-white fill-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                伴侶配對與共同協作中心
                {isBound && (
                  <span className="text-xs bg-white text-rose-600 px-2.5 py-0.5 rounded-full font-bold shadow-sm">
                    甜蜜連線中
                  </span>
                )}
              </h2>
              <p className="text-rose-100 text-xs mt-0.5">
                {isBound 
                  ? '雙方已完成帳本連線，所有公積金與代墊即時雙向同步' 
                  : '選擇任一方式邀請伴侶，1 秒開啟共同記帳生活'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 已綁定狀態展示 */}
          {isBound && partnerBindingInfo ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/80 rounded-2xl p-5 text-center shadow-sm">
                <div className="flex items-center justify-center gap-4 py-3">
                  {/* 管理者 */}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-rose-200 border-2 border-white shadow-md flex items-center justify-center text-rose-700 font-bold text-lg overflow-hidden">
                      {partnerBindingInfo.adminAvatar ? (
                        <img src={partnerBindingInfo.adminAvatar} alt="Admin" className="w-full h-full object-cover" />
                      ) : (
                        partnerBindingInfo.adminName?.charAt(0) || '管'
                      )}
                    </div>
                    <span className="text-xs font-bold text-gray-800 mt-2">
                      {partnerBindingInfo.adminName || '主管理員'}
                    </span>
                    <span className="text-[10px] text-gray-500 max-w-[100px] truncate">
                      {partnerBindingInfo.adminEmail}
                    </span>
                  </div>

                  {/* 愛心連線動畫 */}
                  <div className="flex flex-col items-center px-2">
                    <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md animate-bounce">
                      <Heart className="w-4 h-4 fill-white" />
                    </div>
                    <span className="text-[10px] text-rose-600 font-bold mt-1">共同管理</span>
                  </div>

                  {/* 伴侶 */}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-pink-200 border-2 border-white shadow-md flex items-center justify-center text-pink-700 font-bold text-lg overflow-hidden">
                      {partnerBindingInfo.partnerAvatar ? (
                        <img src={partnerBindingInfo.partnerAvatar} alt="Partner" className="w-full h-full object-cover" />
                      ) : (
                        partnerBindingInfo.partnerName?.charAt(0) || '伴'
                      )}
                    </div>
                    <span className="text-xs font-bold text-gray-800 mt-2">
                      {partnerBindingInfo.partnerName || '伴侶'}
                    </span>
                    <span className="text-[10px] text-gray-500 max-w-[100px] truncate">
                      {partnerBindingInfo.partnerEmail}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-rose-100 flex flex-wrap items-center justify-around gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>資料庫已連線</span>
                  </div>
                  {partnerBindingInfo.boundAt && (
                    <div className="text-[11px] text-gray-400">
                      連線於：{new Date(partnerBindingInfo.boundAt).toLocaleDateString('zh-TW')}
                    </div>
                  )}
                </div>
              </div>

              {/* 解除綁定區 */}
              {!showUnbindConfirm ? (
                <div className="text-center pt-2">
                  <button
                    id="trigger-unbind-btn"
                    type="button"
                    onClick={() => setShowUnbindConfirm(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-700 font-medium transition-colors py-1.5 px-3 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    解除伴侶綁定
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>確定要解除伴侶綁定嗎？</strong><br />
                      解除後雙方將不再自動同步新增之記帳資料，但既有的試算表歷史紀錄將完整保留。
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowUnbindConfirm(false)}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium"
                    >
                      取消
                    </button>
                    <button
                      id="confirm-unbind-btn"
                      type="button"
                      disabled={isUnbinding}
                      onClick={handleExecuteUnbind}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium flex items-center gap-1 shadow-sm"
                    >
                      {isUnbinding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                      確認解除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 未綁定狀態：三合一配對功能區 */
            <div className="space-y-6">
              {/* 配對方案 Tab 切換 */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  id="tab-email-btn"
                  onClick={() => setActiveTab('email')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                    activeTab === 'email'
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>指定信箱</span>
                </button>

                <button
                  type="button"
                  id="tab-qrcode-btn"
                  onClick={() => setActiveTab('qrcode')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                    activeTab === 'qrcode'
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>掃描條碼</span>
                </button>

                <button
                  type="button"
                  id="tab-link-btn"
                  onClick={() => setActiveTab('link')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                    activeTab === 'link'
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Link2 className="w-4 h-4" />
                  <span>專屬連結</span>
                </button>

                <button
                  type="button"
                  id="tab-code-btn"
                  onClick={() => setActiveTab('code')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                    activeTab === 'code'
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>代碼驗證</span>
                </button>
              </div>

              {/* Tab 1: 指定伴侶 Email (最推薦) */}
              {activeTab === 'email' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          零出錯方案：指定伴侶 Google 信箱
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          直接輸入另一半的 Gmail。發出邀請後，<strong>伴侶只要使用該信箱登入系統，畫面就會立即自動跳出配對接受通知</strong>，一鍵確認即可完成雙向連線！
                        </p>
                      </div>
                    </div>
                  </div>

                  {pendingSentInvite ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                          </span>
                          <span className="text-xs font-bold text-emerald-800">已成功送出邀請</span>
                        </div>
                        <button
                          type="button"
                          disabled={isCancelingSent}
                          onClick={handleCancelSentInvite}
                          className="text-[11px] text-gray-500 hover:text-rose-600 font-medium underline"
                        >
                          {isCancelingSent ? '取消中...' : '撤回邀請'}
                        </button>
                      </div>

                      <div className="bg-white/80 rounded-xl p-3 border border-emerald-100">
                        <div className="text-xs text-gray-500">邀請對象：</div>
                        <div className="text-sm font-bold text-gray-800 break-all">
                          {pendingSentInvite.partnerEmail}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">
                          發送時間：{new Date(pendingSentInvite.createdAt).toLocaleString('zh-TW')}
                        </div>
                      </div>

                      <p className="text-xs text-emerald-700">
                        ✨ 當 {pendingSentInvite.partnerEmail} 登入系統時，系統將主動跳出配對卡片提示其加入！
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSendEmailInvite} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          伴侶的 Google Email 信箱
                        </label>
                        <input
                          id="partner-email-input"
                          type="email"
                          value={targetEmail}
                          onChange={(e) => setTargetEmail(e.target.value)}
                          placeholder="例如：partner@gmail.com"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
                          disabled={isSendingEmail}
                        />
                      </div>

                      <button
                        id="submit-email-invite-btn"
                        type="submit"
                        disabled={isSendingEmail || !targetEmail.trim()}
                        className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      >
                        {isSendingEmail ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Mail className="w-4 h-4" />
                        )}
                        <span>送出伴侶配對邀請</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Tab 2: 面對面 QR Code 掃描 */}
              {activeTab === 'qrcode' && (
                <div className="space-y-4 text-center animate-fade-in">
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center min-h-[200px] min-w-[200px]">
                      {isGeneratingQr ? (
                        <div className="flex flex-col items-center gap-2 text-gray-400 py-10">
                          <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
                          <span className="text-xs">正在產生專屬 QR Code...</span>
                        </div>
                      ) : qrDataUrl ? (
                        <img 
                          id="partner-pairing-qr-img"
                          src={qrDataUrl} 
                          alt="伴侶配對 QR Code" 
                          className="w-56 h-56 object-contain rounded-lg"
                        />
                      ) : (
                        <div className="text-xs text-gray-400 py-10">無法產生 QR Code，請使用專屬連結方式</div>
                      )}
                    </div>

                    <div className="mt-4 text-xs text-gray-600 max-w-xs leading-relaxed">
                      📱 <strong>現場面對面連線：</strong><br />
                      請伴侶打開手機相機或 LINE 內建掃描器，掃描此條碼即可自動開啟並完成綁定！
                    </div>
                  </div>

                  {currentInvite?.inviteCode && (
                    <div className="text-xs text-gray-500 flex items-center justify-center gap-2">
                      <span>專屬配對代碼：</span>
                      <code className="bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded border border-rose-200">
                        {currentInvite.inviteCode}
                      </code>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: LINE / 專屬配對連結 */}
              {activeTab === 'link' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Link2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          萬用配對連結（LINE / 通訊軟體分享）
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          將專屬連結傳給伴侶，伴侶點擊開啟後系統將<strong>自動識別並綁定帳本</strong>，無須記憶或複製貼上任何代碼！
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-700">專屬 Magic Pairing 連結</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={currentInvite ? getMagicPairingUrl(currentInvite) : ''}
                        className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-mono truncate select-all"
                      />
                      <button
                        id="copy-magic-link-btn"
                        type="button"
                        onClick={handleCopyLink}
                        className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        {copiedType === 'link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedType === 'link' ? '已複製' : '複製連結'}</span>
                      </button>
                    </div>
                  </div>

                  {/* LINE 分享捷徑 */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      id="share-to-line-btn"
                      type="button"
                      onClick={handleShareToLine}
                      className="py-3 px-4 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>分享到 LINE</span>
                    </button>

                    <button
                      id="copy-full-card-btn"
                      type="button"
                      onClick={handleCopyShareCard}
                      className="py-3 px-4 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      {copiedType === 'card' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedType === 'card' ? '已複製' : '複製完整邀請卡'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 4: 手動代碼驗證 (備用) */}
              {activeTab === 'code' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-rose-500" />
                      我的專屬邀請碼
                    </h4>
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200">
                      <span className="text-lg font-mono font-black text-rose-600 tracking-wider">
                        {currentInvite?.inviteCode || 'BB-XXXX'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (currentInvite?.inviteCode) {
                            navigator.clipboard.writeText(currentInvite.inviteCode);
                            setCopiedType('code');
                            showToast('邀請碼已複製', 'success');
                            setTimeout(() => setCopiedType(null), 2000);
                          }
                        }}
                        className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
                      >
                        {copiedType === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedType === 'code' ? '已複製' : '複製'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 伴侶端手動輸入代碼綁定 */}
                  <form onSubmit={handleManualSubmit} className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        如果您收到了伴侶的邀請碼，請在此輸入：
                      </label>
                      <input
                        id="manual-invite-code-input"
                        type="text"
                        value={manualCodeInput}
                        onChange={(e) => setManualCodeInput(e.target.value)}
                        placeholder="例如：BB-8924 或貼上整段邀請訊息"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-mono"
                        disabled={isSubmittingCode}
                      />
                    </div>

                    <button
                      id="submit-manual-code-btn"
                      type="submit"
                      disabled={isSubmittingCode || !manualCodeInput.trim()}
                      className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                    >
                      {isSubmittingCode ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>驗證並綁定伴侶</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google 雲端帳本安全雙向同步</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-gray-600 hover:text-gray-900 font-medium hover:bg-gray-200/60 transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
