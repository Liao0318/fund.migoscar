import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Store, Plus, MapPin, Trash2, X } from 'lucide-react';

interface ManageStoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  shoppingStores: string[];
  isAddStoreInput: string;
  setIsAddStoreInput: (val: string) => void;
  onAddStore: () => void;
  onDeleteStore: (storeName: string) => void;
}

export const ManageStoresModal: React.FC<ManageStoresModalProps> = ({
  isOpen,
  onClose,
  shoppingStores = [],
  isAddStoreInput,
  setIsAddStoreInput,
  onAddStore,
  onDeleteStore
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
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#3E3A36]">常用購買商店管理</h3>
                  <p className="text-[11px] text-[#8C8475]">將自動儲存在 Google 試算表「常用商店」頁籤</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-[#A39E92] hover:text-[#3E3A36] rounded-full hover:bg-[#F5F2EA] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 font-sans min-h-0">
              {/* 新增門市輸入列 */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="輸入新門市名稱（例如：日日加、全聯）"
                  value={isAddStoreInput}
                  onChange={(e) => setIsAddStoreInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddStore())}
                  className="flex-1 px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E5E1D7] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-amber-600 transition-all font-bold"
                />
                <button
                  type="button"
                  onClick={onAddStore}
                  className="px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0 transition-all flex items-center gap-1 shadow-xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增</span>
                </button>
              </div>

              {/* 現有門市清單 */}
              <div className="space-y-2">
                {shoppingStores.length === 0 ? (
                  <p className="text-center py-6 text-xs text-[#A39E92]">目前尚未設定常用商店。</p>
                ) : (
                  shoppingStores.map((st) => (
                    <div
                      key={st}
                      className="flex items-center justify-between p-3 bg-[#FAF9F5] border border-[#EBE7DF] rounded-xl text-xs text-[#3E3A36]"
                    >
                      <span className="font-bold inline-flex items-center gap-1.5 min-w-0 pr-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-800 shrink-0" /><span className="truncate">{st}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteStore(st)}
                        className="text-[#A39E92] hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="移除門市"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal 頁尾 (Fixed bottom, Edge-to-Edge) */}
            <div className="px-5 py-3.5 sm:px-6 bg-[#FAF9F5] border-t border-[#EBE7DC] flex justify-end shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-[#4D4942] hover:bg-[#322F2A] text-white text-xs font-bold cursor-pointer transition-all active:scale-95"
              >
                完成
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
