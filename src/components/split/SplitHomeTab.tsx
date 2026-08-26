import React from 'react';
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
  Heart
} from 'lucide-react';
import { motion } from 'motion/react';
import { SplitRecordItem, SplitSummary } from '../../types';

interface SplitHomeTabProps {
  summary: SplitSummary;
  recentItems: SplitRecordItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenAdd: () => void;
  onGoToHistory: () => void;
  onGoToSettlement: () => void;
  onOpenSettleModal: () => void;
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
  onRefresh,
  onOpenAdd,
  onGoToHistory,
  onGoToSettlement,
  onOpenSettleModal,
}) => {
  const safeSummary: SplitSummary = summary || DEFAULT_SPLIT_SUMMARY;
  const safeRecentItems = Array.isArray(recentItems) ? recentItems.filter(Boolean) : [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans">
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
            <span>{isLoading ? '同步中...' : '同步資料'}</span>
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
                  <span className="px-2 py-0.5 rounded-lg bg-white/90 text-[#3E3A36] border border-black/5 font-extrabold">
                    {safeSummary.netDebtor === '廖' ? '廖廖' : '周周'}
                  </span>
                  <span>應返還給</span>
                  <span className="px-2 py-0.5 rounded-lg bg-white/90 text-[#3E3A36] border border-black/5 font-extrabold">
                    {safeSummary.netDebtor === '廖' ? '周周' : '廖廖'}
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
        {/* 廖廖代墊卡片 */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#EBE7DF] shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center text-xl shadow-xs font-black">
              👦
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#8C8475]">廖廖 先墊總額</div>
              <div className="text-lg sm:text-xl font-black text-[#3E3A36] mt-0.5">
                NT$ {(safeSummary.zhouOwesLiao || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-sky-700 font-medium">
                {(safeSummary.zhouOwesLiao || 0) > 0 ? `周周 需返還 $${(safeSummary.zhouOwesLiao || 0).toLocaleString()}` : '目前無待還'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-bold border border-sky-200">
              廖代付
            </span>
          </div>
        </div>

        {/* 周周代墊卡片 */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#EBE7DF] shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center text-xl shadow-xs font-black">
              👧
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#8C8475]">周周 先墊總額</div>
              <div className="text-lg sm:text-xl font-black text-[#3E3A36] mt-0.5">
                NT$ {(safeSummary.liaoOwesZhou || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-rose-700 font-medium">
                {(safeSummary.liaoOwesZhou || 0) > 0 ? `廖廖 需返還 $${(safeSummary.liaoOwesZhou || 0).toLocaleString()}` : '目前無待還'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
              周代付
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

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-[#3E3A36] truncate">
                          {item.itemName || '未命名款項'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-[#E0DCD3] text-[10px] font-semibold text-[#7A7366]">
                          {item.splitMode || 'AA平分'}
                        </span>
                        {isUnsettled ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                            未結清
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                            已結清
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-[#8C8475] mt-0.5 flex items-center gap-2">
                        <span>總額 ${(Number(totalAmt) || 0).toLocaleString()}</span>
                        <span>•</span>
                        <span className="font-semibold text-rose-700">
                          {debtorLabel} 需返還 ${(Number(debtorAmt) || 0).toLocaleString()}
                        </span>
                        {item.note && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[120px] text-[#A09A8F]">📝 {item.note}</span>
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

      {/* LINE 智能記帳指令提示 */}
      <div className="bg-[#FAF8F3] rounded-2xl p-4 sm:p-5 border border-[#E6E1D3] space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-base">💬</span>
          <h4 className="text-xs sm:text-sm font-bold text-[#3E3A36]">
            LINE 官方帳號智能代墊指令
          </h4>
        </div>
        <p className="text-xs text-[#736D62] leading-relaxed">
          不用打開網頁，在 LINE 群組或官方帳號直接傳送文字即可快速記帳與查帳：
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
          <div className="bg-white p-2.5 rounded-xl border border-[#E2DDD0] font-mono text-[#5C564C]">
            <span className="font-bold text-rose-700">代墊記帳：</span> <code>代墊 晚餐 1200</code><br />
            <span className="text-[10px] text-[#8C8475]">（自動一人一半 AA 平分各 $600）</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-[#E2DDD0] font-mono text-[#5C564C]">
            <span className="font-bold text-emerald-700">即時查帳：</span> <code>查代墊</code> 或 <code>誰欠誰</code><br />
            <span className="text-[10px] text-[#8C8475]">（LINE 機器人即時回覆結算淨額卡片）</span>
          </div>
        </div>
      </div>
    </div>
  );
};
