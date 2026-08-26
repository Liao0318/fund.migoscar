import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Pencil, X, Check, Store, Clock, User, FileText, Plus, Trash2 } from 'lucide-react';
import { ShoppingItem } from '../../types';
import { getShoppingItemDisplayTime } from '../../utils/formatters';

interface ShoppingDetailModalProps {
  item: ShoppingItem | null;
  onClose: () => void;
  onEdit: (item: ShoppingItem) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onDelete: (id: string, name: string) => void;
}

export const ShoppingDetailModal: React.FC<ShoppingDetailModalProps> = ({
  item,
  onClose,
  onEdit,
  onToggleStatus,
  onDelete
}) => {
  return (
    <AnimatePresence>
      {item && (
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
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-700">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#3E3A36]">採購記事詳情</h3>
                  <p className="text-[11px] text-[#8C8475]">檢視完整購買地點、時間與詳細備註</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* 編輯按鈕 */}
                <button
                  type="button"
                  onClick={() => {
                    const selected = item;
                    onClose();
                    onEdit(selected);
                  }}
                  className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold border border-amber-200/80 shadow-2xs active:scale-95"
                  title="編輯此採購記事"
                >
                  <Pencil className="w-4 h-4 text-amber-700" />
                  <span className="hidden sm:inline">編輯</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-[#A39E92] hover:text-[#3E3A36] rounded-full hover:bg-[#F5F2EA] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 font-sans min-h-0">
              {/* 分類與狀態 Badge */}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  item.status === '已買到'
                    ? 'bg-emerald-100 text-emerald-800'
                    : item.category === '需要買'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    item.status === '已買到'
                      ? 'bg-emerald-500'
                      : item.category === '需要買'
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                  }`} />
                  {item.status === '已買到' ? '已採購完成' : item.category}
                </span>

                <button
                  type="button"
                  onClick={() => onToggleStatus(item.id, item.status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                    item.status === '已買到'
                      ? 'bg-white border-[#E5E1D7] text-[#706B62] hover:bg-[#FAF9F5]'
                      : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{item.status === '已買到' ? '標記為待購買' : '標記為已買到'}</span>
                </button>
              </div>

              {/* 物品名稱展示 */}
              <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-[#EFECE6]">
                <span className="text-[10px] font-bold text-[#A39E92] uppercase tracking-wider block mb-1">採購物品名稱</span>
                <h2 className={`text-lg font-bold text-[#3E3A36] ${item.status === '已買到' ? 'line-through text-[#8C8475]' : ''}`}>
                  {item.item}
                </h2>
              </div>

              {/* 屬性資訊網格 */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#EFECE6]">
                  <span className="text-[10px] text-[#A39E92] font-semibold flex items-center gap-1 mb-1">
                    <Store className="w-3 h-3 text-amber-700" /> 購買地點
                  </span>
                  <p className="text-xs font-bold text-[#3E3A36]">{item.store || '隨意'}</p>
                </div>

                <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#EFECE6]">
                  <span className="text-[10px] text-[#A39E92] font-semibold flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-amber-700" /> 預計購買期限
                  </span>
                  <p className="text-xs font-bold text-[#3E3A36]">{item.deadline || '儘快'}</p>
                </div>

                <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#EFECE6]">
                  <span className="text-[10px] text-[#A39E92] font-semibold flex items-center gap-1 mb-1">
                    <User className="w-3 h-3 text-amber-700" /> 登記人
                  </span>
                  <p className="text-xs font-bold text-[#3E3A36]">{item.creator || '夥伴'}</p>
                </div>

                <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#EFECE6]">
                  <span className="text-[10px] text-[#A39E92] font-semibold flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-amber-700" /> 建立時間
                  </span>
                  <p className="text-xs font-medium text-[#5C564E]">
                    {getShoppingItemDisplayTime(item) || '即時記錄'}
                  </p>
                </div>
              </div>

              {/* 詳細備註說明區塊 */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#3E3A36] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                    詳細備註與規格說明
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const selected = item;
                      onClose();
                      onEdit(selected);
                    }}
                    className="text-[11px] text-amber-700 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Pencil className="w-3 h-3" />
                    {item.note ? '編輯備註' : '新增備註'}
                  </button>
                </div>

                {item.note && item.note.trim() ? (
                  <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-[#E8E4D9] text-xs text-[#3E3A36] leading-relaxed whitespace-pre-wrap font-sans">
                    {item.note}
                  </div>
                ) : (
                  <div className="bg-[#FAF9F6] border border-dashed border-[#E0DCD0] rounded-2xl p-5 text-center">
                    <p className="text-xs text-[#A39E92]">目前尚無填寫詳細備註或規格說明</p>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = item;
                        onClose();
                        onEdit(selected);
                      }}
                      className="mt-2.5 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1 active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                      <span>添加詳細備註</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal 頁尾 (Fixed bottom, Edge-to-Edge) */}
            <div className="px-5 py-3.5 sm:px-6 bg-[#FAF9F5] border-t border-[#EBE7DC] flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const id = item.id;
                  const name = item.item;
                  onClose();
                  onDelete(id, name);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>刪除品項</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const selected = item;
                    onClose();
                    onEdit(selected);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>編輯</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-[#DDD8CC] text-[#706B62] font-bold text-xs transition-colors hover:bg-[#EEEDE9] cursor-pointer"
                >
                  關閉
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
