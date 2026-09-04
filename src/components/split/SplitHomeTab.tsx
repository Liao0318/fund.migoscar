import React, { useMemo } from 'react';
import { 
  Plus, 
  ArrowRightLeft, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  TrendingUp, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet,
  ChevronRight,
  ShieldCheck,
  Heart,
  MessageCircle,
  Database,
  Key,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SplitRecordItem, SplitSummary, SmartCommandResult, AuthUser, CoupleBindingInfo } from '../../types';
import { resolveUserPersonas, formatPayerDisplayName } from '../../utils/userPersona';
import { InitialEmptyEntryFrame } from '../common/InitialEmptyEntryFrame';

interface SplitHomeTabProps {
  summary: SplitSummary;
  recentItems: SplitRecordItem[];
  isLoading: boolean;
  currentUser?: AuthUser | null;
  partnerBindingInfo?: CoupleBindingInfo | null;
  onRefresh: () => void;
  onOpenAdd: () => void;
  onGoToHistory: () => void;
  onGoToSettlement: () => void;
  onOpenSettleModal: () => void;
  onExecuteSmartCommand?: (cmd: string) => Promise<SmartCommandResult | boolean> | SmartCommandResult | boolean;
  onOpenChatAssistant?: () => void;
  isDbConnected?: boolean;
  onOpenGasDeploy?: () => void;
  onOpenWizard?: (role?: 'admin' | 'partner') => void;
  onEnableSandbox?: () => void;
}

const DEFAULT_SPLIT_SUMMARY: SplitSummary = {
  zhouOwesLiao: 0,
  liaoOwesZhou: 0,
  netDebtor: 'none',
  netAmount: 0,
  summaryText: '目前雙方已結清 💖',
  unsettledCount: 0,
  settledCount: 0,
};

