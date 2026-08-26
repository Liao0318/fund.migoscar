import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  Sparkles, 
  Tag, 
  User, 
  ArrowRightLeft,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SplitRecordItem } from '../../types';

interface SplitAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSplit?: (data: {
    payer: '廖' | '周';
    itemName: string;
    totalAmount: number;
    splitMode: 'AA平分' | '全額代付' | '自訂金額';
    customOweAmount?: number;
    note?: string;
  }) => void;
  onSubmit?: (data: {
    payer: '廖' | '周';
    itemName: string;
    totalAmount: number;
    splitMode: 'AA平分' | '全額代付' | '自訂金額';
    customOweAmount?: number;
    note?: string;
  }) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SplitAddModal: React.FC<SplitAddModalProps> = ({
  isOpen,
  onClose,
  onAddSplit,
  onSubmit,
  showToast,
}) => {
  const [payer, setPayer] = useState<'廖' | '周'>('廖');
  const [itemName, setItemName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [splitMode, setSplitMode] = useState<'AA平分' | '全額代付' | '自訂金額'>('AA平分');
  const [customOweAmount, setCustomOweAmount] = useState('');
  const [note, setNote] = useState('');

  const quickTags = ['晚餐火鍋', '午餐便當', '飲料咖啡', '全聯採買', '好市多', '叫外送', '生活用品', '超商', '計程車資', '電影約會'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(totalAmount);
    if (isNaN(num) || num <= 0) {
      if (showToast) showToast('請輸入有效消費總金額', 'error');
      return;
    }
    if (!itemName.trim()) {
      if (showToast) showToast('請輸入品項名稱', 'error');
      return;
    }

    let customNum: number | undefined = undefined;
    if (splitMode === '自訂金額') {
      const parsedCustom = parseFloat(customOweAmount);
      if (isNaN(parsedCustom) || parsedCustom < 0) {
        if (showToast) showToast('請輸入有效的自訂應還金額', 'error');
        return;
      }
      customNum = parsedCustom;
    }

    const payload = {
      payer,
      itemName: itemName.trim(),
      totalAmount: num,
      splitMode,
      customOweAmount: customNum,
      note: note.trim()
    };

    if (onAddSplit) {
      onAddSplit(payload);
    } else if (onSubmit) {
      onSubmit(payload);
    }

    onClose();
    setItemName('');
    setTotalAmount('');
    setCustomOweAmount('');
    setNote('');
  };

  const otherPerson = payer === '廖' ? '周周' : '廖廖';
  const myPerson = payer === '廖' ? '廖廖' : '周周';
  const numAmt = parseFloat(totalAmount) || 0;
  let previewOwe = Math.round(numAmt / 2);
  if (splitMode === '全額代付') previewOwe = numAmt;
  else if (splitMode === '自訂金額') previewOwe = parseFloat(customOweAmount) || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs font-sans">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-[#FAF9F5] rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col border border-[#E8E4D9] shadow-2xl overflow-hidden"
          >
            {/* Header (固定標頭) */}
            <div className="flex items-center justify-between border-b border-[#EDE8DC] p-5 sm:px-7 pb-4 shrink-0 bg-[#FAF9F5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-rose-600 text-white flex items-center justify-center text-sm shadow-xs font-bold">
                  💳
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#3E3A36]">新增代墊借還</h3>
                  <p className="text-[11px] text-[#8C8475]">記錄誰先出錢、如何分攤與待還金額</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-[#EFEAE0] text-[#8C8475] hover:text-[#3E3A36] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* 可滾動內容區 */}
              <div className="p-5 sm:px-7 flex-1 overflow-y-auto space-y-4">
                {/* 1. 出資人選擇 */}
                <div>
                  <label className="block text-xs font-bold text-[#6E6659] mb-1.5">
                    先出資代墊人
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPayer('廖')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        payer === '廖'
                          ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                          : 'bg-white text-[#6E6659] border-[#DDD8CD] hover:bg-[#F5F2EB]'
                      }`}
                    >
                      <span className="text-base">👦</span>
                      <span>廖廖 先出錢</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayer('周')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        payer === '周'
                          ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                          : 'bg-white text-[#6E6659] border-[#DDD8CD] hover:bg-[#F5F2EB]'
                      }`}
                    >
                      <span className="text-base">👧</span>
                      <span>周周 先出錢</span>
                    </button>
                  </div>
                </div>

                {/* 2. 品項名稱 & 快捷標籤 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#6E6659]">
                      消費品項名稱 *
                    </label>
                    <span className="text-[10px] text-[#8C8475]">點選常用標籤快速填入</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="例：無印良品文具、晚餐火鍋、叫外送"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DDD8CD] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-rose-400 font-medium shadow-2xs"
                    />
                    {itemName && (
                      <button
                        type="button"
                        onClick={() => setItemName('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-[#EFECE3] hover:bg-[#E3DFC2] text-[#7A7469] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        清除
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap pt-2">
                    <span className="text-[10px] text-[#A09A8F] font-bold">常用：</span>
                    {quickTags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setItemName(t)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer active:scale-95 ${
                          itemName === t
                            ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                            : 'bg-white hover:bg-rose-50 text-[#7A7366] hover:text-rose-700 border-[#E0DCD3]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. 消費總金額 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#6E6659]">
                      消費總金額 (NT$) *
                    </label>
                    <span className="text-[10px] text-[#8C8475]">支援手機數字鍵盤</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8C8475]">
                      $
                    </span>
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      required
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-12 py-2.5 bg-white border border-[#DDD8CD] rounded-xl text-base font-black text-[#3E3A36] focus:outline-none focus:border-rose-400 shadow-2xs font-mono"
                    />
                    {totalAmount && (
                      <button
                        type="button"
                        onClick={() => setTotalAmount('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-[#EFECE3] hover:bg-[#E3DFC2] text-[#7A7469] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        清除
                      </button>
                    )}
                  </div>

                  {/* 快速加額標籤 */}
                  <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                    <span className="text-[10px] text-[#A09A8F] font-bold">快捷金額：</span>
                    {[50, 100, 200, 500, 1000, 2000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          const curr = parseFloat(totalAmount) || 0;
                          setTotalAmount((curr + amt).toString());
                        }}
                        className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-rose-100 text-[#6E6659] hover:text-rose-700 text-[10px] font-bold border border-stone-200 transition-colors cursor-pointer active:scale-95"
                      >
                        +{amt}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTotalAmount('')}
                      className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 text-[10px] border border-stone-200 transition-colors cursor-pointer ml-auto"
                    >
                      歸零
                    </button>
                  </div>
                </div>

                {/* 4. 分攤模式 */}
                <div>
                  <label className="block text-xs font-bold text-[#6E6659] mb-1.5">
                    分攤方式
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['AA平分', '全額代付', '自訂金額'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSplitMode(m)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                          splitMode === m
                            ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                            : 'bg-white text-[#6E6659] border-[#DDD8CD] hover:bg-[#F5F2EB]'
                        }`}
                      >
                        {m === 'AA平分' ? '👥 一人一半' : m === '全額代付' ? '🎁 全額代墊' : '⚖️ 自訂金額'}
                      </button>
                    ))}
                  </div>

                  {splitMode === '自訂金額' && (
                    <div className="mt-2.5 p-3 rounded-xl bg-white border border-[#DDD8CD] space-y-1">
                      <label className="block text-[11px] font-bold text-[#6E6659]">
                        {otherPerson} 應分擔 / 需返還金額 (NT$)
                      </label>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={customOweAmount}
                        onChange={(e) => setCustomOweAmount(e.target.value)}
                        placeholder="輸入對方應返還之金額"
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD8CD] rounded-lg text-xs font-bold text-[#3E3A36] focus:outline-none focus:border-rose-400"
                      />
                    </div>
                  )}
                </div>

                {/* 5. 備註 */}
                <div>
                  <label className="block text-xs font-bold text-[#6E6659] mb-1">
                    備註說明 (選填)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="備註發票、消費地點或說明..."
                    className="w-full px-3 py-2 bg-white border border-[#DDD8CD] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-rose-400 shadow-2xs"
                  />
                </div>

                {/* 6. 即時預覽卡片 */}
                <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200/80 text-xs flex items-center justify-between text-rose-950">
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-rose-600" />
                      <span>即時分攤試算：</span>
                    </div>
                    <div className="font-extrabold text-[#3E3A36]">
                      {otherPerson} 應返還給 {myPerson}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black text-rose-600">
                      NT$ {(Number(previewOwe) || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#8C8475]">
                      {splitMode}
                    </div>
                  </div>
                </div>
              </div>

              {/* 固定底部操作按鈕 (Sticky Footer) */}
              <div className="p-4 sm:px-7 border-t border-[#EDE8DC] bg-[#FAF9F5] shrink-0 flex gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-[#DDD8CD] text-[#6E6659] text-xs font-bold hover:bg-[#F2EEE6] transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>記錄此筆代墊</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
