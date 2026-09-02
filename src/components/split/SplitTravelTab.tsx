import React, { useState, useMemo, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Plane, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  Calendar, 
  Tag, 
  User, 
  Users,
  MapPin,
  TrendingUp,
  PieChart,
  CheckCircle2,
  Copy,
  ChevronDown,
  Layers,
  ArrowRightLeft,
  Utensils,
  Hotel,
  Ticket,
  ShoppingBag,
  Car,
  Palmtree,
  CreditCard,
  Edit3,
  ListTodo,
  Palette,
  UserPlus,
  X,
  UserMinus,
  Settings2,
  HelpCircle,
  Clock,
  RefreshCw,
  Database,
  FileSpreadsheet,
  Search,
  SlidersHorizontal,
  Download,
  ExternalLink,
  Receipt,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TravelTrip, TravelExpenseItem, TravelWishItem } from '../../types';
import { TravelBatchImportModal } from './TravelBatchImportModal';
import { TravelReceiptQuickModal } from './TravelReceiptQuickModal';

interface SplitTravelTabProps {
  onConvertToSplit: (item: { itemName: string; totalAmount: number; payer: '廖' | '周' }) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  gasWebUrl?: string;
  callGasApi?: (action: string, payload?: any) => Promise<any>;
  enqueueSyncItem?: (action: string, payload: any, desc: string) => void;
  isDbConnected?: boolean;
  onOpenGasDeploy?: () => void;
}

// 8 種旅程專屬主題底色配色方案
export const TRIP_THEMES: Record<string, {
  id: string;
  name: string;
  badge: string;
  gradient: string;
  cardBg: string;
  border: string;
  accent: string;
  textAccent: string;
  lightBg: string;
}> = {
  rose: {
    id: 'rose',
    name: '甜心玫瑰',
    badge: '🌸',
    gradient: 'from-rose-600 via-rose-700 to-pink-800',
    cardBg: 'from-rose-50/90 to-pink-50/90',
    border: 'border-rose-200',
    accent: 'bg-rose-600 text-white',
    textAccent: 'text-rose-700',
    lightBg: 'bg-rose-50'
  },
  ocean: {
    id: 'ocean',
    name: '湛藍海島',
    badge: '🌊',
    gradient: 'from-sky-600 via-blue-700 to-indigo-800',
    cardBg: 'from-sky-50/90 to-blue-50/90',
    border: 'border-sky-200',
    accent: 'bg-sky-600 text-white',
    textAccent: 'text-sky-700',
    lightBg: 'bg-sky-50'
  },
  emerald: {
    id: 'emerald',
    name: '翠綠山林',
    badge: '🌲',
    gradient: 'from-emerald-600 via-teal-700 to-green-800',
    cardBg: 'from-emerald-50/90 to-teal-50/90',
    border: 'border-emerald-200',
    accent: 'bg-emerald-600 text-white',
    textAccent: 'text-emerald-700',
    lightBg: 'bg-emerald-50'
  },
  amber: {
    id: 'amber',
    name: '暖陽夕暮',
    badge: '🌅',
    gradient: 'from-amber-600 via-orange-700 to-amber-900',
    cardBg: 'from-amber-50/90 to-orange-50/90',
    border: 'border-amber-200',
    accent: 'bg-amber-600 text-white',
    textAccent: 'text-amber-800',
    lightBg: 'bg-amber-50'
  },
  purple: {
    id: 'purple',
    name: '暮光薰衣草',
    badge: '🍇',
    gradient: 'from-purple-600 via-violet-700 to-indigo-900',
    cardBg: 'from-purple-50/90 to-violet-50/90',
    border: 'border-purple-200',
    accent: 'bg-purple-600 text-white',
    textAccent: 'text-purple-700',
    lightBg: 'bg-purple-50'
  },
  stone: {
    id: 'stone',
    name: '侘寂大地',
    badge: '🪵',
    gradient: 'from-[#5C564E] via-[#4D4942] to-[#36322D]',
    cardBg: 'from-[#F5F2EB]/90 to-[#EDE8DE]/90',
    border: 'border-[#DDD7CC]',
    accent: 'bg-[#5C564E] text-white',
    textAccent: 'text-[#4D4942]',
    lightBg: 'bg-[#F5F2EB]'
  },
  coral: {
    id: 'coral',
    name: '活力珊瑚',
    badge: '🪸',
    gradient: 'from-orange-500 via-rose-600 to-red-700',
    cardBg: 'from-orange-50/90 to-rose-50/90',
    border: 'border-orange-200',
    accent: 'bg-orange-600 text-white',
    textAccent: 'text-orange-700',
    lightBg: 'bg-orange-50'
  },
  night: {
    id: 'night',
    name: '星空極光',
    badge: '🌌',
    gradient: 'from-slate-800 via-indigo-950 to-zinc-900',
    cardBg: 'from-slate-50/90 to-indigo-50/90',
    border: 'border-slate-300',
    accent: 'bg-slate-800 text-white',
    textAccent: 'text-slate-800',
    lightBg: 'bg-slate-100'
  }
};

