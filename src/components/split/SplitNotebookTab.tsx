import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Check, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  Tag, 
  User, 
  Layers, 
  Store,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface SplitWishItem {
  id: string;
  requester: '廖' | '周' | '共同';
  itemName: string;
  store: string;
  estimatedPrice?: number;
  deadline?: string;
  note?: string;
  status: '待代買' | '已買好';
  createdAt: string;
}

interface SplitNotebookTabProps {
  onConvertToSplit: (item: { itemName: string; totalAmount: number; payer: '廖' | '周' }) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SplitNotebookTab: React.FC<SplitNotebookTabProps> = ({
  onConvertToSplit,
  showToast,
}) => {
  const [wishlist, setWishlist] = useState<SplitWishItem[]>(() => {
    try {
      const saved = localStorage.getItem('banban_split_wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'wish-1',
        requester: '周',
        itemName: '無印良品 溫和卸妝油 200ml',
        store: 'MUJI 無印良品',
        estimatedPrice: 280,
        deadline: '這週休假前',
        note: '如果有經過再順便買～',
        status: '待代買',
        createdAt: '2026-08-20'
      },
      {
        id: 'wish-2',
        requester: '廖',
        itemName: '深焙義式咖啡豆 (半磅)',
        store: '路易莎或星巴克',
        estimatedPrice: 350,
        deadline: '無期限',
        note: '家裡咖啡豆快喝完了',
        status: '待代買',
        createdAt: '2026-08-21'
      }
    ];
  });

  const [filterRequester, setFilterRequester] = useState<'ALL' | '廖' | '周'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | '待代買' | '已買好'>('待代買');

  // 新增 Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [requester, setRequester] = useState<'廖' | '周' | '共同'>('周');
  const [itemName, setItemName] = useState('');
  const [store, setStore] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [deadline, setDeadline] = useState('');
  const [note, setNote] = useState('');

  // 轉代墊對話框
  const [convertingItem, setConvertingItem] = useState<SplitWishItem | null>(null);
  const [convertPayer, setConvertPayer] = useState<'廖' | '周'>('廖');
  const [convertActualAmount, setConvertActualAmount] = useState<string>('');

  const saveWishlist = (newList: SplitWishItem[]) => {
    setWishlist(newList);
    try {
      localStorage.setItem('banban_split_wishlist', JSON.stringify(newList));
    } catch (e) {}
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      showToast('請輸入品項名稱', 'error');
      return;
    }

    const newItem: SplitWishItem = {
      id: 'wish-' + Date.now(),
      requester,
      itemName: itemName.trim(),
      store: store.trim() || '隨意',
      estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) || undefined : undefined,
      deadline: deadline.trim() || '無期限',
      note: note.trim(),
      status: '待代買',
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newItem, ...wishlist];
    saveWishlist(updated);
    setIsAddOpen(false);
    setItemName('');
    setStore('');
    setEstimatedPrice('');
    setDeadline('');
    setNote('');
    showToast(`已新增代買心願：${newItem.itemName}`, 'success');
  };

  const handleToggleStatus = (id: string) => {
    const updated = wishlist.map((item) => {
      if (item.id === id) {
        const nextStatus: '待代買' | '已買好' = item.status === '待代買' ? '已買好' : '待代買';
        return { ...item, status: nextStatus };
      }
      return item;
    });
    saveWishlist(updated);
  };

  const handleDeleteItem = (id: string) => {
    const updated = wishlist.filter(i => i.id !== id);
    saveWishlist(updated);
    showToast('已移除該項代買許願', 'info');
  };

  const handleStartConvert = (item: SplitWishItem) => {
    setConvertingItem(item);
    // 預設由另一方先代付
    const defaultPayer: '廖' | '周' = item.requester === '周' ? '廖' : '周';
    setConvertPayer(defaultPayer);
    setConvertActualAmount(item.estimatedPrice ? String(item.estimatedPrice) : '');
  };

  const handleConfirmConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingItem) return;
    const num = parseFloat(convertActualAmount);
    if (isNaN(num) || num <= 0) {
      showToast('請輸入有效實際代付金額', 'error');
      return;
    }

    // 標記為已買好
    const updated = wishlist.map((item) => {
      if (item.id === convertingItem.id) {
        return { ...item, status: '已買好' as const };
      }
      return item;
    });
    saveWishlist(updated);

    onConvertToSplit({
      itemName: convertingItem.itemName,
      totalAmount: num,
      payer: convertPayer
    });

    setConvertingItem(null);
    showToast(`已成功轉入代墊記帳：${convertingItem.itemName}（${convertPayer} 代墊 $${num}）`, 'success');
  };

  const filteredItems = wishlist.filter((item) => {
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (filterRequester !== 'ALL' && item.requester !== filterRequester && item.requester !== '共同') return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans">
      {/* 橫幅 Banner */}
      <div className="bg-gradient-to-r from-rose-800 to-rose-900 text-rose-50 rounded-3xl p-5 sm:p-7 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-400/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              代買與心願記事
            </h2>
            <p className="text-rose-200/90 text-xs sm:text-sm mt-1 max-w-lg leading-relaxed font-light">
              紀錄需對方順路代買的項目，買好後可直接轉為代墊記帳。
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white text-rose-900 hover:bg-rose-50 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 text-rose-700" />
            <span>新增代買心願</span>
          </button>
        </div>
      </div>

      {/* 篩選切換列 */}
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-[#EBE7DF] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center p-1 bg-[#F5F2EB] rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilterStatus('待代買')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterStatus === '待代買'
                ? 'bg-white text-rose-800 shadow-xs'
                : 'text-[#8C8475] hover:text-[#3E3A36]'
            }`}
          >
            待代買 ({wishlist.filter(i => i.status === '待代買').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('已買好')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterStatus === '已買好'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-[#8C8475] hover:text-[#3E3A36]'
            }`}
          >
            已買好 ({wishlist.filter(i => i.status === '已買好').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-white text-[#3E3A36] shadow-xs'
                : 'text-[#8C8475] hover:text-[#3E3A36]'
            }`}
          >
            全部 ({wishlist.length})
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#8C8475]">許願人：</span>
          {(['ALL', '廖', '周'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setFilterRequester(r)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterRequester === r
                  ? r === '廖'
                    ? 'bg-sky-100 text-sky-800 border border-sky-300'
                    : r === '周'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-[#4D4942] text-white'
                  : 'bg-[#F5F2EB] text-[#8C8475] hover:text-[#3E3A36]'
              }`}
            >
              {r === 'ALL' ? '全部' : r === '廖' ? '廖廖' : '周周'}
            </button>
          ))}
        </div>
      </div>

      {/* 清單列表 */}
      {filteredItems.length === 0 ? (
        <div className="bg-white/80 rounded-3xl p-12 text-center border border-[#EAE6DD] shadow-2xs space-y-3">
          <div className="text-4xl">🛍️</div>
          <h3 className="text-sm font-bold text-[#3E3A36]">目前沒有代買許願項目</h3>
          <p className="text-xs text-[#8C8475]">有想要對方順路代買的零食、飲料或用品嗎？快記錄下來吧！</p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              ＋ 新增代買許願
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredItems.map((item) => {
            const isDone = item.status === '已買好';

            return (
              <div
                key={item.id}
                className={`rounded-2xl p-4 border transition-all shadow-2xs flex flex-col justify-between space-y-3 ${
                  isDone
                    ? 'bg-[#FAF9F7] border-[#E8E6E0] opacity-75'
                    : 'bg-white border-[#E9E4DB] hover:border-rose-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        item.requester === '廖'
                          ? 'bg-sky-100 text-sky-800'
                          : item.requester === '周'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.requester === '廖' ? '廖想要' : item.requester === '周' ? '周想要' : '共同'}
                      </span>

                      <span className="px-2 py-0.5 rounded-md bg-[#F4F1EA] text-[#6E6659] text-[10px] font-semibold flex items-center gap-1">
                        <Store className="w-3 h-3 text-[#8C8475]" />
                        <span>{item.store}</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item.id)}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                        isDone
                          ? 'bg-emerald-500 text-white border-emerald-600'
                          : 'bg-white hover:bg-[#F5F2EB] text-[#8C8475] border-[#DDD8CD]'
                      }`}
                      title={isDone ? '標記為待代買' : '標記為已買好'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className={`text-sm sm:text-base font-bold text-[#3E3A36] ${isDone ? 'line-through text-[#A39E93]' : ''}`}>
                    {item.itemName}
                  </h4>

                  <div className="text-xs text-[#7A7366] flex items-center gap-3 flex-wrap">
                    {item.estimatedPrice !== undefined && item.estimatedPrice !== null && (
                      <span className="font-semibold text-rose-700">
                        預估 NT$ {(Number(item.estimatedPrice) || 0).toLocaleString()}
                      </span>
                    )}
                    {item.deadline && (
                      <span className="text-[#8C8475] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{item.deadline}</span>
                      </span>
                    )}
                  </div>

                  {item.note && (
                    <div className="text-[11px] text-[#8C8475] bg-[#FAF8F3] p-2 rounded-lg border border-[#EDE8DE]">
                      📝 {item.note}
                    </div>
                  )}
                </div>

                {/* 底部操作 */}
                <div className="flex items-center justify-between border-t border-[#F2EEE4] pt-2.5">
                  <div className="text-[10px] text-[#A8A296]">
                    登錄於 {item.createdAt}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* 一鍵轉代墊 */}
                    <button
                      type="button"
                      onClick={() => handleStartConvert(item)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-200 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      title="代買完成，直接轉入代墊帳目"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      <span>轉代墊記帳</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-[#A8A296] hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="刪除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 新增代買許願 Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#FAF9F5] rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col border border-[#E8E4D9] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-[#EDE8DC] p-5 pb-3 shrink-0 bg-[#FAF9F5]">
                <h3 className="text-sm sm:text-base font-bold text-[#3E3A36] flex items-center gap-2">
                  <span>🎁 新增代買心願</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="text-[#8C8475] hover:text-[#3E3A36] text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddItem} className="flex-1 flex flex-col min-h-0 overflow-hidden text-xs">
                <div className="p-5 flex-1 overflow-y-auto space-y-3.5">
                  {/* 許願人 */}
                  <div>
                    <label className="block text-xs font-bold text-[#6E6659] mb-1.5">許願人（誰想要）</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['周', '廖', '共同'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRequester(r)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            requester === r
                              ? r === '周'
                                ? 'bg-rose-600 text-white border-rose-700'
                                : r === '廖'
                                ? 'bg-sky-600 text-white border-sky-700'
                                : 'bg-amber-600 text-white border-amber-700'
                              : 'bg-white text-[#6E6659] border-[#DDD8CD]'
                          }`}
                        >
                          {r === '周' ? '👧 周周' : r === '廖' ? '👦 廖廖' : '👫 共同'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 品項名稱 */}
                  <div>
                    <label className="block text-xs font-bold text-[#6E6659] mb-1">品項名稱 *</label>
                    <input
                      type="text"
                      required
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="例：無印良品 化妝水 / 烏龍拿鐵半糖"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DDD8CD] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-rose-400"
                    />
                  </div>

                  {/* 購買地點 & 預估金額 */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-[#6E6659] mb-1">購買地點</label>
                      <input
                        type="text"
                        value={store}
                        onChange={(e) => setStore(e.target.value)}
                        placeholder="例：全聯 / 7-11 / 隨意"
                        className="w-full px-3 py-2 bg-white border border-[#DDD8CD] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#6E6659] mb-1">預估金額 (選填)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={estimatedPrice}
                        onChange={(e) => setEstimatedPrice(e.target.value)}
                        placeholder="例：150"
                        className="w-full px-3 py-2 bg-white border border-[#DDD8CD] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-rose-400"
                      />
                    </div>
                  </div>

                  {/* 期望期限 */}
                  <div>
                    <label className="block text-xs font-bold text-[#6E6659] mb-1">期望期限 (選填)</label>
                    <input
                      type="text"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      placeholder="例：這週五前 / 順路再買 / 越快越好"
                      className="w-full px-3 py-2 bg-white border border-[#DDD8CD] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-rose-400"
                    />
                  </div>

                  {/* 備註說明 */}
                  <div>
                    <label className="block text-xs font-bold text-[#6E6659] mb-1">備註說明 (選填)</label>
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="規格、容量、口味偏好等..."
                      className="w-full px-3 py-2 bg-white border border-[#DDD8CD] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-[#EDE8DC] bg-[#FAF9F5] shrink-0 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#DDD8CD] text-[#6E6659] text-xs font-bold hover:bg-[#F2EEE6] cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    儲存心願
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 轉代墊記帳 Modal */}
      <AnimatePresence>
        {convertingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#FAF9F5] rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col border border-[#E8E4D9] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-[#EDE8DC] p-5 pb-3 shrink-0 bg-[#FAF9F5]">
                <h3 className="text-sm sm:text-base font-bold text-[#3E3A36] flex items-center gap-2">
                  <span>💳 轉為代墊借還記帳</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setConvertingItem(null)}
                  className="text-[#8C8475] hover:text-[#3E3A36] text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleConfirmConvert} className="flex-1 flex flex-col min-h-0 overflow-hidden text-xs">
                <div className="p-5 flex-1 overflow-y-auto space-y-3.5">
                  <div className="bg-rose-50/80 p-3 rounded-2xl border border-rose-200/80 text-xs text-rose-950 space-y-1">
                    <div className="font-bold">轉入品項：{convertingItem.itemName}</div>
                    <div className="text-[11px] text-rose-800">
                      原許願人：{convertingItem.requester === '周' ? '👧 周周' : '👦 廖廖'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#6E6659] mb-1.5">出錢代墊人</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setConvertPayer('廖')}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          convertPayer === '廖'
                            ? 'bg-sky-600 text-white border-sky-700'
                            : 'bg-white text-[#6E6659] border-[#DDD8CD]'
                        }`}
                      >
                        👦 廖廖 先代墊
                      </button>
                      <button
                        type="button"
                        onClick={() => setConvertPayer('周')}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          convertPayer === '周'
                            ? 'bg-rose-600 text-white border-rose-700'
                            : 'bg-white text-[#6E6659] border-[#DDD8CD]'
                        }`}
                      >
                        👧 周周 先代墊
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#6E6659] mb-1">實際消費金額 (NT$) *</label>
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      required
                      value={convertActualAmount}
                      onChange={(e) => setConvertActualAmount(e.target.value)}
                      placeholder="輸入實際代買發票或結帳金額"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DDD8CD] rounded-xl text-sm font-bold text-[#3E3A36] focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-[#EDE8DC] bg-[#FAF9F5] shrink-0 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConvertingItem(null)}
                    className="flex-1 py-2.5 rounded-xl border border-[#DDD8CD] text-[#6E6659] text-xs font-bold hover:bg-[#F2EEE6] cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold shadow-md cursor-pointer active:scale-95"
                  >
                    確認寫入代墊
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
