import React, { useState, useMemo } from 'react';
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
  ArrowUpRight,
  Database,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthUser, CoupleBindingInfo } from '../../types';
import { resolveUserPersonas } from '../../utils/userPersona';

export interface SplitWishItem {
  id: string;
  requester: string;
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
  isDbConnected?: boolean;
  onOpenGasDeploy?: () => void;
  currentUser?: AuthUser | null;
  partnerBindingInfo?: CoupleBindingInfo | null;
}

export const SplitNotebookTab: React.FC<SplitNotebookTabProps> = ({
  onConvertToSplit,
  showToast,
  isDbConnected = true,
  onOpenGasDeploy,
  currentUser,
  partnerBindingInfo,
}) => {
  const { userA, userB } = useMemo(() => {
    return resolveUserPersonas(currentUser, partnerBindingInfo);
  }, [currentUser, partnerBindingInfo]);

  const [wishlist, setWishlist] = useState<SplitWishItem[]>(() => {
    try {
      const isDbConfigured = Boolean(localStorage.getItem('muji_gas_web_url') || (typeof window !== 'undefined' && (window as any).google?.script?.run));
      const isSandbox = localStorage.getItem('banban_is_sandbox_mode') === 'true';
      if (!isDbConfigured && !isSandbox) {
        return [];
      }
      const saved = localStorage.getItem('banban_split_wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [filterRequester, setFilterRequester] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | '待代買' | '已買好'>('待代買');

  if (!isDbConnected) {
    return (
      <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto pb-4 sm:pb-6 font-sans">
        <div className="bg-white/85 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-[#E8E2D5] shadow-2xs text-center space-y-4 my-2">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto shadow-inner">
            <Database className="w-8 h-8 text-amber-700" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg sm:text-2xl font-black text-[#3E3A36]">尚未連線至資料庫</h3>
            <p className="text-xs sm:text-sm text-[#7A7366] leading-relaxed max-w-md mx-auto font-normal">
              尚未登錄 Google 試算表 Web App API 金鑰，無法讀取代買清單與記事。請先設定連線金鑰以同步雲端數據。
            </p>
          </div>
          {onOpenGasDeploy && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenGasDeploy}
                className="px-6 py-3 bg-amber-800 hover:bg-amber-900 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer inline-flex items-center gap-2"
              >
                <Key className="w-4 h-4" />
                <span>設定連線金鑰與同步</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 新增 Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [requester, setRequester] = useState<string>(userB.shortName);
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
      id: `wish-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      requester,
      itemName: itemName.trim(),
      store: store.trim() || '不限/隨意',
      estimatedPrice: estimatedPrice ? Number(estimatedPrice) : undefined,
      deadline: deadline.trim() || undefined,
      note: note.trim() || undefined,
      status: '待代買',
      createdAt: new Date().toLocaleString('zh-TW', { hour12: false }),
    };

    const updated = [newItem, ...wishlist];
    saveWishlist(updated);
    showToast(`✨ 已新增代買心願：${newItem.itemName}`, 'success');

    // 重設表單
    setItemName('');
    setStore('');
    setEstimatedPrice('');
    setDeadline('');
    setNote('');
    setIsAddOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    const updated = wishlist.map((item) => {
      if (item.id === id) {
        const nextStatus = item.status === '待代買' ? '已買好' : '待代買';
        return { ...item, status: nextStatus as '待代買' | '已買好' };
      }
      return item;
    });
    saveWishlist(updated);
  };

  const handleDeleteItem = (id: string) => {
    const updated = wishlist.filter((item) => item.id !== id);
    saveWishlist(updated);
    showToast('已刪除該代買項目', 'info');
  };

  const isUserARequester = (reqStr?: string) => {
    const r = (reqStr || '').trim();
    return r === userA.shortName || r === userA.name || r === userA.displayName || r === '廖';
  };

  const isUserBRequester = (reqStr?: string) => {
    const r = (reqStr || '').trim();
    return r === userB.shortName || r === userB.name || r === userB.displayName || r === '周';
  };

  const handleOpenConvert = (item: SplitWishItem) => {
    setConvertingItem(item);
    // 預設由對方代墊
    const defaultPayer: '廖' | '周' = isUserBRequester(item.requester) ? '廖' : '周';
    setConvertPayer(defaultPayer);
    setConvertActualAmount(item.estimatedPrice ? String(item.estimatedPrice) : '');
  };

  const handleConfirmConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingItem) return;
    const amount = Number(convertActualAmount);
    if (!amount || amount <= 0) {
      showToast('請輸入有效的消費金額', 'error');
      return;
    }

    // 呼叫父層新增代墊紀錄
    onConvertToSplit({
      itemName: `[代買] ${convertingItem.itemName}${convertingItem.store ? ` (${convertingItem.store})` : ''}`,
      totalAmount: amount,
      payer: convertPayer,
    });

    // 標記原願望為已買好
    handleToggleStatus(convertingItem.id);
    setConvertingItem(null);
    showToast(`🎉 已成功將「${convertingItem.itemName}」轉為代墊帳目！`, 'success');
  };

  const filteredItems = wishlist.filter((item) => {
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (filterRequester !== 'ALL') {
      if (filterRequester === userA.shortName && !isUserARequester(item.requester)) return false;
      if (filterRequester === userB.shortName && !isUserBRequester(item.requester)) return false;
      if (filterRequester === '共同' && item.requester !== '共同') return false;
    }
    return true;
  });

  const pendingCount = wishlist.filter((i) => i.status === '待代買').length;
  const doneCount = wishlist.filter((i) => i.status === '已買好').length;

  return (
    <div className="space-y-4 sm:space-y-5 max-w-4xl mx-auto pb-4 sm:pb-6 font-sans">
      {/* 頂部功能橫幅 */}
      <div className="bg-white/70 backdrop-blur-md p-4 sm:px-6 sm:py-5 rounded-2xl border border-[#E9E5DC] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[#3E3A36] flex items-center gap-2">
              <span>🛍️ 代買清單與記事</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 text-[10px] font-bold border border-rose-200">
              待買 {pendingCount} 件
            </span>
          </div>
          <p className="text-xs text-[#8C8475] mt-0.5">
            順路代買、心願清單與隨手筆記。買好後可一鍵無縫轉入代墊帳目！
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>＋ 新增代買項目</span>
        </button>
      </div>

      {/* 篩選切換列 */}
      <div className="bg-white/80 backdrop-blur-md p-3.5 rounded-2xl border border-[#EAE6DD] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center bg-[#F5F2EB] p-1 rounded-xl text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => setFilterStatus('待代買')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              filterStatus === '待代買'
                ? 'bg-white text-rose-800 shadow-xs'
                : 'text-[#8C8475] hover:text-[#3E3A36]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>待代買 ({pendingCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('已買好')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              filterStatus === '已買好'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-[#8C8475] hover:text-[#3E3A36]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>已買好 ({doneCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-white text-[#3E3A36] shadow-xs'
                : 'text-[#8C8475] hover:text-[#3E3A36]'
            }`}
          >
            全部 ({wishlist.length})
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-[#8C8475]">許願人：</span>
          {[
            { key: 'ALL', label: '全部' },
            { key: userA.shortName, label: `${userA.iconEmoji} ${userA.displayName}` },
            { key: userB.shortName, label: `${userB.iconEmoji} ${userB.displayName}` },
            { key: '共同', label: '👫 共同' }
          ].map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setFilterRequester(r.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterRequester === r.key
                  ? r.key === userA.shortName
                    ? 'bg-sky-100 text-sky-800 border border-sky-300'
                    : r.key === userB.shortName
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-[#4D4942] text-white'
                  : 'bg-[#F5F2EB] text-[#8C8475] hover:text-[#3E3A36]'
              }`}
            >
              {r.label}
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
            const isReqA = isUserARequester(item.requester);
            const isReqB = isUserBRequester(item.requester);
            const reqLabel = isReqA ? `${userA.displayName}想要` : isReqB ? `${userB.displayName}想要` : '共同';

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
                        isReqA
                          ? 'bg-sky-100 text-sky-800'
                          : isReqB
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {reqLabel}
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

                  <div className="min-w-0 flex-1">
                    <h4 className={`text-sm font-bold truncate max-w-[200px] min-[360px]:max-w-[250px] sm:max-w-md ${isDone ? 'line-through text-[#8C8475]' : 'text-[#3E3A36]'}`} title={item.itemName}>
                      {item.itemName}
                    </h4>
                    {item.note && (
                      <p className="text-xs text-[#7A7366] mt-1 bg-[#FAF8F5] p-2 rounded-xl border border-[#EDE8DE]">
                        📝 {item.note}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-[11px] text-[#8C8475]">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.estimatedPrice && (
                      <span className="font-bold text-rose-700">
                        預估：${item.estimatedPrice.toLocaleString()}
                      </span>
                    )}
                    {item.deadline && (
                      <span className="text-[#8C8475] flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>{item.deadline}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenConvert(item)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                      title="代買完成，轉入代墊分帳借還系統"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      <span>轉記代墊</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 text-[#A09A8F] hover:text-rose-600 rounded-md transition-colors cursor-pointer"
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

      {/* 新增心願 Modal */}
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
                  <span>🛍️ 新增代買許願項目</span>
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
                      {[
                        { key: userB.shortName, label: `${userB.iconEmoji} ${userB.displayName}`, color: 'rose' },
                        { key: userA.shortName, label: `${userA.iconEmoji} ${userA.displayName}`, color: 'sky' },
                        { key: '共同', label: '👫 共同', color: 'amber' }
                      ].map((r) => (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => setRequester(r.key)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            requester === r.key
                              ? r.color === 'rose'
                                ? 'bg-rose-600 text-white border-rose-700'
                                : r.color === 'sky'
                                ? 'bg-sky-600 text-white border-sky-700'
                                : 'bg-amber-600 text-white border-amber-700'
                              : 'bg-white text-[#6E6659] border-[#DDD8CD]'
                          }`}
                        >
                          {r.label}
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
                      原許願人：{isUserBRequester(convertingItem.requester) ? `${userB.iconEmoji} ${userB.displayName}` : `${userA.iconEmoji} ${userA.displayName}`}
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
                        {userA.iconEmoji} {userA.displayName} 先代墊
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
                        {userB.iconEmoji} {userB.displayName} 先代墊
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
