import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Tag, 
  MessageSquare,
  Sparkles,
  ArrowRightLeft,
  X,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { SplitRecordItem } from '../../types';
import { exportSplitRecordsToCSV } from '../../utils/exportCsv';

interface SplitHistoryTabProps {
  items: SplitRecordItem[];
  onDeleteItem: (id: string) => void;
  onOpenAdd: () => void;
}

export const SplitHistoryTab: React.FC<SplitHistoryTabProps> = ({
  items = [],
  onDeleteItem,
  onOpenAdd,
}) => {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'unsettled' | 'settled'>('ALL');
  const [filterPayer, setFilterPayer] = useState<'ALL' | '廖' | '周'>('ALL');
  const [filterDebtor, setFilterDebtor] = useState<'ALL' | '廖' | '周'>('ALL');
  const [sortBy, setSortBy] = useState<'time-desc' | 'time-asc' | 'amount-desc' | 'amount-asc'>('time-desc');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredItems = safeItems
    .filter((item) => {
      if (!item) return false;
      if (filterStatus === 'unsettled' && item.status !== '未結清') return false;
      if (filterStatus === 'settled' && item.status !== '已結清') return false;
      if (filterPayer !== 'ALL' && item.payer !== filterPayer) return false;
      if (filterDebtor !== 'ALL' && item.debtor !== filterDebtor) return false;
      
      // 日期範圍篩選
      if (startDate) {
        const itemDate = item.time ? String(item.time).substring(0, 10) : '';
        if (itemDate && itemDate < startDate) return false;
      }
      if (endDate) {
        const itemDate = item.time ? String(item.time).substring(0, 10) : '';
        if (itemDate && itemDate > endDate) return false;
      }

      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const matchName = item.itemName ? String(item.itemName).toLowerCase().includes(q) : false;
        const matchNote = item.note ? String(item.note).toLowerCase().includes(q) : false;
        const matchPayer = item.payer ? String(item.payer).toLowerCase().includes(q) : false;
        const matchDebtor = item.debtor ? String(item.debtor).toLowerCase().includes(q) : false;
        const totalStr = (item.totalAmount !== undefined && item.totalAmount !== null) ? String(item.totalAmount) : '';
        const debtorStr = (item.debtorAmount !== undefined && item.debtorAmount !== null) ? String(item.debtorAmount) : '';
        const matchAmount = totalStr.includes(q) || debtorStr.includes(q);
        if (!matchName && !matchNote && !matchPayer && !matchDebtor && !matchAmount) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const totA = Number(a.totalAmount) || 0;
      const totB = Number(b.totalAmount) || 0;
      const amtA = Number(a.debtorAmount) || (a.splitMode === 'AA平分' ? Math.round(totA / 2) : totA);
      const amtB = Number(b.debtorAmount) || (b.splitMode === 'AA平分' ? Math.round(totB / 2) : totB);

      if (sortBy === 'amount-desc') return amtB - amtA;
      if (sortBy === 'amount-asc') return amtA - amtB;
      
      const timeA = String(a.time || a.id || '');
      const timeB = String(b.time || b.id || '');
      if (sortBy === 'time-asc') return timeA.localeCompare(timeB);
      return timeB.localeCompare(timeA);
    });

  const unsettledCount = safeItems.filter(i => i && i.status === '未結清').length;
  const settledCount = safeItems.filter(i => i && i.status === '已結清').length;

  const totalFilteredExpenseSum = filteredItems.reduce((acc, item) => acc + (Number(item?.totalAmount) || 0), 0);
  const totalFilteredDebtorSum = filteredItems.reduce((acc, item) => {
    const tot = Number(item?.totalAmount) || 0;
    const amt = Number(item?.debtorAmount) || (item?.splitMode === 'AA平分' ? Math.round(tot / 2) : tot);
    return acc + amt;
  }, 0);

  const liaoAdvancedSum = filteredItems
    .filter(i => i?.payer === '廖')
    .reduce((acc, i) => acc + (Number(i?.totalAmount) || 0), 0);
  const zhouAdvancedSum = filteredItems
    .filter(i => i?.payer === '周')
    .reduce((acc, i) => acc + (Number(i?.totalAmount) || 0), 0);

  const handleExportCSV = () => {
    exportSplitRecordsToCSV(filteredItems, `伴伴記_代墊明細_${new Date().toISOString().substring(0, 10)}.csv`);
  };

  const hasActiveFilters = filterStatus !== 'ALL' || filterPayer !== 'ALL' || filterDebtor !== 'ALL' || searchKeyword || startDate || endDate;

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-12 font-sans">
      {/* 頂部標題與統計 */}
      <div className="bg-white/70 backdrop-blur-md p-4 sm:px-6 sm:py-5 rounded-2xl border border-[#E9E5DC] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[#3E3A36] flex items-center gap-2">
              <span>🧾 代墊流水帳明細</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 text-[10px] font-bold border border-rose-200">
              共 {safeItems.length} 筆
            </span>
          </div>
          <p className="text-xs text-[#8C8475] mt-0.5">
            完整檢視每一筆代付款項、分攤方式與各筆還款狀態。
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white hover:bg-[#FAF8F5] text-[#4A4641] border border-[#DDD8CD] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="匯出當前篩選結果為 CSV 表格"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>匯出 CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenAdd}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>＋ 新增代墊</span>
          </button>
        </div>
      </div>

      {/* 篩選與搜尋列 */}
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-[#EBE7DF] shadow-2xs space-y-3">
        {/* 狀態標籤切換 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* 未結清 / 已結清 / 全部 */}
          <div className="flex items-center p-1 bg-[#F5F2EB] rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilterStatus('ALL')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-white text-[#3E3A36] shadow-xs'
                  : 'text-[#8C8475] hover:text-[#3E3A36]'
              }`}
            >
              全部 ({safeItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('unsettled')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                filterStatus === 'unsettled'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-[#8C8475] hover:text-[#3E3A36]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>待結算 ({unsettledCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('settled')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                filterStatus === 'settled'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-[#8C8475] hover:text-[#3E3A36]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>已結清 ({settledCount})</span>
            </button>
          </div>

          {/* 付款人篩選 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-[#8C8475] shrink-0">出資人：</span>
            {(['ALL', '廖', '周'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setFilterPayer(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterPayer === p
                    ? p === '廖'
                      ? 'bg-sky-100 text-sky-800 border border-sky-300'
                      : p === '周'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-[#4D4942] text-white'
                    : 'bg-[#F5F2EB] text-[#8C8475] hover:text-[#3E3A36]'
                }`}
              >
                {p === 'ALL' ? '全部' : p === '廖' ? '👦 廖廖' : '👧 周周'}
              </button>
            ))}
          </div>
        </div>

        {/* 日期區間快篩與排序 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-[#F0ECE1]">
          {/* 起始日 */}
          <div className="flex items-center gap-1.5 bg-[#FAF8F3] px-2.5 py-1.5 rounded-xl border border-[#E2DDD0]">
            <span className="text-[11px] font-bold text-[#8C8475] shrink-0">起：</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs text-[#3E3A36] focus:outline-none w-full cursor-pointer"
            />
            {startDate && (
              <button onClick={() => setStartDate('')} className="text-[#A09A8F] hover:text-gray-700 text-xs">✕</button>
            )}
          </div>

          {/* 結束日 */}
          <div className="flex items-center gap-1.5 bg-[#FAF8F3] px-2.5 py-1.5 rounded-xl border border-[#E2DDD0]">
            <span className="text-[11px] font-bold text-[#8C8475] shrink-0">訖：</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs text-[#3E3A36] focus:outline-none w-full cursor-pointer"
            />
            {endDate && (
              <button onClick={() => setEndDate('')} className="text-[#A09A8F] hover:text-gray-700 text-xs">✕</button>
            )}
          </div>

          {/* 排序選擇器 */}
          <div className="flex items-center gap-1.5 bg-[#FAF8F3] px-2.5 py-1.5 rounded-xl border border-[#E2DDD0]">
            <span className="text-[11px] font-bold text-[#8C8475] shrink-0">排序：</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-[#3E3A36] font-bold focus:outline-none w-full cursor-pointer"
            >
              <option value="time-desc">最新時間優先</option>
              <option value="time-asc">最舊時間優先</option>
              <option value="amount-desc">應還金額 (大到小)</option>
              <option value="amount-asc">應還金額 (小到大)</option>
            </select>
          </div>
        </div>

        {/* 搜尋列 */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#A09A8F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜尋代墊品項名稱、備註、金額..."
            className="w-full pl-9 pr-8 py-2 bg-[#FAF8F3] border border-[#E2DDD0] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-rose-400 focus:bg-white transition-all"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => setSearchKeyword('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A09A8F] hover:text-[#5C564C] p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 篩選結果統計小計卡 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[#EDE8DC] text-xs">
          <div className="bg-[#FAF8F5] p-2 rounded-xl border border-[#EDE8DC] flex flex-col">
            <span className="text-[10px] text-[#8C8475]">顯示筆數</span>
            <span className="font-mono font-bold text-[#3E3A36]">{filteredItems.length} 筆</span>
          </div>
          <div className="bg-[#FAF8F5] p-2 rounded-xl border border-[#EDE8DC] flex flex-col">
            <span className="text-[10px] text-[#8C8475]">消費總金額</span>
            <span className="font-mono font-bold text-[#3E3A36]">NT$ {(Number(totalFilteredExpenseSum) || 0).toLocaleString()}</span>
          </div>
          <div className="bg-sky-50/70 p-2 rounded-xl border border-sky-200/60 flex flex-col">
            <span className="text-[10px] text-sky-800 font-semibold">廖先付小計</span>
            <span className="font-mono font-bold text-sky-900">NT$ {(Number(liaoAdvancedSum) || 0).toLocaleString()}</span>
          </div>
          <div className="bg-rose-50/70 p-2 rounded-xl border border-rose-200/60 flex flex-col">
            <span className="text-[10px] text-rose-800 font-semibold">周先付小計</span>
            <span className="font-mono font-bold text-rose-900">NT$ {(Number(zhouAdvancedSum) || 0).toLocaleString()}</span>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end pt-0.5">
            <button
              type="button"
              onClick={() => {
                setFilterStatus('ALL');
                setFilterPayer('ALL');
                setFilterDebtor('ALL');
                setSearchKeyword('');
                setStartDate('');
                setEndDate('');
              }}
              className="text-[11px] text-rose-700 hover:text-rose-800 hover:underline cursor-pointer flex items-center gap-1 font-bold"
            >
              <span>重設所有篩選條件</span>
            </button>
          </div>
        )}
      </div>

      {/* 明細列表 */}
      {filteredItems.length === 0 ? (
        <div className="bg-white/80 rounded-3xl p-12 text-center border border-[#EAE6DD] shadow-2xs space-y-3">
          <div className="text-4xl">🔍</div>
          <h3 className="text-sm font-bold text-[#3E3A36]">找不到符合條件的代墊紀錄</h3>
          <p className="text-xs text-[#8C8475]">可以嘗試更換篩選條件，或點擊下方按鈕新增一筆代墊款項！</p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenAdd}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              ＋ 新增代墊明細
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isUnsettled = item.status === '未結清';
            const totalAmt = Number(item.totalAmount) || 0;
            const debtorAmt = Number(item.debtorAmount) || (item.splitMode === 'AA平分' ? Math.round(totalAmt / 2) : totalAmt);
            const payerLabel = item.payer === '廖' ? '廖' : '周';
            const debtorLabel = item.debtor || (item.payer === '廖' ? '周' : '廖');

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isUnsettled
                    ? 'border-[#E5DFD3] hover:border-rose-300'
                    : 'border-[#EAEAEA] opacity-80 bg-[#FAFAFA]'
                }`}
              >
                {/* 左側詳細資訊 */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 mt-0.5 ${
                    item.payer === '廖' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {payerLabel}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm sm:text-base font-bold text-[#3E3A36] break-words">
                        {item.itemName || '未命名款項'}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-[#F4F1EA] text-[#6E6659] text-[10px] font-bold">
                        {item.splitMode || 'AA平分'}
                      </span>
                      {isUnsettled ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
                          待結算
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                          已結清
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#7A7366] flex items-center gap-2 flex-wrap">
                      <span>消費總額：${(Number(totalAmt) || 0).toLocaleString()}</span>
                      <span>•</span>
                      <span className="font-bold text-rose-700">
                        {debtorLabel} 應返還 NT$ {(Number(debtorAmt) || 0).toLocaleString()}
                      </span>
                    </div>

                    {item.note && (
                      <div className="text-[11px] text-[#8C8475] bg-[#FAF8F5] p-2 rounded-lg border border-[#EEEAE1] mt-1">
                        📝 備註：{item.note}
                      </div>
                    )}

                    <div className="text-[10px] text-[#A09A8F] pt-0.5 flex items-center gap-2">
                      <span>🕒 記帳時間：{item.time || '—'}</span>
                      {item.settledTime && (
                        <span>• ✅ 結清時間：{item.settledTime}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 右側金額與操作 */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[#F0EBE1] shrink-0 gap-2">
                  <div className="text-left sm:text-right">
                    <div className="text-xs text-[#8C8475]">應還款額</div>
                    <div className="text-base sm:text-lg font-black text-rose-600">
                      ${(Number(debtorAmt) || 0).toLocaleString()}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    className="p-2 text-[#A8A296] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-200 cursor-pointer"
                    title="刪除此筆代墊紀錄"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
