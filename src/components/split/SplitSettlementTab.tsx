import React, { useState } from 'react';
import { 
  Scale, 
  CheckCircle2, 
  ArrowRightLeft, 
  Sparkles, 
  Receipt, 
  Clock, 
  Calendar, 
  Check, 
  AlertCircle,
  HelpCircle,
  FileCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SplitRecordItem, SplitSummary } from '../../types';

interface SplitSettlementTabProps {
  summary: SplitSummary;
  items: SplitRecordItem[];
  onOpenSettleModal: () => void;
  isLoading: boolean;
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

export const SplitSettlementTab: React.FC<SplitSettlementTabProps> = ({
  summary = DEFAULT_SPLIT_SUMMARY,
  items = [],
  onOpenSettleModal,
  isLoading,
}) => {
  const safeSummary: SplitSummary = summary || DEFAULT_SPLIT_SUMMARY;
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const unsettledItems = safeItems.filter(i => i && i.status === '未結清');
  const settledItems = safeItems.filter(i => i && i.status === '已結清');
  const [showSettledList, setShowSettledList] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans">
      {/* 頂部橫幅 */}
      <div className="bg-gradient-to-r from-[#4A4641] to-[#36322E] text-white rounded-3xl p-5 sm:p-7 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              代墊對帳中心
            </h2>
            <p className="text-[#C5BFB5] text-xs sm:text-sm mt-1 max-w-lg leading-relaxed font-light">
              雙方代墊自動互抵結算，確認結清後可自動推播 LINE 通知。
            </p>
          </div>

          {(safeSummary.unsettledCount || 0) > 0 && (
            <button
              type="button"
              onClick={onOpenSettleModal}
              disabled={isLoading}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>一鍵全部結清歸零</span>
            </button>
          )}
        </div>
      </div>

      {/* 核心相抵算式大面板 */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E9E5DC] shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#F2EDE4] pb-4">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-rose-600" />
            <h3 className="text-sm sm:text-base font-bold text-[#3E3A36]">雙方互抵結算單</h3>
          </div>
          <span className="text-xs text-[#8C8475] font-medium">
            待對帳項目：{unsettledItems.length} 筆
          </span>
        </div>

        {/* 算式分解 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* 廖廖代墊 */}
          <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200/80 space-y-1">
            <div className="text-[11px] font-bold text-sky-800 flex items-center justify-between">
              <span>👦 廖廖 先墊總額</span>
              <span className="text-[10px] bg-sky-100 px-1.5 py-0.5 rounded text-sky-700">廖出錢</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-sky-900">
              NT$ {(safeSummary.zhouOwesLiao || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-sky-700">（周周 應返還此筆）</div>
          </div>

          {/* 減號 / 互抵符號 */}
          <div className="hidden md:flex flex-col items-center justify-center text-center">
            <span className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#DDD8CD] text-[#7A7366] font-bold flex items-center justify-center text-sm shadow-2xs">
              ⇋
            </span>
            <span className="text-[10px] font-bold text-[#8C8475] mt-1">互相抵銷</span>
          </div>

          {/* 周周代墊 */}
          <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 space-y-1">
            <div className="text-[11px] font-bold text-rose-800 flex items-center justify-between">
              <span>👧 周周 先墊總額</span>
              <span className="text-[10px] bg-rose-100 px-1.5 py-0.5 rounded text-rose-700">周出錢</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-900">
              NT$ {(safeSummary.liaoOwesZhou || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-rose-700">（廖廖 應返還此筆）</div>
          </div>
        </div>

        {/* 最終淨額結算結果 */}
        <div className={`p-5 rounded-2xl border text-center space-y-2 ${
          safeSummary.netDebtor === 'none'
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-[#FAF8F5] border-[#E8E2D5] text-[#3E3A36]'
        }`}>
          <div className="text-xs font-bold text-[#8C8475] uppercase tracking-wider">
            抵銷後最終淨返還結果
          </div>

          {safeSummary.netDebtor === 'none' ? (
            <div className="py-2">
              <div className="text-2xl sm:text-3xl font-black text-emerald-800 flex items-center justify-center gap-2">
                <span>目前雙方已結清 💖</span>
              </div>
              <p className="text-xs text-emerald-700 mt-1 font-medium">
                互相代墊金額完全平帳，不需要任何匯款返還！
              </p>
            </div>
          ) : (
            <div className="py-2 space-y-1.5">
              <div className="text-sm font-bold text-[#6E6659]">
                由 <span className="font-black text-[#3E3A36] text-base px-2 py-0.5 rounded bg-white border border-black/5 shadow-2xs">{safeSummary.netDebtor === '廖' ? '廖廖' : '周周'}</span> 支付給 <span className="font-black text-[#3E3A36] text-base px-2 py-0.5 rounded bg-white border border-black/5 shadow-2xs">{safeSummary.netDebtor === '廖' ? '周周' : '廖廖'}</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-rose-600 tracking-tight">
                NT$ {(safeSummary.netAmount || 0).toLocaleString()} 元
              </div>
              <p className="text-xs text-[#8C8475] max-w-md mx-auto pt-1">
                依此金額進行轉帳或現金交付後，點擊下方「確認已全數結清」即可將帳目歸檔清零。
              </p>
            </div>
          )}

          {(safeSummary.unsettledCount || 0) > 0 && (
            <div className="pt-3">
              <button
                type="button"
                onClick={onOpenSettleModal}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95 inline-flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>確認雙方已交付款項，全部結清！</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 待結清明細清單 */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-[#EBE7DF] shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F2EEE4] pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#8C8475]" />
            <h3 className="text-sm font-bold text-[#3E3A36]">本次待對帳明細</h3>
            <span className="text-xs text-[#8C8475]">({unsettledItems.length} 筆)</span>
          </div>
        </div>

        {unsettledItems.length === 0 ? (
          <div className="text-center py-8 text-[#9E978C] text-xs">
            ✨ 太棒了！目前無任何待對帳項目。
          </div>
        ) : (
          <div className="space-y-2.5">
            {unsettledItems.map((item) => {
              const totalAmt = Number(item.totalAmount) || 0;
              const debtorAmt = Number(item.debtorAmount) || (item.splitMode === 'AA平分' ? Math.round(totalAmt / 2) : totalAmt);
              const dateDisplay = item.time ? String(item.time).split(' ')[0] : '—';
              const payerLabel = item.payer === '廖' ? '廖' : '周';
              const debtorLabel = item.debtor || (item.payer === '廖' ? '周' : '廖');

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E9E4DA] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                      item.payer === '廖' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {payerLabel}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-[#3E3A36] truncate">{item.itemName || '未命名款項'}</div>
                      <div className="text-[10px] text-[#8C8475]">
                        總額 ${(Number(totalAmt) || 0).toLocaleString()} • {item.splitMode || 'AA平分'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-rose-700">
                      {debtorLabel} 還 ${(Number(debtorAmt) || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#A8A296]">{dateDisplay}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 歷次已結清歸檔紀錄 (可展開折疊) */}
      <div className="bg-white/70 rounded-3xl p-5 border border-[#EAE6DD] shadow-2xs space-y-3">
        <button
          type="button"
          onClick={() => setShowSettledList(!showSettledList)}
          className="w-full flex items-center justify-between text-xs font-bold text-[#6E6659] hover:text-[#3E3A36] cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>歷次已結清歸檔紀錄 ({settledItems.length} 筆)</span>
          </div>
          {showSettledList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showSettledList && (
          <div className="pt-2 space-y-2 border-t border-[#F2EEE4]">
            {settledItems.length === 0 ? (
              <div className="text-center py-4 text-xs text-[#A8A296]">尚無已結清之歷史紀錄</div>
            ) : (
              settledItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#F9FAF9] border border-[#E5EFE7] flex items-center justify-between text-xs text-[#6E6659]"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-[#3E3A36]">{item.itemName || '款項'}</span>
                    <span className="text-[10px] text-[#8C8475]">(${(Number(item.totalAmount) || 0).toLocaleString()})</span>
                  </div>
                  <div className="text-[10px] text-[#A8A296]">
                    ✅ 結清於：{item.settledTime || item.time || '—'}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
