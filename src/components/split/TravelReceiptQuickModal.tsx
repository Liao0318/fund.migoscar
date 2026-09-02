import React, { useState } from 'react';
import { 
  ShoppingBag, 
  X, 
  Plus, 
  Trash2, 
  Check, 
  User, 
  MapPin, 
  CreditCard, 
  ArrowRightLeft,
  Calendar,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TravelExpenseItem, TravelTrip } from '../../types';

interface TravelReceiptQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTrip: TravelTrip;
  tripMembers: string[];
  onAddExpenses: (expenses: TravelExpenseItem[]) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface ReceiptItemRow {
  id: string;
  itemName: string;
  category: TravelExpenseItem['category'];
  unitPrice: string;
  quantity: string;
  discount: string;
  payer: string;
  splitMode: TravelExpenseItem['splitMode'];
  splitTarget: string;
  participants: string[];
  note: string;
}

export const TravelReceiptQuickModal: React.FC<TravelReceiptQuickModalProps> = ({
  isOpen,
  onClose,
  activeTrip,
  tripMembers,
  onAddExpenses,
  showToast,
}) => {
  const [storeName, setStoreName] = useState('Lotte Mart 首爾站店');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState(activeTrip.currency || 'KRW');
  const [exchangeRate, setExchangeRate] = useState(String(activeTrip.exchangeRate || 0.024));
  const [defaultPayer, setDefaultPayer] = useState(tripMembers[0] || '廖');
  const [paymentMethod, setPaymentMethod] = useState('信用卡');

  const [items, setItems] = useState<ReceiptItemRow[]>([
    {
      id: 'row-1',
      itemName: '',
      category: '購物伴手禮',
      unitPrice: '',
      quantity: '1',
      discount: '',
      payer: defaultPayer,
      splitMode: '全體AA',
      splitTarget: '',
      participants: [...tripMembers],
      note: ''
    }
  ]);

  // 新增一列
  const handleAddRow = () => {
    setItems([
      ...items,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        itemName: '',
        category: '購物伴手禮',
        unitPrice: '',
        quantity: '1',
        discount: '',
        payer: defaultPayer,
        splitMode: '全體AA',
        splitTarget: '',
        participants: [...tripMembers],
        note: ''
      }
    ]);
  };

  // 移除列
  const handleRemoveRow = (id: string) => {
    if (items.length <= 1) {
      showToast('至少需保留一個品項列', 'info');
      return;
    }
    setItems(items.filter(it => it.id !== id));
  };

  // 更新列欄位
  const handleUpdateRow = (id: string, field: keyof ReceiptItemRow, value: any) => {
    setItems(items.map(it => {
      if (it.id !== id) return it;
      const updated = { ...it, [field]: value };
      if (field === 'splitMode' && value === '個人自付' && !updated.splitTarget) {
        updated.splitTarget = tripMembers[0] || '廖';
      }
      return updated;
    }));
  };

  // 計算小計
  const getItemSubtotal = (it: ReceiptItemRow) => {
    const price = parseFloat(it.unitPrice) || 0;
    const qty = parseInt(it.quantity, 10) || 1;
    const disc = parseFloat(it.discount) || 0;
    return Math.max(0, price * qty - disc);
  };

  const receiptTotalOriginal = items.reduce((sum, it) => sum + getItemSubtotal(it), 0);
  const rate = parseFloat(exchangeRate) || 1;
  const receiptTotalTWD = Math.round(receiptTotalOriginal * rate);

  // 儲存收據所有品項
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(it => it.itemName.trim().length > 0 && getItemSubtotal(it) > 0);
    if (validItems.length === 0) {
      showToast('請至少填寫一個品項名稱與金額', 'error');
      return;
    }

    const createdExpenses: TravelExpenseItem[] = validItems.map((it, idx) => {
      const origAmt = getItemSubtotal(it);
      const totalTWD = Math.round(origAmt * rate);

      const memberSplits: Record<string, number> = {};
      tripMembers.forEach(m => { memberSplits[m] = 0; });

      let debtor = 'none';
      let debtorAmtTWD = 0;

      const payer = it.payer || defaultPayer;

      if (it.splitMode === '個人自付' && it.splitTarget) {
        memberSplits[it.splitTarget] = totalTWD;
        if (payer !== it.splitTarget) {
          debtor = it.splitTarget;
          debtorAmtTWD = totalTWD;
        }
      } else if (it.splitMode === '全體AA' || it.splitMode === 'AA平分') {
        const share = Math.round(totalTWD / (tripMembers.length || 1));
        tripMembers.forEach(m => { memberSplits[m] = share; });
        if (payer !== '共同基金') {
          const nonPayers = tripMembers.filter(m => m !== payer);
          if (nonPayers.length === 1) {
            debtor = nonPayers[0];
            debtorAmtTWD = memberSplits[debtor] || 0;
          } else {
            debtor = '多位成員';
            debtorAmtTWD = totalTWD - (memberSplits[payer] || share);
          }
        }
      } else if (it.splitMode === '參與者AA') {
        const parts = it.participants.length > 0 ? it.participants : tripMembers;
        if (parts.length === 1) {
          const singleTarget = parts[0];
          memberSplits[singleTarget] = totalTWD;
          if (payer !== '共同基金' && payer !== singleTarget) {
            debtor = singleTarget;
            debtorAmtTWD = totalTWD;
          }
        } else {
          const share = Math.round(totalTWD / (parts.length || 1));
          parts.forEach(p => { memberSplits[p] = share; });
          if (payer !== '共同基金') {
            debtor = '部分成員';
            debtorAmtTWD = totalTWD - (memberSplits[payer] || 0);
          }
        }
      }

      return {
        id: `exp-receipt-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        tripId: activeTrip.id,
        date: receiptDate,
        category: it.category,
        itemName: it.itemName.trim(),
        payer: payer,
        originalCurrency: currency,
        originalAmount: origAmt,
        exchangeRate: rate,
        totalAmountTWD: totalTWD,
        splitMode: it.splitMode,
        splitTarget: it.splitTarget,
        unitPrice: parseFloat(it.unitPrice) || undefined,
        quantity: parseInt(it.quantity, 10) || 1,
        discount: parseFloat(it.discount) || undefined,
        paymentMethod: paymentMethod,
        participants: it.participants,
        memberSplits,
        debtor,
        debtorAmountTWD: debtorAmtTWD,
        location: storeName.trim(),
        note: it.note.trim(),
        syncedToSplit: false,
        createdAt: new Date().toISOString().split('T')[0]
      };
    });

    onAddExpenses(createdExpenses);
    onClose();
    showToast(`🛒 已成功記錄「${storeName}」整張收據共 ${createdExpenses.length} 個品項！`, 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-[#E8E4D9] max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-[#F0ECE1] bg-gradient-to-r from-rose-50/60 via-white to-amber-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center shadow-2xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-[#3E3A36]">
                單店/收據 多品項快速連記
              </h3>
              <p className="text-[11px] text-[#8C8475]">
                設定一次店家與幣別，迅速逐列輸入買的所有品項與各自分攤對象
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#A09A8F] hover:text-[#3E3A36] hover:bg-[#F5F2EB] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden text-xs">
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
            {/* 店家與全單設定 Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E8E4D9]">
              <div className="space-y-1">
                <label className="font-bold text-[#5C564E] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  <span>購物店家/地點</span>
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="例：Lotte Mart 首爾站店"
                  className="w-full p-2 bg-white border border-[#DDD8CC] rounded-xl font-bold text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#5C564E] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-rose-600" />
                  <span>採買日期</span>
                </label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="w-full p-2 bg-white border border-[#DDD8CC] rounded-xl font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#5C564E] flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  <span>本單出資代墊人</span>
                </label>
                <select
                  value={defaultPayer}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDefaultPayer(val);
                    setItems(items.map(it => ({ ...it, payer: val })));
                  }}
                  className="w-full p-2 bg-white border border-[#DDD8CC] rounded-xl font-bold text-xs"
                >
                  {tripMembers.map(m => (
                    <option key={m} value={m}>💳 {m} 先付</option>
                  ))}
                  <option value="共同基金">🏦 共同公費</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#5C564E] flex items-center gap-1">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
                  <span>幣別 & 匯率</span>
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-20 p-2 bg-white border border-[#DDD8CC] rounded-xl font-bold text-xs"
                  >
                    <option value="KRW">KRW ₩</option>
                    <option value="JPY">JPY ¥</option>
                    <option value="TWD">TWD NT$</option>
                    <option value="USD">USD $</option>
                    <option value="EUR">EUR €</option>
                  </select>
                  <input
                    type="number"
                    step="0.0001"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    placeholder="匯率"
                    className="flex-1 p-2 bg-white border border-[#DDD8CC] rounded-xl font-bold font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 品項列表 Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-[#3E3A36] text-xs flex items-center gap-1.5">
                  <span>收據明細品項 ({items.length} 項)</span>
                  <span className="text-[10px] text-[#8C8475]">（支援填寫單價×數量，或直接填小計）</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-3 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增一行</span>
                </button>
              </div>

              <div className="border border-[#E8E4D9] rounded-2xl overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                  <thead className="bg-[#F5F2EB] text-[#5C564E] font-bold border-b border-[#E2DDD2]">
                    <tr>
                      <th className="p-2.5 min-w-[160px]">品項名稱 *</th>
                      <th className="p-2.5 w-24">單價 ({currency})</th>
                      <th className="p-2.5 w-16">數量</th>
                      <th className="p-2.5 w-24 text-right">小計 ({currency})</th>
                      <th className="p-2.5 w-24 text-right">折合台幣</th>
                      <th className="p-2.5 min-w-[160px]">分攤方式 / 對象</th>
                      <th className="p-2.5 w-28">備註</th>
                      <th className="p-2.5 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2EEE6] bg-white">
                    {items.map((it, idx) => {
                      const subtotal = getItemSubtotal(it);
                      const twd = Math.round(subtotal * rate);

                      return (
                        <tr key={it.id} className="hover:bg-amber-50/30">
                          <td className="p-2">
                            <input
                              type="text"
                              value={it.itemName}
                              onChange={(e) => handleUpdateRow(it.id, 'itemName', e.target.value)}
                              placeholder={`品項 ${idx + 1} (例：洋芋片、棉被)`}
                              className="w-full p-1.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-lg font-bold text-[#3E3A36] focus:bg-white focus:border-rose-500"
                              required
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={it.unitPrice}
                              onChange={(e) => handleUpdateRow(it.id, 'unitPrice', e.target.value)}
                              placeholder="0"
                              className="w-full p-1.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-lg font-mono font-bold text-[#3E3A36] text-right focus:bg-white focus:border-rose-500"
                              required
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={it.quantity}
                              onChange={(e) => handleUpdateRow(it.id, 'quantity', e.target.value)}
                              placeholder="1"
                              className="w-full p-1.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-lg font-mono font-bold text-[#3E3A36] text-center focus:bg-white focus:border-rose-500"
                            />
                          </td>
                          <td className="p-2 text-right font-black font-mono text-[#3E3A36]">
                            {subtotal.toLocaleString()}
                          </td>
                          <td className="p-2 text-right font-black font-mono text-rose-700">
                            NT$ {twd.toLocaleString()}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <select
                                value={it.splitMode}
                                onChange={(e) => handleUpdateRow(it.id, 'splitMode', e.target.value)}
                                className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#DDD8CC] text-[11px] font-bold"
                              >
                                <option value="全體AA">全體均分</option>
                                <option value="個人自付">個人自付</option>
                                <option value="參與者AA">部分均分</option>
                              </select>

                              {it.splitMode === '個人自付' && (
                                <select
                                  value={it.splitTarget || tripMembers[0]}
                                  onChange={(e) => handleUpdateRow(it.id, 'splitTarget', e.target.value)}
                                  className="p-1.5 rounded-lg bg-amber-50 border border-amber-300 text-[11px] font-bold text-amber-900"
                                >
                                  {tripMembers.map(m => (
                                    <option key={m} value={m}>{m} 自付</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={it.note}
                              onChange={(e) => handleUpdateRow(it.id, 'note', e.target.value)}
                              placeholder="備註說明"
                              className="w-full p-1.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-lg text-[10px]"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(it.id)}
                              className="text-[#A09A8F] hover:text-rose-600 cursor-pointer p-1"
                              title="刪除此項"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 收據總計 Bar */}
            <div className="p-4 bg-gradient-to-r from-rose-500 to-rose-600 rounded-2xl text-white flex items-center justify-between shadow-md">
              <div>
                <div className="text-[11px] opacity-80">收據全額統計 ({storeName})</div>
                <div className="text-lg font-black font-mono">
                  {currency} {receiptTotalOriginal.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] opacity-80">折合台幣總金額</div>
                <div className="text-xl font-black font-mono">
                  NT$ {receiptTotalTWD.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:px-6 border-t border-[#F0ECE1] bg-white shrink-0 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#DDD8CC] text-[#7A7366] font-bold hover:bg-[#FAF8F5] cursor-pointer"
            >
              取消
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddRow}
                className="px-4 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#DDD8CC] text-[#5C564E] font-bold cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>繼續新增品項</span>
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>儲存整張收據 ({items.filter(it => it.itemName.trim()).length} 項)</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
