import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw, Calculator, Coins } from 'lucide-react';
import { CURRENCIES, DEFAULT_RATES_MAP } from '../../utils/formatters';

interface CurrencyCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  exchangeRates: Record<string, number>;
  ratesLastUpdated: string;
  isRateLoading: boolean;
  rateFetchError: boolean;
  onRefreshRates: () => void;
  calcBaseCurrency: string;
  setCalcBaseCurrency: (c: string) => void;
  calcInputAmount: string;
  setCalcInputAmount: (val: string) => void;
  calcMode: 'foreignToTwd' | 'twdToForeign';
  setCalcMode: React.Dispatch<React.SetStateAction<'foreignToTwd' | 'twdToForeign'>>;
}

export const CurrencyCalculatorModal: React.FC<CurrencyCalculatorModalProps> = ({
  isOpen,
  onClose,
  exchangeRates,
  ratesLastUpdated,
  isRateLoading,
  rateFetchError,
  onRefreshRates,
  calcBaseCurrency,
  setCalcBaseCurrency,
  calcInputAmount,
  setCalcInputAmount,
  calcMode,
  setCalcMode
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-[#FAF9F5] rounded-3xl max-w-lg w-full max-h-[88vh] shadow-2xl border border-[#E8E4D9] relative flex flex-col font-sans text-[#3E3A36] overflow-hidden"
          >
            {/* Modal 標頭 (Fixed top, Edge-to-Edge) */}
            <div className="px-5 py-4 sm:px-6 bg-white border-b border-[#EBE7DC] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100/90 text-amber-900 flex items-center justify-center text-lg font-bold shrink-0 shadow-2xs">
                  💱
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#3E3A36] flex items-center gap-1.5">
                    <span>出國幣值與各國即時匯率換算</span>
                  </h3>
                  <p className="text-xs text-[#8C8475] mt-0.5 font-light">即時聯網國際外匯市場，旅遊出國記帳不卡關</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-[#8C8475] hover:bg-[#EFECE3] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal 可上下滑動主內容區域 (Scrollable Content Body) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 font-sans min-h-0">
              {/* 即時匯率更新狀態條 */}
              <div className="bg-white/90 rounded-2xl p-3 border border-[#E3DFD5] flex items-center justify-between text-xs shadow-2xs">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${rateFetchError ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                  <span className="text-[#5C564E] font-medium truncate">
                    {rateFetchError ? '離線基準匯率' : `最新匯率：${ratesLastUpdated} (10s 自動更新)`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onRefreshRates}
                  disabled={isRateLoading}
                  className="px-2.5 py-1 rounded-lg bg-[#EFECE3] hover:bg-[#E5E1D5] text-[#5C564E] font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-3 h-3 ${isRateLoading ? 'animate-spin' : ''}`} />
                  <span>{isRateLoading ? '更新中...' : '立即刷新'}</span>
                </button>
              </div>

              {/* 試算器雙向計算模式選擇與輸入 */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E3DFD5] space-y-4 shadow-2xs">
                <div className="flex items-center justify-between gap-2 border-b border-[#F2EFE8] pb-3">
                  <div className="text-xs font-bold text-[#3E3A36] uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>即時外匯雙向試算器</span>
                  </div>

                  {/* 雙向切換模式頁籤 */}
                  <div className="flex bg-[#F2EFE9] p-0.5 rounded-xl text-[11px] font-bold text-[#6C675F]">
                    <button
                      type="button"
                      onClick={() => setCalcMode('foreignToTwd')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        calcMode === 'foreignToTwd'
                          ? 'bg-white text-amber-900 shadow-2xs font-bold'
                          : 'hover:text-[#3E3A36]'
                      }`}
                    >
                      外幣 ➔ 台幣
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcMode('twdToForeign')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        calcMode === 'twdToForeign'
                          ? 'bg-white text-amber-900 shadow-2xs font-bold'
                          : 'hover:text-[#3E3A36]'
                      }`}
                    >
                      台幣 ➔ 外幣
                    </button>
                  </div>
                </div>

                {/* 欄位輸入網格 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 外幣選擇 */}
                  <div>
                    <label className="block text-xs font-bold text-[#5C564E] mb-1">
                      {calcMode === 'foreignToTwd' ? '目標外幣 (Foreign Currency)' : '欲兌換的外幣'}
                    </label>
                    <select
                      value={calcBaseCurrency}
                      onChange={(e) => setCalcBaseCurrency(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DDD9CE] text-xs text-[#3E3A36] font-bold cursor-pointer focus:outline-none focus:border-amber-700 focus:bg-white transition-all"
                    >
                      {CURRENCIES.filter(c => c.code !== 'TWD').map(c => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 金額輸入 */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-[#5C564E]">
                        {calcMode === 'foreignToTwd' ? `${calcBaseCurrency} 金額` : '台幣金額 (NT$)'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setCalcMode(prev => prev === 'foreignToTwd' ? 'twdToForeign' : 'foreignToTwd')}
                        className="text-[10px] text-amber-800 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>切換換算方向</span>
                      </button>
                    </div>
                    <input
                      type="number"
                      value={calcInputAmount}
                      onChange={(e) => setCalcInputAmount(e.target.value)}
                      placeholder={calcMode === 'foreignToTwd' ? "例如: 10000" : "例如: 5000"}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#DDD9CE] text-xs text-[#3E3A36] font-mono font-bold focus:outline-none focus:border-amber-700 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* 快捷常見金額點選 */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-[#8C8475] font-bold mr-1">快捷面額：</span>
                  {[100, 500, 1000, 5000, 10000].map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setCalcInputAmount(amount.toString())}
                      className="px-2.5 py-1 rounded-lg bg-[#F4F1E8] hover:bg-[#E8E3D5] text-[10px] font-mono font-bold text-[#5C564E] transition-colors cursor-pointer"
                    >
                      ${amount.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* 雙向換算動態結果卡 */}
                {(() => {
                  const currObj = CURRENCIES.find(c => c.code === calcBaseCurrency);
                  const rate = exchangeRates[calcBaseCurrency] || DEFAULT_RATES_MAP[calcBaseCurrency] || 1;
                  const rawVal = parseFloat(calcInputAmount || '0');
                  const inverseRate = rate > 0 ? (1 / rate) : 0;

                  // 模式一：外幣 ➔ 折台幣
                  const foreignToTwdVal = Math.round(rawVal * rate);
                  // 模式二：台幣 ➔ 換外幣
                  const decCount = ['JPY', 'KRW', 'VND'].includes(calcBaseCurrency) ? 0 : 2;
                  const twdToForeignVal = rate > 0 ? (rawVal / rate).toFixed(decCount) : '0';

                  return (
                    <div className="space-y-2 pt-1">
                      {/* 主試算結果 */}
                      <div className="bg-[#FAF8F2] rounded-2xl p-4 border border-[#E5E0D2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div>
                          <div className="text-[11px] text-[#8C8475] font-semibold flex items-center gap-1 flex-wrap">
                            <span>{calcMode === 'foreignToTwd' ? '【外幣 ➔ 折合台幣】' : '【台幣 ➔ 可兌外幣】'}</span>
                            <span className="font-mono text-[#A0988A]">(1 {calcBaseCurrency} = {rate} TWD)</span>
                          </div>
                          <div className="text-sm font-bold text-[#3E3A36] mt-1">
                            {calcMode === 'foreignToTwd' ? (
                              <span>{currObj?.flag} {rawVal.toLocaleString('zh-TW')} {calcBaseCurrency}</span>
                            ) : (
                              <span>🇹🇼 NT$ {rawVal.toLocaleString('zh-TW')} 台幣</span>
                            )}
                          </div>
                        </div>

                        <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8E3D5]">
                          <div className="text-[10px] text-[#8C8475] uppercase tracking-wider font-bold">
                            {calcMode === 'foreignToTwd' ? '折合新台幣' : `可兌換 ${calcBaseCurrency}`}
                          </div>
                          <div className="text-xl sm:text-2xl font-black text-emerald-800 font-mono mt-0.5 break-words">
                            {calcMode === 'foreignToTwd' ? (
                              <span>NT$ {foreignToTwdVal.toLocaleString('zh-TW')}</span>
                            ) : (
                              <span>{currObj?.flag} {Number(twdToForeignVal).toLocaleString('zh-TW')} <span className="text-xs font-bold">{calcBaseCurrency}</span></span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 雙向反向對照小卡 (同時呈現另一方向) */}
                      <div className="bg-[#FAF9F5] rounded-xl p-3 border border-[#E8E4D9] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                        <div className="flex items-center gap-1.5 text-[#6C675F]">
                          <span className="text-amber-800 font-bold shrink-0">🔄 反向對照：</span>
                          {calcMode === 'foreignToTwd' ? (
                            <span>NT$ {rawVal.toLocaleString('zh-TW')} 台幣可兌換約</span>
                          ) : (
                            <span>{currObj?.flag} {rawVal.toLocaleString('zh-TW')} {calcBaseCurrency} 約折合</span>
                          )}
                        </div>
                        <div className="font-mono font-bold text-[#3E3A36]">
                          {calcMode === 'foreignToTwd' ? (
                            <span className="text-amber-900">{currObj?.flag} {(rawVal * inverseRate).toFixed(decCount)} {calcBaseCurrency}</span>
                          ) : (
                            <span className="text-emerald-800">NT$ {Math.round(rawVal * rate).toLocaleString('zh-TW')} 元</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 各國參考匯率一覽總表 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#5C564E] flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>各主要國家即時參考匯率表</span>
                  </h4>
                  <span className="text-[10px] text-[#8C8475] font-semibold">💡 點擊卡片快速套用</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CURRENCIES.filter(c => c.code !== 'TWD').map(c => {
                    const currentRate = exchangeRates[c.code] || DEFAULT_RATES_MAP[c.code] || c.defaultRate;
                    const isSelected = calcBaseCurrency === c.code;
                    return (
                      <div
                        key={c.code}
                        onClick={() => setCalcBaseCurrency(c.code)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all relative ${
                          isSelected
                            ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-300 shadow-2xs'
                            : 'bg-white border-[#E8E4D9] hover:bg-[#FAF9F5]'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 text-[9px] bg-amber-700 text-white font-bold px-1.5 py-0.2 rounded-md">
                            已選
                          </span>
                        )}
                        <div className="flex items-center justify-between text-xs pr-6">
                          <span className="font-bold text-[#3E3A36]">{c.flag} {c.code}</span>
                        </div>
                        <div className="text-[10px] text-[#8C8475] mt-0.5">{c.name}</div>
                        <div className="text-xs font-bold font-mono text-emerald-800 mt-1">
                          1 {c.code} = <span className="text-emerald-900 font-black">{currentRate}</span> <span className="text-[10px] font-normal text-[#8C8475]">TWD</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal 頁尾 (Fixed bottom, Edge-to-Edge) */}
            <div className="px-5 py-3.5 sm:px-6 bg-white border-t border-[#EBE7DC] flex items-center justify-between shrink-0">
              <span className="text-[11px] text-[#8C8475] hidden sm:inline font-light">
                按 ESC 或點擊背景即可關閉
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#4D4942] hover:bg-[#322F2A] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 text-center"
              >
                關閉換算視窗
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
