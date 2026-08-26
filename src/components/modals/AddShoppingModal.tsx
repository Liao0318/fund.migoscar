import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, ShoppingBag, X, Store, MapPin, Plus } from 'lucide-react';
import { ShoppingItem } from '../../types';

interface AddShoppingModalProps {
  isOpen: boolean;
  onClose: () => void;
  shoppingForm: ShoppingItem;
  setShoppingForm: React.Dispatch<React.SetStateAction<ShoppingItem>>;
  onSubmitShopping: (e: React.FormEvent) => void;
  shoppingStores: string[];
  onOpenManageStores: () => void;
}

export const AddShoppingModal: React.FC<AddShoppingModalProps> = ({
  isOpen,
  onClose,
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#3E3A36]/40 backdrop-blur-xs transition-opacity"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative z-60 border border-[#EBE8E0] max-h-[88vh] flex flex-col font-sans text-[#3E3A36] overflow-hidden"
          >
            {/* Modal 標頭 (Fixed top, Edge-to-Edge) */}
            <div className="px-5 py-4 sm:px-6 bg-[#FAF9F5] border-b border-[#EBE7DC] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-700">
                  {shoppingForm.id ? <Pencil className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#3E3A36]">
                    {shoppingForm.id ? '編輯採購記事' : '建立採購記事'}
                  </h3>
                  <p className="text-[11px] text-[#8C8475]">
                    {shoppingForm.id ? '修改購物品項、門市地點、期限與詳細備註' : '紀錄需要買或想要買的物品、地點與時間'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-[#A39E92] hover:text-[#3E3A36] rounded-full hover:bg-[#F5F2EA] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmitShopping} className="flex flex-col flex-1 min-h-0 font-sans">
              {/* Scrollable Content Body */}
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#5C564E]">
                      物品名稱 <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-[#8C8475]">點選常用標籤快速填入</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="例如：高麗菜、全脂鮮奶、洗髮精..."
                      value={shoppingForm.item}
                      onChange={(e) => setShoppingForm({ ...shoppingForm, item: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E5E1D7] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-amber-600 focus:bg-white transition-all font-medium"
                    />
                    {shoppingForm.item && (
                      <button
                        type="button"
                        onClick={() => setShoppingForm({ ...shoppingForm, item: '' })}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-[#EFECE3] hover:bg-[#E3DFC2] text-[#7A7469] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        清除
                      </button>
                    )}
                  </div>

                  {/* 常用生活採購標籤 */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    <span className="text-[10px] text-[#A09A8F] font-bold">常用：</span>
                    {['全脂鮮奶', '雞蛋', '高麗菜', '衛生紙', '洗髮精', '洗衣精', '咖啡豆', '垃圾袋', '水果', '零食點心'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setShoppingForm({ ...shoppingForm, item: tag })}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer active:scale-95 ${
                          shoppingForm.item === tag
                            ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                            : 'bg-white hover:bg-amber-50 text-[#6E6659] border-[#E0DCD3]'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
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
                    className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E5E1D7] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-amber-600 focus:bg-white transition-all"
                  />
                  {shoppingStores.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-[#8C8475] font-bold shrink-0">快速套用：</span>
                      {shoppingStores.map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setShoppingForm({ ...shoppingForm, store: st })}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border inline-flex items-center gap-1 whitespace-nowrap active:scale-95 ${
                            shoppingForm.store === st
                              ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                              : 'bg-[#F2EFE9] hover:bg-amber-100/80 text-[#5C564E] hover:text-amber-900 border-[#E3DFD3]'
                          }`}
                        >
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{st}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. 預計購買期限 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#5C564E]">
                      預計購買期限
                    </label>
                    <span className="text-[10px] text-[#8C8475]">快捷帶入：</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 pb-2">
                    {['今天', '明天', '這週末前', '儘快', '隨意'].map((dl) => (
                      <button
                        key={dl}
                        type="button"
                        onClick={() => setShoppingForm({ ...shoppingForm, deadline: dl })}
                        className={`py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer active:scale-95 text-center ${
                          shoppingForm.deadline === dl
                            ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                            : 'bg-white hover:bg-amber-50 text-[#6E6659] border-[#DDD8CD]'
                        }`}
                      >
                        {dl}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="例如：8/13前、本週末前、隨意..."
                    value={shoppingForm.deadline}
                    onChange={(e) => setShoppingForm({ ...shoppingForm, deadline: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E5E1D7] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-amber-600 focus:bg-white transition-all"
                  />
                </div>

                {/* 5. 登記人 */}
                <div>
                  <label className="block text-xs font-bold text-[#5C564E] mb-1.5">
                    登記人
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShoppingForm({ ...shoppingForm, creator: '廖尹丞' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                        shoppingForm.creator === '廖尹丞'
                          ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                          : 'bg-[#FAF9F5] border-[#DDD9CE] text-[#6E6659] hover:bg-white'
                      }`}
                    >
                      <span className="text-base">👦</span>
                      <span>廖廖 (廖尹丞)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShoppingForm({ ...shoppingForm, creator: '周沛緹' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                        shoppingForm.creator === '周沛緹'
                          ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                          : 'bg-[#FAF9F5] border-[#DDD9CE] text-[#6E6659] hover:bg-white'
                      }`}
                    >
                      <span className="text-base">👧</span>
                      <span>周周 (周沛緹)</span>
                    </button>
                  </div>
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
                    className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E5E1D7] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-amber-600 focus:bg-white transition-all resize-none font-sans"
                  />
                </div>
              </div>

              {/* Modal 頁尾 (Fixed bottom, Edge-to-Edge) */}
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
                  {shoppingForm.id ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{shoppingForm.id ? '更新採購記事' : '儲存採購記事'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
