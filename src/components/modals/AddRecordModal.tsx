import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Save, Store, MapPin } from 'lucide-react';
import { ShoppingItem } from '../../types';
import { CURRENCIES, DEFAULT_RATES_MAP } from '../../utils/formatters';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  addModalType: 'record' | 'shopping';
  setAddModalType: (type: 'record' | 'shopping') => void;
  formData: {
    item: string;
    amount: string;
    currency: string;
    customRate: string;
    payer: string;
    type: '支出-日常代墊' | '收入-固定公積金';
    date: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    item: string;
    amount: string;
    currency: string;
    customRate: string;
    payer: string;
    type: '支出-日常代墊' | '收入-固定公積金';
    date: string;
  }>>;
  onSubmitRecord: (e: React.FormEvent) => void;
  exchangeRates: Record<string, number>;
  shoppingForm: ShoppingItem;
  setShoppingForm: React.Dispatch<React.SetStateAction<ShoppingItem>>;
  onSubmitShopping: (e: React.FormEvent) => void;
  shoppingStores: string[];
  onOpenManageStores: () => void;
}

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  addModalType,
  setAddModalType,
  formData,
  setFormData,
  onSubmitRecord,
  exchangeRates = {},
  shoppingForm,
  setShoppingForm,
  onSubmitShopping,
  shoppingStores = [],
  onOpenManageStores
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#3E3A36]/40 backdrop-blur-sm"
          />

          {/* Dialog Box */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-white rounded-3xl w-full max-w-lg max-h-[88vh] shadow-2xl relative z-60 border border-[#EBE8E0] flex flex-col font-sans text-[#3E3A36] overflow-hidden"
          >
            {/* Modal 標頭 (Fixed top) */}
            <div className="px-5 py-4 sm:px-6 bg-[#FAF9F5] border-b border-[#EBE7DC] shrink-0 relative pr-12">
              <button 
                onClick={onClose}
                className="absolute right-4 top-4 p-1.5 rounded-xl text-[#A59F94] hover:bg-[#EEEDE9] hover:text-[#3E3A36] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-base font-bold text-[#4A4641] flex items-center gap-2">
                <span className="p-1.5 bg-[#EEEDE9] rounded-xl text-base">✨</span> 快速新增項目
              </h2>
              <p className="text-xs text-[#9E9A92] mt-0.5 leading-relaxed font-light">
                可選擇新增「家庭記帳代墊」或「購物記事」，自動同步至連線系統。
              </p>

              {/* 類型切換頁籤 */}
              <div className="flex p-1 bg-[#F0ECE1] rounded-xl border border-[#E0DCD0] mt-3">
                <button
                  type="button"
                  onClick={() => setAddModalType('record')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    addModalType === 'record'
                      ? 'bg-white text-[#3E3A36] shadow-xs font-bold'
                      : 'text-[#7A7469] hover:text-[#3E3A36]'
                  }`}
                >
                  <span>📝</span>
                  <span>新增代墊 / 撥款</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddModalType('shopping')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    addModalType === 'shopping'
                      ? 'bg-white text-[#3E3A36] shadow-xs font-bold'
                      : 'text-[#7A7469] hover:text-[#3E3A36]'
                  }`}
                >
                  <span>🛒</span>
                  <span>新增採購記事</span>
                </button>
              </div>
            </div>

            {addModalType === 'record' ? (
              <form 
                onSubmit={(e) => {
                  onSubmitRecord(e);
                  onClose();
                }} 
                className="flex flex-col flex-1 min-h-0"
              >
                {/* Modal 可上下滑動主內容區域 */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 font-sans">
                  {/* 項目名稱 & 快捷標籤 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="modal-item" className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider">
                        款項項目 <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-[#8C8475]">點選常用標籤快速填入</span>
                    </div>
                    <div className="relative">
                      <input 
                        id="modal-item"
                        type="text" 
                        required 
                        value={formData.item}
                        onChange={(e) => setFormData({...formData, item: e.target.value})}
                        placeholder="例如：好市多採購、瓦斯費、全聯買菜..." 
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DDD9CE] focus:border-[#8C8475] focus:bg-white focus:outline-none transition-all placeholder-[#C1BDAF] text-xs text-[#3E3A36] font-medium" 
                      />
                      {formData.item && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, item: '' })}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-[#EFECE3] hover:bg-[#E3DFC2] text-[#7A7469] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          清除
                        </button>
                      )}
                    </div>

                    {/* 快捷品項標籤 */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-[#A09A8F] font-bold">常用：</span>
                      {(formData.type === '收入-固定公積金' ? [
                        '每月固定公積金', '廖廖補貼款', '周周補貼款', '獎金公款', '其他退款/利息'
                      ] : [
                        '全聯採買', '好市多', '午餐', '晚餐', '叫外送', '生活用品', '超商', '水電瓦斯', '房租', '加油', '飲料水果'
                      ]).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setFormData({ ...formData, item: tag })}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer active:scale-95 ${
                            formData.item === tag
                              ? 'bg-[#4D4942] text-white border-[#4D4942] shadow-2xs'
                              : 'bg-white hover:bg-[#F3EFE6] text-[#6E6659] border-[#E0DCD3]'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 幣別選取與金額紀錄 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 下拉式幣別清單 */}
                    <div className="space-y-1.5">
                      <label htmlFor="modal-currency-select" className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider">
                        計價幣別
                      </label>
                      <select
                        id="modal-currency-select"
                        value={formData.currency || 'TWD'}
                        onChange={(e) => {
                          const code = e.target.value;
                          const rate = code === 'TWD' ? '1' : String(exchangeRates[code] || DEFAULT_RATES_MAP[code] || 1);
                          setFormData({ ...formData, currency: code, customRate: rate });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DDD9CE] focus:border-[#8C8475] focus:bg-white focus:outline-none transition-all text-xs text-[#3E3A36] cursor-pointer font-medium"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.code} - {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 金額輸入 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="modal-amount" className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider">
                          {formData.currency === 'TWD' ? '金額 (NT$)' : `外幣金額 (${formData.currency})`} <span className="text-rose-500">*</span>
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          id="modal-amount"
                          type="number"
                          required
                          min="0.01"
                          step="any"
                          inputMode="decimal"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          placeholder={formData.currency === 'TWD' ? '請輸入金額' : `輸入 ${formData.currency} 金額`}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DDD9CE] focus:border-[#8C8475] focus:bg-white focus:outline-none transition-all placeholder-[#C1BDAF] text-sm text-[#3E3A36] font-mono font-bold"
                        />
                        {formData.amount && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, amount: '' })}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-[#EFECE3] hover:bg-[#E3DFC2] text-[#7A7469] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            清除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 快捷金額加總按鈕 */}
                  <div className="flex items-center gap-1.5 flex-wrap bg-[#FAF9F5] p-2.5 rounded-xl border border-[#EDE8DE]">
                    <span className="text-[10px] text-[#8C8475] font-bold shrink-0">快捷加額：</span>
                    {[50, 100, 200, 500, 1000, 2000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          const curr = parseFloat(formData.amount) || 0;
                          setFormData({ ...formData, amount: String(curr + amt) });
                        }}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-emerald-50 text-[#5C564E] hover:text-emerald-700 text-[10px] font-bold border border-[#DDD8CD] transition-all cursor-pointer active:scale-95 shadow-2xs"
                      >
                        +{amt}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, amount: '' })}
                      className="px-2 py-1 rounded-lg bg-[#EFECE4] hover:bg-[#E2DDD3] text-[#7A7469] text-[10px] font-bold transition-all cursor-pointer ml-auto"
                    >
                      歸零
                    </button>
                  </div>

                  {/* 當選擇外幣時：自動計算雙向對換結果與即時匯率調整 */}
                  {formData.currency !== 'TWD' && (() => {
                    const activeCurrency = formData.currency;
                    const currObj = CURRENCIES.find((c) => c.code === activeCurrency);
                    const defaultLiveRate = exchangeRates[activeCurrency] || DEFAULT_RATES_MAP[activeCurrency] || 1;
                    const effectiveRate = parseFloat(formData.customRate) || defaultLiveRate;
                    const rawVal = parseFloat(formData.amount || '0');
                    const convertedTwd = Math.round(rawVal * effectiveRate);
                    const inverseRate = effectiveRate > 0 ? (1 / effectiveRate).toFixed(2) : '0';

                    return (
                      <div className="bg-[#FAF9F5] rounded-2xl p-3.5 border border-[#E5DFD1] space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-[#5C564E]">
                          <span className="flex items-center gap-1.5">
                            <span>{currObj?.flag}</span>
                            <span>{currObj?.name} ({activeCurrency}) 即時換算</span>
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            ⚡ 市場匯率: {defaultLiveRate}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                          <div>
                            <label className="block text-[11px] font-medium text-[#787267] mb-1">
                              換算匯率 (1 {activeCurrency} = X 台幣)
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="any"
                                value={formData.customRate !== '' ? formData.customRate : defaultLiveRate}
                                onChange={(e) => setFormData({ ...formData, customRate: e.target.value })}
                                placeholder={String(defaultLiveRate)}
                                className="w-full pl-3 pr-14 py-2 rounded-lg bg-white border border-[#D5CFBF] text-xs font-mono font-semibold text-[#3E3A36] focus:border-[#8C8475] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, customRate: String(defaultLiveRate) })}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-[#8C8475] hover:text-[#3E3A36] bg-[#EFECE3] px-1.5 py-0.5 rounded cursor-pointer"
                                title="重置為即時匯率"
                              >
                                重置
                              </button>
                            </div>
                          </div>

                          {/* 雙向換算預覽 */}
                          <div className="bg-white rounded-xl p-2.5 border border-[#E3DFD5] text-right space-y-0.5">
                            <div className="text-[10px] text-[#8C8475] font-semibold flex items-center justify-between">
                              <span>換算台幣結果：</span>
                              <span>1 TWD ≈ {inverseRate} {activeCurrency}</span>
                            </div>
                            <div className="text-sm font-black text-[#2D2A26] font-mono">
                              NT$ {convertedTwd.toLocaleString('zh-TW')}
                            </div>
                            {rawVal > 0 && (
                              <div className="text-[10px] text-amber-900 font-mono font-medium">
                                ({rawVal.toLocaleString('zh-TW')} {activeCurrency} × {effectiveRate} TWD)
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 消費日期 & 快捷選取 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="modal-date" className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider">
                        消費日期 <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-[#8C8475]">快捷選擇：</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pb-1">
                      {(() => {
                        const now = new Date();
                        const todayStr = now.toISOString().split('T')[0];
                        
                        const yest = new Date();
                        yest.setDate(yest.getDate() - 1);
                        const yestStr = yest.toISOString().split('T')[0];
                        
                        const bYest = new Date();
                        bYest.setDate(bYest.getDate() - 2);
                        const bYestStr = bYest.toISOString().split('T')[0];

                        return [
                          { label: '今天', val: todayStr },
                          { label: '昨天', val: yestStr },
                          { label: '前天', val: bYestStr },
                        ].map((d) => (
                          <button
                            key={d.label}
                            type="button"
                            onClick={() => setFormData({ ...formData, date: d.val })}
                            className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center active:scale-95 ${
                              formData.date === d.val
                                ? 'bg-[#4D4942] text-white border-[#4D4942] shadow-2xs'
                                : 'bg-[#FAF9F5] hover:bg-white text-[#6E6659] border-[#DDD9CE]'
                            }`}
                          >
                            {d.label}
                          </button>
                        ));
                      })()}
                    </div>
                    <input 
                      id="modal-date"
                      type="date" 
                      required 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DDD9CE] focus:border-[#8C8475] focus:bg-white focus:outline-none transition-all text-xs text-[#3E3A36] cursor-pointer font-medium" 
                    />
                  </div>

                  <div className="space-y-3">
                    {/* 對帳類型 */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider">對帳類型</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            type: '支出-日常代墊',
                            payer: prev.payer === '共同帳戶' ? '廖尹丞' : prev.payer
                          }))}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                            formData.type === '支出-日常代墊'
                              ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-2xs'
                              : 'bg-[#FAF9F5] border-[#DDD9CE] text-[#7A7469] hover:bg-white'
                          }`}
                        >
                          <span>💸</span>
                          <span>支出-日常代墊</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            type: '收入-固定公積金',
                            payer: '共同帳戶'
                          }))}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                            formData.type === '收入-固定公積金'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                              : 'bg-[#FAF9F5] border-[#DDD9CE] text-[#7A7469] hover:bg-white'
                          }`}
                        >
                          <span>💰</span>
                          <span>收入-固定公積金</span>
                        </button>
                      </div>
                    </div>

                    {/* 出錢人 */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider">
                        {formData.type === '收入-固定公積金' ? '出錢人 (撥入來源)' : '出錢人 (先代墊)'}
                      </label>
                      {formData.type === '收入-固定公積金' ? (
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: '共同帳戶', val: '共同帳戶', icon: '🏦' },
                            { label: '廖廖', val: '廖尹丞', icon: '👦' },
                            { label: '周周', val: '周沛緹', icon: '👧' },
                          ].map((p) => (
                            <button
                              key={p.val}
                              type="button"
                              onClick={() => setFormData({ ...formData, payer: p.val })}
                              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                                formData.payer === p.val
                                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                  : 'bg-[#FAF9F5] border-[#DDD9CE] text-[#6E6659] hover:bg-white'
                              }`}
                            >
                              <span>{p.icon}</span>
                              <span>{p.label}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, payer: '廖尹丞' })}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                              formData.payer === '廖尹丞'
                                ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                                : 'bg-[#FAF9F5] border-[#DDD9CE] text-[#6E6659] hover:bg-white'
                            }`}
                          >
                            <span className="text-base">👦</span>
                            <span>廖廖 (廖尹丞)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, payer: '周沛緹' })}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                              formData.payer === '周沛緹'
                                ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                                : 'bg-[#FAF9F5] border-[#DDD9CE] text-[#6E6659] hover:bg-white'
                            }`}
                          >
                            <span className="text-base">👧</span>
                            <span>周周 (周沛緹)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal 頁尾 (Fixed bottom) */}
                <div className="px-5 py-3.5 sm:px-6 bg-[#FAF9F5] border-t border-[#EBE7DC] flex gap-3 justify-end shrink-0">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-[#DDD8CC] text-[#706B62] font-bold text-xs hover:bg-[#EEEDE9] transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 rounded-xl bg-[#4D4942] hover:bg-[#322F2A] text-white font-bold text-xs transition-all duration-200 shadow-sm transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>確認送出</span>
                  </button>
                </div>
              </form>
            ) : (
              <form 
                onSubmit={(e) => {
                  onSubmitShopping(e);
                  onClose();
                }} 
                className="flex flex-col flex-1 min-h-0 font-sans"
              >
                {/* Modal 可上下滑動主內容區域 */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                  {/* 1. 分類 */}
                  <div>
                    <label className="block text-xs font-bold text-[#5C564E] mb-1.5">
                      購物性質 (分類)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setShoppingForm({ ...shoppingForm, category: '需要買' })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          shoppingForm.category === '需要買'
                            ? 'bg-rose-500 text-white border-rose-600 shadow-md scale-[1.01]'
                            : 'bg-[#FAF9F5] border-[#E5E1D7] text-[#8C8475] hover:bg-white hover:text-[#3E3A36] font-normal opacity-70'
                        }`}
                      >
                        {shoppingForm.category === '需要買' ? (
                          <span className="w-4 h-4 rounded-full bg-white text-rose-600 flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs">✓</span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-rose-400/60 shrink-0" />
                        )}
                        <span>需要買 (剛需)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShoppingForm({ ...shoppingForm, category: '想要買' })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          shoppingForm.category === '想要買'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-[1.01]'
                            : 'bg-[#FAF9F5] border-[#E5E1D7] text-[#8C8475] hover:bg-white hover:text-[#3E3A36] font-normal opacity-70'
                        }`}
                      >
                        {shoppingForm.category === '想要買' ? (
                          <span className="w-4 h-4 rounded-full bg-white text-amber-600 flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs">✓</span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-amber-400/60 shrink-0" />
                        )}
                        <span>想要買 (觀望)</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. 物品名稱 */}
                  <div>
                    <label className="block text-xs font-bold text-[#5C564E] mb-1">
                      物品名稱 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="例如：高麗菜、全脂鮮奶、洗髮精..."
                      value={shoppingForm.item}
                      onChange={(e) => setShoppingForm({ ...shoppingForm, item: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#FAF9F5] border border-[#E5E1D7] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-amber-600 focus:bg-white transition-all"
                    />
                  </div>

                  {/* 3. 購買地點 / 常用門市 */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-[#5C564E]">
                        購買地點 / 常用商店
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenManageStores();
                        }}
                        className="text-[11px] text-amber-700 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <Store className="w-3 h-3" />
                        編輯常用商店
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="例如：菜市場、全聯、日日加、家樂福..."
                      value={shoppingForm.store}
                      onChange={(e) => setShoppingForm({ ...shoppingForm, store: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#FAF9F5] border border-[#E5E1D7] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-amber-600 focus:bg-white transition-all"
                    />
                    {shoppingStores.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-[#8C8475] font-bold shrink-0">快速套用：</span>
                        {shoppingStores.map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setShoppingForm({ ...shoppingForm, store: st })}
                            className="px-2.5 py-1 rounded-lg bg-[#F2EFE9] hover:bg-amber-100/80 text-[#5C564E] hover:text-amber-900 text-[10px] font-bold transition-all cursor-pointer border border-[#E3DFD3] inline-flex items-center gap-1 whitespace-nowrap active:scale-95"
                          >
                            <MapPin className="w-3 h-3 text-[#8C8475] shrink-0" />
                            <span>{st}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. 預計購買期限 */}
                  <div>
                    <label className="block text-xs font-bold text-[#5C564E] mb-1">
                      預計購買期限
                    </label>
                    <input
                      type="text"
                      placeholder="例如：8/13前、本週末前、隨意..."
                      value={shoppingForm.deadline}
                      onChange={(e) => setShoppingForm({ ...shoppingForm, deadline: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#FAF9F5] border border-[#E5E1D7] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-amber-600 focus:bg-white transition-all"
                    />
                  </div>

                  {/* 5. 登記人 */}
                  <div>
                    <label className="block text-xs font-bold text-[#5C564E] mb-1">
                      登記人
                    </label>
                    <select
                      value={shoppingForm.creator}
                      onChange={(e) => setShoppingForm({ ...shoppingForm, creator: e.target.value as any })}
                      className="w-full px-3.5 py-2 bg-[#FAF9F5] border border-[#E5E1D7] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-amber-600 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="廖尹丞">廖尹丞</option>
                      <option value="周沛緹">周沛緹</option>
                    </select>
                  </div>

                  {/* 6. 備註 / 規格與詳細說明 */}
                  <div>
                    <label className="block text-xs font-bold text-[#5C564E] mb-1">
                      詳細備註 / 規格說明 (選填)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="例如：特定廠牌、包裝容量、尺寸規格、注意事項..."
                      value={shoppingForm.note}
                      onChange={(e) => setShoppingForm({ ...shoppingForm, note: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#FAF9F5] border border-[#E5E1D7] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-amber-600 focus:bg-white transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Modal 頁尾 (Fixed bottom) */}
                <div className="px-5 py-3.5 sm:px-6 bg-[#FAF9F5] border-t border-[#EBE7DC] flex gap-3 justify-end shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-[#DDD8CC] text-[#706B62] font-bold text-xs transition-colors hover:bg-[#EEEDE9] cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>儲存採購記事</span>
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