const CATEGORY_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  '機票交通': { icon: Plane, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200' },
  '住宿訂房': { icon: Hotel, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  '美食餐廳': { icon: Utensils, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  '門票景點': { icon: Ticket, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  '購物伴手禮': { icon: ShoppingBag, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200' },
  '租車加油': { icon: Car, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  '體驗活動': { icon: Palmtree, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
  '其他雜支': { icon: Layers, color: 'text-stone-600', bg: 'bg-stone-50', border: 'border-stone-200' },
};

const CURRENCY_DEFAULTS: Record<string, { rate: number; symbol: string; label: string; name: string }> = {
  'TWD': { rate: 1, symbol: 'NT$', label: '新台幣 (TWD)', name: '台幣' },
  'JPY': { rate: 0.215, symbol: '¥', label: '日圓 (JPY)', name: '日幣' },
  'KRW': { rate: 0.024, symbol: '₩', label: '韓元 (KRW)', name: '韓元' },
  'USD': { rate: 32.2, symbol: '$', label: '美金 (USD)', name: '美金' },
  'EUR': { rate: 35.1, symbol: '€', label: '歐元 (EUR)', name: '歐元' },
  'THB': { rate: 0.95, symbol: '฿', label: '泰銖 (THB)', name: '泰銖' },
  'VND': { rate: 0.0013, symbol: '₫', label: '越南盾 (VND)', name: '越南盾' },
  'SGD': { rate: 24.5, symbol: 'S$', label: '新加坡幣 (SGD)', name: '星幣' },
  'HKD': { rate: 4.12, symbol: 'HK$', label: '港幣 (HKD)', name: '港幣' },
};

// 智慧品項名稱偵測消費類別
export const detectTravelCategory = (name: string): TravelExpenseItem['category'] | null => {
  if (!name) return null;
  const lower = name.toLowerCase().trim();

  // 1. 租車加油
  if (/租車|加油|油錢|停車|過路費|etc|高速公路|toll|car rental|自駕|租機車|租車保險/.test(lower)) {
    return '租車加油';
  }

  // 2. 機票交通
  if (/機票|航班|機位|行李托運|地鐵|捷運|地鐵卡|交通卡|西瓜卡|suica|icoca|t-money|pasmo|八達通|公車|巴士|計程車|taxi|uber|grab|高鐵|新幹線|火車|特急|乘車券|車票|纜車|渡輪|船票|快線|接駁|機場快線|悠遊卡/.test(lower)) {
    return '機票交通';
  }

  // 3. 住宿訂房
  if (/飯店|酒店|民宿|住宿|旅館|青年旅館|hotel|hostel|airbnb|resort|房費|入住|渡假村|露營|溫泉飯店/.test(lower)) {
    return '住宿訂房';
  }

  // 4. 門票景點
  if (/門票|景點|樂園|迪士尼|環球影城|usj|海洋|水族館|動物園|博物館|美術館|展覽|展望台|觀景台|塔|宮|寺|神社|票券|入場券|門票訂位/.test(lower)) {
    return '門票景點';
  }

  // 5. 體驗活動
  if (/體驗|活動|按摩|spa|溫泉|滑雪|潛水|浮潛|跳傘|高空彈跳|和服|韓服|手作|diy|導覽|tour|一日遊|極光|泛舟|觀光巴士/.test(lower)) {
    return '體驗活動';
  }

  // 6. 購物伴手禮
  if (/伴手禮|藥妝|唐吉訶德|donki|免稅|duty free|買|採買|衣服|服飾|鞋|包包|飾品|紀念品|零食|超市|大創|daiso|bic camera|yodobashi|outlet|百貨|商場|代購|名產/.test(lower)) {
    return '購物伴手禮';
  }

  // 7. 美食餐廳
  if (/燒肉|烤肉|火鍋|壽司|拉麵|居酒屋|咖啡|cafe|coffee|下午茶|甜點|蛋糕|抹茶|冰淇淋|早餐|早午餐|午餐|晚餐|宵夜|食堂|餐廳|牛排|炸雞|啤酒|居酒|餐酒館|小吃|夜市|飲品|手搖|飲料|便當|美食|點心|披薩|漢堡|生魚片/.test(lower)) {
    return '美食餐廳';
  }

  // 8. 其他雜支 / 網卡
  if (/esim|sim|網卡|wifi|保險|漫遊|行李|寄放|寄存|寄物|手續費|換匯|小費|簽證/.test(lower)) {
    return '其他雜支';
  }

  return null;
};

export const SplitTravelTab: React.FC<SplitTravelTabProps> = ({
  onConvertToSplit,
  showToast,
  gasWebUrl,
  callGasApi,
  enqueueSyncItem,
  isDbConnected = true,
  onOpenGasDeploy,
}) => {
  // 1. 行程列表 (預設乾淨無假資料)
  const [trips, setTrips] = useState<TravelTrip[]>(() => {
    try {
      const saved = localStorage.getItem('banban_travel_trips');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [activeTripId, setActiveTripId] = useState<string>(() => {
    return trips[0]?.id || '';
  });

  const activeTrip = useMemo(() => {
    if (!trips || trips.length === 0) return null;
    return trips.find(t => t.id === activeTripId) || trips[0] || null;
  }, [trips, activeTripId]);

  // 當前主題配色
  const currentTheme = useMemo(() => {
    const themeKey = activeTrip?.themeColor || 'rose';
    return TRIP_THEMES[themeKey] || TRIP_THEMES.rose;
  }, [activeTrip?.themeColor]);

  // 成員名單
  const tripMembers = useMemo(() => {
    return activeTrip?.members && activeTrip.members.length > 0
      ? activeTrip.members
      : ['廖', '周'];
  }, [activeTrip?.members]);

  // 2. 支出資料列表
  const [expenses, setExpenses] = useState<TravelExpenseItem[]>(() => {
    try {
      const saved = localStorage.getItem('banban_travel_expenses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // 3. 願望清單
  const [wishlist, setWishlist] = useState<TravelWishItem[]>(() => {
    try {
      const saved = localStorage.getItem('banban_travel_wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // 試算表同步狀態
  const [isGasLoading, setIsGasLoading] = useState(false);

  // 試算表自動/手動資料載入
  const fetchTravelDataFromGas = useCallback(async (silent = false) => {
    if (!callGasApi) return;
    const targetUrl = localStorage.getItem('muji_gas_web_url') || gasWebUrl;
    if (!targetUrl && typeof window !== 'undefined' && !(window as any).google?.script?.run) {
      return;
    }
    if (!silent) setIsGasLoading(true);
    try {
      const res = await callGasApi('getTravelData');
      if (res && res.success) {
        if (Array.isArray(res.trips)) {
          setTrips(res.trips);
          try {
            localStorage.setItem('banban_travel_trips', JSON.stringify(res.trips));
          } catch (e) {}
          if (res.trips.length > 0 && !res.trips.some((t: any) => t.id === activeTripId)) {
            setActiveTripId(res.trips[0].id);
          }
        }
        if (Array.isArray(res.expenses)) {
          setExpenses(res.expenses);
          try {
            localStorage.setItem('banban_travel_expenses', JSON.stringify(res.expenses));
          } catch (e) {}
        }
        if (Array.isArray(res.wishlist)) {
          setWishlist(res.wishlist);
          try {
            localStorage.setItem('banban_travel_wishlist', JSON.stringify(res.wishlist));
          } catch (e) {}
        }
        if (!silent) showToast('旅遊分帳資料已與 Google 試算表同步！', 'success');
      }
    } catch (err) {
      console.error('Fetch travel data error:', err);
      if (!silent) showToast('試算表讀取超時，已使用本地快取', 'error');
    } finally {
      if (!silent) setIsGasLoading(false);
    }
  }, [callGasApi, gasWebUrl, activeTripId, showToast]);

  useEffect(() => {
    fetchTravelDataFromGas(true);

    const handleExternalUpdate = (e: any) => {
      if (e?.detail) {
        if (Array.isArray(e.detail.trips)) {
          setTrips(e.detail.trips);
          if (e.detail.trips.length > 0 && !e.detail.trips.some((t: any) => t.id === activeTripId)) {
            setActiveTripId(e.detail.trips[0].id);
          }
        }
        if (Array.isArray(e.detail.expenses)) setExpenses(e.detail.expenses);
        if (Array.isArray(e.detail.wishlist)) setWishlist(e.detail.wishlist);
      }
    };
    window.addEventListener('travel-data-updated', handleExternalUpdate);
    return () => window.removeEventListener('travel-data-updated', handleExternalUpdate);
  }, [fetchTravelDataFromGas, activeTripId]);

  // 狀態管理
  const [subTab, setSubTab] = useState<'expenses' | 'wishlist' | 'settlement'>('expenses');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterPayer, setFilterPayer] = useState<string>('ALL');
  const [filterSplitPerson, setFilterSplitPerson] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<string | null>(null);

  // 批次匯入 & 快速記帳 Modal 狀態
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [isReceiptQuickOpen, setIsReceiptQuickOpen] = useState(false);

  // 編輯 / 建立行程 Modal
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [tripFormTitle, setTripFormTitle] = useState('');
  const [tripFormDestination, setTripFormDestination] = useState('');
  const [tripFormEmoji, setTripFormEmoji] = useState('✈️');
  const [tripFormCurrency, setTripFormCurrency] = useState('JPY');
  const [tripFormRate, setTripFormRate] = useState('0.215');
  const [tripFormHasBudget, setTripFormHasBudget] = useState(false);
  const [tripFormBudget, setTripFormBudget] = useState('60000');
  const [tripFormStartDate, setTripFormStartDate] = useState('');
  const [tripFormEndDate, setTripFormEndDate] = useState('');
  const [tripFormTheme, setTripFormTheme] = useState('rose');
  const [tripFormMembers, setTripFormMembers] = useState<string[]>(['廖', '周']);
  const [newMemberInput, setNewMemberInput] = useState('');

  // 新增 / 編輯支出 Modal
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expCategory, setExpCategory] = useState<TravelExpenseItem['category']>('美食餐廳');
  const [expItemName, setExpItemName] = useState('');
  const [expPayer, setExpPayer] = useState<string>('廖');
  const [expCurrency, setExpCurrency] = useState<string>(activeTrip?.currency || 'JPY');
  const [expRate, setExpRate] = useState<string>(String(activeTrip?.exchangeRate || 0.215));
  const [expOriginalAmount, setExpOriginalAmount] = useState<string>('');
  const [expUnitPrice, setExpUnitPrice] = useState<string>('');
  const [expQuantity, setExpQuantity] = useState<string>('');
  const [expDiscount, setExpDiscount] = useState<string>('');
  const [expPaymentMethod, setExpPaymentMethod] = useState<string>('信用卡');
  const [expSplitMode, setExpSplitMode] = useState<TravelExpenseItem['splitMode']>('全體AA');
  const [expSplitTarget, setExpSplitTarget] = useState<string>('全體');
  const [expParticipants, setExpParticipants] = useState<string[]>([]);
  const [expCustomSplits, setExpCustomSplits] = useState<Record<string, string>>({});
  const [expLocation, setExpLocation] = useState('');
  const [expNote, setExpNote] = useState('');

  // 新增心願 Modal
  const [isAddWishOpen, setIsAddWishOpen] = useState(false);
  const [wishName, setWishName] = useState('');
  const [wishCategory, setWishCategory] = useState('美食餐廳');
  const [wishEstPrice, setWishEstPrice] = useState('');
  const [wishAddedBy, setWishAddedBy] = useState<'廖' | '周' | '共同'>('周');
  const [wishNote, setWishNote] = useState('');

  // 刪除二次確認對話框 State (安全相容 iFrame 沙盒，徹底解決無法刪除問題)
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    dangerLevel?: 'danger' | 'warning';
    onConfirm: () => void;
  } | null>(null);

  // 儲存至 LocalStorage
  const saveTrips = (data: TravelTrip[]) => {
    setTrips(data);
    try {
      localStorage.setItem('banban_travel_trips', JSON.stringify(data));
    } catch (e) {}
  };

  const saveExpenses = (data: TravelExpenseItem[]) => {
    setExpenses(data);
    try {
      localStorage.setItem('banban_travel_expenses', JSON.stringify(data));
    } catch (e) {}
  };

  const saveWishlist = (data: TravelWishItem[]) => {
    setWishlist(data);
    try {
      localStorage.setItem('banban_travel_wishlist', JSON.stringify(data));
    } catch (e) {}
  };

  // 當前行程下的支出與心願
  const currentTripExpenses = useMemo(() => {
    if (!activeTrip) return [];
    return expenses.filter(e => e.tripId === activeTrip.id);
  }, [expenses, activeTrip]);

  const currentTripWishlist = useMemo(() => {
    if (!activeTrip) return [];
    return wishlist.filter(w => w.tripId === activeTrip.id);
  }, [wishlist, activeTrip]);

  // 開啟建立行程彈窗
  const handleOpenCreateTripModal = () => {
    setIsEditingTrip(false);
    setTripFormTitle('');
    setTripFormDestination('');
    setTripFormEmoji('✈️');
    setTripFormCurrency('JPY');
    setTripFormRate('0.215');
    setTripFormHasBudget(false);
    setTripFormBudget('60000');
    const today = new Date().toISOString().split('T')[0];
    setTripFormStartDate(today);
    setTripFormEndDate(today);
    setTripFormTheme('rose');
    setTripFormMembers(['廖', '周']);
    setNewMemberInput('');
    setIsTripModalOpen(true);
  };

  // 開啟編輯當前行程彈窗（可重命名、修改日期、底色主題、成員、是否啟用預算）
  const handleOpenEditTripModal = () => {
    if (!activeTrip) return;
    setIsEditingTrip(true);
    setTripFormTitle(activeTrip.title);
    setTripFormDestination(activeTrip.destination || '');
    setTripFormEmoji(activeTrip.coverEmoji || '✈️');
    setTripFormCurrency(activeTrip.currency || 'JPY');
    setTripFormRate(String(activeTrip.exchangeRate || 1));
    const hasBud = !!(activeTrip.budgetTWD && activeTrip.budgetTWD > 0);
    setTripFormHasBudget(hasBud);
    setTripFormBudget(hasBud ? String(activeTrip.budgetTWD) : '60000');
    setTripFormStartDate(activeTrip.startDate || '');
    setTripFormEndDate(activeTrip.endDate || '');
    setTripFormTheme(activeTrip.themeColor || 'rose');
    setTripFormMembers(activeTrip.members && activeTrip.members.length > 0 ? [...activeTrip.members] : ['廖', '周']);
    setNewMemberInput('');
    setIsTripModalOpen(true);
  };

  // 旅程起訖日期防呆切換
  const handleStartDateChange = (newStart: string) => {
    setTripFormStartDate(newStart);
    if (tripFormEndDate && newStart && tripFormEndDate < newStart) {
      setTripFormEndDate(newStart);
    }
  };

  const handleEndDateChange = (newEnd: string) => {
    setTripFormEndDate(newEnd);
    if (tripFormStartDate && newEnd && newEnd < tripFormStartDate) {
      setTripFormStartDate(newEnd);
    }
  };

  // 新增自訂成員到行程表單
  const handleAddMemberToForm = () => {
    const trimmed = newMemberInput.trim();
    if (!trimmed) return;
    if (tripFormMembers.includes(trimmed)) {
      showToast('此成員名稱已在清單中', 'info');
      return;
    }
    setTripFormMembers([...tripFormMembers, trimmed]);
    setNewMemberInput('');
    showToast(`已新增成員：${trimmed}`, 'success');
  };

  // 移除成員
  const handleRemoveMemberFromForm = (name: string) => {
    if (tripFormMembers.length <= 1) {
      showToast('行程至少需保留一位成員', 'error');
      return;
    }
    setTripFormMembers(tripFormMembers.filter(m => m !== name));
  };

  // 儲存/更新行程
  const handleSaveTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripFormTitle.trim()) {
      showToast('請輸入行程名稱', 'error');
      return;
    }
    const rate = parseFloat(tripFormRate) || 1;
    const budget = tripFormHasBudget ? (parseFloat(tripFormBudget) || 0) : undefined;

    let finalStart = tripFormStartDate || new Date().toISOString().split('T')[0];
    let finalEnd = tripFormEndDate || finalStart;
    if (finalStart && finalEnd && finalEnd < finalStart) {
      finalEnd = finalStart;
    }

    if (isEditingTrip && activeTrip) {
      // 編輯更新
      const targetTrip: TravelTrip = {
        ...activeTrip,
        title: tripFormTitle.trim(),
        destination: tripFormDestination.trim() || '自由行',
        coverEmoji: tripFormEmoji.trim() || '✈️',
        startDate: finalStart,
        endDate: finalEnd,
        currency: tripFormCurrency,
        exchangeRate: rate,
        budgetTWD: budget,
        themeColor: tripFormTheme,
        members: tripFormMembers,
      };
      const updated = trips.map(t => t.id === activeTrip.id ? targetTrip : t);
      saveTrips(updated);
      setIsTripModalOpen(false);
      showToast(`已成功更新行程「${tripFormTitle.trim()}」`, 'success');

      if (callGasApi) {
        callGasApi('saveTravelTrip', targetTrip).then(res => {
          if (res?.success) {
            fetchTravelDataFromGas(true);
          }
        }).catch(() => {});
      }
    } else {
      // 新建行程
      const newTrip: TravelTrip = {
        id: 'trip-' + Date.now(),
        title: tripFormTitle.trim(),
        destination: tripFormDestination.trim() || '自由行',
        coverEmoji: tripFormEmoji.trim() || '✈️',
        startDate: finalStart,
        endDate: finalEnd,
        currency: tripFormCurrency,
        exchangeRate: rate,
        budgetTWD: budget,
        status: '進行中',
        themeColor: tripFormTheme,
        members: tripFormMembers,
        createdAt: new Date().toISOString().split('T')[0]
      };
      const updated = [newTrip, ...trips];
      saveTrips(updated);
      setActiveTripId(newTrip.id);
      setIsTripModalOpen(false);
      showToast(`已建立新旅程：${newTrip.title}`, 'success');

      if (callGasApi) {
        callGasApi('saveTravelTrip', newTrip).then(res => {
          if (res?.success) {
            fetchTravelDataFromGas(true);
          }
        }).catch(() => {});
      }
    }
  };

  // 觸發刪除當前行程（透過自訂確認視窗，保證在 iFrame 與任何環境皆能正常運作）
  const promptDeleteTrip = () => {
    if (!activeTrip) return;
    setDeleteConfirmState({
      isOpen: true,
      title: '確定刪除旅程？',
      message: `確定要刪除「${activeTrip.title}」及其所有花費明細嗎？此動作無法復原。`,
      confirmText: '確定刪除',
      dangerLevel: 'danger',
      onConfirm: () => {
        executeDeleteTrip();
      }
    });
  };

  const executeDeleteTrip = () => {
    if (!activeTrip) return;
    const targetId = activeTrip.id;
    const targetTitle = activeTrip.title;

    const remainingTrips = trips.filter(t => t.id !== targetId);
    saveTrips(remainingTrips);
    setActiveTripId(remainingTrips[0]?.id || '');
    // 刪除關聯支出與心願
    saveExpenses(expenses.filter(e => e.tripId !== targetId));
    saveWishlist(wishlist.filter(w => w.tripId !== targetId));
    setIsTripModalOpen(false);
    setDeleteConfirmState(null);
    showToast(`已成功刪除旅程「${targetTitle}」`, 'info');

    if (callGasApi) {
      callGasApi('deleteTravelTrip', { id: targetId }).then(res => {
        if (res?.success) {
          fetchTravelDataFromGas(true);
        }
      }).catch(() => {});
    }
  };

  // 開啟新增支出彈窗
  const handleOpenAddExpenseModal = () => {
    if (!activeTrip) {
      showToast('請先選擇行程', 'error');
      return;
    }
    setEditingExpenseId(null);
    setExpCategory('美食餐廳');
    setExpItemName('');
    setExpPayer(tripMembers[0] || '廖');
    setExpCurrency(activeTrip.currency || 'JPY');
    setExpRate(String(activeTrip.exchangeRate || 0.215));
    setExpOriginalAmount('');
    setExpUnitPrice('');
    setExpQuantity('');
    setExpDiscount('');
    setExpPaymentMethod('信用卡');
    setExpSplitMode('全體AA');
    setExpSplitTarget('全體');
    setExpParticipants([...tripMembers]);
    setExpCustomSplits({});
    setExpLocation('');
    setExpNote('');
    setIsAddExpenseOpen(true);
  };

  // 開啟編輯支出彈窗
  const handleOpenEditExpenseModal = (targetExp: TravelExpenseItem) => {
    if (!activeTrip) return;
    setEditingExpenseId(targetExp.id);
    setExpCategory(targetExp.category || '美食餐廳');
    setExpItemName(targetExp.itemName || '');
    setExpPayer(targetExp.payer || tripMembers[0] || '廖');
    setExpCurrency(targetExp.originalCurrency || activeTrip.currency || 'JPY');
    setExpRate(String(targetExp.exchangeRate || activeTrip.exchangeRate || 1));
    setExpOriginalAmount(String(targetExp.originalAmount || ''));
    setExpUnitPrice(targetExp.unitPrice !== undefined ? String(targetExp.unitPrice) : '');
    setExpQuantity(targetExp.quantity !== undefined ? String(targetExp.quantity) : '');
    setExpDiscount(targetExp.discount !== undefined ? String(targetExp.discount) : '');
    setExpPaymentMethod(targetExp.paymentMethod || '信用卡');
    setExpSplitMode(targetExp.splitMode || '全體AA');
    setExpSplitTarget(targetExp.splitTarget || '全體');
    setExpParticipants(targetExp.participants && targetExp.participants.length > 0 ? [...targetExp.participants] : [...tripMembers]);
    const custMap: Record<string, string> = {};
    if (targetExp.memberSplits) {
      Object.entries(targetExp.memberSplits).forEach(([m, v]) => {
        custMap[m] = String(v);
      });
    }
    setExpCustomSplits(custMap);
    setExpLocation(targetExp.location || '');
    setExpNote(targetExp.note || '');
    setIsAddExpenseOpen(true);
  };

  // 提交新增 / 編輯支出
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;

    let origAmt = parseFloat(expOriginalAmount);
    // 若無輸入總額，但有輸入單價與數量，自動計算總額
    const uPrice = parseFloat(expUnitPrice);
    const qty = parseFloat(expQuantity);
    const disc = parseFloat(expDiscount) || 0;
    if ((isNaN(origAmt) || origAmt <= 0) && !isNaN(uPrice) && uPrice > 0) {
      const q = isNaN(qty) || qty <= 0 ? 1 : qty;
      origAmt = Math.max(0, uPrice * q - disc);
    }

    if (isNaN(origAmt) || origAmt <= 0) {
      showToast('請輸入有效金額', 'error');
      return;
    }
    if (!expItemName.trim()) {
      showToast('請輸入品項名稱', 'error');
      return;
    }

    const rate = parseFloat(expRate) || 1;
    const totalTWD = Math.round(origAmt * rate);

    // 計算各成員應分擔金額
    const participants = expParticipants.length > 0 ? expParticipants : tripMembers;
    const memberSplits: Record<string, number> = {};

    tripMembers.forEach(m => { memberSplits[m] = 0; });

    if (expPayer === '共同基金') {
      // 共同基金支出，不計入個別代墊負債
      tripMembers.forEach(m => { memberSplits[m] = 0; });
    } else if (expSplitMode === '個人自付') {
      // 個人 100% 自付
      const targetPerson = expSplitTarget && expSplitTarget !== '全體' ? expSplitTarget : (expPayer !== '共同基金' ? expPayer : tripMembers[0]);
      memberSplits[targetPerson] = totalTWD;
    } else if (expSplitMode === '全體AA' || expSplitMode === 'AA平分') {
      const share = Math.round(totalTWD / (tripMembers.length || 1));
      tripMembers.forEach(m => { memberSplits[m] = share; });
    } else if (expSplitMode === '參與者AA') {
      if (participants.length === 1) {
        // 若參與者AA僅選取1人，100% 由該成員負擔（等同個人自付/全額代墊）
        const singleTarget = participants[0];
        memberSplits[singleTarget] = totalTWD;
      } else {
        const share = Math.round(totalTWD / (participants.length || 1));
        participants.forEach(m => { memberSplits[m] = share; });
      }
    } else if (expSplitMode === '全額代墊') {
      // 指定參與者全部分擔（扣除 payer 自己）
      const nonPayers = participants.filter(p => p !== expPayer);
      const targetGroup = nonPayers.length > 0 ? nonPayers : participants;
      const share = Math.round(totalTWD / (targetGroup.length || 1));
      targetGroup.forEach(m => { memberSplits[m] = share; });
    } else if (expSplitMode === '自訂金額') {
      participants.forEach(m => {
        memberSplits[m] = parseFloat(expCustomSplits[m] || '0') || 0;
      });
    }

    // 計算對方的總代墊欠款（給雙人或主要成員）
    let debtor = 'none';
    let debtorAmtTWD = 0;
    if (expPayer !== '共同基金') {
      const nonPayers = Object.entries(memberSplits).filter(([m, val]) => m !== expPayer && val > 0);
      if (nonPayers.length === 1) {
        debtor = nonPayers[0][0];
        debtorAmtTWD = nonPayers[0][1];
      } else if (nonPayers.length > 1) {
        debtor = '多位成員';
        debtorAmtTWD = nonPayers.reduce((sum, [, val]) => sum + val, 0);
      }
    }

    const expenseItemData: TravelExpenseItem = {
      id: editingExpenseId || ('exp-' + Date.now()),
      tripId: activeTrip.id,
      date: new Date().toISOString().split('T')[0],
      category: expCategory,
      itemName: expItemName.trim(),
      unitPrice: !isNaN(uPrice) && uPrice > 0 ? uPrice : undefined,
      quantity: !isNaN(qty) && qty > 0 ? qty : undefined,
      discount: !isNaN(disc) && disc > 0 ? disc : undefined,
      payer: expPayer,
      paymentMethod: expPaymentMethod || '信用卡',
      originalCurrency: expCurrency,
      originalAmount: origAmt,
      exchangeRate: rate,
      totalAmountTWD: totalTWD,
      splitMode: expSplitMode,
      splitTarget: expSplitMode === '個人自付' ? expSplitTarget : undefined,
      participants,
      memberSplits,
      debtor,
      debtorAmountTWD: debtorAmtTWD,
      location: expLocation.trim(),
      note: expNote.trim(),
      syncedToSplit: false,
      createdAt: new Date().toISOString().split('T')[0]
    };

    let updatedList: TravelExpenseItem[];
    if (editingExpenseId) {
      updatedList = expenses.map(e => e.id === editingExpenseId ? expenseItemData : e);
      showToast(`已更新旅費：${expenseItemData.itemName}（NT$ ${(Number(totalTWD) || 0).toLocaleString()}）`, 'success');
    } else {
      updatedList = [expenseItemData, ...expenses];
      showToast(`已新增旅費：${expenseItemData.itemName}（NT$ ${(Number(totalTWD) || 0).toLocaleString()}）`, 'success');
    }

    saveExpenses(updatedList);
    setIsAddExpenseOpen(false);
    setEditingExpenseId(null);

    if (callGasApi) {
      callGasApi('addTravelExpense', expenseItemData).then(res => {
        if (res?.success) {
          fetchTravelDataFromGas(true);
        }
      }).catch(() => {});
    }
  };

  // 批次匯入多筆支出 (支援 Excel 貼上)
  const handleImportExpenses = (newExpenses: TravelExpenseItem[]) => {
    if (!activeTrip || newExpenses.length === 0) return;
    const updated = [...newExpenses, ...expenses];
    saveExpenses(updated);
    setIsBatchImportOpen(false);

    const totalImportedTWD = newExpenses.reduce((sum, item) => sum + (Number(item.totalAmountTWD) || 0), 0);
    showToast(`🎉 成功匯入 ${newExpenses.length} 筆旅費支出（總額 NT$ ${(Number(totalImportedTWD) || 0).toLocaleString()}）！`, 'success');

    if (callGasApi) {
      callGasApi('addBatchTravelExpenses', { items: newExpenses }).then(res => {
        if (res?.success) {
          fetchTravelDataFromGas(true);
        }
      }).catch(err => {
        console.error('Batch import GAS error:', err);
      });
    }
  };

  // 連續記帳/收據多品項錄入
  const handleAddQuickExpenses = (newExpenses: TravelExpenseItem[]) => {
    if (!activeTrip || newExpenses.length === 0) return;
    const updated = [...newExpenses, ...expenses];
    saveExpenses(updated);
    setIsReceiptQuickOpen(false);

    const totalTWD = newExpenses.reduce((sum, item) => sum + (Number(item.totalAmountTWD) || 0), 0);
    showToast(`🛒 成功記錄 ${newExpenses.length} 個品項（總額 NT$ ${(Number(totalTWD) || 0).toLocaleString()}）！`, 'success');

    if (callGasApi) {
      callGasApi('addBatchTravelExpenses', { items: newExpenses }).then(res => {
        if (res?.success) {
          fetchTravelDataFromGas(true);
        }
      }).catch(err => {
        console.error('Quick expenses GAS error:', err);
      });
    }
  };

  // 自動同步新發現的同行成員
  const handleAddTripMembers = (newMembers: string[]) => {
    if (!activeTrip || newMembers.length === 0) return;
    const existing = activeTrip.members || ['廖', '周'];
    const merged = Array.from(new Set([...existing, ...newMembers]));
    const updatedTrip: TravelTrip = {
      ...activeTrip,
      members: merged
    };
    const updatedTrips = trips.map(t => t.id === activeTrip.id ? updatedTrip : t);
    saveTrips(updatedTrips);
    showToast(`已為本行程新增同行成員：${newMembers.join('、')}`, 'info');

    if (callGasApi) {
      callGasApi('saveTravelTrip', updatedTrip).then(res => {
        if (res?.success) fetchTravelDataFromGas(true);
      }).catch(() => {});
    }
  };

  // 刪除支出
  const promptDeleteExpense = (expId: string) => {
    const target = expenses.find(e => e.id === expId);
    if (!target) return;
    setDeleteConfirmState({
      isOpen: true,
      title: '刪除支出明細',
      message: `確定要刪除「${target.itemName}」（NT$ ${(Number(target.totalAmountTWD) || 0).toLocaleString()}）嗎？`,
      confirmText: '確定刪除',
      dangerLevel: 'danger',
      onConfirm: () => {
        const updated = expenses.filter(e => e.id !== expId);
        saveExpenses(updated);
        setDeleteConfirmState(null);
        showToast(`已刪除「${target.itemName}」`, 'info');

        if (callGasApi) {
          callGasApi('deleteTravelExpense', { id: expId }).then(res => {
            if (res?.success) {
              fetchTravelDataFromGas(true);
            }
          }).catch(() => {});
        }
      }
    });
  };

  // 多成員結算核心演算法（支援任意多人、個人專屬自付、店家統計與個人明細）
  const tripSummary = useMemo(() => {
    let totalTWD = 0;
    const memberPaid: Record<string, number> = {};
    const memberShare: Record<string, number> = {};
    const memberPersonalAmounts: Record<string, number> = {};
    const memberSharedAmounts: Record<string, number> = {};
    const memberPersonalItems: Record<string, TravelExpenseItem[]> = {};
    const memberSharedItems: Record<string, { item: TravelExpenseItem; share: number }[]> = {};
    const memberPaidItems: Record<string, TravelExpenseItem[]> = {};
    const categoryBreakdown: Record<string, number> = {};
    const locationBreakdown: Record<string, { totalTWD: number; count: number; items: string[] }> = {};

    tripMembers.forEach(m => {
      memberPaid[m] = 0;
      memberShare[m] = 0;
      memberPersonalAmounts[m] = 0;
      memberSharedAmounts[m] = 0;
      memberPersonalItems[m] = [];
      memberSharedItems[m] = [];
      memberPaidItems[m] = [];
    });

    currentTripExpenses.forEach(exp => {
      const amt = Number(exp.totalAmountTWD) || 0;
      totalTWD += amt;

      // 類別累計
      categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + amt;

      // 地點累計
      const loc = exp.location?.trim() || '未標註地點';
      if (!locationBreakdown[loc]) {
        locationBreakdown[loc] = { totalTWD: 0, count: 0, items: [] };
      }
      locationBreakdown[loc].totalTWD += amt;
      locationBreakdown[loc].count += 1;
      if (!locationBreakdown[loc].items.includes(exp.itemName)) {
        locationBreakdown[loc].items.push(exp.itemName);
      }

      // 付款人
      if (exp.payer !== '共同基金') {
        memberPaid[exp.payer] = (memberPaid[exp.payer] || 0) + amt;
        if (memberPaidItems[exp.payer]) {
          memberPaidItems[exp.payer].push(exp);
        }
      }

      // 分攤統計
      if (exp.splitMode === '個人自付' && exp.splitTarget && exp.splitTarget !== '全體') {
        const target = exp.splitTarget;
        memberShare[target] = (memberShare[target] || 0) + amt;
        memberPersonalAmounts[target] = (memberPersonalAmounts[target] || 0) + amt;
        if (memberPersonalItems[target]) {
          memberPersonalItems[target].push(exp);
        }
      } else if (exp.memberSplits && Object.keys(exp.memberSplits).length > 0) {
        Object.entries(exp.memberSplits).forEach(([m, shareAmt]) => {
          const s = Number(shareAmt) || 0;
          memberShare[m] = (memberShare[m] || 0) + s;
          if (s > 0) {
            // 判斷是否為唯一負擔者（個人自付）
            const nonZeroSplits = Object.values(exp.memberSplits || {}).filter(v => (Number(v) || 0) > 0);
            if (nonZeroSplits.length === 1) {
              memberPersonalAmounts[m] = (memberPersonalAmounts[m] || 0) + s;
              if (memberPersonalItems[m]) memberPersonalItems[m].push(exp);
            } else {
              memberSharedAmounts[m] = (memberSharedAmounts[m] || 0) + s;
              if (memberSharedItems[m]) memberSharedItems[m].push({ item: exp, share: s });
            }
          }
        });
      } else {
        // 舊資料相容：全體 AA
        const perShare = Math.round(amt / (tripMembers.length || 1));
        tripMembers.forEach(m => {
          memberShare[m] = (memberShare[m] || 0) + perShare;
          memberSharedAmounts[m] = (memberSharedAmounts[m] || 0) + perShare;
          if (memberSharedItems[m]) memberSharedItems[m].push({ item: exp, share: perShare });
        });
      }
    });

    // 計算每人淨額 (Net Balance = 付款 - 應負擔)
    // 淨額 > 0 代表該收回的錢 (債權人)；淨額 < 0 代表該付出的錢 (債務人)
    const netBalances: Record<string, number> = {};
    tripMembers.forEach(m => {
      netBalances[m] = (memberPaid[m] || 0) - (memberShare[m] || 0);
    });

    // 簡化債務演算法 (Greedy Debt Settlement)
    const debtors: { member: string; amount: number }[] = [];
    const creditors: { member: string; amount: number }[] = [];

    Object.entries(netBalances).forEach(([m, bal]) => {
      if (bal < -1) {
        debtors.push({ member: m, amount: -bal });
      } else if (bal > 1) {
        creditors.push({ member: m, amount: bal });
      }
    });

    // 排序
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transactions: { from: string; to: string; amount: number }[] = [];
    let dIdx = 0;
    let cIdx = 0;

    const dCopy = debtors.map(d => ({ ...d }));
    const cCopy = creditors.map(c => ({ ...c }));

    while (dIdx < dCopy.length && cIdx < cCopy.length) {
      const debtor = dCopy[dIdx];
      const creditor = cCopy[cIdx];
      const settleAmt = Math.min(debtor.amount, creditor.amount);

      if (settleAmt > 0) {
        transactions.push({
          from: debtor.member,
          to: creditor.member,
          amount: Math.round(settleAmt)
        });
      }

      debtor.amount -= settleAmt;
      creditor.amount -= settleAmt;

      if (debtor.amount <= 1) dIdx++;
      if (creditor.amount <= 1) cIdx++;
    }

    // 雙人專屬情侶摘要文案
    let coupleResultText = '本趟旅費雙方分攤已完全平衡 ✨';
    let coupleNetDebtor: '廖' | '周' | 'none' = 'none';
    let coupleNetAmount = 0;

    const liaoNet = netBalances['廖'] || 0;
    const zhouNet = netBalances['周'] || 0;

    if (tripMembers.includes('廖') && tripMembers.includes('周')) {
      if (liaoNet > 0 && zhouNet < 0) {
        coupleNetDebtor = '周';
        coupleNetAmount = Math.round(liaoNet);
        coupleResultText = `👧 周周 應返還 廖廖 NT$ ${(Number(coupleNetAmount) || 0).toLocaleString()}`;
      } else if (zhouNet > 0 && liaoNet < 0) {
        coupleNetDebtor = '廖';
        coupleNetAmount = Math.round(zhouNet);
        coupleResultText = `👦 廖廖 應返還 周周 NT$ ${(Number(coupleNetAmount) || 0).toLocaleString()}`;
      }
    }

    const budget = activeTrip?.budgetTWD || 0;
    const budgetUsagePercent = budget > 0 ? Math.min(Math.round((totalTWD / budget) * 100), 100) : 0;
    const perPersonAverage = tripMembers.length > 0 ? Math.round(totalTWD / tripMembers.length) : 0;

    return {
      totalTWD,
      perPersonAverage,
      memberPaid,
      memberShare,
      memberPersonalAmounts,
      memberSharedAmounts,
      memberPersonalItems,
      memberSharedItems,
      memberPaidItems,
      locationBreakdown,
      netBalances,
      transactions,
      coupleResultText,
      coupleNetDebtor,
      coupleNetAmount,
      categoryBreakdown,
      budgetUsagePercent,
      budget
    };
  }, [currentTripExpenses, tripMembers, activeTrip]);

  // 新增心願
  const handleAddWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;
    if (!wishName.trim()) {
      showToast('請輸入預訂或心願名稱', 'error');
      return;
    }
    const newWish: TravelWishItem = {
      id: 'twish-' + Date.now(),
      tripId: activeTrip.id,
      itemName: wishName.trim(),
      category: wishCategory,
      estimatedAmountTWD: parseFloat(wishEstPrice) || undefined,
      addedBy: wishAddedBy,
      status: '待預訂',
      note: wishNote.trim()
    };

    const updated = [newWish, ...wishlist];
    saveWishlist(updated);
    setIsAddWishOpen(false);
    setWishName('');
    setWishEstPrice('');
    setWishNote('');
    showToast(`已新增心願項目：${newWish.itemName}`, 'success');

    if (callGasApi) {
      callGasApi('addTravelWishItem', newWish).then(res => {
        if (res?.success) {
          fetchTravelDataFromGas(true);
        }
      }).catch(() => {});
    }
  };

  const handleToggleWishStatus = (item: TravelWishItem) => {
    const nextStatus: '待預訂' | '已完成' = item.status === '待預訂' ? '已完成' : '待預訂';
    const updated: TravelWishItem[] = wishlist.map(w => w.id === item.id ? { ...w, status: nextStatus } : w);
    saveWishlist(updated);
    if (nextStatus === '已完成') {
      showToast(`已標記為完成！可點擊轉為旅費支出`, 'success');
    }

    if (callGasApi) {
      callGasApi('toggleTravelWishStatus', { id: item.id, status: nextStatus }).then(res => {
        if (res?.success) {
          fetchTravelDataFromGas(true);
        }
      }).catch(() => {});
    }
  };

  const promptDeleteWish = (wishId: string) => {
    const target = wishlist.find(w => w.id === wishId);
    if (!target) return;
    setDeleteConfirmState({
      isOpen: true,
      title: '刪除心願/預訂項目',
      message: `確定要刪除「${target.itemName}」嗎？`,
      confirmText: '確定刪除',
      dangerLevel: 'warning',
      onConfirm: () => {
        const updated = wishlist.filter(w => w.id !== wishId);
        saveWishlist(updated);
        setDeleteConfirmState(null);
        showToast(`已刪除「${target.itemName}」`, 'info');

        if (callGasApi) {
          callGasApi('deleteTravelWishItem', { id: wishId }).then(res => {
            if (res?.success) {
              fetchTravelDataFromGas(true);
            }
          }).catch(() => {});
        }
      }
    });
  };

  // 一鍵轉記帳
  const handleConvertWishToExpense = (wish: TravelWishItem) => {
    setExpItemName(wish.itemName);
    if (CATEGORY_CONFIG[wish.category]) {
      setExpCategory(wish.category as any);
    }
    if (wish.estimatedAmountTWD) {
      setExpOriginalAmount(String(wish.estimatedAmountTWD));
      setExpCurrency('TWD');
      setExpRate('1');
    }
    setIsAddExpenseOpen(true);
  };

  // 一鍵複製完整旅行對帳單 (Line / 通訊群組友善排版)
  const handleCopyBillSummary = () => {
    if (!activeTrip) return;
    const lines = [
      `✈️【${activeTrip.title}】旅行結算帳單 📊`,
      `📅 期間：${activeTrip.startDate} ~ ${activeTrip.endDate} (${activeTrip.destination})`,
      `👥 出遊成員：${tripMembers.join('、')}`,
      `💰 總旅費支出：NT$ ${(Number(tripSummary.totalTWD) || 0).toLocaleString()} 元 (人均 NT$ ${(Number(tripSummary.perPersonAverage) || 0).toLocaleString()})`,
      `------------------------`,
      `🎯 最終平帳轉帳清單（誰該還誰）：`,
      ...(tripSummary.transactions.length > 0 
        ? tripSummary.transactions.map(t => `👉 ${t.from} 應支付給 ${t.to}：NT$ ${(Number(t.amount) || 0).toLocaleString()}`)
        : ['✨ 所有成員分攤皆已完全平衡，無須轉帳！']),
      `------------------------`,
      `💳 各成員收支明細：`,
      ...tripMembers.map(m => {
        const paid = Number(tripSummary.memberPaid[m]) || 0;
        const share = Number(tripSummary.memberShare[m]) || 0;
        const personal = Number(tripSummary.memberPersonalAmounts[m]) || 0;
        const shared = Number(tripSummary.memberSharedAmounts[m]) || 0;
        const net = Number(tripSummary.netBalances[m]) || 0;
        return `• ${m}：先付 $${paid.toLocaleString()} | 應負擔 $${share.toLocaleString()} (個人專屬 $${personal.toLocaleString()} + 均攤 $${shared.toLocaleString()}) ➔ 結算：${net >= 0 ? `應收回 +$${net.toLocaleString()}` : `應支付 -$${Math.abs(net).toLocaleString()}`}`;
      }),
      `------------------------`,
      `📝 類別開銷明細：`,
      ...Object.entries(tripSummary.categoryBreakdown).map(([cat, amt]) => `• ${cat}：NT$ ${(Number(amt) || 0).toLocaleString()} (${Math.round(((Number(amt) || 0) / (tripSummary.totalTWD || 1)) * 100)}%)`),
      `\n✨ 由 伴伴記帳 甜蜜生活記帳本自動產生`
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    showToast('📋 已複製完整旅行對帳單！可直接貼至 LINE / 通訊群組', 'success');
  };

  // 一鍵下載所有旅費支出為標準 Excel 試算表 (.xlsx 活頁簿，不亂碼、排版精確)
  const handleDownloadExcelXLSX = () => {
    if (!activeTrip || currentTripExpenses.length === 0) {
      showToast('目前尚無支出資料可匯出', 'info');
      return;
    }

    try {
      const cur = activeTrip.currency || 'KRW';
      const headers = [
        '時間戳記',
        '購物地點',
        '品項',
        `單價(${cur})`,
        '數量',
        `小計(${cur})`,
        '備註/折扣',
        '款項支付方式',
        '代墊人',
        '分帳對象(就是誰要還給代墊人)'
      ];

      const rows = currentTripExpenses.map(exp => {
        let splitTargetText = '全體AA';
        if (exp.splitMode === '個人自付') {
          splitTargetText = exp.splitTarget || '個人自付';
        } else if (exp.splitMode === '全額代墊') {
          const target = (exp.participants || []).filter(p => p !== exp.payer)[0] || exp.splitTarget || '全額代墊';
          splitTargetText = target;
        } else if (exp.splitMode === '全體AA' || exp.splitMode === 'AA平分') {
          splitTargetText = '全體AA';
        } else if (exp.splitMode === '參與者AA') {
          if (exp.participants && exp.participants.length === 1) {
            splitTargetText = exp.participants[0];
          } else if (exp.participants && exp.participants.length > 0) {
            splitTargetText = exp.participants.join('+');
          } else {
            splitTargetText = '全體AA';
          }
        }

        return [
          exp.date || '',
          exp.location || '',
          exp.itemName || '',
          exp.unitPrice !== undefined ? exp.unitPrice : (exp.originalAmount || 0),
          exp.quantity !== undefined ? exp.quantity : 1,
          exp.originalAmount || 0,
          exp.note || '',
          exp.paymentMethod || '信用卡',
          exp.payer || '',
          splitTargetText
        ];
      });

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws['!cols'] = [
        { wch: 18 }, // 時間戳記
        { wch: 22 }, // 購物地點
        { wch: 32 }, // 品項
        { wch: 14 }, // 單價
        { wch: 8 },  // 數量
        { wch: 14 }, // 小計
        { wch: 16 }, // 備註/折扣
        { wch: 14 }, // 款項支付方式
        { wch: 12 }, // 代墊人
        { wch: 22 }  // 分帳對象
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '旅費支出明細');

      const fileName = `旅費支出明細_${activeTrip.title || '旅程'}_${cur}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast(`📥 已成功下載 Excel 檔案「${fileName}」！`, 'success');
    } catch (err) {
      console.error('Export XLSX error:', err);
      showToast('匯出 Excel 檔案失敗，請改用複製表格', 'error');
    }
  };

  // 一鍵複製所有旅費支出為 Excel 試算表格式 (Tab 分隔，可直接貼上試算表，精準對齊 10 欄)
  const handleCopyExcelData = () => {
    if (!activeTrip || currentTripExpenses.length === 0) {
      showToast('目前尚無支出資料可匯出', 'info');
      return;
    }

    const cur = activeTrip.currency || 'KRW';
    const headers = [
      '時間戳記',
      '購物地點',
      '品項',
      `單價(${cur})`,
      '數量',
      `小計(${cur})`,
      '備註/折扣',
      '款項支付方式',
      '代墊人',
      '分帳對象(就是誰要還給代墊人)'
    ];

    const rows = currentTripExpenses.map(exp => {
      let splitTargetText = '全體AA';
      if (exp.splitMode === '個人自付') {
        splitTargetText = exp.splitTarget || '個人自付';
      } else if (exp.splitMode === '全額代墊') {
        const target = (exp.participants || []).filter(p => p !== exp.payer)[0] || exp.splitTarget || '全額代墊';
        splitTargetText = target;
      } else if (exp.splitMode === '全體AA' || exp.splitMode === 'AA平分') {
        splitTargetText = '全體AA';
      } else if (exp.splitMode === '參與者AA') {
        if (exp.participants && exp.participants.length === 1) {
          splitTargetText = exp.participants[0];
        } else if (exp.participants && exp.participants.length > 0) {
          splitTargetText = exp.participants.join('+');
        } else {
          splitTargetText = '全體AA';
        }
      }

      return [
        exp.date || '',
        exp.location || '',
        exp.itemName || '',
        exp.unitPrice !== undefined ? exp.unitPrice : (exp.originalAmount || 0),
        exp.quantity !== undefined ? exp.quantity : 1,
        exp.originalAmount || 0,
        exp.note || '',
        exp.paymentMethod || '信用卡',
        exp.payer || '',
        splitTargetText
      ].join('\t');
    });

    const tsvContent = [headers.join('\t'), ...rows].join('\n');
    navigator.clipboard.writeText(tsvContent);
    showToast('📥 已複製 10 欄標準 Excel 格式表格！可直接在 Google 試算表或 Excel 中按下 Ctrl+V 貼上', 'success');
  };

  // 一鍵將旅費分帳轉入日常代墊借還
  const handleSyncToMainSplit = () => {
    if (tripSummary.coupleNetAmount <= 0 || tripSummary.coupleNetDebtor === 'none') {
      showToast('目前廖廖與周周的旅行分攤已平衡，無須匯入', 'info');
      return;
    }

    const payer = tripSummary.coupleNetDebtor === '周' ? '廖' : '周';
    onConvertToSplit({
      payer,
      itemName: `✈️ ${activeTrip?.title || '旅行'} 總結算平帳款`,
      totalAmount: tripSummary.coupleNetAmount * 2 // 轉入日常代墊 (AA 平分後應返還 coupleNetAmount)
    });
    showToast(`🎉 已成功將旅行分帳 NT$ ${(Number(tripSummary.coupleNetAmount) || 0).toLocaleString()} 匯入日常代墊！`, 'success');
  };

  // 支出分類與多條件篩選
  const filteredExpenses = useMemo(() => {
    return currentTripExpenses.filter(e => {
      // 類別篩選
      if (filterCategory !== 'ALL' && e.category !== filterCategory) return false;
      // 代墊人篩選
      if (filterPayer !== 'ALL' && e.payer !== filterPayer) return false;
      // 分帳對象篩選
      if (filterSplitPerson !== 'ALL') {
        if (filterSplitPerson === '全體AA') {
          if (e.splitMode !== '全體AA' && e.splitMode !== 'AA平分') return false;
        } else if (filterSplitPerson === '個人自付') {
          if (e.splitMode !== '個人自付') return false;
        } else {
          // 指定成員：或是他是個人自付對象、或是 memberSplits 中有他
          const hasMemberSplit = e.memberSplits && (e.memberSplits[filterSplitPerson] || 0) > 0;
          const isTarget = e.splitTarget === filterSplitPerson;
          if (!hasMemberSplit && !isTarget) return false;
        }
      }
      // 關鍵字搜尋
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const matchName = e.itemName.toLowerCase().includes(kw);
        const matchLoc = (e.location || '').toLowerCase().includes(kw);
        const matchNote = (e.note || '').toLowerCase().includes(kw);
        const matchPayer = (e.payer || '').toLowerCase().includes(kw);
        const matchTarget = (e.splitTarget || '').toLowerCase().includes(kw);
        if (!matchName && !matchLoc && !matchNote && !matchPayer && !matchTarget) return false;
      }
      return true;
    });
  }, [currentTripExpenses, filterCategory, filterPayer, filterSplitPerson, searchKeyword]);

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
              尚未登錄 Google 試算表 Web App API 金鑰，無法讀取旅遊分帳與行程專案。請先設定連線金鑰以同步雲端數據。
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

  // 若完全沒有任何旅程時的乾淨空白預設頁
  if (!activeTrip || trips.length === 0) {
    return (
      <div className="max-w-4xl mx-auto pb-4 sm:pb-6 font-sans space-y-4 sm:space-y-6">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-[#E8E4D9] text-center shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto text-3xl shadow-inner">
            ✈️
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-lg sm:text-xl font-black text-[#3E3A36]">
              目前沒有進行中的旅遊分帳專案
            </h2>
            <p className="text-xs text-[#8C8475] leading-relaxed">
              為你們的下一趟出遊或朋友聚會建立專屬分帳本吧！支援多人代墊、外幣匯率自動換算、心願清單與智慧平帳。
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleOpenCreateTripModal}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-sm font-bold shadow-md transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>建立第一趟旅行專案</span>
            </button>
            <button
              type="button"
              onClick={() => fetchTravelDataFromGas(false)}
              disabled={isGasLoading}
              className="px-5 py-3 rounded-2xl bg-white hover:bg-stone-50 border border-[#DDD8CC] text-[#5C564E] text-sm font-bold shadow-xs transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isGasLoading ? 'animate-spin text-rose-600' : 'text-[#8C8475]'}`} />
              <span>{isGasLoading ? '同步中...' : '從 Google 試算表同步'}</span>
            </button>
          </div>
        </div>

        {/* 建立行程 Modal 依然可被開啟 */}
        <AnimatePresence>
          {isTripModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-[#E8E4D9] max-h-[90vh] flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between p-5 sm:px-6 pb-3 border-b border-[#F0ECE1] shrink-0 bg-white">
                  <h3 className="font-black text-base text-[#3E3A36] flex items-center gap-2">
                    <span>{tripFormEmoji}</span>
                    <span>{isEditingTrip ? '編輯旅程設定' : '建立新旅程專案'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsTripModalOpen(false)}
                    className="p-1 rounded-full text-[#A09A8F] hover:text-[#3E3A36] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveTrip} className="flex-1 flex flex-col min-h-0 overflow-hidden text-xs">
                  <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4">
                    {/* 旅程名稱與 Emoji */}
                    <div className="space-y-1">
                      <label className="font-bold text-[#5C564E]">旅程名稱 & Emoji 標誌</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tripFormEmoji}
                          onChange={(e) => setTripFormEmoji(e.target.value)}
                          placeholder="✈️"
                          className="w-14 p-2.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl text-center text-lg focus:outline-none focus:border-rose-500"
                        />
                        <input
                          type="text"
                          value={tripFormTitle}
                          onChange={(e) => setTripFormTitle(e.target.value)}
                          placeholder="例：🇯🇵 東京 5 天 4 夜自由行"
                          className="flex-1 p-2.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl font-bold text-[#3E3A36] focus:outline-none focus:border-rose-500"
                          required
                        />
                      </div>
                    </div>

                    {/* 目的地與預算 */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="font-bold text-[#5C564E]">目的地</label>
                        <input
                          type="text"
                          value={tripFormDestination}
                          onChange={(e) => setTripFormDestination(e.target.value)}
                          placeholder="例：東京、沖繩、花東"
                          className="w-full p-2.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl focus:outline-none focus:border-rose-500 font-medium"
                        />
                      </div>

                      {/* 預算上限開關與設定 */}
                      <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E4D9] space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-[#3E3A36] text-xs flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                              <span>設定預算上限目標</span>
                            </div>
                            <div className="text-[10px] text-[#8C8475]">可自訂是否監控旅費預算進度條</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTripFormHasBudget(!tripFormHasBudget)}
                            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                              tripFormHasBudget ? 'bg-rose-600' : 'bg-[#DDD8CC]'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                                tripFormHasBudget ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {tripFormHasBudget && (
                          <div className="pt-2 border-t border-[#EAE5DA] space-y-1">
                            <label className="font-bold text-[#5C564E] text-[11px]">預算目標金額 (NTD)</label>
                            <input
                              type="number"
                              value={tripFormBudget}
                              onChange={(e) => setTripFormBudget(e.target.value)}
                              placeholder="例：60000"
                              className="w-full p-2.5 bg-white border border-[#E2DDD2] rounded-xl focus:outline-none focus:border-rose-500 font-bold text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 旅程起訖時間 (自訂期間) */}
                    <div className="space-y-1">
                      <label className="font-bold text-[#5C564E] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-rose-600" />
                        <span>旅行日期區間（可自訂）</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-[#8C8475]">開始日期</span>
                          <input
                            type="date"
                            value={tripFormStartDate}
                            max={tripFormEndDate || undefined}
                            onChange={(e) => handleStartDateChange(e.target.value)}
                            className="w-full p-2 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl focus:outline-none focus:border-rose-500"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-[#8C8475]">結束日期</span>
                          <input
                            type="date"
                            value={tripFormEndDate}
                            min={tripFormStartDate || undefined}
                            onChange={(e) => handleEndDateChange(e.target.value)}
                            className="w-full p-2 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 外幣幣別與匯率換算 */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="font-bold text-[#5C564E]">主要幣別</label>
                        <select
                          value={tripFormCurrency}
                          onChange={(e) => {
                            const cur = e.target.value;
                            setTripFormCurrency(cur);
                            if (CURRENCY_DEFAULTS[cur]) {
                              setTripFormRate(String(CURRENCY_DEFAULTS[cur].rate));
                            }
                          }}
                          className="w-full p-2.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl font-bold"
                        >
                          {Object.entries(CURRENCY_DEFAULTS).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-[#5C564E]">換算匯率 (1外幣 = ? TWD)</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={tripFormRate}
                          onChange={(e) => setTripFormRate(e.target.value)}
                          placeholder="0.215"
                          className="w-full p-2.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl font-bold"
                        />
                      </div>
                    </div>

                    {/* 旅程主題 */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-[#5C564E] flex items-center gap-1">
                        <Palette className="w-3.5 h-3.5 text-rose-600" />
                        <span>自訂旅程主題</span>
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {Object.values(TRIP_THEMES).map(theme => (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => setTripFormTheme(theme.id)}
                            className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                              tripFormTheme === theme.id
                                ? 'border-stone-800 ring-2 ring-stone-800 bg-white shadow-xs'
                                : 'border-[#E2DDD2] bg-[#FAF8F5] hover:bg-white'
                            }`}
                          >
                            <div className={`w-full h-4 rounded-lg bg-gradient-to-r ${theme.gradient}`} />
                            <span className="text-[10px] font-bold text-[#3E3A36] truncate w-full">
                              {theme.badge} {theme.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 出遊成員設定 */}
                    <div className="space-y-2 p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E4D9]">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-[#5C564E] flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-sky-600" />
                          <span>同行成員名單</span>
                        </label>
                        <span className="text-[10px] text-[#8C8475]">共 {tripFormMembers.length} 人</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {tripFormMembers.map(member => (
                          <span
                            key={member}
                            className="px-2.5 py-1 rounded-xl bg-white border border-[#DDD8CC] text-[#3E3A36] font-bold text-xs flex items-center gap-1 shadow-2xs"
                          >
                            <span>{member}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMemberFromForm(member)}
                              className="text-[#A09A8F] hover:text-rose-600 cursor-pointer ml-0.5"
                              title="移除此成員"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={newMemberInput}
                          onChange={(e) => setNewMemberInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddMemberToForm();
                            }
                          }}
                          placeholder="輸入同行朋友名字，例如：阿翔、小晴、媽媽"
                          className="flex-1 p-2 bg-white border border-[#DDD8CC] rounded-xl text-xs focus:outline-none focus:border-rose-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddMemberToForm}
                          className="px-3 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>新增</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:px-6 border-t border-[#F0ECE1] bg-white shrink-0 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsTripModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-[#DDD8CC] text-[#7A7366] font-bold cursor-pointer hover:bg-stone-50"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold shadow-md cursor-pointer active:scale-95"
                    >
                      建立旅程
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 sm:space-y-5 max-w-4xl mx-auto pb-4 sm:pb-6 font-sans">
      {/* 1. 頂部旅行專案橫幅 (支援自訂底色主題、重新命名、自訂時間、成員標籤) */}
      <div className={`bg-gradient-to-r ${currentTheme.gradient} text-white rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden transition-all duration-300`}>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 sm:py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] sm:text-[11px] font-bold text-white flex items-center gap-1 border border-white/20">
                <Palmtree className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>旅遊分帳專案</span>
              </span>
              <span className="px-2.5 py-0.5 sm:py-1 rounded-full bg-black/25 text-[10px] sm:text-[11px] font-semibold text-white/90 border border-white/10 flex items-center gap-1">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{tripMembers.length} 位成員 ({tripMembers.join('、')})</span>
              </span>
            </div>

            {/* 行程名稱與目的地 */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="text-2.5xl sm:text-3xl shrink-0 p-1 bg-white/10 rounded-2xl backdrop-blur-xs">
                {activeTrip?.coverEmoji || '✈️'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-2xl font-black tracking-tight drop-shadow-xs leading-snug">
                    {activeTrip?.title || '尚未選擇行程'}
                  </h1>
                </div>
                {/* 日期、地點、匯率 (緊湊窄行高設計) */}
                <div className="flex items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-white/85 pt-0.5 flex-wrap font-medium leading-tight">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-white/90 shrink-0" />
                    <span>{activeTrip?.startDate} ~ {activeTrip?.endDate}</span>
                  </span>
                  <span className="opacity-60">•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-white/90 shrink-0" />
                    <span>{activeTrip?.destination}</span>
                  </span>
                  <span className="opacity-60">•</span>
                  <span>外幣：{activeTrip?.currency} ({activeTrip?.exchangeRate})</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右側操作區：純符號輕量按鈕組 (同步、切換、設定、新增) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap self-start sm:self-auto shrink-0">
            {/* 試算表同步按鈕 (純符號) */}
            <button
              type="button"
              onClick={() => fetchTravelDataFromGas(false)}
              disabled={isGasLoading}
              className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0 shadow-2xs"
              title="與 Google 試算表同步"
              aria-label="與 Google 試算表同步"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGasLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* 行程下拉選單 (小框緊湊版) */}
            <div className="relative shrink-0">
              <select
                value={activeTripId}
                onChange={(e) => setActiveTripId(e.target.value)}
                className="appearance-none bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-xs h-8 sm:h-8.5 pl-2.5 pr-7 rounded-xl backdrop-blur-md cursor-pointer transition-colors focus:outline-none"
              >
                {trips.map(t => (
                  <option key={t.id} value={t.id} className="text-[#3E3A36] bg-white">
                    {t.coverEmoji} {t.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/80" />
            </div>

            {/* 編輯當前行程 (純符號按鈕) */}
            <button
              type="button"
              onClick={handleOpenEditTripModal}
              className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0 shadow-2xs"
              title="行程設定（編輯名稱、時間、主題、成員）"
              aria-label="行程設定"
            >
              <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* 建立新行程 (純符號按鈕) */}
            <button
              type="button"
              onClick={handleOpenCreateTripModal}
              className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-white text-[#3E3A36] hover:bg-white/90 shadow-md transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
              title="建立新旅程專案"
              aria-label="建立新旅程專案"
            >
              <Plus className="w-4 h-4 text-[#3E3A36]" />
            </button>
          </div>
        </div>

        {/* 預算與進度條 */}
        {activeTrip?.budgetTWD && activeTrip.budgetTWD > 0 && (
          <div className="mt-5 pt-4 border-t border-white/20 relative z-10 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-white/90">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>預算使用率 ({tripSummary.budgetUsagePercent}%)</span>
              </span>
              <span>
                NT$ {(Number(tripSummary.totalTWD) || 0).toLocaleString()} / {(Number(activeTrip.budgetTWD) || 0).toLocaleString()} (剩餘 NT$ {Math.max(0, (Number(activeTrip.budgetTWD) || 0) - (Number(tripSummary.totalTWD) || 0)).toLocaleString()})
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/25 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  tripSummary.budgetUsagePercent > 90 ? 'bg-amber-300' : 'bg-white'
                }`}
                style={{ width: `${tripSummary.budgetUsagePercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. 即時分帳結算面板 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* 卡片 1: 總花費與人均 */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C8475] flex items-center gap-1">
              <CreditCard className="w-4 h-4 text-sky-600" />
              <span>本趟總花費 (TWD)</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-[#5C564E] font-bold border border-[#E2DDD2]">
              共 {currentTripExpenses.length} 筆
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#3E3A36]">
            NT$ {(Number(tripSummary.totalTWD) || 0).toLocaleString()}
          </div>
          <div className="text-xs text-[#7A7366] flex items-center justify-between pt-1 border-t border-[#F0ECE1]">
            <span>{tripMembers.length} 位成員人均：</span>
            <span className="font-bold text-rose-700">NT$ {(Number(tripSummary.perPersonAverage) || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* 卡片 2: 各成員先墊款項一覽 */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#E8E4D9] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C8475] flex items-center gap-1">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>各成員先墊付總額</span>
            </span>
            <span className="text-[10px] text-[#A09A8F]">點擊設定可增減成員</span>
          </div>

          <div className="space-y-1.5 pt-0.5 max-h-24 overflow-y-auto scrollbar-none">
            {tripMembers.map(m => (
              <div key={m} className="flex items-center justify-between text-xs">
                <span className="text-[#6E6659] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                  <span>{m} 先出：</span>
                </span>
                <span className="font-black text-[#3E3A36]">
                  NT$ {(Number(tripSummary.memberPaid?.[m]) || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 卡片 3: 智慧平帳結算結果與同步匯入 */}
        <div className={`bg-gradient-to-br ${currentTheme.cardBg} backdrop-blur-md rounded-2xl p-4 sm:p-5 border ${currentTheme.border} shadow-2xs space-y-2 flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${currentTheme.textAccent} flex items-center gap-1`}>
                <Sparkles className="w-4 h-4" />
                <span>平帳結算結果</span>
              </span>
              <button
                type="button"
                onClick={handleCopyBillSummary}
                className={`text-[11px] ${currentTheme.textAccent} hover:underline flex items-center gap-0.5 font-bold cursor-pointer`}
                title="複製旅費對帳清單"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>複製帳單</span>
              </button>
            </div>

            <div className="mt-1 space-y-1">
              {tripSummary.transactions.length > 0 ? (
                tripSummary.transactions.slice(0, 2).map((t, idx) => (
                  <div key={idx} className="text-xs font-black text-[#3E3A36] flex items-center justify-between bg-white/70 px-2.5 py-1 rounded-lg">
                    <span>👉 {t.from} 應支付 {t.to}</span>
                    <span className="text-rose-700">NT$ {(Number(t.amount) || 0).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs font-bold text-[#6E6659] pt-1">
                  ✨ 目前全體成員帳目平衡，無須轉帳
                </div>
              )}
              {tripSummary.transactions.length > 2 && (
                <div className="text-[10px] text-[#8C8475] text-right font-medium">
                  還有 {tripSummary.transactions.length - 2} 筆 (請見結算頁籤)
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSyncToMainSplit}
              disabled={tripSummary.coupleNetAmount <= 0 || tripSummary.coupleNetDebtor === 'none'}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                tripSummary.coupleNetAmount <= 0 || tripSummary.coupleNetDebtor === 'none'
                  ? 'bg-[#E5E0D5] text-[#A09A8F] cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>同步匯入情侶代墊總帳</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. 子功能切換 Tabs */}
      <div className="bg-[#FAF9F5] p-1 rounded-2xl border border-[#E8E4D9] flex items-center gap-1">
        <button
          type="button"
          onClick={() => setSubTab('expenses')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'expenses'
              ? 'bg-white text-rose-700 shadow-xs border border-[#E0DCD3]'
              : 'text-[#8C8475] hover:text-[#3E3A36]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>支出流水 ({currentTripExpenses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('wishlist')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'wishlist'
              ? 'bg-white text-rose-700 shadow-xs border border-[#E0DCD3]'
              : 'text-[#8C8475] hover:text-[#3E3A36]'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>行前預訂 & 心願 ({currentTripWishlist.filter(w => w.status === '待預訂').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('settlement')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'settlement'
              ? 'bg-white text-rose-700 shadow-xs border border-[#E0DCD3]'
              : 'text-[#8C8475] hover:text-[#3E3A36]'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>多成員結算清單</span>
        </button>
      </div>

      {/* 4. Tab 1: 支出流水與明細 */}
      {subTab === 'expenses' && (
        <div className="space-y-4">
          {/* 上方功能工具列：記一筆、快速收據、Excel 匯入、下載 Excel、複製試算表 (純符號輕量按鈕組) */}
          <div className="bg-white/80 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-[#E8E4D9] space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              {/* 左側操作：記一筆、快速收據、Excel 匯入 */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap">
                {/* 記一筆旅費 */}
                <button
                  type="button"
                  onClick={handleOpenAddExpenseModal}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-2xs transition-all cursor-pointer flex items-center justify-center active:scale-95 shrink-0"
                  title="記一筆旅費"
                  aria-label="記一筆旅費"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* 快速收據記帳 */}
                <button
                  type="button"
                  onClick={() => setIsReceiptQuickOpen(true)}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-2xs transition-all cursor-pointer flex items-center justify-center active:scale-95 shrink-0"
                  title="快速收據記帳（單張收據連續記錄多品項與個人自付）"
                  aria-label="快速收據記帳"
                >
                  <Receipt className="w-4 h-4" />
                </button>

                {/* Excel 貼上匯入 */}
                <button
                  type="button"
                  onClick={() => setIsBatchImportOpen(true)}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-2xs transition-all cursor-pointer flex items-center justify-center active:scale-95 shrink-0"
                  title="Excel 貼上匯入（直接複製試算表整批貼上）"
                  aria-label="Excel 貼上匯入"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
              </div>

              {/* 右側操作：下載 Excel、複製試算表 */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* 下載 Excel (.xlsx) */}
                <button
                  type="button"
                  onClick={handleDownloadExcelXLSX}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-2xs shrink-0"
                  title="下載標準 Excel 活頁簿 (.xlsx)"
                  aria-label="下載 Excel (.xlsx)"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                {/* 複製試算表格式 */}
                <button
                  type="button"
                  onClick={handleCopyExcelData}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F0ECE1] border border-[#DDD8CC] text-[#5C564E] transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-2xs shrink-0"
                  title="複製全部明細為試算表文字格式 (可直接貼至 Excel / Google 試算表)"
                  aria-label="複製明細"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 篩選與搜尋列 */}
            <div className="pt-2 border-t border-[#F0ECE1] flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              {/* 搜尋關鍵字 */}
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A09A8F]" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜尋品項、地點、備註或付款人..."
                  className="w-full pl-8 pr-7 py-1.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl text-xs focus:outline-none focus:border-rose-500 font-medium"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A09A8F] hover:text-[#3E3A36]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 代墊人 & 分帳篩選 */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-[#8C8475] font-bold">代墊：</span>
                  <select
                    value={filterPayer}
                    onChange={(e) => setFilterPayer(e.target.value)}
                    className="p-1.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl font-bold text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="ALL">全部成員</option>
                    {tripMembers.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    <option value="共同基金">共同公費</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-[#8C8475] font-bold">分帳：</span>
                  <select
                    value={filterSplitPerson}
                    onChange={(e) => setFilterSplitPerson(e.target.value)}
                    className="p-1.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl font-bold text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="ALL">全部模式</option>
                    <option value="全體AA">全體AA</option>
                    <option value="個人自付">個人自付</option>
                    {tripMembers.map(m => (
                      <option key={m} value={m}>含 {m} 的分帳</option>
                    ))}
                  </select>
                </div>

                {(filterCategory !== 'ALL' || filterPayer !== 'ALL' || filterSplitPerson !== 'ALL' || searchKeyword) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterCategory('ALL');
                      setFilterPayer('ALL');
                      setFilterSplitPerson('ALL');
                      setSearchKeyword('');
                    }}
                    className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer"
                  >
                    重設篩選
                  </button>
                )}
              </div>
            </div>

            {/* 類別標籤列 */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              <button
                type="button"
                onClick={() => setFilterCategory('ALL')}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filterCategory === 'ALL'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-[#FAF8F5] text-[#7A7366] hover:bg-[#EAE5DC] border border-[#E2DDD2]'
                }`}
              >
                全部類別 ({currentTripExpenses.length})
              </button>
              {Object.keys(CATEGORY_CONFIG).map(cat => {
                const count = currentTripExpenses.filter(e => e.category === cat).length;
                if (count === 0 && filterCategory !== cat) return null;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                      filterCategory === cat
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-[#FAF8F5] text-[#7A7366] hover:bg-[#EAE5DC] border border-[#E2DDD2]'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 支出列表 */}
          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center bg-white/60 rounded-3xl border border-dashed border-[#DDD8CD] space-y-3">
              <div className="text-4xl">🧳</div>
              <h3 className="text-sm font-bold text-[#5C564E]">
                {searchKeyword || filterCategory !== 'ALL' || filterPayer !== 'ALL' || filterSplitPerson !== 'ALL'
                  ? '找不到符合條件的支出記錄'
                  : '目前本行程尚無支出記錄'}
              </h3>
              <p className="text-xs text-[#8C8475] max-w-md mx-auto">
                {searchKeyword || filterCategory !== 'ALL'
                  ? '請嘗試切換篩選條件或清除關鍵字'
                  : '點擊上方「記一筆旅費」、「快速收據記帳」或「Excel 貼上匯入」開始記錄你的旅行品項！'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredExpenses.map((exp) => {
                const conf = CATEGORY_CONFIG[exp.category] || CATEGORY_CONFIG['其他雜支'];
                const Icon = conf.icon;

                // 判斷是否為單人負擔（包含個人自付、全額代墊、或參與者AA只勾選1人）
                const isSingleTarget = 
                  exp.splitMode === '個人自付' ||
                  exp.splitMode === '全額代墊' ||
                  (exp.splitMode === '參與者AA' && (exp.participants || []).length === 1);

                let targetPerson = '';
                if (exp.splitMode === '個人自付') {
                  targetPerson = exp.splitTarget || exp.payer;
                } else if (exp.splitMode === '全額代墊') {
                  targetPerson = (exp.participants || []).filter(p => p !== exp.payer)[0] || exp.splitTarget || exp.debtor || '對方';
                } else if (exp.splitMode === '參與者AA' && (exp.participants || []).length === 1) {
                  targetPerson = exp.participants![0];
                }

                const isPersonal = isSingleTarget && targetPerson === exp.payer;

                let splitBadgeLabel = '';
                let splitBadgeStyle = '';

                if (isSingleTarget && targetPerson) {
                  if (targetPerson === exp.payer) {
                    splitBadgeLabel = `👤 ${targetPerson} 個人自付`;
                    splitBadgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
                  } else {
                    splitBadgeLabel = `👤 ${targetPerson} 全額代墊`;
                    splitBadgeStyle = 'bg-amber-50 text-amber-800 border-amber-300';
                  }
                } else if (
                  exp.splitMode === '全體AA' || 
                  exp.splitMode === 'AA平分' || 
                  (exp.splitMode === '參與者AA' && (exp.participants || []).length >= tripMembers.length)
                ) {
                  splitBadgeLabel = '👥 全體AA';
                  splitBadgeStyle = 'bg-sky-50 text-sky-700 border-sky-200';
                } else if (exp.splitMode === '參與者AA') {
                  splitBadgeLabel = `🎯 ${(exp.participants || []).join('、')} AA`;
                  splitBadgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                } else {
                  splitBadgeLabel = exp.splitMode;
                  splitBadgeStyle = 'bg-stone-50 text-stone-700 border-stone-200';
                }

                return (
                  <motion.div
                    key={exp.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-xl p-3 sm:p-4 border border-[#E8E4D9] shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 group"
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${conf.bg} ${conf.border} border flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className={`w-4 h-4 ${conf.color}`} />
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-sm text-[#3E3A36]">
                            {exp.itemName}
                          </span>

                          {/* 單價與數量標籤 */}
                          {exp.unitPrice !== undefined && exp.unitPrice > 0 && exp.quantity !== undefined && exp.quantity > 1 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 text-[#5C564E] font-mono">
                              ${exp.unitPrice} × {exp.quantity}
                            </span>
                          )}

                          {/* 先出代墊人 */}
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            💳 {exp.payer} 先出
                            {exp.paymentMethod && exp.paymentMethod !== '信用卡' && ` (${exp.paymentMethod})`}
                          </span>

                          {/* 分帳模式標籤 (單人時統一標示為全額代墊/個人自付) */}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold border ${splitBadgeStyle}`}>
                            {splitBadgeLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-[#8C8475] flex-wrap">
                          <span>📅 {exp.date}</span>
                          {exp.location && (
                            <span className="flex items-center gap-0.5 text-[#5C564E] font-medium">
                              <MapPin className="w-3 h-3 text-rose-500" />
                              <span>{exp.location}</span>
                            </span>
                          )}
                          {exp.originalCurrency !== 'TWD' && (
                            <span className="text-amber-700 font-semibold">
                              (原幣: {CURRENCY_DEFAULTS[exp.originalCurrency]?.symbol || ''} {(Number(exp.originalAmount) || 0).toLocaleString()} {exp.originalCurrency} @ {exp.exchangeRate})
                            </span>
                          )}
                          {exp.discount !== undefined && exp.discount > 0 && (
                            <span className="text-emerald-700 font-bold">
                              (折扣: -{exp.discount})
                            </span>
                          )}
                        </div>

                        {exp.note && (
                          <p className="text-xs text-[#7A7366] bg-[#FAF8F5] px-2 py-0.5 rounded-lg inline-block">
                            💡 {exp.note}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[#F2ECE1]/70 shrink-0 gap-1 sm:gap-0.5">
                      <div className="text-left sm:text-right">
                        <div className="text-sm sm:text-base font-black text-[#3E3A36]">
                          NT$ {(Number(exp.totalAmountTWD) || 0).toLocaleString()}
                        </div>
                        {exp.debtorAmountTWD > 0 && !isPersonal && (
                          <div className="text-[10px] sm:text-[11px] font-bold text-rose-700">
                            其他成員分攤 NT$ {(Number(exp.debtorAmountTWD) || 0).toLocaleString()}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 sm:pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditExpenseModal(exp)}
                          className="p-1 rounded-lg text-[#8C8475] hover:text-sky-700 hover:bg-sky-50 transition-colors cursor-pointer"
                          title="編輯此筆支出"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => promptDeleteExpense(exp.id)}
                          className="p-1 rounded-lg text-[#A09A8F] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="刪除此筆支出"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 2: 行前心願與預訂待辦清單 */}
      {subTab === 'wishlist' && (() => {
        const totalWishCount = currentTripWishlist.length;
        const doneWishCount = currentTripWishlist.filter(w => w.status === '已完成').length;
        const progressPercent = totalWishCount > 0 ? Math.round((doneWishCount / totalWishCount) * 100) : 0;
        const totalEstimatedAmount = currentTripWishlist.reduce((sum, w) => sum + (w.estimatedAmountTWD || 0), 0);
        const doneEstimatedAmount = currentTripWishlist
          .filter(w => w.status === '已完成')
          .reduce((sum, w) => sum + (w.estimatedAmountTWD || 0), 0);

        return (
          <div className="space-y-4">
            {/* 心願進度與預估金額卡片 */}
            <div className="bg-white rounded-2xl p-4 border border-[#E8E4D9] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#4A4641] flex items-center gap-1.5">
                    <ListTodo className="w-4 h-4 text-rose-600" />
                    <span>行前必去景點、美食與待訂心願進度</span>
                  </h3>
                  <p className="text-[11px] text-[#8C8475] mt-0.5">預訂完成後可直接一鍵轉為旅費支出</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddWishOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>新增心願/待辦</span>
                </button>
              </div>

              {/* 心願完成度進度條與金額統計 */}
              {totalWishCount > 0 && (
                <div className="pt-2 border-t border-[#F0ECE1] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#5C564E] flex items-center gap-1">
                      <span>心願達成率 ({doneWishCount}/{totalWishCount})</span>
                    </span>
                    <span className="text-rose-700">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#F2EEE6] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#8C8475] pt-0.5">
                    <span>心願預估總額：NT$ {(Number(totalEstimatedAmount) || 0).toLocaleString()}</span>
                    <span>已完成預訂：NT$ {(Number(doneEstimatedAmount) || 0).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentTripWishlist.map(w => {
              const conf = CATEGORY_CONFIG[w.category] || CATEGORY_CONFIG['其他雜支'];
              const isDone = w.status === '已完成';

              return (
                <div
                  key={w.id}
                  className={`bg-white rounded-2xl p-4 border transition-all ${
                    isDone
                      ? 'border-[#E0DCD3] opacity-70 bg-stone-50/50'
                      : 'border-[#E8E4D9] shadow-2xs hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleWishStatus(w)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer mt-0.5 ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : 'border-2 border-[#DDD8CD] hover:border-emerald-600'
                        }`}
                      >
                        {isDone && <Check className="w-4 h-4" />}
                      </button>

                      <div className="space-y-1">
                        <div className={`text-xs font-bold ${isDone ? 'line-through text-[#8C8475]' : 'text-[#3E3A36]'}`}>
                          {w.itemName}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#8C8475] flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md ${conf.bg} ${conf.color} font-bold`}>
                            {w.category}
                          </span>
                          <span>提議人：{w.addedBy}</span>
                          {w.estimatedAmountTWD !== undefined && w.estimatedAmountTWD !== null && (
                            <span className="font-bold text-[#5C564E]">
                              預估: NT$ {(Number(w.estimatedAmountTWD) || 0).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {w.note && (
                          <p className="text-[11px] text-[#7A7366] bg-[#FAF8F5] p-1.5 rounded-md">
                            {w.note}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleConvertWishToExpense(w)}
                        className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-[10px] font-bold transition-colors cursor-pointer"
                        title="帶入支出記帳"
                      >
                        轉記帳
                      </button>
                      <button
                        type="button"
                        onClick={() => promptDeleteWish(w.id)}
                        className="p-1 text-[#A09A8F] hover:text-rose-600 transition-colors cursor-pointer"
                        title="刪除項目"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        );
      })()}

      {/* 6. Tab 3: 多成員智慧結算、個人帳目穿透 & 地點店家統計 */}
      {subTab === 'settlement' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 多人結算還款明細 (誰該還誰) */}
            <div className="bg-white rounded-2xl p-5 border border-[#E8E4D9] shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-[#3E3A36] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>智慧平帳清單（誰該償還給誰）</span>
                  </h4>
                  <p className="text-[11px] text-[#8C8475] mt-0.5">系統自動扣抵個人自付與代墊差額後的最小轉帳次數</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyBillSummary}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>複製明細</span>
                </button>
              </div>

              {tripSummary.transactions.length > 0 ? (
                <div className="space-y-2.5">
                  {tripSummary.transactions.map((t, idx) => (
                    <div key={idx} className="p-3.5 bg-gradient-to-r from-[#FAF8F5] to-rose-50/50 rounded-2xl border border-[#EAE5DA] flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2.5 text-xs">
                        <span className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 font-black flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-[#3E3A36]">{t.from}</span>
                            <span className="text-[11px] text-[#8C8475]">應轉帳償還</span>
                            <span className="font-extrabold text-sm text-sky-800">{t.to}</span>
                          </div>
                          <span className="text-[10px] text-[#A09A8F]">已扣減代墊先付款與自付項目</span>
                        </div>
                      </div>
                      <div className="text-base font-black text-rose-700 font-mono">
                        NT$ {(Number(t.amount) || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[#8C8475] bg-[#FAF8F5] rounded-2xl space-y-1">
                  <div className="text-2xl">✨</div>
                  <div className="font-bold text-[#5C564E]">本趟旅費全員分攤已完全平衡！</div>
                  <div>無須再進行任何平帳轉帳</div>
                </div>
              )}

              {/* 各成員墊款、個人自付與應負擔總覽卡片 (可點擊穿透查看個人明細) */}
              <div className="pt-3 border-t border-[#F0ECE1] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#5C564E]">成員分帳總覽（點擊可展開專屬品項明細）：</div>
                  <span className="text-[10px] text-[#A09A8F]">點選成員切換穿透</span>
                </div>

                <div className="space-y-2">
                  {tripMembers.map(m => {
                    const paid = Number(tripSummary.memberPaid?.[m]) || 0;
                    const share = Number(tripSummary.memberShare?.[m]) || 0;
                    const personal = Number(tripSummary.memberPersonalAmounts?.[m]) || 0;
                    const shared = Number(tripSummary.memberSharedAmounts?.[m]) || 0;
                    const net = Number(tripSummary.netBalances?.[m]) || 0;
                    const isSelected = selectedMemberDetail === m;

                    return (
                      <div
                        key={m}
                        className={`rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50/40 ring-1 ring-sky-500'
                            : 'border-[#EAE5DA] bg-[#FAF8F5] hover:bg-white'
                        }`}
                        onClick={() => setSelectedMemberDetail(isSelected ? null : m)}
                      >
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs ${
                              isSelected ? 'bg-sky-600 text-white' : 'bg-white border border-[#DDD8CC] text-[#3E3A36]'
                            }`}>
                              {m}
                            </span>
                            <div>
                              <div className="font-extrabold text-xs text-[#3E3A36] flex items-center gap-1.5">
                                <span>{m}</span>
                                <span className="text-[10px] text-[#8C8475] font-normal">
                                  (自付 ${personal.toLocaleString()} + 均攤 ${shared.toLocaleString()})
                                </span>
                              </div>
                              <div className="text-[10px] text-[#8C8475]">
                                先墊付 ${paid.toLocaleString()} • 實應分擔 ${share.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className={`text-xs font-black ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {net >= 0 ? `應收回 +$${net.toLocaleString()}` : `應支付 -$${Math.abs(net).toLocaleString()}`}
                            </div>
                            <span className="text-[10px] text-sky-700 font-bold">
                              {isSelected ? '收合 ▲' : '查看明細 ▼'}
                            </span>
                          </div>
                        </div>

                        {/* 展開之個人穿透品項明細清單 */}
                        {isSelected && (
                          <div className="p-3 bg-white border-t border-[#EAE5DA] space-y-3 text-xs">
                            {/* 個人 100% 自付品項 */}
                            <div className="space-y-1.5">
                              <div className="font-bold text-purple-800 text-[11px] flex items-center gap-1">
                                <span>👤 {m} 的個人專屬自付品項 ({tripSummary.memberPersonalItems[m]?.length || 0} 筆，小計 NT$ {personal.toLocaleString()})：</span>
                              </div>
                              {(tripSummary.memberPersonalItems[m]?.length || 0) > 0 ? (
                                <div className="space-y-1 pl-2">
                                  {tripSummary.memberPersonalItems[m]?.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between text-[11px] text-[#5C564E] py-0.5 border-b border-dashed border-[#F0ECE1]">
                                      <span>• {item.itemName} {item.location ? `(@${item.location})` : ''}</span>
                                      <span className="font-bold text-[#3E3A36]">NT$ {(Number(item.totalAmountTWD) || 0).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[10px] text-[#A09A8F] pl-2">無個人單獨自付品項</div>
                              )}
                            </div>

                            {/* 參與之共同分攤品項 */}
                            <div className="space-y-1.5 pt-1 border-t border-[#F0ECE1]">
                              <div className="font-bold text-sky-800 text-[11px] flex items-center gap-1">
                                <span>👥 {m} 參與的共同均攤品項 (小計應付 NT$ {shared.toLocaleString()})：</span>
                              </div>
                              {(tripSummary.memberSharedItems[m]?.length || 0) > 0 ? (
                                <div className="space-y-1 pl-2 max-h-36 overflow-y-auto">
                                  {tripSummary.memberSharedItems[m]?.map((sh, i) => (
                                    <div key={i} className="flex items-center justify-between text-[11px] text-[#5C564E] py-0.5 border-b border-dashed border-[#F0ECE1]">
                                      <span>• {sh.item.itemName} (總額 ${(Number(sh.item.totalAmountTWD) || 0).toLocaleString()})</span>
                                      <span className="font-bold text-sky-700">分攤 NT$ {sh.share.toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[10px] text-[#A09A8F] pl-2">無共同分攤品項</div>
                              )}
                            </div>

                            {/* 該成員先出錢代墊之品項 */}
                            <div className="space-y-1.5 pt-1 border-t border-[#F0ECE1]">
                              <div className="font-bold text-amber-800 text-[11px] flex items-center gap-1">
                                <span>💳 由 {m} 先墊付的品項 ({tripSummary.memberPaidItems[m]?.length || 0} 筆，代墊總額 NT$ {paid.toLocaleString()})：</span>
                              </div>
                              {(tripSummary.memberPaidItems[m]?.length || 0) > 0 ? (
                                <div className="space-y-1 pl-2 max-h-36 overflow-y-auto">
                                  {tripSummary.memberPaidItems[m]?.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between text-[11px] text-[#5C564E] py-0.5 border-b border-dashed border-[#F0ECE1]">
                                      <span>• {item.itemName}</span>
                                      <span className="font-bold text-amber-800">NT$ {(Number(item.totalAmountTWD) || 0).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[10px] text-[#A09A8F] pl-2">未代墊任何款項</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 右側：購物地點統計 & 類別開銷分析 */}
            <div className="space-y-4">
              {/* 地點/店家消費統計 */}
              <div className="bg-white rounded-2xl p-5 border border-[#E8E4D9] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#4A4641] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <span>各景點/店家開銷統計</span>
                  </h4>
                  <span className="text-[10px] text-[#8C8475]">共 {Object.keys(tripSummary.locationBreakdown).length} 個地點</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-none">
                  {Object.entries(tripSummary.locationBreakdown).length === 0 ? (
                    <div className="text-xs text-[#8C8475] text-center py-4">記帳時填寫地點即可自動在此統計</div>
                  ) : (
                    Object.entries(tripSummary.locationBreakdown)
                      .sort(([, a], [, b]) => b.totalTWD - a.totalTWD)
                      .map(([loc, stat]) => (
                        <div key={loc} className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DA] flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-[#3E3A36] flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-rose-500" />
                              <span>{loc}</span>
                              <span className="text-[10px] text-[#8C8475]">({stat.count} 個品項)</span>
                            </div>
                            <div className="text-[10px] text-[#8C8475] truncate max-w-xs">
                              {stat.items.slice(0, 3).join('、')} {stat.items.length > 3 ? '...' : ''}
                            </div>
                          </div>
                          <div className="font-extrabold text-[#3E3A36]">
                            NT$ {stat.totalTWD.toLocaleString()}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* 類別開銷佔比分析 */}
              <div className="bg-white rounded-2xl p-5 border border-[#E8E4D9] shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-[#4A4641] flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-rose-600" />
                  <span>各類別開銷佔比</span>
                </h4>

                <div className="space-y-2.5">
                  {Object.entries(tripSummary.categoryBreakdown || {}).map(([cat, amtVal]) => {
                    const amt = Number(amtVal) || 0;
                    const percent = Math.round((amt / (tripSummary.totalTWD || 1)) * 100);
                    const conf = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['其他雜支'];
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#5C564E]">{cat}</span>
                          <span className="font-bold text-[#3E3A36]">
                            NT$ {(Number(amt) || 0).toLocaleString()} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#F2EEE6] overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. 行程設定 Modal (支援重新命名、自訂時間、自訂主題底色、增減其他成員) */}
      <AnimatePresence>
        {isTripModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-[#E8E4D9] max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 sm:px-6 pb-3 border-b border-[#F0ECE1] shrink-0 bg-white">
                <h3 className="font-black text-base text-[#3E3A36] flex items-center gap-2">
                  <span>{tripFormEmoji}</span>
                  <span>{isEditingTrip ? '編輯旅程設定' : '建立新旅程專案'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsTripModalOpen(false)}
                  className="p-1 rounded-full text-[#A09A8F] hover:text-[#3E3A36] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTrip} className="flex-1 flex flex-col min-h-0 overflow-hidden text-xs">
                <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4">
                {/* 旅程名稱與 Emoji */}
                <div className="space-y-1">
                  <label className="font-bold text-[#5C564E]">旅程名稱 & Emoji 標誌</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tripFormEmoji}
                      onChange={(e) => setTripFormEmoji(e.target.value)}
                      placeholder="✈️"
                      className="w-14 p-2.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl text-center text-lg focus:outline-none focus:border-rose-500"
                    />
                    <input
                      type="text"
                      value={tripFormTitle}
                      onChange={(e) => setTripFormTitle(e.target.value)}
                      placeholder="例：🇯🇵 東京 5 天 4 夜自由行"
                      className="flex-1 p-2.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl font-bold text-[#3E3A36] focus:outline-none focus:border-rose-500"
                      required
                    />
                  </div>
                </div>

                {/* 目的地與預算 */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#5C564E]">目的地</label>
                    <input
                      type="text"
                      value={tripFormDestination}
                      onChange={(e) => setTripFormDestination(e.target.value)}
                      placeholder="例：東京、沖繩、花東"
                      className="w-full p-2.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl focus:outline-none focus:border-rose-500 font-medium"
                    />
                  </div>

                  {/* 預算上限開關與設定 */}
                  <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E4D9] space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#3E3A36] text-xs flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                          <span>設定預算上限目標</span>
                        </div>
                        <div className="text-[10px] text-[#8C8475]">可自訂是否監控旅費預算進度條</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTripFormHasBudget(!tripFormHasBudget)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                          tripFormHasBudget ? 'bg-rose-600' : 'bg-[#DDD8CC]'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                            tripFormHasBudget ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {tripFormHasBudget && (
                      <div className="pt-2 border-t border-[#EAE5DA] space-y-1">
                        <label className="font-bold text-[#5C564E] text-[11px]">預算目標金額 (NTD)</label>
                        <input
                          type="number"
                          value={tripFormBudget}
                          onChange={(e) => setTripFormBudget(e.target.value)}
                          placeholder="例：60000"
                          className="w-full p-2.5 bg-white border border-[#E2DDD2] rounded-xl focus:outline-none focus:border-rose-500 font-bold text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 旅程起訖時間 (自訂期間) */}
                <div className="space-y-1">
                  <label className="font-bold text-[#5C564E] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-rose-600" />
                    <span>旅行日期區間（可自訂）</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-[#8C8475]">開始日期</span>
                      <input
                        type="date"
                        value={tripFormStartDate}
                        max={tripFormEndDate || undefined}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="w-full p-2 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8C8475]">結束日期</span>
                      <input
                        type="date"
                        value={tripFormEndDate}
                        min={tripFormStartDate || undefined}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        className="w-full p-2 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 外幣幣別與匯率換算 */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-bold text-[#5C564E]">主要幣別</label>
                    <select
                      value={tripFormCurrency}
                      onChange={(e) => {
                        const cur = e.target.value;
                        setTripFormCurrency(cur);
                        if (CURRENCY_DEFAULTS[cur]) {
                          setTripFormRate(String(CURRENCY_DEFAULTS[cur].rate));
                        }
                      }}
                      className="w-full p-2.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl font-bold"
                    >
                      {Object.entries(CURRENCY_DEFAULTS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[#5C564E]">換算匯率 (1外幣 = ? TWD)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={tripFormRate}
                      onChange={(e) => setTripFormRate(e.target.value)}
                      placeholder="0.215"
                      className="w-full p-2.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl font-bold"
                    />
                  </div>
                </div>

                {/* 旅程主題 */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#5C564E] flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-rose-600" />
                    <span>自訂旅程主題</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.values(TRIP_THEMES).map(theme => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setTripFormTheme(theme.id)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          tripFormTheme === theme.id
                            ? 'border-stone-800 ring-2 ring-stone-800 bg-white shadow-xs'
                            : 'border-[#E2DDD2] bg-[#FAF8F5] hover:bg-white'
                        }`}
                      >
                        <div className={`w-full h-4 rounded-lg bg-gradient-to-r ${theme.gradient}`} />
                        <span className="text-[10px] font-bold text-[#3E3A36] truncate w-full">
                          {theme.badge} {theme.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 出遊成員設定 (支援新增情侶以外的同行朋友/代墊人) */}
                <div className="space-y-2 p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E4D9]">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#5C564E] flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-sky-600" />
                      <span>同行成員名單（支援新增其他代墊人）</span>
                    </label>
                    <span className="text-[10px] text-[#8C8475]">共 {tripFormMembers.length} 人</span>
                  </div>

                  {/* 成員標籤清單 */}
                  <div className="flex flex-wrap gap-1.5">
                    {tripFormMembers.map(member => (
                      <span
                        key={member}
                        className="px-2.5 py-1 rounded-xl bg-white border border-[#DDD8CC] text-[#3E3A36] font-bold text-xs flex items-center gap-1 shadow-2xs"
                      >
                        <span>{member}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMemberFromForm(member)}
                          className="text-[#A09A8F] hover:text-rose-600 cursor-pointer ml-0.5"
                          title="移除此成員"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* 新增成員輸入框 */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newMemberInput}
                      onChange={(e) => setNewMemberInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMemberToForm();
                        }
                      }}
                      placeholder="輸入同行朋友名字，例如：阿翔、小晴、媽媽"
                      className="flex-1 p-2 bg-white border border-[#DDD8CC] rounded-xl text-xs focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddMemberToForm}
                      className="px-3 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>新增成員</span>
                    </button>
                  </div>
                </div>

                {/* 行程設定按鈕操作區 (固定底部) */}
                </div>
                <div className="p-4 sm:px-6 border-t border-[#F0ECE1] bg-white shrink-0 flex items-center justify-between">
                  {isEditingTrip ? (
                    <button
                      type="button"
                      onClick={promptDeleteTrip}
                      className="px-3 py-2 rounded-xl text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>刪除行程</span>
                    </button>
                  ) : <div />}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsTripModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-[#DDD8CC] text-[#7A7366] font-bold hover:bg-[#FAF8F5] cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold shadow-md cursor-pointer active:scale-95"
                    >
                      {isEditingTrip ? '儲存變更' : '建立旅程'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. 新增/編輯旅費支出 Modal (支援自訂單價數量、個人專屬自付、指定分攤者等) */}
      <AnimatePresence>
        {isAddExpenseOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-[#E8E4D9] max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 sm:px-6 pb-3 border-b border-[#F0ECE1] shrink-0 bg-white">
                <h3 className="font-black text-base text-[#3E3A36] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-rose-600" />
                  <span>{editingExpenseId ? '編輯旅費支出' : '記一筆旅費支出'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddExpenseOpen(false);
                    setEditingExpenseId(null);
                  }}
                  className="p-1 rounded-full text-[#A09A8F] hover:text-[#3E3A36] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="flex-1 flex flex-col min-h-0 overflow-hidden text-xs">
                <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-3.5">
                  {/* 1. 品項名稱 & 快捷標籤 (置頂) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-[#5C564E]">品項名稱 <span className="text-rose-500">*</span></label>
                      <span className="text-[10px] text-[#8C8475]">可輸入或點選常用標籤</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={expItemName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setExpItemName(val);
                          const detected = detectTravelCategory(val);
                          if (detected) setExpCategory(detected);
                        }}
                        placeholder="例：敘敘苑燒肉、新宿飯店住宿、唐吉訶德採買"
                        className="w-full p-2.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl font-bold text-[#3E3A36] focus:outline-none focus:border-rose-500"
                        required
                      />
                      {expItemName && (
                        <button
                          type="button"
                          onClick={() => setExpItemName('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-[#EFECE3] hover:bg-[#E3DFC2] text-[#7A7469] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          清除
                        </button>
                      )}
                    </div>

                    {/* 旅遊常用標籤 */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-[#A09A8F] font-bold">常用：</span>
                      {['機票訂位', '飯店住宿', '景點門票', '居酒屋燒肉', '超商點心', '藥妝採買', '伴手禮', '交通卡', '租車加油', '網卡/eSIM'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setExpItemName(tag);
                            const detected = detectTravelCategory(tag);
                            if (detected) setExpCategory(detected);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer active:scale-95 ${
                            expItemName === tag
                              ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                              : 'bg-white hover:bg-rose-50 text-[#6E6659] border-[#E0DCD3]'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. 消費類別 (智慧偵測自動切換，亦可手動點選) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-[#5C564E]">消費類別</label>
                      {detectTravelCategory(expItemName) && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          ✨ 智慧偵測：{detectTravelCategory(expItemName)}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {Object.keys(CATEGORY_CONFIG).map(cat => {
                        const conf = CATEGORY_CONFIG[cat];
                        const Icon = conf.icon;
                        const isSel = expCategory === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setExpCategory(cat as any)}
                            className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                              isSel
                                ? 'bg-rose-50 border-rose-500 text-rose-800 font-bold shadow-2xs'
                                : 'bg-[#FAF8F5] border-[#E2DDD2] text-[#7A7366] hover:bg-white'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isSel ? 'text-rose-600' : 'text-[#8C8475]'}`} />
                            <span className="text-[10px]">{cat}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 先付款出資人 (支援所有成員 + 共同公費) */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#5C564E] flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-sky-600" />
                      <span>由誰先出錢代墊？</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {tripMembers.map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setExpPayer(m)}
                          className={`px-3.5 py-2 rounded-xl border font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                            expPayer === m
                              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                              : 'bg-[#FAF8F5] border-[#E2DDD2] text-[#5C564E] hover:bg-white'
                          }`}
                        >
                          <span>💳 {m} 先付</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setExpPayer('共同基金')}
                        className={`px-3.5 py-2 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                          expPayer === '共同基金'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-[#FAF8F5] border-[#E2DDD2] text-[#5C564E] hover:bg-white'
                        }`}
                      >
                        🏦 共同公費
                      </button>
                    </div>
                  </div>

                  {/* 支付方式 */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#5C564E]">付款方式</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['信用卡', '現金', '交通卡', '行動支付'].map(method => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setExpPaymentMethod(method)}
                          className={`p-1.5 rounded-xl border text-center font-bold text-[11px] cursor-pointer ${
                            expPaymentMethod === method
                              ? 'bg-stone-800 text-white border-stone-800'
                              : 'bg-[#FAF8F5] border-[#E2DDD2] text-[#7A7366] hover:bg-white'
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 幣別選取與即時匯率切換 */}
                  <div className="space-y-1.5 p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E4D9]">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-[#5C564E] flex items-center gap-1">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-rose-600" />
                        <span>消費幣別與換算匯率</span>
                      </label>
                      <span className="text-[10px] text-[#8C8475]">支援自訂即時折算</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-[#8C8475] block mb-0.5">幣別選擇</span>
                        <select
                          value={expCurrency}
                          onChange={(e) => {
                            const cur = e.target.value;
                            setExpCurrency(cur);
                            if (CURRENCY_DEFAULTS[cur]) {
                              setExpRate(String(CURRENCY_DEFAULTS[cur].rate));
                            }
                          }}
                          className="w-full p-2 bg-white border border-[#DDD8CC] rounded-xl font-bold text-xs"
                        >
                          {Object.entries(CURRENCY_DEFAULTS).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#8C8475] block mb-0.5">折算匯率 (1{expCurrency} = ? TWD)</span>
                        <input
                          type="number"
                          step="0.0001"
                          inputMode="decimal"
                          value={expRate}
                          onChange={(e) => setExpRate(e.target.value)}
                          className="w-full p-2 bg-white border border-[#DDD8CC] rounded-xl font-bold text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 幣別與金額輸入 */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-[#5C564E]">原幣金額 ({expCurrency}) <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={expOriginalAmount}
                          onChange={(e) => setExpOriginalAmount(e.target.value)}
                          placeholder="例：22000"
                          className="w-full p-2.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl font-black text-base text-[#3E3A36] focus:outline-none focus:border-rose-500 font-mono"
                          required
                        />
                        {expOriginalAmount && (
                          <button
                            type="button"
                            onClick={() => setExpOriginalAmount('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-[#EFECE3] hover:bg-[#E3DFC2] text-[#7A7469] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            清除
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[#5C564E]">折合台幣 (TWD)</label>
                      <div className="w-full p-2.5 bg-[#F5F2EB] border border-[#E2DDD2] rounded-xl font-black text-base text-rose-700 flex items-center justify-between font-mono">
                        <span>NT$</span>
                        <span>
                          {expOriginalAmount && !isNaN(parseFloat(expOriginalAmount))
                            ? (Number(Math.round(parseFloat(expOriginalAmount) * (parseFloat(expRate) || 1))) || 0).toLocaleString()
                            : '0'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 快速金額增加按鈕 (原幣) */}
                  <div className="flex items-center gap-1.5 flex-wrap bg-[#FAF9F5] p-2 rounded-xl border border-[#EDE8DE]">
                    <span className="text-[10px] text-[#A09A8F] font-bold shrink-0">快速加額：</span>
                    {(expCurrency === 'JPY' || expCurrency === 'KRW'
                      ? [1000, 3000, 5000, 10000, 30000, 50000]
                      : expCurrency === 'VND'
                      ? [50000, 100000, 200000, 500000]
                      : [50, 100, 500, 1000, 2000, 5000]
                    ).map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          const curr = parseFloat(expOriginalAmount) || 0;
                          setExpOriginalAmount((curr + amt).toString());
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white hover:bg-rose-50 text-[#5C564E] hover:text-rose-700 text-[10px] font-bold border border-[#DDD8CD] transition-colors cursor-pointer active:scale-95 shadow-2xs"
                      >
                        +{(Number(amt) || 0).toLocaleString()}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setExpOriginalAmount('')}
                      className="px-2 py-0.5 rounded-lg bg-[#EFECE4] hover:bg-[#E2DDD3] text-[#7A7469] text-[10px] font-bold transition-all cursor-pointer ml-auto"
                    >
                      歸零
                    </button>
                  </div>

                  {/* 單價、數量與折扣 (可選填) */}
                  <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E4D9] space-y-2">
                    <div className="text-[11px] font-bold text-[#5C564E]">單價與數量明細 (選填)：</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-[#8C8475] block mb-0.5">單價 ({expCurrency})</span>
                        <input
                          type="number"
                          step="any"
                          value={expUnitPrice}
                          onChange={(e) => {
                            const up = e.target.value;
                            setExpUnitPrice(up);
                            if (up && expQuantity) {
                              const total = (parseFloat(up) || 0) * (parseInt(expQuantity) || 1) - (parseFloat(expDiscount) || 0);
                              if (total > 0) setExpOriginalAmount(String(total));
                            }
                          }}
                          placeholder="例：500"
                          className="w-full p-2 bg-white border border-[#DDD8CC] rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8C8475] block mb-0.5">數量</span>
                        <input
                          type="number"
                          min="1"
                          value={expQuantity}
                          onChange={(e) => {
                            const q = e.target.value;
                            setExpQuantity(q);
                            if (expUnitPrice && q) {
                              const total = (parseFloat(expUnitPrice) || 0) * (parseInt(q) || 1) - (parseFloat(expDiscount) || 0);
                              if (total > 0) setExpOriginalAmount(String(total));
                            }
                          }}
                          placeholder="1"
                          className="w-full p-2 bg-white border border-[#DDD8CC] rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8C8475] block mb-0.5">折扣扣減 ({expCurrency})</span>
                        <input
                          type="number"
                          step="any"
                          value={expDiscount}
                          onChange={(e) => {
                            const d = e.target.value;
                            setExpDiscount(d);
                            if (expUnitPrice && expQuantity) {
                              const total = (parseFloat(expUnitPrice) || 0) * (parseInt(expQuantity) || 1) - (parseFloat(d) || 0);
                              if (total > 0) setExpOriginalAmount(String(total));
                            }
                          }}
                          placeholder="0"
                          className="w-full p-2 bg-white border border-[#DDD8CC] rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 分攤方式：全體AA、個人自付、參與者AA */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#5C564E]">分攤模式</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['全體AA', '個人自付', '參與者AA'] as const).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setExpSplitMode(mode)}
                          className={`p-2 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                            expSplitMode === mode
                              ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-2xs'
                              : 'bg-[#FAF8F5] border-[#E2DDD2] text-[#7A7366] hover:bg-white'
                          }`}
                        >
                          {mode === '全體AA' ? '👥 全體AA' : mode === '個人自付' ? '👤 個人自付' : '🎯 參與者AA'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 個人自付時選擇歸屬成員 */}
                  {expSplitMode === '個人自付' && (
                    <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-1.5">
                      <label className="font-bold text-purple-900 text-xs flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-purple-600" />
                        <span>此品項由誰 100% 個人自付？</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {tripMembers.map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setExpSplitTarget(m)}
                            className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                              expSplitTarget === m
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : 'bg-white border-[#DDD8CC] text-[#5C564E] hover:bg-purple-50'
                            }`}
                          >
                            👤 {m} 自付
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-purple-700">
                        * 他人代墊此筆款項後，結算時將自動全額計入該成員的償還帳目。
                      </p>
                    </div>
                  )}

                  {/* 參與分攤成員勾選 (當為參與者AA時) */}
                  {expSplitMode === '參與者AA' && (
                    <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E2DDD2] space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <label className="font-bold text-[#5C564E] text-xs">選擇共同分攤之成員：</label>
                        {expParticipants.length === 1 && (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300">
                            💡 僅選 1 人：視同「{expParticipants[0] === expPayer ? `${expParticipants[0]} 個人自付` : `${expParticipants[0]} 全額代墊`}」
                          </span>
                        )}
                        {expParticipants.length === tripMembers.length && (
                          <span className="text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-300">
                            💡 全員已選取：等同「全體AA」
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tripMembers.map(m => {
                          const isChecked = expParticipants.includes(m);
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                if (isChecked) {
                                  if (expParticipants.length <= 1) return;
                                  setExpParticipants(expParticipants.filter(p => p !== m));
                                } else {
                                  setExpParticipants([...expParticipants, m]);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                                isChecked
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-white text-[#7A7366] border-[#DDD8CC]'
                              }`}
                            >
                              {isChecked ? `✓ ${m}` : m}
                            </button>
                          );
                        })}
                      </div>
                      {expParticipants.length === 1 && (
                        <p className="text-[10px] text-amber-800 font-medium">
                          * 系統將自動由 <b>{expParticipants[0]}</b> 100% 負擔{expParticipants[0] !== expPayer ? `，並在結算時列為由 ${expParticipants[0]} 全額償還給 ${expPayer}` : '，不影響他人帳目'}。
                        </p>
                      )}
                    </div>
                  )}

                  {/* 地點與備註 */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-[#5C564E]">消費地點/店家</label>
                      <input
                        type="text"
                        value={expLocation}
                        onChange={(e) => setExpLocation(e.target.value)}
                        placeholder="例：銀座、成田機場"
                        className="w-full p-2 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[#5C564E]">備註說明</label>
                      <input
                        type="text"
                        value={expNote}
                        onChange={(e) => setExpNote(e.target.value)}
                        placeholder="例：刷卡含 1.5% 回饋"
                        className="w-full p-2 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 提交按鈕 (固定底部) */}
                <div className="p-4 sm:px-6 border-t border-[#F0ECE1] bg-white shrink-0 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddExpenseOpen(false);
                      setEditingExpenseId(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-[#DDD8CC] text-[#7A7366] font-bold hover:bg-[#FAF8F5] cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold shadow-md cursor-pointer active:scale-95"
                  >
                    {editingExpenseId ? '儲存修改' : '確認儲存'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. 新增心願/待辦 Modal */}
      <AnimatePresence>
        {isAddWishOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-[#E8E4D9] max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 pb-3 border-b border-[#F0ECE1] shrink-0 bg-white">
                <h3 className="font-black text-base text-[#3E3A36] flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-rose-600" />
                  <span>新增行前心願 & 待訂項目</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddWishOpen(false)}
                  className="p-1 rounded-full text-[#A09A8F] hover:text-[#3E3A36] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddWish} className="flex-1 flex flex-col min-h-0 overflow-hidden text-xs">
                <div className="p-5 flex-1 overflow-y-auto space-y-3.5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-[#5C564E]">項目名稱 <span className="text-rose-500">*</span></label>
                      <span className="text-[10px] text-[#8C8475]">心願待買/待玩/待吃</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={wishName}
                        onChange={(e) => setWishName(e.target.value)}
                        placeholder="例：晴空塔展望台門票、哈利波特影城、買吉伊卡哇"
                        className="w-full p-2.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl font-bold focus:outline-none focus:border-rose-500"
                        required
                      />
                      {wishName && (
                        <button
                          type="button"
                          onClick={() => setWishName('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-[#EFECE3] hover:bg-[#E3DFC2] text-[#7A7469] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          清除
                        </button>
                      )}
                    </div>

                    {/* 心願常用標籤 */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-[#A09A8F] font-bold">靈感：</span>
                      {['環球影城快通', '迪士尼門票', '敘敘苑預約', 'SHIBUYA SKY', '溫泉一泊二食', 'BicCamera電器', '機場伴手禮'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setWishName(tag)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer active:scale-95 ${
                            wishName === tag
                              ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                              : 'bg-white hover:bg-rose-50 text-[#6E6659] border-[#E0DCD3]'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-[#5C564E]">類別</label>
                      <select
                        value={wishCategory}
                        onChange={(e) => setWishCategory(e.target.value)}
                        className="w-full p-2.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl font-bold"
                      >
                        {Object.keys(CATEGORY_CONFIG).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[#5C564E]">預估金額 (TWD)</label>
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="decimal"
                          value={wishEstPrice}
                          onChange={(e) => setWishEstPrice(e.target.value)}
                          placeholder="例：1500"
                          className="w-full p-2.5 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl font-bold font-mono"
                        />
                        {wishEstPrice && (
                          <button
                            type="button"
                            onClick={() => setWishEstPrice('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-[#EFECE3] hover:bg-[#E3DFC2] text-[#7A7469] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            清除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 心願金額快捷按鈕 */}
                  <div className="flex items-center gap-1.5 flex-wrap bg-[#FAF9F5] p-2 rounded-xl border border-[#EDE8DE]">
                    <span className="text-[10px] text-[#A09A8F] font-bold shrink-0">快速填額：</span>
                    {[500, 1000, 2000, 3000, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          const curr = parseFloat(wishEstPrice) || 0;
                          setWishEstPrice((curr + amt).toString());
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white hover:bg-rose-50 text-[#5C564E] hover:text-rose-700 text-[10px] font-bold border border-[#DDD8CD] transition-colors cursor-pointer active:scale-95 shadow-2xs"
                      >
                        +{(Number(amt) || 0).toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#5C564E]">提議人</label>
                    <div className="flex gap-2">
                      {['周', '廖', '共同'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setWishAddedBy(p as any)}
                          className={`flex-1 py-2 rounded-xl border font-bold text-xs cursor-pointer ${
                            wishAddedBy === p
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-[#FAF8F5] border-[#E2DDD2] text-[#7A7366]'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#5C564E]">備註或連結</label>
                    <input
                      type="text"
                      value={wishNote}
                      onChange={(e) => setWishNote(e.target.value)}
                      placeholder="例：官網預約代碼、搭乘地鐵路線"
                      className="w-full p-2 bg-[#FAF8F5] border border-[#E2DDD2] rounded-xl"
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-[#F0ECE1] bg-white shrink-0 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddWishOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#DDD8CC] text-[#7A7366] font-bold cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md cursor-pointer active:scale-95"
                  >
                    新增
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 10. 批次 Excel 貼上匯入 Modal */}
      {activeTrip && (
        <TravelBatchImportModal
          isOpen={isBatchImportOpen}
          onClose={() => setIsBatchImportOpen(false)}
          activeTrip={activeTrip}
          tripMembers={tripMembers}
          onAddTripMembers={handleAddTripMembers}
          onImportExpenses={handleImportExpenses}
          showToast={showToast}
        />
      )}

      {/* 11. 快速連續收據記帳 Modal */}
      {activeTrip && (
        <TravelReceiptQuickModal
          isOpen={isReceiptQuickOpen}
          onClose={() => setIsReceiptQuickOpen(false)}
          activeTrip={activeTrip}
          tripMembers={tripMembers}
          onAddExpenses={handleAddQuickExpenses}
          showToast={showToast}
        />
      )}

      {/* 12. 刪除確認彈窗 (Custom Confirmation Modal - 安全相容 iFrame 沙盒) */}
      <AnimatePresence>
        {deleteConfirmState?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#E8E4D9] space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-[#3E3A36]">
                  {deleteConfirmState.title}
                </h3>
                <p className="text-xs text-[#7A7366] leading-relaxed">
                  {deleteConfirmState.message}
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmState(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#DDD8CC] text-[#7A7366] font-bold text-xs hover:bg-[#FAF8F5] cursor-pointer transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteConfirmState.onConfirm();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deleteConfirmState.confirmText || '確定刪除'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
