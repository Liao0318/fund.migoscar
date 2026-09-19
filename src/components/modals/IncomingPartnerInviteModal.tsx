import React, { useState } from 'react';
import { Heart, Sparkles, CheckCircle2, X, RefreshCw, ShieldCheck } from 'lucide-react';
import { PartnerInviteData } from '../../types';

interface IncomingPartnerInviteModalProps {
  isOpen: boolean;
  invite: PartnerInviteData | null;
  onAccept: (invite: PartnerInviteData) => Promise<void>;
  onDismiss: () => void;
}

export const IncomingPartnerInviteModal: React.FC<IncomingPartnerInviteModalProps> = ({
  isOpen,
  invite,
  onAccept,
  onDismiss
}) => {
  const [isAccepting, setIsAccepting] = useState(false);

  if (!isOpen || !invite) return null;

  const handleAcceptClick = async () => {
    setIsAccepting(true);
    try {
      await onAccept(invite);
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div 
      id="incoming-invite-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onDismiss}
    >
      <div 
        id="incoming-invite-modal-card"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-rose-100 flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 p-6 text-white text-center relative">
          <button 
            type="button"
            onClick={onDismiss}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Heart className="w-8 h-8 text-white fill-white animate-bounce" />
          </div>

          <h3 className="text-xl font-black tracking-tight">收到伴侶記帳配對邀請！</h3>
          <p className="text-rose-100 text-xs mt-1">
            另一半邀請您共同管理情侶生活帳本
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-rose-200 border-2 border-white shadow-md flex items-center justify-center text-rose-700 font-bold text-xl flex-shrink-0 overflow-hidden">
              {invite.adminAvatar ? (
                <img src={invite.adminAvatar} alt="Admin" className="w-full h-full object-cover" />
              ) : (
                invite.adminName?.charAt(0) || '伴'
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">
                  發起人
                </span>
                <span className="text-sm font-bold text-gray-900 truncate">
                  {invite.adminName || '主管理員'}
                </span>
              </div>
              <div className="text-xs text-gray-500 truncate mt-1">
                {invite.adminEmail}
              </div>
              <div className="text-[11px] text-rose-600 font-mono font-semibold mt-0.5">
                配對邀請碼：{invite.inviteCode}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>自動同步生活公積金、代墊分帳與願望購物清單</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>即時雙向更新，記帳通知免手動對帳</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span>直連 Google 試算表資料庫，隱私安全無虞</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              id="accept-incoming-invite-btn"
              type="button"
              disabled={isAccepting}
              onClick={handleAcceptClick}
              className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60 text-sm"
            >
              {isAccepting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Heart className="w-4 h-4 fill-white" />
              )}
              <span>立即接受並完成配對</span>
            </button>

            <button
              type="button"
              onClick={onDismiss}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
            >
              稍後再說
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