export const SplitHomeTab: React.FC<SplitHomeTabProps> = ({
  summary = DEFAULT_SPLIT_SUMMARY,
  recentItems = [],
  isLoading,
  currentUser,
  partnerBindingInfo,
  onRefresh,
  onOpenAdd,
  onGoToHistory,
  onGoToSettlement,
  onOpenSettleModal,
  onExecuteSmartCommand,
  onOpenChatAssistant,
  isDbConnected = true,
  onOpenGasDeploy,
  onOpenWizard,
  onEnableSandbox,
}) => {
  const { userA, userB } = useMemo(() => {
    return resolveUserPersonas(currentUser, partnerBindingInfo);
  }, [currentUser, partnerBindingInfo]);
  const [quickInput, setQuickInput] = React.useState('');
  const [isSubmittingQuick, setIsSubmittingQuick] = React.useState(false);
  const [quickMsg, setQuickMsg] = React.useState<string | null>(null);

  const handleQuickSubmit = async (customCmd?: string) => {
    const text = (customCmd || quickInput).trim();
    if (!text || !onExecuteSmartCommand) return;
    setIsSubmittingQuick(true);
    setQuickMsg(null);
    try {
      const ok = await onExecuteSmartCommand(text);
      if (ok) {
        setQuickMsg(`✅ 已成功記帳：「${text}」`);
        setQuickInput('');
      } else {
        setQuickMsg(`⚠️ 無法辨識指令，請試試：「廖 1200 晚餐」或「周 85 飲料」`);
      }
    } catch (e: any) {
      setQuickMsg(`❌ 記帳失敗：${e?.message || '未知錯誤'}`);
    } finally {
      setIsSubmittingQuick(false);
    }
  };
  const safeSummary: SplitSummary = summary || DEFAULT_SPLIT_SUMMARY;
  const safeRecentItems = Array.isArray(recentItems) ? recentItems.filter(Boolean) : [];

  if (!isDbConnected) {
    return (
      <InitialEmptyEntryFrame
        currentUser={currentUser || null}
        partnerBindingInfo={partnerBindingInfo}
        onOpenWizard={(role) => onOpenWizard ? onOpenWizard(role) : (onOpenGasDeploy && onOpenGasDeploy())}
        onOpenDirectSettings={() => onOpenGasDeploy && onOpenGasDeploy()}
        onEnableSandbox={() => onEnableSandbox && onEnableSandbox()}
        appMode="split"
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto pb-4 sm:pb-6 font-sans">
      {/* 頂部標題與快速更新列 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 backdrop-blur-md p-4 sm:px-6 sm:py-4 rounded-2xl border border-[#E9E5DC] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-400 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
            💳
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#3E3A36]">
              代墊與借還總覽
            </h2>
            <p className="text-xs text-[#8C8475] mt-0.5">
              雙方代墊自動互抵與結算
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-white border border-[#DDD8CD] text-[#6E6659] hover:bg-[#F5F2EB] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="重新同步代墊資料"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-rose-500' : ''}`} />
            <span>同步資料</span>
          </button>
        </div>
      </div>

      {/* 核心淨欠款看板大卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-3xl p-5 sm:p-7 border shadow-md relative overflow-hidden transition-all ${
          safeSummary.netDebtor === 'none'
            ? 'bg-gradient-to-br from-[#FFFDF9] via-[#FAF6EE] to-[#F3ECE0] border-[#E5DEC9]'
            : safeSummary.netDebtor === '廖'
            ? 'bg-gradient-to-br from-[#FFF5F3] via-[#FDF0EC] to-[#FAE4DC] border-rose-200 shadow-rose-100/50'
            : 'bg-gradient-to-br from-[#F3F9F6] via-[#ECF5F0] to-[#DFEFE6] border-emerald-200 shadow-emerald-100/50'
        }`}
      >
        {/* 背景裝飾光暈 */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/60 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-xs text-[11px] font-bold text-[#6E6659] border border-black/5 flex items-center gap-1">
                <ArrowRightLeft className="w-3 h-3 text-rose-500" />
                <span>結算相抵結果</span>
              </span>
              {(safeSummary.unsettledCount || 0) > 0 ? (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/30 text-[11px] font-bold">
                  ⏳ 尚有 {safeSummary.unsettledCount} 筆待結算
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-900 border border-emerald-500/30 text-[11px] font-bold">
                  ✨ 目前全數結清
                </span>
              )}
            </div>

            {safeSummary.netDebtor === 'none' ? (
              <div className="pt-2">
                <h3 className="text-2xl sm:text-3xl font-black text-emerald-800 flex items-center gap-2">
                  目前雙方已結清 💖
                </h3>
                <p className="text-xs sm:text-sm text-emerald-700/80 mt-1 font-medium">
                  所有代墊費用均已返還或平帳，無任何未清款項！
                </p>
              </div>
            ) : (
              <div className="pt-2 space-y-1">
                <div className="text-xs sm:text-sm font-bold text-[#6E6659] flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-white/90 text-[#3E3A36] border border-black/5 font-extrabold flex items-center gap-1">
                    {safeSummary.netDebtor === '廖' ? userA.displayName : userB.displayName}
                  </span>
                  <span>應返還給</span>
                  <span className="px-2 py-0.5 rounded-lg bg-white/90 text-[#3E3A36] border border-black/5 font-extrabold flex items-center gap-1">
                    {safeSummary.netDebtor === '廖' ? userB.displayName : userA.displayName}
                  </span>
                </div>
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-rose-600 flex items-baseline gap-1.5 pt-1">
                  <span className="text-base sm:text-lg font-bold text-rose-800/80">NT$</span>
                  <span>{(safeSummary.netAmount || 0).toLocaleString()}</span>
                </div>
                <p className="text-xs text-[#8C8475] pt-0.5">
                  已自動抵銷雙方個別代墊之費用，直接依此淨額匯款即可平帳！
                </p>
              </div>
            )}
          </div>

          {/* 快捷操作按鈕組 */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 pt-2 md:pt-0">
            <button
              type="button"
              onClick={onOpenAdd}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>新增代墊明細</span>
            </button>

            {(safeSummary.unsettledCount || 0) > 0 && (
              <button
                type="button"
                onClick={onOpenSettleModal}
                className="px-5 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs sm:text-sm shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>一鍵結清返還</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* 雙人代墊統計小卡 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* User A 代墊卡片 */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#EBE7DF] shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            {userA.avatar ? (
              <img
                src={userA.avatar}
                alt={userA.displayName}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-2xl object-cover border border-white shadow-xs shrink-0 ring-1 ring-sky-200"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center text-xl shadow-xs font-black shrink-0">
                {userA.iconEmoji}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-[#8C8475] truncate">{userA.displayName} 先墊總額</div>
              <div className="text-lg sm:text-xl font-black text-[#3E3A36] mt-0.5">
                NT$ {(safeSummary.zhouOwesLiao || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-sky-700 font-medium truncate">
                {(safeSummary.zhouOwesLiao || 0) > 0 ? `${userB.displayName} 需返還 $${(safeSummary.zhouOwesLiao || 0).toLocaleString()}` : '目前無待還'}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-block px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-bold border border-sky-200">
              {userA.shortName}代付
            </span>
          </div>
        </div>

        {/* User B 代墊卡片 */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#EBE7DF] shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            {userB.avatar ? (
              <img
                src={userB.avatar}
                alt={userB.displayName}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-2xl object-cover border border-white shadow-xs shrink-0 ring-1 ring-rose-200"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center text-xl shadow-xs font-black shrink-0">
                {userB.iconEmoji}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-[#8C8475] truncate">{userB.displayName} 先墊總額</div>
              <div className="text-lg sm:text-xl font-black text-[#3E3A36] mt-0.5">
                NT$ {(safeSummary.liaoOwesZhou || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-rose-700 font-medium truncate">
                {(safeSummary.liaoOwesZhou || 0) > 0 ? `${userA.displayName} 需返還 $${(safeSummary.liaoOwesZhou || 0).toLocaleString()}` : '目前無待還'}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-block px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
              {userB.shortName}代付
            </span>
          </div>
        </div>
      </div>

      {/* 近期代墊動態區塊 */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-[#EAE6DD] shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F2EEE4] pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#8C8475]" />
            <h3 className="text-sm font-bold text-[#3E3A36]">近期代墊動態</h3>
            <span className="text-xs text-[#A09A8F]">({safeRecentItems.length} 筆)</span>
          </div>

          <button
            type="button"
            onClick={onGoToHistory}
            className="text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-0.5 transition-colors cursor-pointer"
          >
            <span>查看完整帳目</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {safeRecentItems.length === 0 ? (
          <div className="text-center py-10 space-y-2 text-[#9E978C]">
            <div className="text-3xl">☕</div>
            <p className="text-xs font-medium">目前尚無代墊紀錄</p>
            <p className="text-[11px] text-[#B0AAA0]">點擊上方「新增代墊明細」開始記錄第一筆私人消費！</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {safeRecentItems.slice(0, 5).map((item) => {
              const isUnsettled = item.status === '未結清';
              const totalAmt = Number(item.totalAmount) || 0;
              const debtorAmt = Number(item.debtorAmount) || (item.splitMode === 'AA平分' ? Math.round(totalAmt / 2) : totalAmt);
              const payerLabel = item.payer === '廖' ? '廖' : '周';
              const debtorLabel = item.debtor || (item.payer === '廖' ? '周' : '廖');
              const dateDisplay = item.time ? String(item.time).split(' ')[0] : '—';
              
              return (
                <div
                  key={item.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isUnsettled
                      ? 'bg-[#FAF8F5] border-[#E8E2D5] hover:border-[#D8CFBF]'
                      : 'bg-[#F9FAF9] border-[#E5EDE7] opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      item.payer === '廖' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {payerLabel}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-[#3E3A36] truncate max-w-[110px] min-[360px]:max-w-[150px] sm:max-w-[220px]" title={item.itemName || '未命名款項'}>
                          {item.itemName || '未命名款項'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-[#E0DCD3] text-[10px] font-semibold text-[#7A7366] shrink-0 whitespace-nowrap">
                          {item.splitMode || 'AA平分'}
                        </span>
                        {isUnsettled ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold shrink-0 whitespace-nowrap">
                            未結清
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold shrink-0 whitespace-nowrap">
                            已結清
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-[#8C8475] mt-0.5 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="shrink-0 whitespace-nowrap">總額 ${(Number(totalAmt) || 0).toLocaleString()}</span>
                        <span className="shrink-0">•</span>
                        <span className="font-semibold text-rose-700 shrink-0 whitespace-nowrap truncate max-w-[130px] min-[360px]:max-w-[170px] sm:max-w-none" title={`${debtorLabel} 需返還 $${(Number(debtorAmt) || 0).toLocaleString()}`}>
                          {debtorLabel} 需返還 ${(Number(debtorAmt) || 0).toLocaleString()}
                        </span>
                        {item.note && (
                          <>
                            <span className="shrink-0">•</span>
                            <span className="truncate max-w-[80px] min-[360px]:max-w-[120px] sm:max-w-[160px] text-[#A09A8F]" title={item.note}>📝 {item.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-black text-[#3E3A36]">
                      ${(Number(debtorAmt) || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#A39E93] mt-0.5">
                      {dateDisplay}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* App 內建智慧自然語言快捷記帳助理 */}
      <div className="bg-gradient-to-br from-[#FFF5F5] to-[#FAF8F5] rounded-2xl p-4 sm:p-5 border border-rose-200/80 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <h4 className="text-xs sm:text-sm font-bold text-[#3E3A36]">
              App 內建智慧快速記帳
            </h4>
          </div>
          {onOpenChatAssistant && (
            <button
              type="button"
              onClick={onOpenChatAssistant}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>開啟小秘書視窗</span>
            </button>
          )}
        </div>
        <p className="text-xs text-[#7A756E] leading-relaxed">
          直接輸入或點擊麥克風說出語句，系統自動辨識金額、代墊人與品項並完成記帳：
        </p>

        {onExecuteSmartCommand && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleQuickSubmit();
                    }
                  }}
                  placeholder="例如：廖 1200 晚餐、周 85 飲料、存 10000 薪資"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E2DDD3] focus:border-rose-500 focus:ring-2 focus:ring-rose-200 rounded-xl focus:outline-none font-sans shadow-2xs transition-all"
                />
              </div>

              <button
                type="button"
                onClick={() => handleQuickSubmit()}
                disabled={isSubmittingQuick || !quickInput.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
              >
                {isSubmittingQuick ? '記帳中...' : '送出'}
              </button>
            </div>

            {quickMsg && (
              <div className="text-[11px] font-medium text-[#4A4641] bg-white/80 p-2 rounded-lg border border-rose-100">
                {quickMsg}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
          <button
            type="button"
            onClick={() => handleQuickSubmit('廖 1200 晚餐')}
            className="bg-white p-2.5 rounded-xl border border-rose-100 font-mono text-left hover:border-rose-300 transition-all cursor-pointer shadow-2xs group"
          >
            <span className="font-bold text-rose-700">代墊指令範例：</span> <code>廖 1200 晚餐</code>
            <p className="text-[10px] text-[#8C8475] mt-0.5">（自動辨識一人一半 AA 平分各 $600）</p>
          </button>
          <button
            type="button"
            onClick={() => handleQuickSubmit('查代墊')}
            className="bg-white p-2.5 rounded-xl border border-rose-100 font-mono text-left hover:border-rose-300 transition-all cursor-pointer shadow-2xs group"
          >
            <span className="font-bold text-sky-700">即時查帳指令範例：</span> <code>查代墊</code> 或 <code>查</code>
            <p className="text-[10px] text-[#8C8475] mt-0.5">（即時彈出對帳與公積金結餘摘要）</p>
          </button>
        </div>
      </div>
    </div>
  );
};
