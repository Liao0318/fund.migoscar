import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Check, 
  User, 
  Wallet, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Tag, 
  MessageSquare, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SplitRecordItem, SplitSummary } from '../types';

interface SplitDebtViewProps {
  gasApiUrl: string;
  onSwitchToFund?: () => void;
  onOpenSettings?: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SplitDebtView: React.FC<SplitDebtViewProps> = ({
  gasApiUrl,
  onSwitchToFund,
  onOpenSettings,
  showToast
}) => {
  // 資料狀態
  const [items, setItems] = useState<SplitRecordItem[]>(() => {
    try {
      const saved = localStorage.getItem('banban_split_records');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [summary, setSummary] = useState<SplitSummary>(() => {
    try {
      const saved = localStorage.getItem('banban_split_summary');
      return saved ? JSON.parse(saved) : {
        liaoOwesZhou: 0,
        zhouOwesLiao: 0,
        netDebtor: 'none',
        netAmount: 0,
        summaryText: '目前雙方已結清 💖',
        unsettledCount: 0,
        settledCount: 0
      };
    } catch (e) {
      return {
        liaoOwesZhou: 0,
        zhouOwesLiao: 0,
        netDebtor: 'none',
        netAmount: 0,
        summaryText: '目前雙方已結清 💖',
        unsettledCount: 0,
        settledCount: 0
      };
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'unsettled' | 'settled'>('unsettled');
  const [filterPayer, setFilterPayer] = useState<'ALL' | '廖' | '周'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 新增表單狀態
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [payer, setPayer] = useState<'廖' | '周'>('廖');
  const [itemName, setItemName] = useState('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [splitMode, setSplitMode] = useState<'AA平分' | '全額代付' | '自訂金額'>('AA平分');
  const [customOweAmount, setCustomOweAmount] = useState<string>('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 結清確認視窗
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<SplitRecordItem | null>(null);

  // 本機計算 Summary
  const calculateLocalSummary = (currentItems: SplitRecordItem[]) => {
    let liaoOwesZhou = 0;
    let zhouOwesLiao = 0;
    let unsettledCount = 0;
    let settledCount = 0;

    currentItems.forEach((item) => {
      if (item.status === '未結清') {
        unsettledCount++;
        const debtorAmt = item.debtorAmount || (item.splitMode === 'AA平分' ? Math.round(item.totalAmount / 2) : item.totalAmount);
        if (item.payer === '廖') {
          zhouOwesLiao += debtorAmt;
        } else {
          liaoOwesZhou += debtorAmt;
        }
      } else {
        settledCount++;
      }
    });

    let netDebtor: '廖' | '周' | 'none' = 'none';
    let netAmount = 0;
    let summaryText = '目前雙方已結清 💖';

    if (liaoOwesZhou > zhouOwesLiao) {
      netDebtor = '廖';
      netAmount = liaoOwesZhou - zhouOwesLiao;
      summaryText = `廖 應返還 周 NT$ ${(Number(netAmount) || 0).toLocaleString()}`;
    } else if (zhouOwesLiao > liaoOwesZhou) {
      netDebtor = '周';
      netAmount = zhouOwesLiao - liaoOwesZhou;
      summaryText = `周 應返還 廖 NT$ ${(Number(netAmount) || 0).toLocaleString()}`;
    }

    const newSummary: SplitSummary = {
      liaoOwesZhou,
      zhouOwesLiao,
      netDebtor,
      netAmount,
      summaryText,
      unsettledCount,
      settledCount
    };

    setSummary(newSummary);
    try {
      localStorage.setItem('banban_split_summary', JSON.stringify(newSummary));
      localStorage.setItem('banban_split_records', JSON.stringify(currentItems));
    } catch (e) {}
  };

  // 從 GAS API 抓取最新代墊資料
  const fetchSplitData = async (silent = false) => {
    if (!gasApiUrl) {
      calculateLocalSummary(items);
      return;
    }

    if (!silent) setIsLoading(true);
    try {
      const res = await fetch(gasApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getSplitData' })
      });
      const data = await res.json();
      if (data && data.success) {
        setItems(data.items || []);
        if (data.summary) {
          setSummary(data.summary);
          localStorage.setItem('banban_split_summary', JSON.stringify(data.summary));
        } else {
          calculateLocalSummary(data.items || []);
        }
        localStorage.setItem('banban_split_records', JSON.stringify(data.items || []));
        if (!silent) showToast('代墊明細已同步更新！', 'success');
      } else {
        if (!silent) showToast(data.message || '讀取代墊資料失敗', 'error');
      }
    } catch (err) {
      console.error('Fetch split error:', err);
      calculateLocalSummary(items);
      if (!silent) showToast('連線失敗，已載入本機快取', 'info');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSplitData(true);
  }, [gasApiUrl]);

  // 新增代墊紀錄
  const handleAddSplit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(totalAmount);
    if (isNaN(num) || num <= 0) {
      showToast('請輸入有效的代墊金額', 'error');
      return;
    }
    if (!itemName.trim()) {
      showToast('請輸入品項名稱', 'error');
      return;
    }

    const otherPerson = payer === '廖' ? '周' : '廖';
    let debtorAmt = Math.round(num / 2);
    if (splitMode === '全額代付') {
      debtorAmt = num;
    } else if (splitMode === '自訂金額') {
      const customNum = parseFloat(customOweAmount);
      debtorAmt = !isNaN(customNum) && customNum >= 0 ? customNum : Math.round(num / 2);
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? '下午' : '上午';
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    const timeStr = `${year}-${month}-${day} ${ampm} ${String(h12).padStart(2, '0')}:${minutes}`;

    const newItem: SplitRecordItem = {
      id: 'split-' + Date.now(),
      time: timeStr,
      payer,
      splitMode,
      itemName: itemName.trim(),
      totalAmount: num,
      splitResult: `${otherPerson} 應返還 ${payer} NT$ ${(Number(debtorAmt) || 0).toLocaleString()}`,
      debtor: otherPerson,
      debtorAmount: debtorAmt,
      status: '未結清',
      note: note.trim()
    };

    const updated = [newItem, ...items];
    setItems(updated);
    calculateLocalSummary(updated);
    setIsAddFormOpen(false);
    setItemName('');
    setTotalAmount('');
    setCustomOweAmount('');
    setNote('');

    showToast(`已成功記錄代墊：${newItem.itemName}（${otherPerson} 需返還 $${debtorAmt}）`, 'success');

    // 同步到 GAS
    if (gasApiUrl) {
      setIsSubmitting(true);
      try {
        await fetch(gasApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'addSplitRecord',
            payer,
            totalAmount: num,
            itemName: newItem.itemName,
            splitMode,
            customOweAmount: debtorAmt,
            note: newItem.note
          })
        });
        fetchSplitData(true);
      } catch (err) {
        console.error('GAS add split error:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // 刪除代墊紀錄
  const confirmDeleteItem = (item: SplitRecordItem) => {
    setDeleteConfirmItem(item);
  };

  const executeDeleteItem = async (id: string) => {
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    calculateLocalSummary(updated);
    setDeleteConfirmItem(null);
    showToast('已刪除該筆代墊明細', 'info');

    if (gasApiUrl) {
      try {
        await fetch(gasApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'deleteSplitRecord', id })
        });
        fetchSplitData(true);
      } catch (err) {
        console.error('GAS delete split error:', err);
      }
    }
  };

  // 一鍵結清所有款項
  const handleSettleAll = async () => {
    setShowSettleModal(false);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? '下午' : '上午';
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    const timeStr = `${year}-${month}-${day} ${ampm} ${String(h12).padStart(2, '0')}:${minutes}`;

    const updated = items.map(item => {
      if (item.status === '未結清') {
        return { ...item, status: '已結清' as const, settledTime: timeStr };
      }
      return item;
    });

    setItems(updated);
    calculateLocalSummary(updated);
    showToast('🎉 所有代墊款項已全數結清！目前債務歸零！', 'success');

    if (gasApiUrl) {
      try {
        await fetch(gasApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'settleAllSplitRecords' })
        });
        fetchSplitData(true);
      } catch (err) {
        console.error('GAS settle all error:', err);
      }
    }
  };

  // 篩選清單
  const filteredItems = items.filter(item => {
    if (activeTab === 'unsettled' && item.status !== '未結清') return false;
    if (activeTab === 'settled' && item.status !== '已結清') return false;
    if (filterPayer !== 'ALL' && item.payer !== filterPayer) return false;
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      const matchName = item.itemName.toLowerCase().includes(q);
      const matchNote = item.note ? item.note.toLowerCase().includes(q) : false;
      if (!matchName && !matchNote) return false;
    }
    return true;
  });

  // 計算預覽金額
  const previewAmount = parseFloat(totalAmount) || 0;
  let previewDebtorOwe = Math.round(previewAmount / 2);
  if (splitMode === '全額代付') previewDebtorOwe = previewAmount;
  else if (splitMode === '自訂金額') previewDebtorOwe = parseFloat(customOweAmount) || 0;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2825] pb-24 font-sans selection:bg-[#E8998D] selection:text-white">
      {/* 頂部導航列 */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EBE5DE] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E8998D] to-[#F3C5B5] flex items-center justify-center text-white shadow-sm font-bold text-sm">
              💳
            </div>
            <div>
              <h1 className="text-base font-bold text-[#3D3733] flex items-center gap-1.5">
                伴伴記・代墊借還
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#EFE8E1] text-[#8C7E74] font-medium">
                  /split
                </span>
              </h1>
              <p className="text-[11px] text-[#8C7E74]">情侶個人代墊・AA與全額分帳算清</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onSwitchToFund && (
              <button
                id="btn-nav-to-fund"
                onClick={onSwitchToFund}
                className="px-2.5 py-1.5 rounded-lg bg-[#EFE9E2] hover:bg-[#E2D8CE] text-[#4A423C] text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
                title="切換回公積金記帳"
              >
                🏠 公積金主頁
              </button>
            )}

            <button
              id="btn-split-refresh"
              onClick={() => fetchSplitData(false)}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-white border border-[#E0D7CD] text-[#6E6359] hover:bg-[#F3EDE6] transition-colors shadow-xs disabled:opacity-50"
              title="重新整理同步"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#E8998D]' : ''}`} />
            </button>

            {onOpenSettings && (
              <button
                id="btn-split-settings"
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg bg-white border border-[#E0D7CD] text-[#6E6359] hover:bg-[#F3EDE6] transition-colors shadow-xs"
                title="連線設定"
              >
                ⚙️
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* 核心債務狀態卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-5 border shadow-sm transition-all relative overflow-hidden ${
            summary.netDebtor === 'none'
              ? 'bg-gradient-to-br from-[#FFFDFC] to-[#F7F3EE] border-[#E8DFC8]'
              : summary.netDebtor === '廖'
              ? 'bg-gradient-to-br from-[#FFF6F3] to-[#FCEEEA] border-[#F2C9BF]'
              : 'bg-gradient-to-br from-[#F2F8F4] to-[#E5F1E9] border-[#C3DEC9]'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#8C7E74]">目前結算狀態</span>
                {summary.unsettledCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3D3733] text-white font-medium">
                    {summary.unsettledCount} 筆未結清
                  </span>
                )}
              </div>

              {summary.netDebtor === 'none' ? (
                <div className="pt-1">
                  <h2 className="text-2xl font-black text-[#2E6B47] flex items-center gap-1.5">
                    目前雙方已結清 💖
                  </h2>
                  <p className="text-xs text-[#6B7E70] pt-0.5">無任何待返還款項，感情甜蜜蜜！</p>
                </div>
              ) : (
                <div className="pt-1">
                  <div className="text-xs font-bold text-[#6E6359]">
                    {summary.netDebtor === '廖' ? '廖尹丞 應返還給 周沛緹' : '周沛緹 應返還給 廖尹丞'}
                  </div>
                  <div className="text-3xl font-black tracking-tight text-[#D34E36] flex items-baseline gap-1 pt-0.5">
                    <span className="text-base font-bold text-[#8C7E74]">NT$</span>
                    {(Number(summary?.netAmount) || 0).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* 一鍵結清按鈕 */}
            {(summary?.unsettledCount || 0) > 0 && (
              <button
                id="btn-settle-all-split"
                onClick={() => setShowSettleModal(true)}
                className="px-3 py-2 rounded-xl bg-[#2E6B47] hover:bg-[#245738] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all transform active:scale-95 shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                一鍵結清返還
              </button>
            )}
          </div>

          {/* 雙方累計代墊細目 */}
          <div className="mt-4 pt-3 border-t border-black/5 grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-white/70 border border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2B825B]" />
                <span className="text-[#6E6359]">周 應返還 廖</span>
              </div>
              <span className="font-bold text-[#3D3733]">NT$ {(Number(summary?.zhouOwesLiao) || 0).toLocaleString()}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/70 border border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D34E36]" />
                <span className="text-[#6E6359]">廖 應返還 周</span>
              </div>
              <span className="font-bold text-[#3D3733]">NT$ {(Number(summary?.liaoOwesZhou) || 0).toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        {/* 快速新增代墊卡片 */}
        <div className="bg-white rounded-2xl border border-[#EBE5DE] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#3D3733]">📝 記一筆代墊</span>
              <span className="text-[11px] text-[#8C7E74]">個人先行代付・自動分帳</span>
            </div>
            {!isAddFormOpen && (
              <button
                id="btn-open-add-form"
                onClick={() => setIsAddFormOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#E8998D] hover:bg-[#D78478] text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                新增代墊
              </button>
            )}
          </div>

          <AnimatePresence>
            {isAddFormOpen && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddSplit}
                className="space-y-3.5 pt-2"
              >
                {/* 選擇代墊人 */}
                <div>
                  <label className="block text-xs font-bold text-[#6E6359] mb-1.5">
                    誰先代墊出錢？
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayer('廖')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        payer === '廖'
                          ? 'bg-[#EBF5EF] border-[#2B825B] text-[#2B825B] shadow-xs'
                          : 'bg-[#F9F7F4] border-[#E8E1D7] text-[#8C7E74] hover:bg-white'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      廖尹丞 先墊
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayer('周')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        payer === '周'
                          ? 'bg-[#FDF2F0] border-[#E8998D] text-[#D34E36] shadow-xs'
                          : 'bg-[#F9F7F4] border-[#E8E1D7] text-[#8C7E74] hover:bg-white'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      周沛緹 先墊
                    </button>
                  </div>
                </div>

                {/* 品項與金額 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-[#6E6359] mb-1">
                      代墊品項名稱 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={itemName}
                      onChange={e => setItemName(e.target.value)}
                      placeholder="例：高鐵車票、火鍋晚餐、加油"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#F9F7F4] border border-[#E0D7CD] focus:outline-none focus:ring-2 focus:ring-[#E8998D] text-[#3D3733]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#6E6359] mb-1">
                      代墊總金額 (NT$) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={totalAmount}
                      onChange={e => setTotalAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#F9F7F4] border border-[#E0D7CD] focus:outline-none focus:ring-2 focus:ring-[#E8998D] text-[#3D3733] font-bold"
                      required
                    />
                  </div>
                </div>

                {/* 快速金額增加鈕 */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[50, 100, 200, 500, 1000, 2000].map(addAmt => (
                    <button
                      key={addAmt}
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(totalAmount) || 0;
                        setTotalAmount(String(cur + addAmt));
                      }}
                      className="px-2 py-0.5 rounded-lg bg-[#EFE9E2] text-[#6E6359] hover:bg-[#E2D8CE] text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      +{addAmt}
                    </button>
                  ))}
                </div>

                {/* 分帳模式 */}
                <div>
                  <label className="block text-xs font-bold text-[#6E6359] mb-1.5">
                    分帳模式（對方該返還多少？）
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'AA平分', label: '👫 AA 平分 (50%)', desc: '各半平攤' },
                      { id: '全額代付', label: '🎁 全額代買 (100%)', desc: '幫對方買' },
                      { id: '自訂金額', label: '✏️ 自訂金額', desc: '自訂應還' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setSplitMode(mode.id as any)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          splitMode === mode.id
                            ? 'bg-[#FFF7F4] border-[#E8998D] text-[#3D3733] shadow-2xs'
                            : 'bg-[#F9F7F4] border-[#E8E1D7] text-[#8C7E74] hover:bg-white'
                        }`}
                      >
                        <div className="text-xs font-bold">{mode.label}</div>
                        <div className="text-[10px] text-[#A09388]">{mode.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 自訂金額輸入 */}
                {splitMode === '自訂金額' && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-[#FFF9F5] border border-[#F2DEC9]"
                  >
                    <label className="block text-xs font-bold text-[#8A5A36] mb-1">
                      {payer === '廖' ? '周沛緹' : '廖尹丞'} 應返還金額 (NT$)
                    </label>
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={customOweAmount}
                      onChange={e => setCustomOweAmount(e.target.value)}
                      placeholder={`預設各半：${Math.round((parseFloat(totalAmount) || 0) / 2)}`}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-white border border-[#E0D7CD] focus:outline-none focus:ring-2 focus:ring-[#E8998D]"
                    />
                  </motion.div>
                )}

                {/* 備註 */}
                <div>
                  <label className="block text-xs font-bold text-[#6E6359] mb-1">
                    備註細節（選填）
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="例：含兩杯大冰拿與一份鬆餅"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#F9F7F4] border border-[#E0D7CD] text-[#3D3733]"
                  />
                </div>

                {/* 即時試算預覽框 */}
                {previewAmount > 0 && (
                  <div className="p-3 rounded-xl bg-[#EBF5EF] border border-[#C8E4D1] text-xs flex items-center justify-between text-[#245738]">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#2E6B47]" />
                      <span>
                        記錄後：<strong>{payer === '廖' ? '周沛緹' : '廖尹丞'}</strong> 需返還{' '}
                        <strong>{payer === '廖' ? '廖尹丞' : '周沛緹'}</strong>
                      </span>
                    </div>
                    <span className="font-bold text-sm text-[#2E6B47]">
                      NT$ {(Number(previewDebtorOwe) || 0).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* 按鈕組 */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddFormOpen(false)}
                    className="px-3 py-2 rounded-xl border border-[#E0D7CD] text-xs font-semibold text-[#6E6359] hover:bg-[#F3EDE6] transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-[#E8998D] hover:bg-[#D78478] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    儲存代墊記錄
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* 明細檢視切換 Tab */}
        <div className="flex items-center justify-between gap-2 border-b border-[#EBE5DE] pb-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('unsettled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'unsettled'
                  ? 'bg-[#3D3733] text-white shadow-xs'
                  : 'bg-white text-[#6E6359] border border-[#E0D7CD] hover:bg-[#F3EDE6]'
              }`}
            >
              ⏳ 待結清款項 ({items.filter(i => i.status === '未結清').length})
            </button>
            <button
              onClick={() => setActiveTab('settled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'settled'
                  ? 'bg-[#3D3733] text-white shadow-xs'
                  : 'bg-white text-[#6E6359] border border-[#E0D7CD] hover:bg-[#F3EDE6]'
              }`}
            >
              📜 已結清歷史 ({items.filter(i => i.status === '已結清').length})
            </button>
          </div>

          {/* 出錢人過濾 */}
          <div className="flex items-center gap-1 text-xs">
            {(['ALL', '廖', '周'] as const).map(p => (
              <button
                key={p}
                onClick={() => setFilterPayer(p)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  filterPayer === p
                    ? 'bg-[#E8998D] text-white'
                    : 'bg-[#EFE9E2] text-[#6E6359] hover:bg-[#E2D8CE]'
                }`}
              >
                {p === 'ALL' ? '全部' : `${p}先墊`}
              </button>
            ))}
          </div>
        </div>

