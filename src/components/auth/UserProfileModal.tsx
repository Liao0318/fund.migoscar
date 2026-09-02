import React, { useState } from 'react';
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
  CheckCircle2
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
  onUnbindPartner
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const isAdmin = currentUser?.userRole !== 'partner';

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
                    <span>Google 帳戶與權限中心</span>
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
              {/* 目前登入帳號卡片 */}
              <div className="bg-white rounded-2xl p-4 border border-[#E8E4D9] shadow-2xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl ${
                    isAdmin
                      ? 'bg-gradient-to-br from-amber-600 to-amber-700'
                      : 'bg-gradient-to-br from-rose-500 to-rose-600'
                  } text-white font-black text-lg flex items-center justify-center shadow-xs shrink-0`}>
                    {currentUser?.role || (isAdmin ? '廖' : '周')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-[#3E3A36]">
                        {currentUser?.name || (isAdmin ? '主管理員' : '甜蜜伴侶')}
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        Google 官方已授權
                      </span>
                    </div>
                    <div className="text-xs text-[#8C8475] font-mono truncate">
                      {currentUser?.email || 'user@gmail.com'}
                    </div>
                  </div>
                </div>

                {/* 登入角色切換 */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#F2EDE1]">
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
                    className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200 cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>登出</span>
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
                          <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold">管理員專用</span>
                        </h4>
                        <p className="text-[10px] text-[#8C8475]">伴侶登入輸入此碼即可自動綁定並同步資料庫</p>
                      </div>
                    </div>
                  </div>

                  {/* 邀請碼展示卡片 */}
                  <div className="bg-white rounded-xl p-3 border-2 border-amber-200/90 flex items-center justify-between gap-2 shadow-xs">
                    <div>
                      <div className="text-[10px] text-[#8C8475] font-bold">專屬伴侶邀請代碼</div>
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

                <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EDE7D9] space-y-1 text-xs">
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
                    <span>管理 / 變更連線金鑰與 Code.gs 部署 (管理員)</span>
                  </button>
                ) : (
                  <div className="text-[11px] text-[#8C8475] bg-[#FAF8F3] p-2.5 rounded-xl border border-[#E5E0D2] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>API 與 Code.gs 設定由主管理員統一管理，伴侶無需設定即可直接記帳。</span>
                  </div>
                )}
              </div>

              {/* 🧪 開發人員沙盒測試模式切換 */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-800">
                      開發人員沙盒測試模式
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
                  開啟後，所有記帳與對帳行為僅在本機 LocalStorage 模擬，供開發與除錯測試使用。
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