        {/* 明細列表清單 */}
        <div className="space-y-2.5">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-[#E0D7CD] p-6">
              <div className="w-12 h-12 rounded-full bg-[#FAF5F0] flex items-center justify-center mx-auto text-2xl mb-2">
                {activeTab === 'unsettled' ? '🎉' : '📂'}
              </div>
              <h3 className="text-sm font-bold text-[#3D3733]">
                {activeTab === 'unsettled' ? '目前沒有任何待結清的代墊款項！' : '尚無已結清的歷史紀錄'}
              </h3>
              <p className="text-xs text-[#8C7E74] mt-1">
                {activeTab === 'unsettled'
                  ? '有需要記帳時，點擊上方「新增代墊」即可快速分帳。'
                  : '結清款項後，歷史紀錄會完整存放在這裡。'}
              </p>
            </div>
          ) : (
            filteredItems.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-2xl border bg-white shadow-2xs transition-all ${
                  item.status === '未結清' ? 'border-[#EBE5DE]' : 'border-[#EBE5DE] opacity-75'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          item.payer === '廖'
                            ? 'bg-[#EBF5EF] text-[#2B825B]'
                            : 'bg-[#FDF2F0] text-[#D34E36]'
                        }`}
                      >
                        {item.payer === '廖' ? '廖尹丞 先墊' : '周沛緹 先墊'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F2EDE7] text-[#8C7E74]">
                        {item.splitMode}
                      </span>
                      {item.status === '已結清' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EBF5EF] text-[#2B825B] font-bold">
                          ✓ 已結清
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-[#3D3733] pt-0.5">{item.itemName}</h4>

                    {item.note && (
                      <p className="text-[11px] text-[#8C7E74] italic">備註：{item.note}</p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-[#A09388] pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {item.time}
                      </span>
                      {item.settledTime && (
                        <span className="text-[#2B825B]">結清於：{item.settledTime}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right space-y-1 shrink-0">
                    <div className="text-xs text-[#8C7E74]">
                      總額 NT$ {(Number(item.totalAmount) || 0).toLocaleString()}
                    </div>
                    <div className="text-sm font-black text-[#D34E36]">
                      {item.debtor || '對方'} 需返還 ${(Number(item.debtorAmount) || 0).toLocaleString()}
                    </div>
                    <button
                      onClick={() => confirmDeleteItem(item)}
                      className="p-1 text-[#A09388] hover:text-[#D34E36] transition-colors rounded cursor-pointer"
                      title="刪除這筆代墊"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>

      {/* 刪除確認視窗 */}
      <AnimatePresence>
        {deleteConfirmItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full p-5 border border-[#EBE5DE] shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#3D3733] flex items-center gap-1.5">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                  確認刪除代墊明細？
                </h3>
                <button
                  onClick={() => setDeleteConfirmItem(null)}
                  className="p-1 rounded-lg text-[#8C7E74] hover:bg-[#F3EDE6] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 text-xs text-[#6E6359] space-y-1">
                <div>
                  <strong>品項名稱：</strong>
                  <span className="font-bold text-[#3D3733] ml-1">{deleteConfirmItem.itemName || '代墊款項'}</span>
                </div>
                <div>
                  <strong>消費金額：</strong>
                  <span className="font-bold text-rose-700 ml-1">NT$ {(Number(deleteConfirmItem.totalAmount) || 0).toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-[#8C7E74] pt-1">
                  刪除後將會重新計算雙方的結算帳款，此動作無法還原。
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setDeleteConfirmItem(null)}
                  className="px-3.5 py-2 rounded-xl border border-[#E0D7CD] text-xs font-semibold text-[#6E6359] hover:bg-[#F3EDE6] cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={() => executeDeleteItem(deleteConfirmItem.id)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  確定刪除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 結清確認視窗 */}
      <AnimatePresence>
        {showSettleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full p-5 border border-[#EBE5DE] shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#3D3733] flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5 text-[#2E6B47]" />
                  確認一鍵結清返還？
                </h3>
                <button
                  onClick={() => setShowSettleModal(false)}
                  className="p-1 rounded-lg text-[#8C7E74] hover:bg-[#F3EDE6]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] text-xs text-[#6E6359] space-y-1.5">
                <div>
                  <strong>目前結算總額：</strong>
                  <span className="font-bold text-[#D34E36] text-sm ml-1">
                    {summary.summaryText}
                  </span>
                </div>
                <p className="text-[11px] text-[#8C7E74]">
                  按下確認後，系統會將所有 {summary.unsettledCount} 筆待結清款項標記為「已結清」，並記錄時間戳記。
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowSettleModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#E0D7CD] text-xs font-semibold text-[#6E6359] hover:bg-[#F3EDE6]"
                >
                  再想想
                </button>
                <button
                  onClick={handleSettleAll}
                  className="px-4 py-2 rounded-xl bg-[#2E6B47] hover:bg-[#245738] text-white text-xs font-bold shadow-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  確認已返還並結清
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
