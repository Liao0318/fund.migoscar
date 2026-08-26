/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  FileCode, 
  Check, 
  User, 
  Wallet, 
  TrendingDown, 
  TrendingUp, 
  Copy, 
  FileText, 
  Sparkles,
  Info,
  ExternalLink,
  Settings,
  List,
  Home,
  X,
  Bell,
  Target,
  Search,
  ShoppingBag,
  MapPin,
  ChevronRight,
  Store,
  Clock,
  CheckSquare,
  Square,
  Tag,
  MessageSquare,
  Share2,
  Save,
  Edit3,
  Pencil,
  Globe,
  Coins,
  ArrowRightLeft,
  Calculator,
  Sliders,
  BellRing,
  CheckCircle2,
  AlertCircle,
  Plane,
  Palmtree,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportFundRecordsToCSV } from './utils/exportCsv';
import { CODE_GS_TEMPLATE, INDEX_HTML_TEMPLATE, SPLIT_INDEX_HTML_TEMPLATE } from './data/gasTemplates';
import { SplitDebtView } from './components/SplitDebtView';
import { SplitHomeTab } from './components/split/SplitHomeTab';
import { SplitHistoryTab } from './components/split/SplitHistoryTab';
import { SplitTravelTab } from './components/split/SplitTravelTab';
import { SplitNotebookTab } from './components/split/SplitNotebookTab';
import { SplitSettlementTab } from './components/split/SplitSettlementTab';
import { SplitAddModal } from './components/split/SplitAddModal';
import { SplitSettleModal } from './components/split/SplitSettleModal';
import { Header } from './components/common/Header';
import { FloatingDock } from './components/common/FloatingDock';
import { CustomConfirmModal } from './components/common/CustomConfirmModal';
import { SmartAlertModal } from './components/modals/SmartAlertModal';
import { SyncAlertModal } from './components/modals/SyncAlertModal';
import { LinePromptModal } from './components/modals/LinePromptModal';
import { AddRecordModal } from './components/modals/AddRecordModal';
import { AddShoppingModal } from './components/modals/AddShoppingModal';
import { ManageStoresModal } from './components/modals/ManageStoresModal';
import { ClearDoneConfirmModal } from './components/modals/ClearDoneConfirmModal';
import { ShoppingDetailModal } from './components/modals/ShoppingDetailModal';
import { CurrencyCalculatorModal } from './components/modals/CurrencyCalculatorModal';
import { LineSettingsModal } from './components/modals/LineSettingsModal';
import { GasDeployModal } from './components/modals/GasDeployModal';
import { DataBackupModal } from './components/modals/DataBackupModal';
import { PwaInstallModal } from './components/modals/PwaInstallModal';
import { 
  PendingSyncItem, 
  getPendingQueue, 
  enqueueSyncItem, 
  processSyncQueue, 
  subscribeSyncStatus 
} from './services/syncQueue';
import { SplitRecordItem, SplitSummary } from './types';

// 定義購物記事資料型態
export interface ShoppingItem {
  id: string;
  category: '需要買' | '想要買';
  item: string;
  store: string;
  deadline: string;
  status: '待購買' | '已買到';
  creator: string;
  createdTime: string;
  note?: string;
}

// 鎖定為「yyyy-MM-dd 上午/下午 hh:mm」格式，不含時區或 ISO 字串
export function formatAmPmTime(timeInput: any): string {
  if (!timeInput) return '';
  const strVal = String(timeInput).trim();
  if (strVal.includes('上午') || strVal.includes('下午')) {
    return strVal;
  }

  let d: Date | null = null;
  if (timeInput instanceof Date) {
    d = timeInput;
  } else if (typeof timeInput === 'number') {
    d = new Date(timeInput);
  } else {
    // 檢查是否為純數字時間戳記或包含 shop-時間戳
    const numMatch = strVal.match(/\b\d{10,13}\b/);
    if (numMatch && !strVal.includes('/') && !strVal.includes('-') && !strVal.includes('T')) {
      d = new Date(parseInt(numMatch[0], 10));
    } else {
      const cleanStr = strVal.replace(/T/g, ' ').replace(/-/g, '/').split('.')[0].split('+')[0];
      const ms = Date.parse(cleanStr);
      if (!isNaN(ms)) {
        d = new Date(ms);
      } else {
        const parts = strVal.split(/\s+/);
        if (parts.length >= 2) {
          const dateParts = parts[0].split(/[-/]/);
          const timeParts = parts[1].split(':');
          if (dateParts.length >= 3 && timeParts.length >= 2) {
            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1;
            const day = parseInt(dateParts[2], 10);
            const hours = parseInt(timeParts[0], 10);
            const minutes = parseInt(timeParts[1], 10);
            d = new Date(year, month, day, hours, minutes);
          }
        }
      }
    }
  }

  if (!d || isNaN(d.getTime())) {
    return strVal;
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');

  const ampm = hours >= 12 ? '下午' : '上午';
  let h12 = hours % 12;
  if (h12 === 0) h12 = 12;
  const hStr = String(h12).padStart(2, '0');

  return `${year}-${month}-${day} ${ampm} ${hStr}:${minutes}`;
}

// 輔助函式：可靠取得採購項目的標準格式化時間
export function getShoppingItemDisplayTime(item: ShoppingItem | any): string {
  if (!item) return '';
  if (item.createdTime) {
    const formatted = formatAmPmTime(item.createdTime);
    if (formatted) return formatted;
  }
  if (item.timeStr) {
    const formatted = formatAmPmTime(item.timeStr);
    if (formatted) return formatted;
  }
  if (item.time) {
    const formatted = formatAmPmTime(item.time);
    if (formatted) return formatted;
  }
  if (item.createdAt) {
    const formatted = formatAmPmTime(item.createdAt);
    if (formatted) return formatted;
  }
  if (item.id) {
    const match = String(item.id).match(/\d{10,13}/);
    if (match) {
      const ms = parseInt(match[0], 10);
      if (!isNaN(ms) && ms > 1500000000000 && ms < 2500000000000) {
        return formatAmPmTime(new Date(ms));
      }
    }
  }
  return '';
}

const INITIAL_SHOPPING_ITEMS: ShoppingItem[] = [
  { id: 'shop-1', category: '需要買', item: '高麗菜', store: '菜市場', deadline: '8/13前', status: '待購買', creator: '廖尹丞', createdTime: '2026-08-10 上午 10:00', note: '挑選高麗菜葉片緊實、無蟲蛀者，打算炒培根！' },
  { id: 'shop-2', category: '需要買', item: '衛生紙 1 串', store: '全聯福利中心', deadline: '本週內', status: '待購買', creator: '周沛緹', createdTime: '2026-08-09 下午 06:30', note: '買三層柔柔牌，若有特價大包裝優先。' },
  { id: 'shop-3', category: '想要買', item: '雞塊', store: '日日加', deadline: '8/15前', status: '待購買', creator: '廖尹丞', createdTime: '2026-08-10 上午 11:15', note: '宵夜想用氣炸鍋炸來吃，買 1 斤裝。' },
  { id: 'shop-4', category: '需要買', item: '鮮乳 1 瓶', store: '家樂福', deadline: '8/11前', status: '已買到', creator: '周沛緹', createdTime: '2026-08-08 上午 09:20', note: '瑞穗或初鹿，保存期限選最久者。' }
];

const INITIAL_STORES = ['菜市場', '全聯福利中心', '日日加', '家樂福', '好市多', '寶雅', '7-ELEVEN', '蝦皮購物'];

// 定義通知資料型態
interface AppNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: 'expense' | 'income' | 'system' | 'delete' | 'settle';
  timestamp?: number;
}

// 定義帳目資料型態

// ------------------- 幣別與國際即時匯率設定 -------------------
export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  defaultRate: number; // 1 外幣 = X 台幣 (TWD)
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'TWD', name: '新台幣', symbol: 'NT$', flag: '🇹🇼', defaultRate: 1 },
  { code: 'JPY', name: '日圓', symbol: '¥', flag: '🇯🇵', defaultRate: 0.2024 },
  { code: 'USD', name: '美元', symbol: '$', flag: '🇺🇸', defaultRate: 32.21 },
  { code: 'EUR', name: '歐元', symbol: '€', flag: '🇪🇺', defaultRate: 37.20 },
  { code: 'KRW', name: '韓元', symbol: '₩', flag: '🇰🇷', defaultRate: 0.0228 },
  { code: 'THB', name: '泰銖', symbol: '฿', flag: '🇹🇭', defaultRate: 0.973 },
  { code: 'HKD', name: '港幣', symbol: 'HK$', flag: '🇭🇰', defaultRate: 4.12 },
  { code: 'CNY', name: '人民幣', symbol: '¥', flag: '🇨🇳', defaultRate: 4.77 },
  { code: 'GBP', name: '英鎊', symbol: '£', flag: '🇬🇧', defaultRate: 43.20 },
  { code: 'AUD', name: '澳幣', symbol: 'A$', flag: '🇦🇺', defaultRate: 21.20 },
  { code: 'SGD', name: '新加坡幣', symbol: 'S$', flag: '🇸🇬', defaultRate: 24.50 },
  { code: 'VND', name: '越南盾', symbol: '₫', flag: '🇻🇳', defaultRate: 0.0013 },
  { code: 'MYR', name: '馬來西亞令吉', symbol: 'RM', flag: '🇲🇾', defaultRate: 7.45 },
  { code: 'PHP', name: '菲律賓披索', symbol: '₱', flag: '🇵🇭', defaultRate: 0.56 },
];

export const DEFAULT_RATES_MAP: Record<string, number> = CURRENCIES.reduce((acc, cur) => {
  acc[cur.code] = cur.defaultRate;
  return acc;
}, {} as Record<string, number>);

interface RecordItem {
  id: string | number;
  month: string;
  date: string;
  item: string;
  payer: '廖尹丞' | '周沛緹' | '共同帳戶' | string;
  amount: number; // 換算後的台幣總額 (作為系統對帳計價基準)
  type: '支出-日常代墊' | '收入-固定公積金';
  timestamp?: string;
  currency?: string;        // 幣別 (例如: JPY, USD, TWD)
  originalAmount?: number;  // 原幣金額 (例如: 10000 JPY)
  exchangeRate?: number;    // 當時換算匯率 (例如: 0.2024)
}

// 預設對帳明細數據
const INITIAL_RECORDS: RecordItem[] = [
  { id: 4, month: "2026-06", date: "2026-06-05", item: "全聯福利中心採購食材", payer: "廖尹丞", amount: 1250, type: "支出-日常代墊", timestamp: "2026-06-05 14:32:00" },
  { id: 3, month: "2026-06", date: "2026-06-03", item: "台灣自來水 5-6 月水費", payer: "周沛緹", amount: 480, type: "支出-日常代墊", timestamp: "2026-06-03 10:15:00" },
  { id: 2, month: "2026-06", date: "2026-06-01", item: "本月固定公積金撥入", payer: "共同帳戶", amount: 10000, type: "收入-固定公積金", timestamp: "2026-06-01 09:00:00" },
  { id: 1, month: "2026-05", date: "2026-05-15", item: "好市多採買公共清潔耗材", payer: "廖尹丞", amount: 3120, type: "支出-日常代墊", timestamp: "2026-05-15 16:45:00" },
  { id: 0, month: "2026-05", date: "2026-05-01", item: "固定公積金底池撥入", payer: "共同帳戶", amount: 10000, type: "收入-固定公積金", timestamp: "2026-05-01 09:00:00" }
];

// 預設對帳明細數據

const normalizeMonth = (m: string): string => {
  if (!m) return '';
  const cleaned = m.toString().replace(/['"]/g, '').trim();
  const match = cleaned.match(/^(\d{4})[-/](\d{1,2})$/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    return `${year}-${month}`;
  }
  return cleaned;
};

const isMonthReconciled = (month: string, list: string[]): boolean => {
  const normMonth = normalizeMonth(month);
  return list.some(item => normalizeMonth(item) === normMonth);
};

export default function App() {
  const [records, setRecords] = useState<RecordItem[]>(() => {
    try {
      const saved = localStorage.getItem('muji_ledger_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((r: any) => {
            let mStr = String(r.month || '').trim();
            if (!/^\d{4}-\d{2}$/.test(mStr)) {
              if (/^\d{4}-\d{2}-\d{2}$/.test(mStr)) {
                mStr = mStr.substring(0, 7);
              } else {
                const d = new Date(mStr);
                if (!isNaN(d.getTime())) {
                  const year = d.getFullYear();
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  mStr = `${year}-${month}`;
                }
              }
            }
            return {
              ...r,
              month: mStr,
              date: r.date || `${mStr}-01`
            };
          });
        }
      }
      return INITIAL_RECORDS;
    } catch (e) {
      return INITIAL_RECORDS;
    }
  });
  // 模式狀態：'fund' (公積金模式) ｜ 'split' (代墊借還模式)
  const [appMode, setAppMode] = useState<'fund' | 'split'>(() => {
    try {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash.includes('split') || path.includes('/split')) return 'split';
      const saved = localStorage.getItem('banban_active_mode');
      if (saved === 'split' || saved === 'fund') return saved;
    } catch (e) {}
    return 'fund';
  });

  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'settlement' | 'notebook'>('home');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isFloatingBarDismissed, setIsFloatingBarDismissed] = useState(false);

  // 監聽網址 Hash 路由 (支援 #/split 或 #split 自動跳轉代墊分頁)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash.includes('split') || path.includes('/split')) {
        setAppMode('split');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // ------------------- 代墊借還 (Split Debt) 狀態與函式 -------------------
  const [splitItems, setSplitItems] = useState<SplitRecordItem[]>(() => {
    try {
      const saved = localStorage.getItem('banban_split_records');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [splitSummary, setSplitSummary] = useState<SplitSummary>(() => {
    try {
      const saved = localStorage.getItem('banban_split_summary');
      return saved ? JSON.parse(saved) : {
        liaoOwesZhou: 0,
        zhouOwesLiao: 0,
        netDebtor: 'none',
        netAmount: 0,
        summaryText: '目前雙方已結清 💖',
        unsettledCount: 0,
        settledCount: 0
      };
    } catch (e) {
      return {
        liaoOwesZhou: 0,
        zhouOwesLiao: 0,
        netDebtor: 'none',
        netAmount: 0,
        summaryText: '目前雙方已結清 💖',
        unsettledCount: 0,
        settledCount: 0
      };
    }
  });

  const [isSplitLoading, setIsSplitLoading] = useState(false);
  const [isSplitAddOpen, setIsSplitAddOpen] = useState(false);
  const [isSplitSettleModalOpen, setIsSplitSettleModalOpen] = useState(false);

  const calculateLocalSplitSummary = (currentItems: SplitRecordItem[]) => {
    let liaoOwesZhou = 0;
    let zhouOwesLiao = 0;
    let unsettledCount = 0;
    let settledCount = 0;

    currentItems.forEach((item) => {
      if (item.status === '未結清') {
        unsettledCount++;
        const debtorAmt = item.debtorAmount || (item.splitMode === 'AA平分' ? Math.round(item.totalAmount / 2) : item.totalAmount);
        if (item.payer === '廖') {
          zhouOwesLiao += debtorAmt;
        } else {
          liaoOwesZhou += debtorAmt;
        }
      } else {
        settledCount++;
      }
    });

    let netDebtor: '廖' | '周' | 'none' = 'none';
    let netAmount = 0;
    let summaryText = '目前雙方已結清 💖';

    if (liaoOwesZhou > zhouOwesLiao) {
      netDebtor = '廖';
      netAmount = liaoOwesZhou - zhouOwesLiao;
      summaryText = `廖廖 應返還 周周 NT$ ${(Number(netAmount) || 0).toLocaleString()}`;
    } else if (zhouOwesLiao > liaoOwesZhou) {
      netDebtor = '周';
      netAmount = zhouOwesLiao - liaoOwesZhou;
      summaryText = `周周 應返還 廖廖 NT$ ${(Number(netAmount) || 0).toLocaleString()}`;
    }

    const newSummary: SplitSummary = {
      liaoOwesZhou,
      zhouOwesLiao,
      netDebtor,
      netAmount,
      summaryText,
      unsettledCount,
      settledCount
    };

    setSplitSummary(newSummary);
    try {
      localStorage.setItem('banban_split_summary', JSON.stringify(newSummary));
      localStorage.setItem('banban_split_records', JSON.stringify(currentItems));
    } catch (e) {}
  };

  // ------------------- 購物記事 (Notebook / Shopping List) 狀態 -------------------
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => {
    const local = localStorage.getItem('muji_shopping_items');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((it: any) => ({
            ...it,
            createdTime: getShoppingItemDisplayTime(it) || it.createdTime || formatAmPmTime(new Date())
          }));
        }
      } catch (e) {}
    }
    return INITIAL_SHOPPING_ITEMS;
  });
  const [shoppingStores, setShoppingStores] = useState<string[]>(INITIAL_STORES);
  const [shoppingFilter, setShoppingFilter] = useState<'all' | 'need' | 'want' | 'done'>('all');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('all');
  const [shoppingSearch, setShoppingSearch] = useState<string>('');
  const [isAddShoppingOpen, setIsAddShoppingOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<'record' | 'shopping'>('record');
  const [isManageStoresOpen, setIsManageStoresOpen] = useState(false);
  const [isAddStoreInput, setIsAddStoreInput] = useState('');
  const [isClearDoneConfirmOpen, setIsClearDoneConfirmOpen] = useState(false);
  const [selectedShoppingDetail, setSelectedShoppingDetail] = useState<ShoppingItem | null>(null);

  // 新增/編輯採購項目表單狀態
  const [shoppingForm, setShoppingForm] = useState({
    id: '',
    category: '需要買' as '需要買' | '想要買',
    item: '',
    store: '菜市場',
    customStore: '',
    deadline: '儘快',
    customDeadline: '',
    creator: '廖尹丞' as '廖尹丞' | '周沛緹',
    status: '待購買' as '待購買' | '已買到',
    createdTime: '',
    note: ''
  });
  
  // 篩選與彈窗提醒狀態
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedPayer, setSelectedPayer] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all'); // 新增：詳細日期篩選
  const [searchQuery, setSearchQuery] = useState<string>(''); // 新增：歷史明細關鍵字搜尋
  const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc'); // 新增：歷史帳目排序方式
  const [reconciledMonths, setReconciledMonths] = useState<string[]>([]); // 新增：已核銷月份
  const [settlementMonth, setSettlementMonth] = useState<string>(''); // 新增：結算頁面選擇的對帳月份
  const [isSyncAlertOpen, setIsSyncAlertOpen] = useState(false);
  
  // ------------------- 即時匯率與出國幣值換算狀態 -------------------
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('muji_exchange_rates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.rates) return { ...DEFAULT_RATES_MAP, ...parsed.rates };
      }
    } catch (e) {}
    return DEFAULT_RATES_MAP;
  });
  const [ratesLastUpdated, setRatesLastUpdated] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('muji_exchange_rates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.updated) return parsed.updated;
      }
    } catch (e) {}
    return new Date().toLocaleDateString('zh-TW');
  });
  const [isRateLoading, setIsRateLoading] = useState(false);
  const [rateFetchError, setRateFetchError] = useState(false);

  // 出國幣值試算器 Modal 與計算狀態 (支援雙向對換)
  const [showTravelCalculatorModal, setShowTravelCalculatorModal] = useState(false);
  const [calcInputAmount, setCalcInputAmount] = useState('1000');
  const [calcBaseCurrency, setCalcBaseCurrency] = useState('JPY');
  const [calcMode, setCalcMode] = useState<'foreignToTwd' | 'twdToForeign'>('foreignToTwd');

  // ------------------- 隱密部署與連線設定 Modal 狀態 -------------------
  
  const [editingRecord, setEditingRecord] = useState<RecordItem | null>(null);
  const [gasWebUrl, setGasWebUrl] = useState(() => localStorage.getItem('muji_gas_web_url') || '');
  const [isSyncingGas, setIsSyncingGas] = useState(false);

  // ------------------- Google Apps Script / Web App API 整合核心 -------------------
  const callGasApi = async (action: string, payload?: any): Promise<any> => {
    // 1. 原生 Google Apps Script iframe 環境
    if (typeof window !== 'undefined' && (window as any).google?.script?.run) {
      return new Promise((resolve) => {
        const runner = (window as any).google.script.run
          .withSuccessHandler((res: any) => resolve(res))
          .withFailureHandler((err: any) => resolve({ success: false, error: String(err) }));
        if (typeof runner[action] === 'function') {
          runner[action](payload);
        } else {
          resolve({ success: false, error: `Function ${action} not found` });
        }
      });
    }

    // 2. AI Studio 預覽版或獨立 Web 網頁環境，透過 HTTP fetch 呼叫 GAS Web App
    const targetUrl = localStorage.getItem('muji_gas_web_url') || gasWebUrl;
    if (targetUrl && targetUrl.trim().startsWith('http')) {
      try {
        const res = await fetch(targetUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action, ...payload })
        });
        const data = await res.json();
        return data;
      } catch (err) {
        console.warn(`callGasApi HTTP POST to ${action} failed:`, err);
      }
    }

    return { success: false, isLocalFallback: true };
  };

  // 連網與即時同步狀態
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() => new Date().toLocaleTimeString('zh-TW', { hour12: false }));
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);
  const [isDataBackupOpen, setIsDataBackupOpen] = useState(false);
  const [pendingSyncQueue, setPendingSyncQueue] = useState<PendingSyncItem[]>(() => getPendingQueue());

  // 監聽離線佇列變更
  useEffect(() => {
    return subscribeSyncStatus(setPendingSyncQueue);
  }, []);

  const handleFlushQueue = async () => {
    setIsSyncingGas(true);
    try {
      const res = await processSyncQueue();
      if (res.processed > 0) {
        showToast(`⚡ 已成功補送 ${res.processed} 筆離線操作至試算表！`, 'success');
        fetchDashboardData(false, true);
        fetchShoppingData(true);
        fetchSplitData(true);
      } else if (res.failed > 0) {
        showToast(`⚠️ 部分重試未成功 (${res.failed} 筆失敗)，請確認網路或 Web App 連線設定`, 'error');
      } else {
        showToast('目前無待同步之離線操作', 'info');
      }
    } finally {
      setIsSyncingGas(false);
    }
  };

  const handleRestoreData = (restored: any) => {
    if (Array.isArray(restored.records)) {
      setRecords(restored.records);
      localStorage.setItem('muji_ledger_data', JSON.stringify(restored.records));
    }
    if (Array.isArray(restored.shoppingItems)) {
      setShoppingItems(restored.shoppingItems);
      localStorage.setItem('muji_shopping_items', JSON.stringify(restored.shoppingItems));
    }
    if (Array.isArray(restored.shoppingStores)) {
      setShoppingStores(restored.shoppingStores);
      localStorage.setItem('muji_shopping_stores', JSON.stringify(restored.shoppingStores));
    }
    if (Array.isArray(restored.splitItems)) {
      setSplitItems(restored.splitItems);
      localStorage.setItem('banban_split_records', JSON.stringify(restored.splitItems));
      calculateLocalSplitSummary(restored.splitItems);
    }
    if (Array.isArray(restored.travelTrips)) {
      localStorage.setItem('banban_travel_trips', JSON.stringify(restored.travelTrips));
    }
    if (Array.isArray(restored.travelExpenses)) {
      localStorage.setItem('banban_travel_expenses', JSON.stringify(restored.travelExpenses));
    }
    if (Array.isArray(restored.travelWishlist)) {
      localStorage.setItem('banban_travel_wishlist', JSON.stringify(restored.travelWishlist));
    }
    showToast('🎉 已成功還原備份資料！', 'success');
  };

  const handleSyncAll = async () => {
    setIsSyncingGas(true);
    try {
      await Promise.all([
        fetchDashboardData(false, false),
        fetchShoppingData(false),
        fetchSplitData(false),
        fetchTravelData(true)
      ]);
      showToast('🎉 所有資料庫（流水帳、採購、代墊、旅遊分帳）已與 Google 試算表完成即時對帳！', 'success');
    } finally {
      setIsSyncingGas(false);
    }
  };

  const fetchDashboardData = async (showToastNotice = false, isBackground = false) => {
    if (!isBackground) setIsSyncingGas(true);
    else setIsBackgroundSyncing(true);

    try {
      const res = await callGasApi('getDashboardData');
      if (res && res.success) {
        if (Array.isArray(res.records)) {
          setRecords(prev => {
            // 只有在資料內容有變動時才更新狀態，避免無謂 re-render
            const prevStr = JSON.stringify(prev);
            const nextStr = JSON.stringify(res.records);
            if (prevStr !== nextStr && res.records.length > 0) {
              localStorage.setItem('muji_ledger_data', nextStr);
              return res.records;
            }
            return prev;
          });
        }
        if (Array.isArray(res.reconciledMonths)) {
          setReconciledMonths(prev => {
            const prevStr = JSON.stringify(prev);
            const nextStr = JSON.stringify(res.reconciledMonths);
            if (prevStr !== nextStr) {
              localStorage.setItem('muji_reconciled_months', nextStr);
              return res.reconciledMonths;
            }
            return prev;
          });
        }
        const timeStr = new Date().toLocaleTimeString('zh-TW', { hour12: false });
        setLastSyncedAt(timeStr);
        if (showToastNotice) {
          showToast('🎉 已成功從 Google 試算表抓取最新對帳資料！', 'success');
        }
      } else if (showToastNotice) {
        showToast('⚡ 本機離線模式（若需雲端同步，請於右下角「設定部署」輸入 Web App URL）', 'info');
      }
    } catch (err) {
      console.warn('fetchDashboardData error:', err);
    } finally {
      if (!isBackground) setIsSyncingGas(false);
      setIsBackgroundSyncing(false);
    }
  };

  const fetchShoppingData = async (isBackground = false) => {
    try {
      const res = await callGasApi('getShoppingData');
      if (res && res.success) {
        if (Array.isArray(res.items)) {
          const normalized = res.items.map((it: any) => ({
            ...it,
            createdTime: getShoppingItemDisplayTime(it) || it.createdTime || formatAmPmTime(new Date())
          }));
          setShoppingItems(prev => {
            const prevStr = JSON.stringify(prev);
            const nextStr = JSON.stringify(normalized);
            if (prevStr !== nextStr) {
              localStorage.setItem('muji_shopping_items', nextStr);
              return normalized;
            }
            return prev;
          });
        }
        if (Array.isArray(res.stores) && res.stores.length > 0) {
          setShoppingStores(prev => {
            const prevStr = JSON.stringify(prev);
            const nextStr = JSON.stringify(res.stores);
            if (prevStr !== nextStr) {
              localStorage.setItem('muji_shopping_stores', nextStr);
              return res.stores;
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.warn('fetchShoppingData error:', err);
    }
  };

  const fetchSplitData = async (silent = false) => {
    if (!gasWebUrl) {
      calculateLocalSplitSummary(splitItems);
      return;
    }
    if (!silent) setIsSplitLoading(true);
    try {
      const res = await callGasApi('getSplitData');
      if (res && res.success) {
        if (Array.isArray(res.items)) {
          setSplitItems(res.items);
          localStorage.setItem('banban_split_records', JSON.stringify(res.items));
        }
        if (res.summary) {
          setSplitSummary(res.summary);
          localStorage.setItem('banban_split_summary', JSON.stringify(res.summary));
        } else {
          calculateLocalSplitSummary(res.items || []);
        }
        if (!silent) showToast('代墊明細已同步更新！', 'success');
      } else {
        calculateLocalSplitSummary(splitItems);
      }
    } catch (err) {
      calculateLocalSplitSummary(splitItems);
    } finally {
      if (!silent) setIsSplitLoading(false);
    }
  };

  const fetchTravelData = async (silent = false) => {
    try {
      const res = await callGasApi('getTravelData');
      if (res && res.success) {
        if (Array.isArray(res.trips)) {
          localStorage.setItem('banban_travel_trips', JSON.stringify(res.trips));
        }
        if (Array.isArray(res.expenses)) {
          localStorage.setItem('banban_travel_expenses', JSON.stringify(res.expenses));
        }
        if (Array.isArray(res.wishlist)) {
          localStorage.setItem('banban_travel_wishlist', JSON.stringify(res.wishlist));
        }
        window.dispatchEvent(new CustomEvent('travel-data-updated', { detail: res }));
        if (!silent) showToast('旅遊分帳資料已同步更新！', 'success');
      }
    } catch (err) {
      console.warn('fetchTravelData error:', err);
    }
  };

  const handleAddSplitRecord = async (data: {
    payer: '廖' | '周';
    itemName: string;
    totalAmount: number;
    splitMode: 'AA平分' | '全額代付' | '自訂金額';
    customOweAmount?: number;
    note?: string;
  }) => {
    const otherPerson = data.payer === '廖' ? '周' : '廖';
    let debtorAmt = Math.round(data.totalAmount / 2);
    if (data.splitMode === '全額代付') {
      debtorAmt = data.totalAmount;
    } else if (data.splitMode === '自訂金額') {
      debtorAmt = data.customOweAmount !== undefined ? data.customOweAmount : Math.round(data.totalAmount / 2);
    }

    const now = new Date();
    const timeStr = formatAmPmTime(now);

    const newItem: SplitRecordItem = {
      id: 'split-' + Date.now(),
      time: timeStr,
      payer: data.payer,
      splitMode: data.splitMode,
      itemName: data.itemName,
      totalAmount: data.totalAmount,
      splitResult: `${otherPerson} 應返還 ${data.payer} NT$ ${(Number(debtorAmt) || 0).toLocaleString()}`,
      debtor: otherPerson,
      debtorAmount: debtorAmt,
      status: '未結清',
      note: data.note || ''
    };

    const updated = [newItem, ...splitItems];
    setSplitItems(updated);
    calculateLocalSplitSummary(updated);
    showToast(`已成功記錄代墊：${newItem.itemName}（${otherPerson === '廖' ? '廖廖' : '周周'} 需返還 $${debtorAmt}）`, 'success');

    if (gasWebUrl) {
      try {
        const res = await callGasApi('addSplitRecord', {
          payer: data.payer,
          totalAmount: data.totalAmount,
          itemName: data.itemName,
          splitMode: data.splitMode,
          customOweAmount: debtorAmt,
          note: data.note || ''
        });
        if (!res || !res.success) {
          enqueueSyncItem('addSplitRecord', {
            payer: data.payer,
            totalAmount: data.totalAmount,
            itemName: data.itemName,
            splitMode: data.splitMode,
            customOweAmount: debtorAmt,
            note: data.note || ''
          }, `新增代墊：${newItem.itemName} ($${newItem.totalAmount})`);
        }
        fetchSplitData(true);
      } catch (err) {
        console.error('GAS add split error:', err);
        enqueueSyncItem('addSplitRecord', {
          payer: data.payer,
          totalAmount: data.totalAmount,
          itemName: data.itemName,
          splitMode: data.splitMode,
          customOweAmount: debtorAmt,
          note: data.note || ''
        }, `新增代墊：${newItem.itemName} ($${newItem.totalAmount})`);
      }
    } else {
      enqueueSyncItem('addSplitRecord', {
        payer: data.payer,
        totalAmount: data.totalAmount,
        itemName: data.itemName,
        splitMode: data.splitMode,
        customOweAmount: debtorAmt,
        note: data.note || ''
      }, `新增代墊：${newItem.itemName} ($${newItem.totalAmount})`);
    }
  };

  const handleDeleteSplitRecord = (id: string) => {
    const target = splitItems.find(i => String(i.id) === String(id));
    const itemName = target ? `「${target.itemName || '代墊明細'}」` : '這筆代墊明細';
    const amountStr = target && target.totalAmount !== undefined && target.totalAmount !== null ? `（NT$ ${(Number(target.totalAmount) || 0).toLocaleString()}）` : '';

    setCustomConfirmState({
      isOpen: true,
      title: '🗑️ 確認刪除代墊紀錄',
      message: `確定要刪除代墊明細 ${itemName} ${amountStr} 嗎？刪除後系統將自動重新計算所有待結算與還款金額。`,
      confirmText: '確定刪除',
      cancelText: '取消',
      isDanger: true,
      onConfirm: async () => {
        const updated = splitItems.filter(i => String(i.id) !== String(id));
        setSplitItems(updated);
        localStorage.setItem('banban_split_records', JSON.stringify(updated));
        calculateLocalSplitSummary(updated);
        showToast('已刪除該筆代墊明細', 'info');

        try {
          const res = await callGasApi('deleteSplitRecord', { id });
          if (!res || !res.success) {
            enqueueSyncItem('deleteSplitRecord', { id }, `刪除代墊：${itemName}`);
          }
        } catch (err) {
          enqueueSyncItem('deleteSplitRecord', { id }, `刪除代墊：${itemName}`);
        }
      }
    });
  };

  const handleSettleAllSplitRecords = async (settleNote?: string) => {
    const now = new Date();
    const timeStr = formatAmPmTime(now);

    const updated = splitItems.map(item => {
      if (item.status === '未結清') {
        return { ...item, status: '已結清' as const, settledTime: timeStr };
      }
      return item;
    });

    setSplitItems(updated);
    calculateLocalSplitSummary(updated);
    showToast('🎉 所有代墊款項已全數結清！目前債務歸零！', 'success');

    if (gasWebUrl) {
      try {
        const res = await callGasApi('settleAllSplitRecords', { note: settleNote });
        if (!res || !res.success) {
          enqueueSyncItem('settleAllSplitRecords', { note: settleNote }, '全額結清所有代墊款項');
        }
        fetchSplitData(true);
      } catch (err) {
        enqueueSyncItem('settleAllSplitRecords', { note: settleNote }, '全額結清所有代墊款項');
      }
    } else {
      enqueueSyncItem('settleAllSplitRecords', { note: settleNote }, '全額結清所有代墊款項');
    }
  };

  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [deploySheetUrl, setDeploySheetUrl] = useState(() => localStorage.getItem('muji_sheet_url') || '');
  const [deployLineToken, setDeployLineToken] = useState(() => localStorage.getItem('muji_line_token') || '');
  const [activeDeployCodeTab, setActiveDeployCodeTab] = useState<'codeGs' | 'indexHtml' | 'splitHtml'>('codeGs');
  const [copiedCodeType, setCopiedCodeType] = useState<'codeGs' | 'indexHtml' | 'splitHtml' | null>(null);

  const saveDeployConfig = () => {
    const cleanSheet = deploySheetUrl.trim();
    const cleanToken = deployLineToken.trim();
    const cleanGas = gasWebUrl.trim();

    localStorage.setItem('muji_sheet_url', cleanSheet);
    localStorage.setItem('muji_line_token', cleanToken);
    localStorage.setItem('muji_gas_web_url', cleanGas);

    if (cleanSheet) {
      callGasApi('saveSpreadsheetId', { spreadsheetId: cleanSheet, url: cleanSheet });
    }
    if (cleanToken) {
      callGasApi('saveLineNotifyToken', { token: cleanToken });
    }

    showToast('連線設定與 Web App API URL 已儲存！正嘗試即時連線...', 'success');
    fetchDashboardData(true);
    fetchShoppingData();
    fetchSplitData(true);
    fetchTravelData(true);
  };

  const getCustomizedCodeGs = () => {
    let code = CODE_GS_TEMPLATE;
    
    let sheetId = deploySheetUrl.trim();
    if (sheetId.includes('docs.google.com/spreadsheets')) {
      const match = sheetId.match(/\/d\/([a-zA-Z0-9_\-]+)/);
      if (match && match[1]) sheetId = match[1];
    }

    if (deployLineToken.trim()) {
      code = code.replace(
        'var HARDCODED_LINE_TOKEN = "";',
        `var HARDCODED_LINE_TOKEN = "${deployLineToken.trim()}";`
      );
    }

    if (sheetId) {
      code = code.replace(
        'var HARDCODED_SPREADSHEET_ID = "";',
        `var HARDCODED_SPREADSHEET_ID = "${sheetId}";`
      );
    }

    return code;
  };

  const copyDeployCode = (type: 'codeGs' | 'indexHtml' | 'splitHtml') => {
    let textToCopy = INDEX_HTML_TEMPLATE;
    let labelName = 'Index.html';
    if (type === 'codeGs') {
      textToCopy = getCustomizedCodeGs();
      labelName = 'Code.gs';
    } else if (type === 'splitHtml') {
      textToCopy = SPLIT_INDEX_HTML_TEMPLATE;
      labelName = 'split/index.html';
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedCodeType(type);
      showToast(`已成功複製 ${labelName} 部署代碼！`, 'success');
      setTimeout(() => setCopiedCodeType(null), 2500);
    }).catch(() => {
      showToast('複製失敗，請手動選取代碼複製。', 'info');
    });
  };

  // 取得最新各國即時匯率 API (以台幣 TWD 為基礎交叉換算)
  const fetchLiveExchangeRates = async (showToastNotice = false, isBackground = false) => {
    if (!isBackground) setIsRateLoading(true);
    setRateFetchError(false);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/TWD');
      if (!res.ok) throw new Error('Primary API HTTP error');
      const data = await res.json();
      if (data && data.result === 'success' && data.rates) {
        const newRates: Record<string, number> = { TWD: 1 };
        CURRENCIES.forEach(c => {
          if (c.code === 'TWD') {
            newRates['TWD'] = 1;
          } else if (data.rates[c.code]) {
            const twdPerUnit = 1 / data.rates[c.code];
            newRates[c.code] = Number(twdPerUnit.toFixed(4));
          } else {
            newRates[c.code] = c.defaultRate;
          }
        });
        setExchangeRates(newRates);
        const nowStr = new Date().toLocaleString('zh-TW', { hour12: false });
        setRatesLastUpdated(nowStr);
        localStorage.setItem('muji_exchange_rates', JSON.stringify({ rates: newRates, updated: nowStr }));
        if (showToastNotice) showToast('⚡ 已即時更新台灣銀行/國際匯率市場最新數據！', 'success');
        return;
      }
    } catch (err) {
      console.warn('Primary exchange rate API failed, trying backup...', err);
    }

    try {
      const resBackup = await fetch('https://api.exchangerate-api.com/v4/latest/TWD');
      if (!resBackup.ok) throw new Error('Backup API HTTP error');
      const dataB = await resBackup.json();
      if (dataB && dataB.rates) {
        const newRates: Record<string, number> = { TWD: 1 };
        CURRENCIES.forEach(c => {
          if (c.code === 'TWD') {
            newRates['TWD'] = 1;
          } else if (dataB.rates[c.code]) {
            newRates[c.code] = Number((1 / dataB.rates[c.code]).toFixed(4));
          } else {
            newRates[c.code] = c.defaultRate;
          }
        });
        setExchangeRates(newRates);
        const nowStr = new Date().toLocaleString('zh-TW', { hour12: false });
        setRatesLastUpdated(nowStr);
        localStorage.setItem('muji_exchange_rates', JSON.stringify({ rates: newRates, updated: nowStr }));
        if (showToastNotice) showToast('⚡ 已透過備用伺服器更新各國即時匯率！', 'success');
        return;
      }
    } catch (err2) {
      console.error('All exchange rate APIs failed, using cached/default rates', err2);
      setRateFetchError(true);
      if (showToastNotice) showToast('無法連線取得最新匯率，目前採用離線基準匯率', 'info');
    } finally {
      if (!isBackground) setIsRateLoading(false);
    }
  };

  // 系統初始化載入與每 10 秒自動輪詢（即時匯率自動更新 + 雙人即時協同同步）
  useEffect(() => {
    // 首次載入
    fetchLiveExchangeRates(false, false);
    fetchDashboardData(false, false);
    fetchShoppingData(false);
    fetchSplitData(true);
    fetchTravelData(true);

    // 監聽連線與斷線事件
    const handleOnline = async () => {
      setIsOnline(true);
      fetchLiveExchangeRates(false, true);
      const res = await processSyncQueue();
      if (res.processed > 0) {
        showToast(`⚡ 網路恢復連線！已自動補送 ${res.processed} 筆暫存操作至雲端試算表`, 'success');
      }
      fetchDashboardData(false, true);
      fetchShoppingData(true);
      fetchSplitData(true);
      fetchTravelData(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 10 秒自動定時輪詢：連線中且分頁在前景時自動抓取最新匯率與試算表數據，並嘗試補送佇列
    const autoSyncTimer = setInterval(async () => {
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (!online) {
        setIsOnline(false);
        return;
      }
      setIsOnline(true);

      // 當頁面在前景時背景靜默同步
      if (!document.hidden) {
        // 如果有離線未送出佇列，嘗試自動補送
        if (getPendingQueue().length > 0) {
          await processSyncQueue();
        }
        fetchLiveExchangeRates(false, true);
        fetchDashboardData(false, true);
        fetchShoppingData(true);
        fetchSplitData(true);
        fetchTravelData(true);
      }
    }, 10000);

    // 當使用者切換回到分頁時，立即自動同步最新資料
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
        if (online) {
          if (getPendingQueue().length > 0) {
            await processSyncQueue();
          }
          fetchLiveExchangeRates(false, true);
          fetchDashboardData(false, true);
          fetchShoppingData(true);
          fetchSplitData(true);
          fetchTravelData(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(autoSyncTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [gasWebUrl]);

  // 記帳表單狀態 (新增記錄日期，預設今天，包含貨幣選項與自訂匯率)
  const [formData, setFormData] = useState({
    item: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payer: '廖尹丞' as string,
    type: '支出-日常代墊' as '支出-日常代墊' | '收入-固定公積金',
    currency: 'TWD',
    customRate: ''
  });

  // 系統載入與模擬重置狀態
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const [copied, setCopied] = useState<string | null>(null);

  // ------------------- 通知系統狀態 -------------------
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotificationsOpen, setShowNotificationsOpen] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [notifySettings, setNotifySettings] = useState({
    notifyOnAdd: true,
    notifyOnDelete: true,
    notifyOnSettle: true
  });
  const [isAppLoaded, setIsAppLoaded] = useState(false);

  // ------------------- PWA 離線安裝狀態 -------------------
  const [isPwaInstallModalOpen, setIsPwaInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // ------------------- 官方 LINE 帳號 狀態與提示 -------------------
  const [hasJoinedLine, setHasJoinedLine] = useState(false);
  const [showLinePromptModal, setShowLinePromptModal] = useState(false);

  // ------------------- LINE Notify 狀態與函式 -------------------
  const [isLineSettingsModalOpen, setIsLineSettingsModalOpen] = useState(false);
  const [lineNotifyToken, setLineNotifyToken] = useState('');
  const [maskedLineToken, setMaskedLineToken] = useState('');
  const [hasLineToken, setHasLineToken] = useState(false);
  const [isSavingLineToken, setIsSavingLineToken] = useState(false);
  const [isTestingLine, setIsTestingLine] = useState(false);
  const [lineNotifySettings, setLineNotifySettings] = useState({
    notifyOnAdd: true,
    notifyOnIncome: true,
    notifyOnEdit: true,
    notifyOnDelete: true,
    notifyOnSettle: true,
    showBalance: true,
    notifyOnShoppingAdd: true,
    notifyOnShoppingComplete: true,
    notifyOnShoppingDelete: true
  });

  const handleOpenEditShopping = (item: ShoppingItem) => {
    setShoppingForm({
      id: item.id,
      category: item.category,
      item: item.item,
      store: item.store || (shoppingStores[0] || '菜市場'),
      customStore: '',
      deadline: item.deadline || '儘快',
      customDeadline: '',
      creator: (item.creator as '廖尹丞' | '周沛緹') || '廖尹丞',
      status: item.status || '待購買',
      createdTime: item.createdTime || getShoppingItemDisplayTime(item) || formatAmPmTime(new Date()),
      note: item.note || ''
    });
    setIsAddShoppingOpen(true);
  };

  const handleAddShoppingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shoppingForm.item.trim()) {
      showToast('請填寫欲購買的品項名稱！', 'error');
      return;
    }
    const finalStore = shoppingForm.store === 'custom' ? (shoppingForm.customStore.trim() || '隨意') : shoppingForm.store;
    const finalDeadline = shoppingForm.deadline === 'custom' ? (shoppingForm.customDeadline.trim() || '儘快') : shoppingForm.deadline;
    const isEdit = !!shoppingForm.id;
    const nowFormattedTime = formatAmPmTime(new Date());

    const itemObj: ShoppingItem = {
      id: shoppingForm.id || (`shop-${Date.now()}`),
      category: shoppingForm.category,
      item: shoppingForm.item.trim(),
      store: finalStore,
      deadline: finalDeadline,
      status: (shoppingForm as any).status || '待購買',
      creator: shoppingForm.creator,
      createdTime: shoppingForm.createdTime || nowFormattedTime,
      note: shoppingForm.note.trim()
    };

    setLoading(true);
    const action = isEdit ? 'updateShoppingItem' : 'addShoppingItem';
    try {
      const res = await callGasApi(action, itemObj);
      if (res && res.success) {
        if (res.createdTime || res.timeStr) {
          itemObj.createdTime = res.createdTime || res.timeStr;
        }
      } else {
        enqueueSyncItem(action, itemObj, `${isEdit ? '修改' : '新增'}採購項目：${itemObj.item}`);
      }
    } catch (err) {
      enqueueSyncItem(action, itemObj, `${isEdit ? '修改' : '新增'}採購項目：${itemObj.item}`);
    } finally {
      setLoading(false);
    }

    if (isEdit) {
      setShoppingItems(prev => prev.map(s => String(s.id) === String(itemObj.id) ? { ...s, ...itemObj } : s));
      showToast(`已成功更新採購筆記「${shoppingForm.item}」！`, 'success');
    } else {
      setShoppingItems(prev => [itemObj, ...prev]);
      showToast(`已成功新增「${shoppingForm.item}」至採購清單！`, 'success');
    }

    setIsAddShoppingOpen(false);
    setIsAddOpen(false);
    setShoppingForm({
      id: '',
      category: '需要買',
      item: '',
      store: '全聯',
      customStore: '',
      deadline: '本週',
      customDeadline: '',
      creator: '廖尹丞',
      status: '待購買',
      createdTime: '',
      note: ''
    });
  };

  const handleToggleShoppingStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === '已買到' ? '待購買' : '已買到';
    if (selectedShoppingDetail && String(selectedShoppingDetail.id) === String(id)) {
      setSelectedShoppingDetail({
        ...selectedShoppingDetail,
        status: newStatus as any
      });
    }

    setShoppingItems(prev => prev.map(item => String(item.id) === String(id) ? { ...item, status: newStatus as any } : item));

    try {
      const res = await callGasApi('toggleShoppingItemStatus', { id, status: newStatus });
      if (!res || !res.success) {
        enqueueSyncItem('toggleShoppingItemStatus', { id, status: newStatus }, `標記採購狀態：${id} (${newStatus})`);
      }
    } catch (err) {
      enqueueSyncItem('toggleShoppingItemStatus', { id, status: newStatus }, `標記採購狀態：${id} (${newStatus})`);
    }
    showToast(newStatus === '已買到' ? '🎉 已勾選為「已買到」！' : '已重置狀態為「待購買」！', 'success');
  };

  const handleDeleteShoppingItem = (id: string, name: string) => {
    setCustomConfirmState({
      isOpen: true,
      title: '🗑️ 確認要刪除此筆購物記事嗎？',
      message: `確定要刪除「${name}」這筆購物記事嗎？刪除後將無法還原。`,
      confirmText: '確定刪除',
      cancelText: '取消',
      onConfirm: async () => {
        const updated = shoppingItems.filter(item => String(item.id) !== String(id));
        setShoppingItems(updated);
        localStorage.setItem('muji_shopping_items', JSON.stringify(updated));
        showToast(`已刪除購物記事「${name}」`, 'info');

        try {
          const res = await callGasApi('deleteShoppingItem', { id });
          if (!res || !res.success) {
            enqueueSyncItem('deleteShoppingItem', { id }, `刪除採購項目：${name}`);
          }
        } catch (err) {
          enqueueSyncItem('deleteShoppingItem', { id }, `刪除採購項目：${name}`);
        }
      }
    });
  };

  const handleClearDoneShopping = async () => {
    const doneItems = shoppingItems.filter(i => i.status === '已買到');
    if (doneItems.length === 0) {
      showToast('目前沒有已買到的項目喔！', 'info');
      setIsClearDoneConfirmOpen(false);
      return;
    }

    const updated = shoppingItems.filter(i => i.status !== '已買到');
    setShoppingItems(updated);
    localStorage.setItem('muji_shopping_items', JSON.stringify(updated));
    showToast(`🎉 已一次性清空 ${doneItems.length} 項已買到的採購項目！`, 'success');
    setIsClearDoneConfirmOpen(false);

    try {
      await callGasApi('clearDoneShoppingItems');
    } catch (err) {
      console.warn('Clear done shopping items gas error:', err);
    }
  };

  const handleAddStore = () => {
    if (!isAddStoreInput.trim()) return;
    const newName = isAddStoreInput.trim();
    if (shoppingStores.includes(newName)) {
      showToast('該商店已存在常用清單中囉！', 'info');
      return;
    }
    const updated = [...shoppingStores, newName];
    setShoppingStores(updated);
    setIsAddStoreInput('');
    saveStoresToBackend(updated);
  };

  const handleDeleteStore = (storeName: string) => {
    const updated = shoppingStores.filter(s => s !== storeName);
    setShoppingStores(updated);
    saveStoresToBackend(updated);
  };

  const saveStoresToBackend = (newStoresList: string[]) => {
    if (typeof (window as any).google !== 'undefined' && (window as any).google.script && (window as any).google.script.run) {
      (window as any).google.script.run
        .withSuccessHandler((res: any) => {
          if (res && res.success) showToast('常用商店清單已更新並同步至 Google 試算表！', 'success');
        })
        .saveStoresList(newStoresList);
    } else {
      localStorage.setItem('muji_shopping_stores_sandbox', JSON.stringify(newStoresList));
      showToast('[沙盒] 常用商店清單已更新！', 'success');
    }
  };

  useEffect(() => {
    // 載入 LINE 通知自訂設定
    const savedLineSettings = localStorage.getItem('muji_line_notify_settings');
    if (savedLineSettings) {
      try {
        const parsed = JSON.parse(savedLineSettings);
        setLineNotifySettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {}
    }

    // 獨立 sandbox 或 local 環境載入快取
    const savedLineToken = localStorage.getItem('muji_line_notify_token_sandbox');
    if (savedLineToken) {
      setLineNotifyToken('');
      const masked = savedLineToken.substring(0, 4) + "********************" + savedLineToken.substring(savedLineToken.length - 4);
      setMaskedLineToken(masked);
      setHasLineToken(true);
    }

    if (typeof (window as any).google !== 'undefined' && (window as any).google.script && (window as any).google.script.run) {
      try {
        (window as any).google.script.run
          .withSuccessHandler((res: any) => {
            if (res && res.success && res.token) {
              setMaskedLineToken(res.token);
              setLineNotifyToken('');
              setHasLineToken(true);
            }
          })
          .getLineNotifyToken();

        (window as any).google.script.run
          .withSuccessHandler((res: any) => {
            if (res && res.success && res.settings) {
              setLineNotifySettings(prev => ({ ...prev, ...res.settings }));
            }
          })
          .getLineNotifySettings();
      } catch (e) {
        console.warn("Failed to get LINE Notify config from GAS:", e);
      }
    } else if (gasWebUrl) {
      callGasApi('getLineNotifySettings').then(res => {
        if (res && res.success && res.settings) {
          setLineNotifySettings(prev => ({ ...prev, ...res.settings }));
        }
      });
      callGasApi('getLineNotifyToken').then(res => {
        if (res && res.success && res.token) {
          setMaskedLineToken(res.token);
          setHasLineToken(true);
        }
      });
    }

    fetchShoppingData();
  }, [gasWebUrl]);

  const saveLineNotifySettings = (newSettings: typeof lineNotifySettings) => {
    setLineNotifySettings(newSettings);
    localStorage.setItem('muji_line_notify_settings', JSON.stringify(newSettings));

    // 同步到 GAS Web App 後端
    if (gasWebUrl) {
      callGasApi('saveLineNotifySettings', { settings: newSettings });
    }

    if (typeof (window as any).google !== 'undefined' && (window as any).google.script && (window as any).google.script.run) {
      try {
        (window as any).google.script.run
          .withSuccessHandler((res: any) => {
            if (res && res.success) {
              showToast('LINE 通知偏好設定已同步至雲端！', 'success');
            }
          })
          .saveLineNotifySettings(newSettings);
      } catch (e) {}
    } else {
      showToast('已即時更新 LINE 各項通知開關！', 'success');
    }
  };

  const toggleLineNotifySetting = (key: keyof typeof lineNotifySettings) => {
    const updated = {
      ...lineNotifySettings,
      [key]: !lineNotifySettings[key]
    };
    saveLineNotifySettings(updated);
  };

  const setAllLineNotifySettings = (enableAll: boolean) => {
    const updated = {
      notifyOnAdd: enableAll,
      notifyOnIncome: enableAll,
      notifyOnEdit: enableAll,
      notifyOnDelete: enableAll,
      notifyOnSettle: enableAll,
      showBalance: enableAll,
      notifyOnShoppingAdd: enableAll,
      notifyOnShoppingComplete: enableAll,
      notifyOnShoppingDelete: enableAll
    };
    saveLineNotifySettings(updated);
    showToast(enableAll ? '已一鍵開啟所有 LINE 即時推播項目！' : '已一鍵關閉所有 LINE 即時推播項目！', 'info');
  };

  const handleSaveLineNotifyToken = () => {
    if (!lineNotifyToken.trim() && hasLineToken) {
      // 這是點擊「清除 / 重新設定」
      if (gasWebUrl) {
        setIsSavingLineToken(true);
        callGasApi('saveLineNotifyToken', { token: '' }).then((res: any) => {
          setIsSavingLineToken(false);
          setMaskedLineToken('');
          setHasLineToken(false);
          showToast('已清除 LINE 權杖設定！', 'success');
        });
        return;
      }
      if (typeof (window as any).google !== 'undefined' && (window as any).google.script && (window as any).google.script.run) {
        setIsSavingLineToken(true);
        (window as any).google.script.run
          .withSuccessHandler((res: any) => {
            setIsSavingLineToken(false);
            if (res && res.success) {
              setMaskedLineToken('');
              setHasLineToken(false);
              showToast(res.message, 'success');
            } else {
              showToast(res ? res.message : '清除失敗', 'error');
            }
          })
          .withFailureHandler((err: any) => {
            setIsSavingLineToken(false);
            showToast('連線失敗：' + err.toString(), 'error');
          })
          .saveLineNotifyToken('');
      } else {
        localStorage.removeItem('muji_line_notify_token_sandbox');
        setLineNotifyToken('');
        setMaskedLineToken('');
        setHasLineToken(false);
        showToast('已清除本機沙盒模擬 LINE 權杖！', 'success');
      }
      return;
    }

    if (!lineNotifyToken.trim()) {
      showToast('請輸入有效的 LINE Channel Access Token 權杖！', 'error');
      return;
    }

    const tokenToSave = lineNotifyToken.trim();
    if (gasWebUrl) {
      setIsSavingLineToken(true);
      callGasApi('saveLineNotifyToken', { token: tokenToSave }).then((res: any) => {
        setIsSavingLineToken(false);
        if (res && res.success) {
          const masked = tokenToSave.substring(0, 4) + "********************" + tokenToSave.substring(tokenToSave.length - 4);
          setMaskedLineToken(masked);
          setLineNotifyToken('');
          setHasLineToken(true);
          showToast(res.message || 'LINE Token 儲存成功！', 'success');
        } else {
          showToast(res ? res.message : '儲存失敗', 'error');
        }
      });
      return;
    }

    if (typeof (window as any).google !== 'undefined' && (window as any).google.script && (window as any).google.script.run) {
      setIsSavingLineToken(true);
      (window as any).google.script.run
        .withSuccessHandler((res: any) => {
          setIsSavingLineToken(false);
          if (res && res.success) {
            setMaskedLineToken(tokenToSave.substring(0, 4) + "********************" + tokenToSave.substring(tokenToSave.length - 4));
            setLineNotifyToken('');
            setHasLineToken(true);
            showToast(res.message, 'success');
          } else {
            showToast(res ? res.message : '儲存失敗', 'error');
          }
        })
        .withFailureHandler((err: any) => {
          setIsSavingLineToken(false);
          showToast('儲存失敗：' + err.toString(), 'error');
        })
        .saveLineNotifyToken(tokenToSave);
    } else {
      // Sandbox
      localStorage.setItem('muji_line_notify_token_sandbox', tokenToSave);
      setMaskedLineToken(tokenToSave.substring(0, 4) + "********************" + tokenToSave.substring(tokenToSave.length - 4));
      setLineNotifyToken('');
      setHasLineToken(true);
      showToast('本機沙盒測試：LINE 權杖儲存成功！', 'success');
    }
  };

  const handleTestLineNotify = async () => {
    setIsTestingLine(true);
    const tokenToUse = lineNotifyToken.trim() || deployLineToken.trim();

    if (gasWebUrl) {
      try {
        const res = await callGasApi('testLineNotify', { token: tokenToUse });
        setIsTestingLine(false);
        if (res && res.success) {
          showToast(res.message || '🎉 LINE 測試卡片訊息發送成功！請檢查聊天室。', 'success');
        } else {
          showToast(res ? res.message : '測試發送失敗，請確認 Token 是否有效', 'error');
        }
        return;
      } catch (err: any) {
        setIsTestingLine(false);
        showToast('測試失敗：' + err.toString(), 'error');
        return;
      }
    }

    if (typeof (window as any).google !== 'undefined' && (window as any).google.script && (window as any).google.script.run) {
      (window as any).google.script.run
        .withSuccessHandler((res: any) => {
          setIsTestingLine(false);
          if (res && res.success) {
            showToast(res.message, 'success');
          } else {
            showToast(res ? res.message : '測試發送失敗', 'error');
          }
        })
        .withFailureHandler((err: any) => {
          setIsTestingLine(false);
          showToast('測試失敗：' + err.toString(), 'error');
        })
        .testLineNotify(tokenToUse);
    } else {
      // Sandbox Simulator
      setTimeout(() => {
        setIsTestingLine(false);
        showToast('🔔 [沙盒模擬] LINE 測試卡片發送成功！若連線至正式 GAS，LINE 將即時跳出卡片通知！', 'success');
      }, 700);
    }
  };

  const handleMarkJoinedLine = () => {
    localStorage.setItem('muji_official_line_joined', 'true');
    setHasJoinedLine(true);
    setShowLinePromptModal(false);
    showToast('感謝您加入官方 LINE 帳號！已記錄您的狀態。', 'success');
  };

  // ------------------- 自訂雙鍵對話確認 Modal -------------------
  const [customConfirmState, setCustomConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const handleSyncClick = () => {
    setIsSyncAlertOpen(true);
  };

  const backfillNotificationsFromRecords = (ledgerRecords: RecordItem[]) => {
    if (!ledgerRecords || ledgerRecords.length === 0) return;
    
    const oneWeekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    setNotifications(prev => {
      let updated = [...prev];
      let addedAny = false;
      
      const sortedLedger = [...ledgerRecords].sort((a, b) => {
        const da = Date.parse((String(a.date) || '').replace(/-/g, '/'));
        const db = Date.parse((String(b.date) || '').replace(/-/g, '/'));
        return db - da;
      });

      sortedLedger.slice(0, 3).forEach(rec => {
        const notifId = 'notif-sync-' + rec.id;
        const isIncome = rec.type.includes('收入');
        const titleTag = isIncome ? "💰 " : "💸 ";
        const actionName = isIncome ? "撥入了公積金" : "新增了日常代墊";
        const notifyTitle = `${titleTag}${rec.payer} ${actionName}`;
        const notifyDesc = `「${rec.item}」：金額 $${(Number(rec.amount) || 0).toLocaleString()} 元 (${rec.month} 月份)`;
        
        const exists = updated.some(n => 
          n.id === notifId || 
          n.desc === notifyDesc || 
          (n.desc.includes(rec.item) && n.desc.includes((Number(rec.amount) || 0).toLocaleString()))
        );
        
        if (!exists) {
          const isIncome = rec.type.includes('收入');
          const titleTag = isIncome ? "💰 " : "💸 ";
          const actionName = isIncome ? "撥入了公積金" : "新增了日常代墊";
          const notifyTitle = `${titleTag}${rec.payer} ${actionName}`;
          const notifyDesc = `「${rec.item}」：金額 $${(Number(rec.amount) || 0).toLocaleString()} 元 (${rec.month} 月份)`;
          
          let recordTimestamp = Date.now();
          let timeDisplayStr = formatAmPmTime(rec.timestamp || rec.date || '');
          if (rec.timestamp) {
            try {
              const parsed = Date.parse(rec.timestamp.replace(/-/g, '/'));
              if (!isNaN(parsed)) {
                recordTimestamp = parsed;
              }
            } catch(e) {}
          } else {
            try {
              const parsed = Date.parse((String(rec.date) || '').replace(/-/g, '/'));
              if (!isNaN(parsed)) recordTimestamp = parsed;
            } catch(e) {}
          }

          const isFreshNotif = isAppLoaded;

          updated.push({
            id: notifId,
            title: notifyTitle,
            desc: notifyDesc,
            time: timeDisplayStr,
            read: !isFreshNotif, // 💡 新通知為未讀 (read: false)，初始載入回填的通知為已讀 (read: true)
            type: isIncome ? 'income' : 'expense',
            timestamp: recordTimestamp
          });
          addedAny = true;
        }
      });

      if (addedAny) {
        updated.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        updated = updated.filter(n => (n.timestamp || Date.now()) >= oneWeekAgoMs);
        localStorage.setItem('muji_notifications', JSON.stringify(updated));
      }
      return updated;
    });
  };

  // 初始化與本機 LocalStorage 綁定
  useEffect(() => {
    // 1. 載入對帳流水帳紀錄
    const saved = localStorage.getItem('muji_ledger_data');
    let loadedRecords: RecordItem[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 防呆與舊資料遷移：確保每條紀錄都有 date
        const migrated = parsed.map((r: any) => {
          let mStr = String(r.month || '').trim();
          if (!/^\d{4}-\d{2}$/.test(mStr)) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(mStr)) {
              mStr = mStr.substring(0, 7);
            } else {
              const d = new Date(mStr);
              if (!isNaN(d.getTime())) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                mStr = `${year}-${month}`;
              }
            }
          }
          return {
            ...r,
            month: mStr,
            date: r.date || `${mStr}-01`
          };
        });
        loadedRecords = migrated;
        setRecords(migrated);
        
        // 預設結算對帳月份為最新一筆的月份
        if (migrated.length > 0) {
          const uniqueMonths = Array.from(new Set(migrated.map((r: any) => r.month))).sort((a: any, b: any) => b.localeCompare(a));
          if (uniqueMonths.length > 0) {
            setSettlementMonth(uniqueMonths[0] as string);
          }
        }
      } catch (err) {
        loadedRecords = INITIAL_RECORDS;
        setRecords(INITIAL_RECORDS);
        setSettlementMonth('2026-06');
      }
    } else {
      loadedRecords = INITIAL_RECORDS;
      setRecords(INITIAL_RECORDS);
      setSettlementMonth('2026-06');
      localStorage.setItem('muji_ledger_data', JSON.stringify(INITIAL_RECORDS));
    }

    // 2. 載入已核銷月份
    const savedReconciled = localStorage.getItem('muji_reconciled_months');
    if (savedReconciled) {
      try {
        setReconciledMonths(JSON.parse(savedReconciled));
      } catch (e) {
        setReconciledMonths([]);
      }
    }

    // 3. 載入通知紀錄（每週自動清理：僅保留一週內的通知紀錄，其餘自動刪除）
    const savedNotifications = localStorage.getItem('muji_notifications');
    const oneWeekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let initialLoadedNotifs: AppNotification[] = [];

    if (savedNotifications) {
      try {
        const parsedNotifs: AppNotification[] = JSON.parse(savedNotifications);
        initialLoadedNotifs = parsedNotifs.filter(n => {
          let t = n.timestamp;
          if (!t) {
            try {
              const parsed = Date.parse(n.time.replace(/-/g, '/'));
              t = !isNaN(parsed) ? parsed : Date.now();
            } catch (e) {
              t = Date.now();
            }
          }
          return t >= oneWeekAgoMs;
        });
      } catch (e) {
        initialLoadedNotifs = [];
      }
    } else {
      const parsedTime1 = Date.parse('2026-06-06 08:33'.replace(/-/g, '/'));
      initialLoadedNotifs = [
        {
          id: 'notif-1',
          title: '💡 系統連線成功',
          desc: '已妥善準備好與 Muji 雲端記帳資料同步連結機制。',
          time: '2026-06-06 08:33',
          read: false,
          type: 'system',
          timestamp: !isNaN(parsedTime1) ? parsedTime1 : Date.now()
        }
      ];
    }
    
    setNotifications(initialLoadedNotifs);
    localStorage.setItem('muji_notifications', JSON.stringify(initialLoadedNotifs));

    // 自動依據真實交易資料回填最新通知
    backfillNotificationsFromRecords(loadedRecords);

    // 4. 載入通知偏好設定
    const savedSettings = localStorage.getItem('muji_notification_settings');
    if (savedSettings) {
      try {
        setNotifySettings(JSON.parse(savedSettings));
      } catch (e) {
        // Use default values
      }
    }

    // 5. 載入官方 LINE 帳號狀態與初次使用提醒
    const joinedLine = localStorage.getItem('muji_official_line_joined');
    if (joinedLine === 'true') {
      setHasJoinedLine(true);
    } else {
      setTimeout(() => {
        setShowLinePromptModal(true);
      }, 1000);
    }
  }, []);

  // 在初始化載入完之後，延遲一秒將 isAppLoaded 設為 true，此後的新增才觸發推播
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLoaded(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 🧪 本機沙盒測試：模擬另一半記帳即時背景推播
  useEffect(() => {
    if (!notifyEnabled || !isAppLoaded) return;
    
    const intervalOfSim = setInterval(() => {
      // 15% 機率模擬另一半寫入新代墊項目
      if (Math.random() < 0.15) {
        const payers: ('廖尹丞' | '周沛緹')[] = ["周沛緹", "廖尹丞"];
        const randomPayer = payers[Math.floor(Math.random() * payers.length)];
        const items = ["美廉社採買牛奶飲料", "家樂福公共垃圾袋", "蝦皮公共小拖鞋", "全家便利商店買零食"];
        const rItem = items[Math.floor(Math.random() * items.length)];
        const rAmount = Math.floor(Math.random() * 500) + 100;
        
        const pad = (n: number) => String(n).padStart(2, '0');
        const nowObj = new Date();
        const mockTimestamp = `${nowObj.getFullYear()}-${pad(nowObj.getMonth() + 1)}-${pad(nowObj.getDate())} ${pad(nowObj.getHours())}:${pad(nowObj.getMinutes())}:${pad(nowObj.getSeconds())}`;
        const monthStr = mockTimestamp.substring(0, 7);
        const newMockId = Date.now();
        
        const mockRow: RecordItem = {
          id: newMockId,
          month: monthStr,
          date: mockTimestamp.split(' ')[0],
          item: rItem,
          payer: randomPayer,
          amount: rAmount,
          type: "支出-日常代墊",
          timestamp: mockTimestamp
        };
        
        setRecords(prev => {
          const updated = [mockRow, ...prev];
          localStorage.setItem('muji_ledger_data', JSON.stringify(updated));
          // 延遲更新以確保 setRecords 完成後，能回填新的通知及觸發 Notification 推播
          setTimeout(() => {
            backfillNotificationsFromRecords(updated);
          }, 100);
          return updated;
        });
      }
    }, 30000); // 每 30 秒執行一次
    
    return () => clearInterval(intervalOfSim);
  }, [notifyEnabled, isAppLoaded]);

  const addNotificationAndSave = (title: string, desc: string, type: 'expense' | 'income' | 'system' | 'delete' | 'settle') => {
    if (!notifyEnabled && type !== 'system') return;
    if (type === 'expense' || type === 'income') {
      if (!notifySettings.notifyOnAdd) return;
    }
    if (type === 'delete') {
      if (!notifySettings.notifyOnDelete) return;
    }
    if (type === 'settle') {
      if (!notifySettings.notifyOnSettle) return;
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    setNotifications(prev => {
      const newNotif: AppNotification = {
        id: 'notif-' + Date.now() + Math.random().toString(36).substring(2, 7),
        title,
        desc,
        time: timeStr,
        read: false,
        type,
        timestamp: Date.now()
      };
      const updated = [newNotif, ...prev];
      localStorage.setItem('muji_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('muji_notifications', JSON.stringify(updated));
      return updated;
    });
    showToast('已將所有通知標示為已讀', 'success');
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('muji_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem('muji_notifications', JSON.stringify(updated));
      return updated;
    });
    showToast('已刪除該通知', 'info');
  };

  const saveNotifySettings = (newSettings: typeof notifySettings) => {
    setNotifySettings(newSettings);
    localStorage.setItem('muji_notification_settings', JSON.stringify(newSettings));
    showToast('通知設定已儲存', 'success');
  };

  // 儲存已核銷月份到本機
  const saveReconciledToLocal = (newReconciled: string[]) => {
    setReconciledMonths(newReconciled);
    localStorage.setItem('muji_reconciled_months', JSON.stringify(newReconciled));
  };

  // 儲存至本機
  const saveRecordsToLocal = (newRecords: RecordItem[]) => {
    setRecords(newRecords);
    localStorage.setItem('muji_ledger_data', JSON.stringify(newRecords));
  };

  // 觸發 Toast 通知
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // 表單送出處理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item.trim()) {
      showToast('請輸入款項項目名稱', 'error');
      return;
    }
    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('款項金額必須是正數或大於 0 的數值', 'error');
      return;
    }
    const selectedCurrency = formData.currency || 'TWD';
    const effectiveRate = selectedCurrency === 'TWD'
      ? 1
      : (parseFloat(formData.customRate) || exchangeRates[selectedCurrency] || DEFAULT_RATES_MAP[selectedCurrency] || 1);
    const twdAmount = selectedCurrency === 'TWD' ? numAmount : Math.round(numAmount * effectiveRate);
    const selectedDateStr = formData.date || new Date().toISOString().split('T')[0];
    const monthStr = selectedDateStr.substring(0, 7);
    const nowObj = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const mockTimestamp = `${nowObj.getFullYear()}-${pad(nowObj.getMonth() + 1)}-${pad(nowObj.getDate())} ${pad(nowObj.getHours())}:${pad(nowObj.getMinutes())}:${pad(nowObj.getSeconds())}`;

    const recordData: RecordItem = {
      id: editingRecord ? editingRecord.id : Date.now(),
      month: monthStr,
      date: selectedDateStr,
      item: formData.item.trim(),
      payer: formData.payer,
      amount: twdAmount,
      type: formData.type,
      timestamp: mockTimestamp,
      currency: selectedCurrency,
      originalAmount: numAmount,
      exchangeRate: Number(effectiveRate.toFixed(4))
    };

    setLoading(true);

    if (editingRecord) {
      // 編輯既有項目
      try {
        const res = await callGasApi('updateRecordByRow', recordData);
        if (!res || !res.success) {
          enqueueSyncItem('updateRecordByRow', recordData, `修改對帳紀錄：${recordData.item} ($${recordData.amount})`);
        }
      } catch (err) {
        enqueueSyncItem('updateRecordByRow', recordData, `修改對帳紀錄：${recordData.item} ($${recordData.amount})`);
      } finally {
        setLoading(false);
      }

      const updated = records.map(r => r.id === editingRecord.id ? { ...r, ...recordData } : r);
      setRecords(updated);
      saveRecordsToLocal(updated);

      setIsAddOpen(false);
      setEditingRecord(null);
      showToast('✨ 對帳項目修改完成並同步試算表！', 'success');
    } else {
      // 新增項目
      try {
        const res = await callGasApi('addRecord', recordData);
        if (!res || !res.success) {
          enqueueSyncItem('addRecord', recordData, `新增對帳紀錄：${recordData.item} ($${recordData.amount})`);
        }
      } catch (err) {
        enqueueSyncItem('addRecord', recordData, `新增對帳紀錄：${recordData.item} ($${recordData.amount})`);
      } finally {
        setLoading(false);
      }

      const updated = [recordData, ...records];
      setRecords(updated);
      saveRecordsToLocal(updated);

      const isExpense = formData.type.startsWith('支出');
      const currObj = CURRENCIES.find(c => c.code === selectedCurrency);
      const foreignStr = selectedCurrency !== 'TWD'
        ? ` (原幣 ${currObj?.flag || ''} ${(Number(numAmount) || 0).toLocaleString('zh-TW')} ${selectedCurrency}, 匯率 ${effectiveRate})`
        : '';
      const notifTitle = isExpense 
        ? `💸 ${formData.payer} 新增了日常代墊${selectedCurrency !== 'TWD' ? ' (外幣)' : ''}`
        : `💰 ${formData.payer} 撥入了公積金`;
      const notifDesc = `「${formData.item.trim()}」：金額 $${(Number(twdAmount) || 0).toLocaleString('zh-TW')} 元${foreignStr} (${monthStr} 月份)`;
      addNotificationAndSave(notifTitle, notifDesc, isExpense ? 'expense' : 'income');

      setIsAddOpen(false);
      showToast('對帳項目登錄成功並同步 Google 試算表！', 'success');
    }

    setFormData({
      item: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      payer: '廖尹丞',
      type: '支出-日常代墊',
      currency: 'TWD',
      customRate: ''
    });
  };

  const handleEditRecord = (record: RecordItem) => {
    setEditingRecord(record);
    setFormData({
      item: record.item,
      amount: String(record.originalAmount || record.amount),
      currency: record.currency || 'TWD',
      customRate: String(record.exchangeRate || (exchangeRates[record.currency || 'TWD'] || '')),
      date: record.date || new Date().toISOString().split('T')[0],
      payer: record.payer,
      type: record.type
    });
    setAddModalType('record');
    setIsAddOpen(true);
  };

  // 刪除對帳項目項
  const handleDelete = (id: string | number) => {
    const itemToDelete = records.find(r => String(r.id) === String(id));
    const itemName = itemToDelete ? itemToDelete.item : '此項目';

    setCustomConfirmState({
      isOpen: true,
      title: '🗑️ 確認要刪除此筆對帳紀錄嗎？',
      message: `您確定要刪除「${itemName}」嗎？這會自 Google 試算表永久移去資料。`,
      confirmText: '永久刪除',
      cancelText: '保留紀錄',
      onConfirm: async () => {
        const filtered = records.filter(r => String(r.id) !== String(id));
        setRecords(filtered);
        saveRecordsToLocal(filtered);

        addNotificationAndSave('🗑️ 刪除了對帳紀錄', `「${itemName}」已被移除`, 'delete');
        showToast('已成功刪除該筆對帳紀錄！', 'success');

        try {
          const res = await callGasApi('deleteRecordByRow', { id, rowId: id });
          if (!res || !res.success) {
            enqueueSyncItem('deleteRecordByRow', { id, rowId: id }, `刪除對帳紀錄：${itemName}`);
          }
        } catch (err) {
          enqueueSyncItem('deleteRecordByRow', { id, rowId: id }, `刪除對帳紀錄：${itemName}`);
        }
      }
    });
  };

  // 重新同步/重置為預設假資料
  const handleResetData = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      saveRecordsToLocal(INITIAL_RECORDS);
      showToast('已同步試算表完畢，已還原乾淨預設值！', 'success');
    }, 1000);
  };

  // 1. 最新月份代墊與收入計算 (供底部浮動合計面板、首頁即時顯示使用)
  const latestMonth = React.useMemo(() => {
    if (records.length === 0) return '2026-06';
    const unique = Array.from(new Set(records.map(r => r.month))) as string[];
    unique.sort((a, b) => b.localeCompare(a));
    return unique[0];
  }, [records]);

  const liaoLatestTotal = React.useMemo(() => {
    return records
      .filter(r => r.month === latestMonth && r.payer === '廖尹丞' && r.type.includes('支出'))
      .reduce((sum, r) => sum + r.amount, 0);
  }, [records, latestMonth]);

  const zhouLatestTotal = React.useMemo(() => {
    return records
      .filter(r => r.month === latestMonth && r.payer === '周沛緹' && r.type.includes('支出'))
      .reduce((sum, r) => sum + r.amount, 0);
  }, [records, latestMonth]);

  // 全域所有月份的累計代墊 (相容舊有狀態)
  const liaoTotal = React.useMemo(() => {
    return records
      .filter(r => r.payer === '廖尹丞' && r.type.includes('支出'))
      .reduce((sum, r) => sum + r.amount, 0);
  }, [records]);

  const zhouTotal = React.useMemo(() => {
    return records
      .filter(r => r.payer === '周沛緹' && r.type.includes('支出'))
      .reduce((sum, r) => sum + r.amount, 0);
  }, [records]);

  // 2. 計算全域所有月份累計（不分月份）已撥款給雙方後，剩下的總額度 (公積金實際餘額與銷帳前 Quota 試算)
  const overallStats = React.useMemo(() => {
    let income = 0;
    let disbursedExpenses = 0; // 已銷帳代墊
    let pendingExpenses = 0;   // 待銷帳代墊
    records.forEach(r => {
      if (r.type === '收入-固定公積金') {
        income += r.amount;
      } else if (r.type.includes('支出')) {
        // 判斷是否屬於已核銷/已結清月份
        if (isMonthReconciled(r.month, reconciledMonths)) {
          disbursedExpenses += r.amount;
        } else {
          pendingExpenses += r.amount;
        }
      }
    });

    const currentBalance = income - disbursedExpenses; // 扣除已銷帳撥款後的公積金實際餘額
    const estimatedQuota = currentBalance - pendingExpenses; // 當月銷帳前預計所剩的餘額 Quota

    return { 
      income, 
      expenses: disbursedExpenses, 
      pendingExpenses,
      diff: currentBalance, 
      estimatedQuota 
    };
  }, [records, reconciledMonths]);

  // 3. 獲取單一月份統計數據的 Memo (用於圓形比例圓餅圖與入不敷出診斷)
  const monthlyBalances = React.useMemo(() => {
    const stats: { [month: string]: { income: number; expenses: number; deficit: number; liaoExp: number; zhouExp: number } } = {};
    records.forEach(r => {
      const m = r.month;
      if (!stats[m]) {
        stats[m] = { income: 0, expenses: 0, deficit: 0, liaoExp: 0, zhouExp: 0 };
      }
      if (r.type === '收入-固定公積金') {
        stats[m].income += r.amount;
      } else if (r.type.includes('支出')) {
        stats[m].expenses += r.amount;
        if (r.payer === '廖尹丞') {
          stats[m].liaoExp += r.amount;
        } else if (r.payer === '周沛緹') {
          stats[m].zhouExp += r.amount;
        }
      }
    });

    // 剩餘的總公積金 (核銷過後的已從總公積金中扣掉)
    const remainingPool = overallStats.diff;

    // 算赤字 (分析的母數改為剩餘的總公積金以判斷該月份超支狀況)
    Object.keys(stats).forEach(m => {
      const diff = stats[m].expenses - remainingPool;
      stats[m].deficit = diff > 0 ? diff : 0;
    });

    return stats;
  }, [records, overallStats.diff]);

  // 新增：首頁整合數據統計
  const homeStats = React.useMemo(() => {
    let income = 0;
    let liaoExp = 0;
    let zhouExp = 0;
    let expenses = 0;
    Object.values(monthlyBalances).forEach((b: any) => {
      income += b.income;
      liaoExp += b.liaoExp;
      zhouExp += b.zhouExp;
      expenses += b.expenses;
    });
    return { income, liaoExp, zhouExp, expenses };
  }, [monthlyBalances]);

  // 4. 購物記事篩選計算 (Shopping List Filter)
  const filteredShoppingItems = React.useMemo(() => {
    const list = shoppingItems.filter((item) => {
      if (shoppingFilter === 'need' && (item.category !== '需要買' || item.status === '已買到')) return false;
      if (shoppingFilter === 'want' && (item.category !== '想要買' || item.status === '已買到')) return false;
      if (shoppingFilter === 'done' && item.status !== '已買到') return false;
      
      if (selectedStoreFilter !== 'all' && item.store !== selectedStoreFilter) return false;
      
      if (shoppingSearch.trim()) {
        const q = shoppingSearch.toLowerCase();
        return (
          item.item.toLowerCase().includes(q) ||
          (item.store && item.store.toLowerCase().includes(q)) ||
          (item.deadline && item.deadline.toLowerCase().includes(q)) ||
          (item.creator && item.creator.toLowerCase().includes(q)) ||
          (item.note && item.note.toLowerCase().includes(q))
        );
      }
      return true;
    });

    return list.sort((a, b) => {
      if (a.status === '已買到' && b.status !== '已買到') return 1;
      if (a.status !== '已買到' && b.status === '已買到') return -1;
      return 0;
    });
  }, [shoppingItems, shoppingFilter, selectedStoreFilter, shoppingSearch]);

  // 5. 智慧安全通知與診斷系統提醒 (即時計算)
  const smartAlerts = React.useMemo(() => {
    const alerts: Array<{
      id: string;
      title: string;
      message: string;
      type: 'error' | 'warning' | 'info';
    }> = [];

    const sortedMonths = (Array.from(new Set(records.map(r => r.month))) as string[]).sort((a, b) => a.localeCompare(b));
    const remainingPool = overallStats.diff;

    // A. 檢查是否有月份入不敷出 (代墊費大於公積金剩餘盈餘)
    sortedMonths.forEach(m => {
      // 警示部分若提及該月已經完全核銷，就不須再有該月的警示
      if (isMonthReconciled(m, reconciledMonths)) return;

      const stat = monthlyBalances[m];
      if (stat && stat.expenses > remainingPool) {
        const deficit = stat.expenses - remainingPool;
        alerts.push({
          id: `deficit-${m}`,
          title: `⚠️ ${m} 月份入不敷出提示`,
          message: `${m} 月份代墊支出為 $${(Number(stat.expenses) || 0).toLocaleString()} 元，目前剩餘的總公積金為 $${(Number(remainingPool) || 0).toLocaleString()} 元，可用額度不足，超支達 $${(Number(deficit) || 0).toLocaleString()} 元。請注意花錢狀況！`,
          type: 'error'
        });
      }
    });

    // B. 檢查隔月份有撥入收入款 (固定公積金)，就通知使用者應先優先核銷上一月份被超支墊付的赤字，並特別提示少花錢
    for (let i = 1; i < sortedMonths.length; i++) {
      const prevM = sortedMonths[i - 1];
      const curM = sortedMonths[i];

      // 若提及上個月已經完全核銷，就不須再有該上個月的跨月警示建議
      if (isMonthReconciled(prevM, reconciledMonths)) continue;

      const prevStat = monthlyBalances[prevM];
      const curStat = monthlyBalances[curM];

      if (prevStat && prevStat.expenses > remainingPool && curStat && curStat.income > 0) {
        const deficit = prevStat.expenses - remainingPool;
        alerts.push({
          id: `consecutive-clear-${curM}`,
          title: `💡 跨月結算與省錢通知`,
          message: `本月 (${curM}) 已有撥入公積金。然而上個月 (${prevM}) 代墊支出超過剩餘的總公積金（超支赤字 $${(Number(deficit) || 0).toLocaleString()} 元），請本月撥款時優先補繳、結清上月款項，並切記注意花錢與非必要性日常消費！`,
          type: 'warning'
        });
      }
    }

    return alerts;
  }, [records, monthlyBalances, reconciledMonths, overallStats.diff]);

  // 進入網頁時自動警示提醒
  const [hasShownLoadAlert, setHasShownLoadAlert] = useState(false);
  const [showLoadAlertModal, setShowLoadAlertModal] = useState(false);

  // 每個功能頁面跳轉進入，自動從頁首開始捲動
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as any });
  }, [activeTab]);

  useEffect(() => {
    if (records.length > 0 && !hasShownLoadAlert) {
      const hasDeficits = Object.values(monthlyBalances).some((s: any) => s.deficit > 0);
      if (hasDeficits && smartAlerts.length > 0) {
        setShowLoadAlertModal(true);
        setHasShownLoadAlert(true);
      }
    }
  }, [records, monthlyBalances, smartAlerts, hasShownLoadAlert]);


  return (
    <div className="min-h-screen text-[#3E3A36] font-sans flex flex-col bg-[#F8F7F3] relative overflow-x-hidden antialiased selection:bg-[#E4DFD3] selection:text-[#3E3A36]">
      {/* 淡淡的無印木質感、日系暖色調背景光波 */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#F2EFE7] to-transparent opacity-40 pointer-events-none -z-10" />
      
      {/* 🔔 畫面右上角懸浮日系無印風通知鈴鐺 (z-index 高圖層，防遮擋) */}
      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-[100] select-none">
        <div className="relative">
          <button 
            type="button"
            onClick={() => setShowNotificationsOpen(!showNotificationsOpen)}
            className="p-3 bg-white/95 hover:bg-[#EEEDE9] border border-[#E1DDD3]/90 text-[#706B62] hover:text-[#3E3A36] rounded-2xl transition duration-200 flex items-center justify-center relative cursor-pointer shadow-[0_8px_20px_rgba(140,132,117,0.1)] focus:outline-none backdrop-blur-md active:scale-95"
            title="即時系統通知"
          >
            <Bell className="w-4 h-4" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center border border-white animate-pulse">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>

          {/* 下拉通知選單 */}
          <AnimatePresence>
            {showNotificationsOpen && (
              <>
                <div 
                  className="fixed inset-0 z-[90]" 
                  onClick={() => setShowNotificationsOpen(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2.5 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#EEEDE3] z-[100] overflow-hidden text-left"
                >
                  <div className="p-4 border-b border-[#EEEDE3] bg-[#FAF9F5] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-[#3E3A36]">
                      <span>🔔</span>
                      <span>通知紀錄 ({notifications.filter(n => !n.read).length})</span>
                    </div>
                    {notifications.filter(n => !n.read).length > 0 && (
                      <button 
                        onClick={() => {
                          markAllNotificationsAsRead();
                          setShowNotificationsOpen(false);
                        }}
                        className="text-[10px] text-[#8C8475] hover:text-[#5C564E] font-medium underline cursor-pointer"
                      >
                        全部標示已讀
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto divide-y divide-[#F5F4EE] max-w-full">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#BCB8B0]">
                        目前沒有任何通知
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            markNotificationAsRead(n.id);
                          }}
                          className={`p-3 hover:bg-[#FAF9F5] transition-all cursor-pointer relative flex items-start gap-2.5 ${!n.read ? 'bg-[#FDFCF7]/95' : ''}`}
                        >
                          {!n.read && (
                            <span className="absolute top-4 left-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                          )}
                          <div className="flex-1 min-w-0 pl-1.5">
                            <div className="flex justify-between items-start gap-1">
                              <h4 className="text-[11px] font-semibold text-[#4A4641] truncate">{n.title}</h4>
                              <span className="text-[9px] text-[#BCB8B0] font-mono whitespace-nowrap">
                                {formatAmPmTime(n.time)}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#7A756E] mt-0.5 leading-relaxed break-words">{n.desc}</p>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(n.id);
                            }}
                            className="text-[10px] text-[#A39E92] hover:text-red-500 p-1 hover:bg-red-50 rounded-md transition-colors"
                            title="移除通知"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* 底部功能按鈕：自訂 LINE 通知開關 */}
                  <div className="p-2.5 bg-[#FAF8F3] border-t border-[#EEEDE3] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotificationsOpen(false);
                        setIsLineSettingsModalOpen(true);
                      }}
                      className="w-full py-1.5 px-3 bg-white hover:bg-[#F2EFE7] text-[#4A4641] text-[11px] font-bold rounded-xl border border-[#E0DCD3] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                      <span>設定各項 LINE 推播開關</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 頂部精緻極簡 Header */}
      <Header
        isOnline={isOnline}
        isBackgroundSyncing={isBackgroundSyncing}
        lastSyncedAt={lastSyncedAt}
        appMode={appMode}
        setAppMode={(mode) => {
          setAppMode(mode);
          try {
            localStorage.setItem('banban_active_mode', mode);
          } catch (e) {}
          if (mode === 'split') {
            window.location.hash = '/split';
          } else if (window.location.hash.includes('split')) {
            window.location.hash = '';
          }
        }}
        unsettledSplitCount={splitSummary.unsettledCount}
        onOpenLineSettings={() => setIsLineSettingsModalOpen(true)}
        onOpenTravelCalculator={() => setShowTravelCalculatorModal(true)}
        pendingQueueCount={pendingSyncQueue.length}
        onOpenDataBackup={() => setIsDataBackupOpen(true)}
        onFlushQueue={handleFlushQueue}
        onOpenPwaInstall={() => setIsPwaInstallModalOpen(true)}
      />

      {/* 主呈現區 */}
      <main className="w-full max-w-4xl mx-auto px-3 sm:px-4 flex-grow pb-32 sm:pb-40">
        
        {/* 核心內容視窗切換區，加入優雅 motion 轉場效果 */}
        <div className="relative">
          <AnimatePresence mode="wait">

            {/* Tab 1: 首頁整合面板 */}
            {activeTab === 'home' && (
              appMode === 'split' ? (
                <SplitHomeTab
                  key="split-home"
                  summary={splitSummary}
                  recentItems={splitItems}
                  isLoading={isSplitLoading}
                  onRefresh={() => fetchSplitData(false)}
                  onOpenAdd={() => setIsSplitAddOpen(true)}
                  onGoToHistory={() => setActiveTab('history')}
                  onGoToSettlement={() => setActiveTab('settlement')}
                  onOpenSettleModal={() => setIsSplitSettleModalOpen(true)}
                />
              ) : (
                <motion.div 
                  key="tab-home"
                  initial={{ opacity: 0, y: 12 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -12 }} 
                  transition={{ duration: 0.25 }}
                  className="space-y-4 sm:space-y-6"
                >
                {/* 💬 官方 LINE 帳號提醒 Banner */}
                {!hasJoinedLine && (
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50/80 to-emerald-50 rounded-2xl p-3.5 sm:p-4 border border-emerald-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#06C755] text-white flex items-center justify-center text-base sm:text-lg font-bold shrink-0 shadow-xs mt-0.5 sm:mt-0">
                        💬
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#20402C]">
                          加入官方 LINE 帳號
                        </h4>
                        <p className="text-[11px] text-[#4A6B56] mt-0.5">
                          接收代墊與對帳即時推播通知
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-1 sm:pt-0 border-t sm:border-0 border-emerald-100">
                      <a 
                        href="https://lin.ee/tHfDgoL" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none text-center px-3.5 py-1.5 rounded-xl bg-[#06C755] hover:bg-[#05AB49] text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1"
                      >
                        加入
                      </a>
                      <button 
                        onClick={handleMarkJoinedLine}
                        className="px-3.5 py-1.5 rounded-xl bg-[#8C8475] hover:bg-[#726A5C] text-white text-xs font-semibold transition-all cursor-pointer shadow-xs shrink-0"
                      >
                        已加入
                      </button>
                    </div>
                  </div>
                )}
                {/* 🎯 當月銷帳之前預計所剩餘額 核心重點看板 */}
                {(() => {
                  const quota = overallStats.estimatedQuota;
                  const currentPool = overallStats.diff;
                  const pending = overallStats.pendingExpenses;
                  
                  let statusBadgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200/80";
                  let statusText = "🟢 額度充裕";
                  let adviceMessage = "目前銷帳試算後的餘額充足，可正常消費。";
                  
                  if (quota < 0) {
                    statusBadgeColor = "bg-rose-50 text-rose-800 border-rose-200/80 animate-pulse";
                    statusText = "🚨 預計赤字超支";
                    adviceMessage = "待銷帳代墊總額已超出目前公積金餘額，建議適當補充公積金。";
                  } else if (quota < 3000) {
                    statusBadgeColor = "bg-amber-50 text-amber-800 border-amber-200/80";
                    statusText = "🟡 預算緊繃";
                    adviceMessage = "預計銷帳後剩餘額度較少，建議控制非必要開支。";
                  }

                  return (
                    <div className="bg-gradient-to-br from-white via-[#FAF9F5] to-[#F5F2E9] rounded-3xl p-4 sm:p-6 border border-[#E3DFD5] shadow-2xs space-y-3.5 sm:space-y-4 relative overflow-hidden">
                      {/* 背景幾何圖示 */}
                      <div className="absolute -right-4 -bottom-4 text-[#E6E2D8] opacity-25 pointer-events-none">
                        <Target className="w-28 h-28 sm:w-32 sm:h-32" />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-[#ECE8DE] pb-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold tracking-wider text-[#8C8475] uppercase flex items-center gap-1.5">
                              <Target className="w-4 h-4 text-[#8C8475]" />
                              當月銷帳前預計所剩餘額
                            </span>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold border self-start sm:self-auto shrink-0 ${statusBadgeColor}`}>
                          {statusText}
                        </span>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-xs text-[#7A756E] font-medium">預計銷帳後剩餘額度</span>
                          <div className={`text-2xl sm:text-3xl lg:text-4xl font-light font-mono leading-none tracking-tight break-words ${quota >= 0 ? 'text-emerald-700' : 'text-[#C55757]'}`}>
                            {quota < 0 ? '- $ ' : '$ '}
                            <span className="font-bold">{(Number(Math.abs(quota)) || 0).toLocaleString('zh-TW')}</span> 元
                            {quota < 0 && <span className="text-xs font-bold text-[#C55757] ml-2">(超支)</span>}
                          </div>
                        </div>

                        {/* 算式拆解標籤 */}
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono bg-white/90 backdrop-blur-xs px-2.5 py-1.5 sm:px-3 rounded-xl border border-[#EBE8DE] text-[#5C564E] flex-wrap max-w-full">
                          <span>池內餘額 <strong className="text-emerald-700">${(Number(currentPool) || 0).toLocaleString('zh-TW')}</strong></span>
                          <span className="text-gray-400">-</span>
                          <span>待銷帳代墊 <strong className="text-amber-700">${(Number(pending) || 0).toLocaleString('zh-TW')}</strong></span>
                          <span className="text-gray-400">=</span>
                          <span>預計剩餘 <strong className={quota >= 0 ? 'text-emerald-700' : 'text-[#C55757]'}>{quota < 0 ? '-' : ''}${(Number(Math.abs(quota)) || 0).toLocaleString('zh-TW')}</strong></span>
                        </div>
                      </div>

                      {/* 智慧消費判斷建議列 */}
                      <div className="bg-white/90 rounded-2xl p-2.5 sm:p-3 border border-[#EAE6DC] flex items-start sm:items-center gap-2 text-xs text-[#4A4641]">
                        <span className="text-sm shrink-0 mt-0.5 sm:mt-0">💡</span>
                        <span className="font-medium leading-normal">{adviceMessage}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* 財務即時統計卡片 3 欄位 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
                  {/* 1. 公積金底池撥入 */}
                  <div className="bg-white/70 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border-l-4 border-[#6E8C78] shadow-2xs border-[#EBE8E0] relative overflow-hidden flex flex-col justify-between min-h-[5.5rem]">
                    <div>
                      <h3 className="text-xs font-semibold text-[#5C564E]">公積金撥入額度</h3>
                    </div>
                    <div className="text-base font-light text-[#3E3A36] font-mono leading-none mt-2 break-words">
                      $ <span className="text-lg sm:text-xl font-bold">{(Number(homeStats?.income) || 0).toLocaleString('zh-TW')}</span> 元
                    </div>
                  </div>

                  {/* 2. 雙方代墊總支出 */}
                  <div className="bg-white/70 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border-l-4 border-[#8C8475] shadow-2xs border-[#EBE8E0] relative overflow-hidden flex flex-col justify-between min-h-[5.5rem]">
                    <div>
                      <h3 className="text-xs font-semibold text-[#5C564E]">雙方代墊總支出</h3>
                    </div>
                    <div className="text-base font-light text-[#3E3A36] font-mono leading-none mt-2 break-words">
                      $ <span className="text-lg sm:text-xl font-bold">{(Number(homeStats?.expenses) || 0).toLocaleString('zh-TW')}</span> 元
                    </div>
                  </div>

                  {/* 3. 盈餘與赤字狀態 / 扣除已銷帳撥款後餘額 */}
                  <div className={`bg-white/70 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border-l-4 ${overallStats.diff >= 0 ? 'border-emerald-600' : 'border-[#C55757]'} shadow-2xs border-[#EBE8E0] relative overflow-hidden flex flex-col justify-between min-h-[5.5rem]`}>
                    <div>
                      <h3 className="text-xs font-semibold text-[#5C564E]">
                        {overallStats.diff >= 0 ? '扣除已銷帳撥款後餘額' : '累計超支 (赤字)'}
                      </h3>
                    </div>
                    <div className={`text-base font-light font-mono leading-none mt-2 break-words ${overallStats.diff >= 0 ? 'text-emerald-700' : 'text-[#C55757]'}`}>
                      $ <span className="text-lg sm:text-xl font-bold">{(Number(Math.abs(overallStats?.diff || 0)) || 0).toLocaleString('zh-TW')}</span> 元
                    </div>
                  </div>
                </div>

                {/* ✈️ 出國旅遊與即時匯率換算看板 */}
                <div className="bg-gradient-to-r from-[#FAF8F3] via-white to-[#F6F3EA] rounded-2xl p-3.5 sm:p-4 border border-[#E5E1D5] shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-900 flex items-center justify-center text-sm font-bold shrink-0">
                        💱
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#3E3A36]">
                          出國外幣即時匯率換算
                        </h4>
                        <p className="text-[11px] text-[#8C8475] mt-0.5">
                          支援外幣記帳自動折算台幣
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowTravelCalculatorModal(true)}
                      className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1 shrink-0 active:scale-95"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>匯率計算器</span>
                    </button>
                  </div>

                  {/* 快捷熱門外幣即時匯率展示 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[#EFECE3]">
                    {[
                      { code: 'JPY', name: '日圓', flag: '🇯🇵' },
                      { code: 'USD', name: '美元', flag: '🇺🇸' },
                      { code: 'EUR', name: '歐元', flag: '🇪🇺' },
                      { code: 'KRW', name: '韓元', flag: '🇰🇷' }
                    ].map(c => (
                      <div key={c.code} className="bg-white/90 rounded-xl p-2 sm:p-2.5 border border-[#EAE6DC] flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#4A4641] flex items-center gap-1">
                          <span>{c.flag}</span>
                          <span>{c.code}</span>
                        </span>
                        <span className="text-xs font-black font-mono text-emerald-800">
                          ${exchangeRates[c.code] || DEFAULT_RATES_MAP[c.code] || 1} <span className="text-[9px] font-normal text-[#8C8475]">TWD</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 智慧安全通知提醒 */}
                {smartAlerts.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 pl-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8C8475]" />
                      <h3 className="text-xs font-bold text-[#8C8475] tracking-wider uppercase">
                        📋 智慧收支診斷與警示
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {smartAlerts.map((alert) => (
                        <div 
                          key={alert.id} 
                          className={`p-3 sm:p-3.5 rounded-xl border flex items-start gap-2.5 transition-all shadow-2xs ${
                            alert.type === 'error' 
                              ? 'bg-red-50/75 border-red-200/40 text-[#C55757]' 
                              : 'bg-amber-50/75 border-amber-200/40 text-[#8C5E24]'
                          }`}
                        >
                          <span className="text-sm shrink-0 mt-0.5">
                            {alert.type === 'error' ? '🚨' : '💡'}
                          </span>
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold">{alert.title}</h4>
                            <p className="text-[11px] leading-relaxed opacity-90">{alert.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 最近動態預覽 */}
                <div className="bg-white/70 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-[#EBE8E0] shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold tracking-wider text-[#8C8475] uppercase flex items-center gap-1.5 pl-0.5">
                      <span>📌</span> 最近登錄的對帳動態
                    </h3>
                    <button 
                      onClick={() => setActiveTab('history')}
                      className="text-xs text-[#8C8475] hover:text-[#5C564E] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>全帳單</span>
                      <span>&rarr;</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {records.slice(0, 3).length === 0 ? (
                      <p className="text-center py-6 text-xs text-[#9E988D] font-light">目前無任何記帳數據。</p>
                    ) : (
                      records.slice(0, 3).map((r) => {
                        const isExp = r.type.includes('支出');
                        return (
                          <div 
                            key={r.id}
                            className="bg-white/60 border border-[#EEEDE3]/80 rounded-xl p-2.5 sm:p-3 flex items-center justify-between text-xs hover:bg-white transition-all gap-2"
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono text-[9px] text-[#8C8475] bg-[#FAF9F5] px-1.5 py-0.5 rounded border border-[#EBE8DE]">
                                  {r.date}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border leading-none ${isExp ? 'bg-[#FCF4F4] text-[#C55757] border-[#F4DFDF]' : 'bg-[#F2F8F4] text-[#428564] border-[#DCEFE5]'}`}>
                                  {r.payer} {(isExp ? '代墊' : '撥入')}
                                </span>
                              </div>
                              <h4 className="font-semibold text-[#3E3A36] truncate text-xs sm:text-sm">{r.item}</h4>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-mono font-bold text-xs sm:text-sm text-[#3E3A36] whitespace-nowrap bg-[#FAF9F5] px-2 py-1 rounded border border-[#E8E4D9] block">
                                $ {(Number(r?.amount) || 0).toLocaleString('zh-TW')}
                              </span>
                              {r.currency && r.currency !== 'TWD' && (
                                <span className="text-[9px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 font-mono block mt-0.5">
                                  {CURRENCIES.find(c => c.code === r.currency)?.flag} {(Number(r?.originalAmount) || 0).toLocaleString('zh-TW')} {r.currency}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleEditRecord(r)}
                                className="text-[#8C8475] hover:text-[#4A4641] p-1.5 rounded-lg hover:bg-gray-100 transition-all border border-transparent cursor-pointer"
                                title="編輯對帳紀錄"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="text-[#A59F94] hover:text-[#C55757] p-1.5 rounded-lg hover:bg-red-50 hover:border-red-100 transition-all border border-transparent cursor-pointer"
                                title="移除對帳紀錄"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 首頁採購清單快覽小工具 (Compact Shopping List Widget) */}
                <div className="bg-white/70 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-[#EBE8E0] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <ShoppingBag className="w-4 h-4 text-amber-600 shrink-0" />
                      <h3 className="text-xs font-bold tracking-wider text-[#8C8475] uppercase flex items-center gap-1.5">
                        待辦採購筆記
                      </h3>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold shrink-0">
                        {shoppingItems.filter(i => i.status === '待購買').length} 待買
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('notebook')}
                      className="text-xs text-amber-800 hover:text-amber-900 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>全頁面</span>
                      <span>&rarr;</span>
                    </button>
                  </div>

                  {shoppingItems.filter(i => i.status === '待購買').length === 0 ? (
                    <p className="text-center py-4 text-xs text-[#9E988D] font-light">目前沒有待購買的品項喔！🎉</p>
                  ) : (
                    <div className="space-y-2">
                      {shoppingItems.filter(i => i.status === '待購買').slice(0, 3).map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 bg-white/60 rounded-xl border border-[#EEEDE3] text-xs hover:bg-white transition-all gap-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${item.category === '需要買' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                            <span className="font-semibold text-[#3E3A36] truncate">{item.item}</span>
                            <span className="text-[10px] text-[#8C8475] bg-[#FAF9F5] px-1.5 py-0.5 rounded border border-[#E8E4D9] flex items-center gap-1"><MapPin className="w-3 h-3 text-[#8C8475]" /><span>{item.store || '隨意'}</span></span>
                            <span className="text-[10px] text-[#8C8475] flex items-center gap-1"><Clock className="w-3 h-3 text-[#8C8475]" /><span>{item.deadline || '儘快'}</span></span>
                          </div>
                          <button
                            onClick={() => handleToggleShoppingStatus(item.id, item.status)}
                            className="self-end sm:self-auto text-[11px] text-emerald-700 font-semibold hover:underline cursor-pointer bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg shrink-0"
                          >
                            標記買到
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
              )
            )}

            {/* Tab 2: 歷史流水帳 */}
            {activeTab === 'history' && (
              appMode === 'split' ? (
                <SplitHistoryTab
                  key="split-history"
                  items={splitItems}
                  onDeleteItem={handleDeleteSplitRecord}
                  onOpenAdd={() => setIsSplitAddOpen(true)}
                />
              ) : (
                <motion.div 
                  key="tab-history"
                  initial={{ opacity: 0, y: 12 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -12 }} 
                  transition={{ duration: 0.25 }}
                  className="bg-white/70 backdrop-blur-md rounded-3xl p-4 sm:p-6 md:p-8 border border-white/50 shadow-2xs border-[#EBE8E0]"
                >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5 pb-3.5 border-b border-[#F0ECE1] gap-2">
                  <div>
                    <h2 className="text-base font-bold text-[#4A4641] flex items-center gap-2">
                      <span className="p-1 bg-[#EEEDE9] rounded-lg text-sm">📋</span> 歷史記帳明細
                    </h2>
                    <p className="text-xs text-[#9E9A92] mt-0.5 font-light leading-relaxed">
                      家庭所有日常代墊支出與公積金固定撥入的流水清單。
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        const q = searchQuery.trim().toLowerCase();
                        const filtered = records.filter(r => {
                          const matchMonth = selectedMonth === 'all' || r.month === selectedMonth;
                          const matchPayer = selectedPayer === 'all' || r.payer === selectedPayer;
                          const matchDate = selectedDate === 'all' || r.date === selectedDate;
                          const matchQuery = !q || (
                            (r.item && r.item.toLowerCase().includes(q)) ||
                            (r.payer && r.payer.toLowerCase().includes(q)) ||
                            (r.type && r.type.toLowerCase().includes(q)) ||
                            (r.date && r.date.includes(q)) ||
                            (r.month && r.month.includes(q)) ||
                            r.amount.toString().includes(q)
                          );
                          return matchMonth && matchPayer && matchDate && matchQuery;
                        });
                        exportFundRecordsToCSV(filtered, `伴伴記_公積金明細_${new Date().toISOString().substring(0, 10)}.csv`);
                      }}
                      className="px-3 py-2 bg-white hover:bg-[#FAF8F5] text-[#4A4641] border border-[#DDD8CD] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                      title="匯出當前篩選結果為 CSV 試算表"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-700" />
                      <span>匯出 CSV</span>
                    </button>
                  </div>
                </div>

                {/* 🔍 關鍵字搜尋列 */}
                <div className="relative mb-3.5">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C8475]">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋項目名稱、金額、代墊者 (例如: 全聯、廖尹丞、300)..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/80 border border-[#DDD9CE] text-xs text-[#3E3A36] placeholder-[#A39E92] focus:outline-none focus:border-[#8C8475] focus:bg-white transition-all shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                      title="清除搜尋內容"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* 篩選器工具列 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 mb-5">
                  <div className="space-y-1">
                    <label htmlFor="filter-month" className="block text-[10px] font-semibold text-[#8C8475] uppercase tracking-wider">月份篩選</label>
                    <select
                      id="filter-month"
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        setSelectedDate('all'); // 當切換月份時，清除詳細日期，避免篩選互斥
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/70 border border-[#DDD9CE] text-xs text-[#3E3A36] focus:outline-none focus:border-[#8C8475] cursor-pointer"
                    >
                      <option value="all">📅 全部月份</option>
                      {(Array.from(new Set(records.map(r => r.month))) as string[]).sort((a,b) => b.localeCompare(a)).map(m => (
                        <option key={m} value={m}>{m} 月份</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="filter-payer" className="block text-[10px] font-semibold text-[#8C8475] uppercase tracking-wider">代墊者 / 來源篩選</label>
                    <select
                      id="filter-payer"
                      value={selectedPayer}
                      onChange={(e) => setSelectedPayer(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/70 border border-[#DDD9CE] text-xs text-[#3E3A36] focus:outline-none focus:border-[#8C8475] cursor-pointer"
                    >
                      <option value="all">👤 所有出資/來源</option>
                      <option value="廖尹丞">廖尹丞</option>
                      <option value="周沛緹">周沛緹</option>
                      <option value="共同帳戶">共同帳戶</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="filter-date" className="block text-[10px] font-semibold text-[#8C8475] uppercase tracking-wider">詳細日期篩選</label>
                    <div className="relative">
                      <input
                        id="filter-date"
                        type="date"
                        value={selectedDate === 'all' ? '' : selectedDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            setSelectedDate(val);
                            setSelectedMonth(val.substring(0, 7)); // 連動設定月份
                          } else {
                            setSelectedDate('all');
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-[#DDD9CE] text-xs text-[#3E3A36] focus:outline-none focus:border-[#8C8475] cursor-pointer"
                      />
                      {selectedDate !== 'all' && (
                        <button 
                          onClick={() => setSelectedDate('all')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 rounded px-1 border border-gray-200 cursor-pointer"
                          title="清除日期"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="filter-sort" className="block text-[10px] font-semibold text-[#8C8475] uppercase tracking-wider">排序方式</label>
                    <select
                      id="filter-sort"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/70 border border-[#DDD9CE] text-xs text-[#3E3A36] focus:outline-none focus:border-[#8C8475] cursor-pointer"
                    >
                      <option value="date-desc">📅 記帳日期：由新到舊 (預設)</option>
                      <option value="date-asc">📅 記帳日期：由舊到新</option>
                      <option value="amount-desc">💵 金額：由大到小</option>
                      <option value="amount-asc">💵 金額：由小到大</option>
                    </select>
                  </div>
                </div>

                {/* 篩選結果即時統計卡片 */}
                {(() => {
                  const q = searchQuery.trim().toLowerCase();
                  const filtered = records.filter(r => {
                    const matchMonth = selectedMonth === 'all' || r.month === selectedMonth;
                    const matchPayer = selectedPayer === 'all' || r.payer === selectedPayer;
                    const matchDate = selectedDate === 'all' || r.date === selectedDate;
                    const matchQuery = !q || (
                      (r.item && r.item.toLowerCase().includes(q)) ||
                      (r.payer && r.payer.toLowerCase().includes(q)) ||
                      (r.type && r.type.toLowerCase().includes(q)) ||
                      (r.date && r.date.includes(q)) ||
                      (r.month && r.month.includes(q)) ||
                      r.amount.toString().includes(q)
                    );
                    return matchMonth && matchPayer && matchDate && matchQuery;
                  });

                  const expSum = filtered.filter(r => r.type.includes('支出')).reduce((acc, r) => acc + r.amount, 0);
                  const incSum = filtered.filter(r => r.type.includes('收入')).reduce((acc, r) => acc + r.amount, 0);
                  const liaoAdv = filtered.filter(r => r.type.includes('支出') && (r.payer.includes('廖') || r.payer === '廖')).reduce((acc, r) => acc + r.amount, 0);
                  const zhouAdv = filtered.filter(r => r.type.includes('支出') && (r.payer.includes('周') || r.payer === '周')).reduce((acc, r) => acc + r.amount, 0);
                  const hasActiveFilters = selectedMonth !== 'all' || selectedPayer !== 'all' || selectedDate !== 'all' || searchQuery;

                  return (
                    <div className="mb-4 space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EDE8DC] flex flex-col">
                          <span className="text-[10px] text-[#8C8475]">顯示筆數</span>
                          <span className="font-mono font-bold text-[#3E3A36]">{filtered.length} 筆</span>
                        </div>
                        <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-200/60 flex flex-col">
                          <span className="text-[10px] text-rose-800 font-semibold">支出小計</span>
                          <span className="font-mono font-bold text-rose-900">NT$ {(Number(expSum) || 0).toLocaleString()}</span>
                        </div>
                        <div className="bg-sky-50/60 p-2.5 rounded-xl border border-sky-200/60 flex flex-col">
                          <span className="text-[10px] text-sky-800 font-semibold">廖代墊小計</span>
                          <span className="font-mono font-bold text-sky-900">NT$ {(Number(liaoAdv) || 0).toLocaleString()}</span>
                        </div>
                        <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 flex flex-col">
                          <span className="text-[10px] text-amber-800 font-semibold">周代墊小計</span>
                          <span className="font-mono font-bold text-amber-900">NT$ {(Number(zhouAdv) || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      {hasActiveFilters && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMonth('all');
                              setSelectedPayer('all');
                              setSelectedDate('all');
                              setSearchQuery('');
                            }}
                            className="text-[11px] text-emerald-800 hover:text-emerald-900 hover:underline cursor-pointer flex items-center gap-1 font-bold"
                          >
                            <span>重設所有篩選條件</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 行動裝置優選：帳目卡片清單 (取代直式被擠壓之表格) */}
                <div className="space-y-2.5">
                  {(() => {
                    const q = searchQuery.trim().toLowerCase();
                    const filtered = records.filter(r => {
                      const matchMonth = selectedMonth === 'all' || r.month === selectedMonth;
                      const matchPayer = selectedPayer === 'all' || r.payer === selectedPayer;
                      const matchDate = selectedDate === 'all' || r.date === selectedDate;
                      
                      const matchQuery = !q || (
                        (r.item && r.item.toLowerCase().includes(q)) ||
                        (r.payer && r.payer.toLowerCase().includes(q)) ||
                        (r.type && r.type.toLowerCase().includes(q)) ||
                        (r.date && r.date.includes(q)) ||
                        (r.month && r.month.includes(q)) ||
                        r.amount.toString().includes(q)
                      );

                      return matchMonth && matchPayer && matchDate && matchQuery;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-12 text-[#9A958C] text-xs font-light tracking-wide bg-[#FAF9F5]/40 rounded-2xl border border-dashed border-[#E3DFD4] p-4">
                          {searchQuery ? `找不到與「${searchQuery}」符合的記帳紀錄` : '目前尚無符合篩選條件的交易紀錄'}
                        </div>
                      );
                    }

                    // 依據「某一天記帳的日期 (r.date)」來排序，補記帳時不會錯亂
                    const sorted = [...filtered].sort((a, b) => {
                      if (sortOrder === 'date-desc') {
                        const dateA = a.date || `${a.month}-01`;
                        const dateB = b.date || `${b.month}-01`;
                        if (dateA !== dateB) {
                          return dateB.localeCompare(dateA);
                        }
                        const timeA = a.timestamp || String(a.id);
                        const timeB = b.timestamp || String(b.id);
                        return timeB.localeCompare(timeA) || (Number(b.id) - Number(a.id));
                      } else if (sortOrder === 'date-asc') {
                        const dateA = a.date || `${a.month}-01`;
                        const dateB = b.date || `${b.month}-01`;
                        if (dateA !== dateB) {
                          return dateA.localeCompare(dateB);
                        }
                        const timeA = a.timestamp || String(a.id);
                        const timeB = b.timestamp || String(b.id);
                        return timeA.localeCompare(timeB) || (Number(a.id) - Number(b.id));
                      } else if (sortOrder === 'amount-desc') {
                        return b.amount - a.amount;
                      } else if (sortOrder === 'amount-asc') {
                        return a.amount - b.amount;
                      }
                      return 0;
                    });

                    return sorted.map(r => {
                      const isExp = r.type.includes('支出');
                      return (
                        <div 
                          key={r.id} 
                          className="bg-white/80 border border-[#EEEDE3] rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-2xs hover:border-[#D5D0C2] hover:bg-white transition-all gap-2.5 sm:gap-2"
                        >
                          <div className="space-y-1 flex-1 min-w-0 pr-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[9px] text-[#8C8475] bg-[#FAF9F5] px-1.5 py-0.5 rounded border border-[#EBE8DE]">
                                📅 {r.date || `${r.month}-01`}
                              </span>
                              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[9px] font-medium border ${
                                isExp 
                                  ? 'bg-[#FCF4F4] text-[#C55757] border-[#F4DFDF]' 
                                  : 'bg-[#F2F8F4] text-[#428564] border-[#DCEFE5]'
                              }`}>
                                {isExp ? <TrendingDown className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
                                {isExp ? '日常代墊支出' : '公積金固定撥入'}
                              </span>
                            </div>
                            
                            <h4 className="text-sm font-semibold text-[#3E3A36] leading-snug break-words">{r.item}</h4>
                            
                            <div className="flex items-center gap-1 text-[11px] text-[#8C8475]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#8C8475] shrink-0" />
                              <span>{r.type === '收入-固定公積金' ? '來源：' : '代墊者：'}</span>
                              <span className="font-semibold text-[#4D4942]">{r.payer}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F3F0E6]">
                            <div className="text-left sm:text-right">
                              <span className="text-[10px] text-[#A59F94] block font-light">金額 (台幣 NT$)</span>
                              <span className="font-mono font-bold text-[#3E3A36] text-sm sm:text-base block">
                                $ {(Number(r?.amount) || 0).toLocaleString('zh-TW')}
                              </span>
                              {r.currency && r.currency !== 'TWD' && (
                                <span className="text-[10px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 font-mono block mt-0.5">
                                  {CURRENCIES.find(c => c.code === r.currency)?.flag} {(Number(r?.originalAmount) || 0).toLocaleString('zh-TW')} {r.currency} (匯率 {r.exchangeRate})
                                </span>
                              )}
                            </div>
                            
                            <button 
                              onClick={() => handleDelete(r.id)}
                              className="text-[#A59F94] hover:text-[#C55757] p-2 rounded-xl hover:bg-[#FAF9F5] hover:border-[#F4DFDF] transition-all border border-transparent cursor-pointer"
                              title="移除對帳紀錄"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </motion.div>
              )
            )}

            {/* Tab 3: 月底自動結算 */}
            {activeTab === 'settlement' && (
              appMode === 'split' ? (
                <SplitSettlementTab
                  key="split-settlement"
                  summary={splitSummary}
                  items={splitItems}
                  onOpenSettleModal={() => setIsSplitSettleModalOpen(true)}
                  isLoading={isSplitLoading}
                />
              ) : (
                <motion.div 
                  key="tab-settlement"
                  initial={{ opacity: 0, y: 12 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -12 }} 
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                {/* 月份選取器與核銷狀態大面板 */}
                <div className="bg-white/75 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#EBE8E0] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="space-y-1 w-full sm:w-auto">
                    <label htmlFor="settlement-month-select" className="block text-[10px] font-bold text-[#8C8475] uppercase tracking-wider">正在核對月份</label>
                    <select
                      id="settlement-month-select"
                      value={settlementMonth}
                      onChange={(e) => setSettlementMonth(e.target.value)}
                      className="w-full sm:w-48 px-3 py-2.5 rounded-xl bg-white/70 border border-[#DDD9CE] text-xs font-semibold text-[#3E3A36] focus:outline-none focus:border-[#8C8475] cursor-pointer"
                    >
                      {(Array.from(new Set(records.map(r => r.month))) as string[]).sort((a,b) => b.localeCompare(a)).map(m => (
                        <option key={m} value={m}>{m} 月份</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    {/* 核銷核取狀態 */}
                    {isMonthReconciled(settlementMonth, reconciledMonths) ? (
                      <div className="flex items-center gap-1.5 bg-[#F2F8F4] border border-[#DCEFE5] text-[#428564] px-3.5 py-2 rounded-xl text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-[#428564] shrink-0 animate-pulse" />
                        此月份已結清
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/50 text-[#8C5E24] px-3.5 py-2 rounded-xl text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        代墊款對帳中
                      </div>
                    )}

                    <button
                      onClick={() => {
                        const isReconciled = isMonthReconciled(settlementMonth, reconciledMonths);
                        let updated: string[];
                        if (isReconciled) {
                          updated = reconciledMonths.filter(m => normalizeMonth(m) !== normalizeMonth(settlementMonth));
                          showToast(`${settlementMonth} 月份已更改為：待核銷狀態`, 'info');
                          addNotificationAndSave(
                            `⚠️ 有帳目需重啟核對：${settlementMonth} 變更為「待核銷」`,
                            `已撤銷了 ${settlementMonth} 月份的對帳結清狀態，請雙方主動重啟明細之覆核。`,
                            'settle'
                          );
                        } else {
                          updated = [...reconciledMonths.filter(m => normalizeMonth(m) !== normalizeMonth(settlementMonth)), settlementMonth];
                          showToast(`${settlementMonth} 月份已成功核銷結清！`, 'success');
                          addNotificationAndSave(
                            `✅ ${settlementMonth} 月份對帳成功核銷`,
                            `本月公積金撥款與日常代墊已全數核對完畢，狀態已更新為「已核銷結清」。`,
                            'settle'
                          );
                        }
                        setReconciledMonths(updated);
                        localStorage.setItem('muji_reconciled_months', JSON.stringify(updated));
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                        isMonthReconciled(settlementMonth, reconciledMonths)
                          ? 'bg-[#EAE8E1] hover:bg-[#DDD9CE] text-[#5C564E]'
                          : 'bg-[#6E8C78] hover:bg-[#5C7765] text-white'
                      }`}
                    >
                      {isMonthReconciled(settlementMonth, reconciledMonths) ? '取消核銷標記' : '變更為「本月已核銷」'}
                    </button>
                  </div>
                </div>

                {/* 雙邊結算數字看板 (僅計算該指定核銷月份之累計數字) */}
                {(() => {
                  const compLiaoMonthTotal = records
                    .filter(r => r.month === settlementMonth && r.payer === '廖尹丞' && r.type.includes('支出'))
                    .reduce((sum, r) => sum + r.amount, 0);

                  const compZhouMonthTotal = records
                    .filter(r => r.month === settlementMonth && r.payer === '周沛緹' && r.type.includes('支出'))
                    .reduce((sum, r) => sum + r.amount, 0);

                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
                        {/* 廖尹丞 卡片 */}
                        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 sm:p-5 border-l-4 border-[#8C8475] shadow-2xs border-[#EBE8E0] relative overflow-hidden flex flex-col justify-between min-h-[7.5rem]">
                          <div className="absolute right-3 top-3 text-[#E6E3DB] opacity-35 pointer-events-none">
                            <User className="w-12 h-12 sm:w-14 sm:h-14" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold tracking-wider text-[#A59F94]">Liao Yin-Cheng</p>
                            <h3 className="text-xs font-semibold text-[#4A4641] mt-0.5">廖尹丞 • {settlementMonth} 代墊總額</h3>
                          </div>
                          <div className="mt-2">
                            <div className="text-lg sm:text-xl font-light text-[#3E3A36] font-mono leading-none break-words">
                              $ <span className="text-xl sm:text-2xl font-bold">{(Number(compLiaoMonthTotal) || 0).toLocaleString('zh-TW')}</span> 元
                            </div>
                          </div>
                        </div>

                        {/* 周沛緹 卡片 */}
                        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 sm:p-5 border-l-4 border-[#C1B79E] shadow-2xs border-[#EBE8E0] relative overflow-hidden flex flex-col justify-between min-h-[7.5rem]">
                          <div className="absolute right-3 top-3 text-[#E6E3DB] opacity-35 pointer-events-none">
                            <User className="w-12 h-12 sm:w-14 sm:h-14" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold tracking-wider text-[#A59F94]">Chou Pei-Ti</p>
                            <h3 className="text-xs font-semibold text-[#4A4641] mt-0.5">周沛緹 • {settlementMonth} 代墊總額</h3>
                          </div>
                          <div className="mt-2">
                            <div className="text-lg sm:text-xl font-light text-[#3E3A36] font-mono leading-none break-words">
                              $ <span className="text-xl sm:text-2xl font-bold">{(Number(compZhouMonthTotal) || 0).toLocaleString('zh-TW')}</span> 元
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 智慧結算金流提示核心黃金對帳區 */}
                      <div className="bg-gradient-to-br from-[#FAF8F2] to-[#EFEADA] border border-[#DDD9CE] rounded-2xl p-4 sm:p-5 md:p-6 shadow-2xs relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#8C8475]" />
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold tracking-wider text-[#5C564E] uppercase flex items-center gap-1.5">
                            <Wallet className="w-4 h-4 text-amber-800" />
                            {settlementMonth} 月度公積金撥款對帳建議
                          </h3>
                          
                          {/* 精簡對帳結果 */}
                          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#EBE8DE] shadow-2xs">
                            {compLiaoMonthTotal === 0 && compZhouMonthTotal === 0 ? (
                              <p className="text-[#3E3A36] text-xs font-medium py-1">
                                本月（{settlementMonth}）雙方暫無任何代墊紀錄，無需撥款返還。
                              </p>
                            ) : (
                              <div className="space-y-2 text-xs text-[#3E3A36]">
                                {compLiaoMonthTotal > 0 && (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#8C8475] shrink-0" />
                                    <span>公積金應撥款給 <strong>廖尹丞</strong>：</span>
                                    <span className="font-mono font-bold text-sm text-[#8C5E24] underline decoration-wavy">$ {(Number(compLiaoMonthTotal) || 0).toLocaleString('zh-TW')}</span>
                                    <span>元</span>
                                  </div>
                                )}
                                {compZhouMonthTotal > 0 && (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#8C8475] shrink-0" />
                                    <span>公積金應撥款給 <strong>周沛緹</strong>：</span>
                                    <span className="font-mono font-bold text-sm text-[#8C5E24] underline decoration-wavy">$ {(Number(compZhouMonthTotal) || 0).toLocaleString('zh-TW')}</span>
                                    <span>元</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* 代墊細項核對庫 - 列出個別對帳款項 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#4A4641] tracking-wider flex items-center gap-2 uppercase whitespace-nowrap">
                      <span>👥</span> {settlementMonth} 月度個別支出細項明細
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 廖尹丞的明細 */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-[#EEEDE3] space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b border-[#F2F1EC] pb-2 font-medium text-xs text-[#5C564E] whitespace-nowrap">
                        <span>廖尹丞 的代墊細目</span>
                        <span className="font-mono font-bold text-[#8C8475] whitespace-nowrap">
                          {records.filter(r => r.month === settlementMonth && r.payer === '廖尹丞' && r.type.includes('支出')).length} 筆
                        </span>
                      </div>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {records.filter(r => r.month === settlementMonth && r.payer === '廖尹丞' && r.type.includes('支出')).length === 0 ? (
                          <div className="text-center py-8 text-[11px] text-[#A59F94] font-light whitespace-nowrap">本月份無廖尹丞之代墊</div>
                        ) : (
                          records.filter(r => r.month === settlementMonth && r.payer === '廖尹丞' && r.type.includes('支出')).map(r => (
                            <div key={r.id} className="flex justify-between items-center text-xs bg-[#FAF9F5]/50 hover:bg-white p-2.5 rounded-xl transition-all border border-[#F2EDE1] gap-2">
                              <div className="space-y-0.5 flex-grow min-w-0 pr-1">
                                <div className="font-bold text-[#3E3A36] leading-snug truncate">{r.item}</div>
                                <div className="font-mono text-[9px] text-[#9A948C] whitespace-nowrap">📅 {r.date || `${r.month}-01`}</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono font-bold text-[#4D4942] whitespace-nowrap">$ {(Number(r?.amount) || 0).toLocaleString('zh-TW')}</span>
                                <button 
                                  onClick={() => handleDelete(r.id)}
                                  className="text-[#A59F94] hover:text-[#C55757] p-1.5 rounded-lg hover:bg-red-50 hover:border-red-100 transition-all border border-transparent cursor-pointer"
                                  title="移除此筆錯誤紀錄"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 周沛緹的明細 */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-[#EEEDE3] space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b border-[#F2F1EC] pb-2 font-medium text-xs text-[#5C564E] whitespace-nowrap">
                        <span>周沛緹 的代墊細目</span>
                        <span className="font-mono font-bold text-[#8C8475] whitespace-nowrap">
                          {records.filter(r => r.month === settlementMonth && r.payer === '周沛緹' && r.type.includes('支出')).length} 筆
                        </span>
                      </div>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {records.filter(r => r.month === settlementMonth && r.payer === '周沛緹' && r.type.includes('支出')).length === 0 ? (
                          <div className="text-center py-8 text-[11px] text-[#A59F94] font-light whitespace-nowrap">本月份無周沛緹之代墊</div>
                        ) : (
                          records.filter(r => r.month === settlementMonth && r.payer === '周沛緹' && r.type.includes('支出')).map(r => (
                            <div key={r.id} className="flex justify-between items-center text-xs bg-[#FAF9F5]/50 hover:bg-white p-2.5 rounded-xl transition-all border border-[#F2EDE1] gap-2">
                              <div className="space-y-0.5 flex-grow min-w-0 pr-1">
                                <div className="font-bold text-[#3E3A36] leading-snug truncate">{r.item}</div>
                                <div className="font-mono text-[9px] text-[#9A948C] whitespace-nowrap">📅 {r.date || `${r.month}-01`}</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono font-bold text-[#4D4942] whitespace-nowrap">$ {(Number(r?.amount) || 0).toLocaleString('zh-TW')}</span>
                                <button 
                                  onClick={() => handleDelete(r.id)}
                                  className="text-[#A59F94] hover:text-[#C55757] p-1.5 rounded-lg hover:bg-red-50 hover:border-red-100 transition-all border border-transparent cursor-pointer"
                                  title="移除此筆錯誤紀錄"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 隱密部署與連線設定按鈕 */}
                  <div className="pt-6 pb-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setIsDeployModalOpen(true)}
                      className="text-[10px] text-[#A59F94]/40 hover:text-[#5C564E] transition-all flex items-center gap-1 cursor-pointer opacity-40 hover:opacity-100 py-1 px-2.5 rounded-lg border border-transparent hover:border-[#E8E4D9] hover:bg-white/60"
                      title="系統部署與進階設定"
                    >
                      <FileCode className="w-3 h-3" />
                      <span>進階部署與一鍵複製代碼</span>
                    </button>
                  </div>
                </div>
              </motion.div>
              )
            )}

            {/* 🛒 購物清單 (生活模式) / ✈️ 旅遊分帳 (代墊借還模式) */}
            {activeTab === 'notebook' && (
              appMode === 'split' ? (
                <SplitTravelTab
                  key="split-travel"
                  gasWebUrl={gasWebUrl}
                  callGasApi={callGasApi}
                  enqueueSyncItem={enqueueSyncItem}
                  onConvertToSplit={(item) => {
                    handleAddSplitRecord({
                      payer: item.payer,
                      itemName: item.itemName,
                      totalAmount: item.totalAmount,
                      splitMode: 'AA平分'
                    });
                  }}
                  showToast={showToast}
                />
              ) : (
                <motion.div
                  key="notebook"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 max-w-4xl mx-auto pb-12"
                >
                {/* 頂部功能區標題與橫幅 */}
                <div className="bg-gradient-to-r from-amber-800 to-amber-900 text-amber-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-md relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none" />
                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-700/60 text-amber-100 text-[10px] sm:text-[11px] font-bold tracking-wider border border-amber-600/50">
                          🛒 雙人採購記事本
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                        生活採購與待買清單
                      </h2>
                      <p className="text-amber-200/90 text-xs sm:text-sm mt-1 max-w-lg leading-relaxed font-light">
                        區分「剛需需要買」與「心動想要買」，共同管理補貨需求。可點擊項目觀看詳細說明與備註！
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setShoppingForm({
                          id: '',
                          category: '需要買',
                          item: '',
                          store: '菜市場',
                          customStore: '',
                          deadline: '儘快',
                          customDeadline: '',
                          status: '待購買',
                          creator: '廖尹丞',
                          createdTime: '',
                          note: ''
                        });
                        setIsAddShoppingOpen(true);
                      }}
                      className="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 sm:py-3 bg-white text-amber-900 hover:bg-amber-50 rounded-xl sm:rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95"
                    >
                      <Plus className="w-4 h-4 text-amber-700 stroke-[3]" />
                      <span>新增採購記事</span>
                    </button>
                  </div>

                  {/* LINE 快捷提示貼心說明 */}
                  <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-amber-700/50 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs text-amber-100/90">
                    <div className="flex items-start gap-2 bg-amber-950/30 p-2.5 rounded-xl border border-amber-700/30">
                      <span className="text-sm shrink-0">💬</span>
                      <div>
                        <strong className="text-white font-semibold block mb-0.5">LINE 快速新增指令：</strong>
                        <span className="text-[11px] sm:text-xs">傳送 「買 全聯 鮮奶」 或 「想要 PS5」 即可智慧判斷自動入單！</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 bg-amber-950/30 p-2.5 rounded-xl border border-amber-700/30">
                      <span className="text-sm shrink-0">💡</span>
                      <div>
                        <strong className="text-white font-semibold block mb-0.5">分類觀望提示：</strong>
                        <span className="text-[11px] sm:text-xs">將「想要買」的奢侈品或非急需品列入觀察，特價或閒暇時再購買。</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 篩選與搜尋列 */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-[#EAE7DF] shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* 頁籤開關 (可平滑橫向滾動) */}
                    <div className="flex items-center bg-[#FAF9F5] p-1 rounded-xl border border-[#E8E4D9] w-full sm:w-auto overflow-x-auto scrollbar-none gap-1">
                      <button
                        onClick={() => setShoppingFilter('all')}
                        className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap text-center ${
                          shoppingFilter === 'all' ? 'bg-white text-[#3E3A36] shadow-2xs border border-[#E0DCD0]' : 'text-[#8C8475] hover:text-[#3E3A36]'
                        }`}
                      >
                        全部待買 ({shoppingItems.filter(i => i.status === '待購買').length})
                      </button>
                      <button
                        onClick={() => setShoppingFilter('need')}
                        className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap text-center ${
                          shoppingFilter === 'need' ? 'bg-rose-50 text-rose-800 shadow-2xs border border-rose-200' : 'text-[#8C8475] hover:text-[#3E3A36]'
                        }`}
                      >
                        需要買 ({shoppingItems.filter(i => i.category === '需要買' && i.status === '待購買').length})
                      </button>
                      <button
                        onClick={() => setShoppingFilter('want')}
                        className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap text-center ${
                          shoppingFilter === 'want' ? 'bg-amber-50 text-amber-800 shadow-2xs border border-amber-200' : 'text-[#8C8475] hover:text-[#3E3A36]'
                        }`}
                      >
                        想要買 ({shoppingItems.filter(i => i.category === '想要買' && i.status === '待購買').length})
                      </button>
                      <button
                        onClick={() => setShoppingFilter('done')}
                        className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap text-center ${
                          shoppingFilter === 'done' ? 'bg-emerald-50 text-emerald-800 shadow-2xs border border-emerald-200' : 'text-[#8C8475] hover:text-[#3E3A36]'
                        }`}
                      >
                        已買到 ({shoppingItems.filter(i => i.status === '已買到').length})
                      </button>
                    </div>

                    {/* 搜尋框與清空按鈕 */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      {shoppingFilter === 'done' && shoppingItems.some(i => i.status === '已買到') && (
                        <button
                          onClick={() => setIsClearDoneConfirmOpen(true)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 whitespace-nowrap shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>清空已購 ({shoppingItems.filter(i => i.status === '已買到').length})</span>
                        </button>
                      )}
                      <div className="relative w-full sm:w-48">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A39E92]" />
                        <input
                          type="text"
                          placeholder="搜尋品項/門市..."
                          value={shoppingSearch}
                          onChange={(e) => setShoppingSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-[#FAF9F5] border border-[#E5E1D7] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-[#8C8475] transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 門市 Chips 快速標籤 */}
                  {shoppingStores.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs no-scrollbar">
                      <span className="text-[11px] text-[#8C8475] shrink-0 font-bold mr-0.5 inline-flex items-center gap-1">
                        <Store className="w-3.5 h-3.5 text-amber-800" />
                        <span>地點門市：</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedStoreFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer shrink-0 font-bold inline-flex items-center ${
                          selectedStoreFilter === 'all'
                            ? 'bg-[#4D4942] text-white shadow-2xs'
                            : 'bg-[#F2EFE9] text-[#6C675F] hover:bg-[#E5E1D7]'
                        }`}
                      >
                        全部地點
                      </button>
                      {shoppingStores.map((st) => {
                        const isSelected = selectedStoreFilter === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setSelectedStoreFilter(isSelected ? 'all' : st)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer shrink-0 inline-flex items-center gap-1 font-bold ${
                              isSelected
                                ? 'bg-amber-700 text-white shadow-2xs'
                                : 'bg-[#F2EFE9] text-[#6C675F] hover:bg-[#E5E1D7] hover:text-amber-900'
                            }`}
                          >
                            <MapPin className={`w-3 h-3 shrink-0 ${isSelected ? 'text-amber-100' : 'text-[#8C8475]'}`} />
                            <span className="whitespace-nowrap">{st}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 購物清單卡片列表 */}
                <div className="space-y-3">
                  {filteredShoppingItems.length === 0 ? (
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-10 text-center border border-[#EAE7DF] shadow-xs">
                      <div className="w-12 h-12 rounded-full bg-[#FAF9F5] flex items-center justify-center mx-auto mb-3 text-2xl">
                        🛒
                      </div>
                      <h3 className="text-sm font-semibold text-[#3E3A36]">目前沒有符合條件的採購項目</h3>
                      <p className="text-xs text-[#8C8475] mt-1 max-w-xs mx-auto">
                        您可以點擊畫面下方「＋」按鈕新增，或在 LINE 傳送訊息快速新增！
                      </p>
                      <button
                        onClick={() => {
                          setAddModalType('shopping');
                          setIsAddOpen(true);
                        }}
                        className="mt-4 px-4 py-2 rounded-xl bg-[#4D4942] text-white text-xs font-medium cursor-pointer inline-flex items-center gap-1.5 shadow-xs active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>新增採購記事</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredShoppingItems.map((item) => {
                        const isDone = item.status === '已買到';
                        const isNeed = item.category === '需要買';

                        return (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            onClick={() => setSelectedShoppingDetail(item)}
                            className={`bg-white rounded-2xl p-4 border transition-all duration-200 relative group flex flex-col justify-between cursor-pointer ${
                              isDone 
                                ? 'border-[#EAE7DF] bg-[#FAF9F6]/80 opacity-75 hover:opacity-95' 
                                : isNeed 
                                  ? 'border-rose-200/80 hover:border-rose-300 shadow-2xs hover:shadow-md' 
                                  : 'border-amber-200/80 hover:border-amber-300 shadow-2xs hover:shadow-md'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                {/* 分類 Tag */}
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 ${
                                  isDone
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isNeed
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isDone ? 'bg-emerald-500' : isNeed ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                  {isDone ? '已採購完成' : item.category}
                                </span>

                                {/* 操作按鈕區：鉛筆編輯 + 刪除 */}
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditShopping(item);
                                    }}
                                    className="text-[#A39E92] hover:text-amber-800 p-1.5 rounded-lg hover:bg-amber-50 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                                    title="編輯此採購項目"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteShoppingItem(item.id, item.item);
                                    }}
                                    className="text-[#A39E92] hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                                    title="刪除此紀錄"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* 品項與 Checkbox */}
                              <div className="flex items-start gap-3 my-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleShoppingStatus(item.id, item.status);
                                  }}
                                  className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                                    isDone
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-[#CBD5E1] hover:border-amber-500 bg-white text-transparent hover:text-amber-300'
                                  }`}
                                  title={isDone ? '標記為待購買' : '標記為已買到'}
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </button>

                                <div className="flex-1 min-w-0">
                                  <h4 className={`text-sm font-semibold text-[#3E3A36] ${isDone ? 'line-through text-[#8C8475]' : ''}`}>
                                    {item.item}
                                  </h4>

                                  {/* 商店、期限與備註提示 */}
                                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-[#7A7469]">
                                    <span className="bg-[#F5F3ED] px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-[#E8E4D9] shrink-0 font-medium">
                                      <MapPin className="w-3 h-3 text-[#8C8475] shrink-0" /><span className="truncate max-w-[120px]">{item.store || '隨意'}</span>
                                    </span>
                                    <span className="bg-[#F5F3ED] px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-[#E8E4D9] shrink-0 font-medium">
                                      <Clock className="w-3 h-3 text-[#8C8475] shrink-0" /><span className="truncate max-w-[120px]">{item.deadline || '儘快'}</span>
                                    </span>
                                    {item.note && item.note.trim() !== '' && (
                                      <span className="bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1 shrink-0">
                                        <FileText className="w-3 h-3 text-amber-700 shrink-0" /><span>附備註</span>
                                      </span>
                                    )}
                                  </div>

                                  {/* 詳細備註預覽區塊 */}
                                  {item.note && item.note.trim() !== '' && (
                                    <div className="mt-2.5 px-2.5 py-1.5 bg-[#FAF9F5] border border-[#E8E4D9] rounded-xl text-xs text-[#5C564E] flex items-start gap-1.5">
                                      <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                                      <span className="line-clamp-2 break-all">{item.note}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* 底部時間與詳情按鈕 */}
                            <div className="mt-3 pt-2 border-t border-[#F3F0E6] flex items-center justify-between text-[10px] text-[#A39E92]">
                              <span>
                                登記人：{item.creator || '夥伴'}
                                {(() => {
                                  const displayTime = getShoppingItemDisplayTime(item);
                                  return displayTime ? ` · ${displayTime}` : '';
                                })()}
                              </span>
                              <span className="text-amber-800 font-semibold group-hover:underline flex items-center gap-0.5 text-[11px]">
                                <span>詳情</span><ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* 底部浮動合計看板 (依據當前模式：公積金模式顯示當月代墊累計，代墊借還模式顯示即時未結淨額與雙方先付) */}
      <AnimatePresence>
        {(activeTab === 'home' || activeTab === 'history') && !isFloatingBarDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-30 max-w-md w-[calc(100%-2rem)] backdrop-blur-md shadow-[0_8px_25px_rgba(0,0,0,0.25)] rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3.5 flex items-center justify-between gap-2 ${
              appMode === 'split'
                ? 'bg-[#2D2825]/95 border border-rose-900/50 shadow-[0_8px_25px_rgba(225,29,72,0.2)]'
                : 'bg-[#4D4942]/95 border border-[#5C564E]'
            }`}
          >
            {appMode === 'split' ? (
              // 💳 代墊借還模式專屬懸浮看板
              <>
                <div className="text-[10px] sm:text-xs text-[#E8DFC8] font-bold tracking-wider flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <ArrowRightLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
                  <span>
                    {(splitSummary?.unsettledCount || 0) > 0
                      ? `未結代墊 (${splitSummary.unsettledCount}筆)：`
                      : '代墊狀態：'}
                  </span>
                </div>

                <div className="flex gap-2 sm:gap-3 items-center shrink-0">
                  {(splitSummary?.unsettledCount || 0) === 0 ? (
                    <span className="text-emerald-400 text-[11px] sm:text-xs font-bold whitespace-nowrap">
                      ✨ 目前已全部結清
                    </span>
                  ) : (
                    <>
                      <div className="text-[10px] sm:text-xs text-white/90 whitespace-nowrap hidden sm:block">
                        廖代墊: <span className="font-mono font-bold text-rose-300">$ {(Number(splitSummary?.zhouOwesLiao) || 0).toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-white/90 whitespace-nowrap hidden sm:block">
                        周代墊: <span className="font-mono font-bold text-rose-300">$ {(Number(splitSummary?.liaoOwesZhou) || 0).toLocaleString()}</span>
                      </div>

                      {/* 淨結算方向按鈕，點擊可直接開啟對帳彈窗 */}
                      <button
                        type="button"
                        onClick={() => setIsSplitSettleModalOpen(true)}
                        className="cursor-pointer transition-all active:scale-95"
                        title="點擊開啟結算對帳"
                      >
                        {splitSummary?.netDebtor === '周' ? (
                          <span className="bg-rose-500/25 hover:bg-rose-500/40 text-rose-200 border border-rose-500/40 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold whitespace-nowrap flex items-center gap-1">
                            <span>周應還廖</span>
                            <span className="font-mono text-white">$ {(Number(splitSummary?.netAmount) || 0).toLocaleString()}</span>
                          </span>
                        ) : splitSummary?.netDebtor === '廖' ? (
                          <span className="bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 border border-amber-500/40 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold whitespace-nowrap flex items-center gap-1">
                            <span>廖應還周</span>
                            <span className="font-mono text-white">$ {(Number(splitSummary?.netAmount) || 0).toLocaleString()}</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold whitespace-nowrap">
                            雙方金額持平
                          </span>
                        )}
                      </button>
                    </>
                  )}

                  {/* 關閉按鈕 */}
                  <button
                    onClick={() => {
                      setIsFloatingBarDismissed(true);
                      showToast('已暫時收合代墊看板，可點擊右下角圖示重新展開', 'info');
                    }}
                    className="ml-1 text-white/50 hover:text-white transition-colors cursor-pointer text-xs font-bold leading-none p-1"
                    title="暫時收合看板"
                  >
                    ✕
                  </button>
                </div>
              </>
            ) : (
              // 💰 公積金模式專屬懸浮看板
              <>
                <div className="text-[10px] sm:text-xs text-[#DDD9CE] font-bold tracking-wider flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D5CDBC]" />
                  <span>{latestMonth} 月公積金代墊：</span>
                </div>
                <div className="flex gap-2 sm:gap-3.5 items-center shrink-0">
                  <div className="text-[11px] sm:text-xs text-white whitespace-nowrap">
                    L: <span className="font-mono font-bold text-[#EFC38E]">$ {(Number(liaoLatestTotal) || 0).toLocaleString('zh-TW')}</span>
                  </div>
                  <div className="text-[11px] sm:text-xs text-white whitespace-nowrap">
                    P: <span className="font-mono font-bold text-[#EFC38E]">$ {(Number(zhouLatestTotal) || 0).toLocaleString('zh-TW')}</span>
                  </div>
                  
                  {/* 關閉按鈕 */}
                  <button
                    onClick={() => {
                      setIsFloatingBarDismissed(true);
                      showToast('已暫時收合累計代墊，可點擊右下角錢包圖示重新展開', 'info');
                    }}
                    className="ml-1 text-white/50 hover:text-white transition-colors cursor-pointer text-xs font-bold leading-none p-1"
                    title="暫時關閉看板"
                  >
                    ✕
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 迷你懸浮錢包小按鈕 (當合計看板被收合時顯示於右下角) */}
      <AnimatePresence>
        {(activeTab === 'home' || activeTab === 'history') && isFloatingBarDismissed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsFloatingBarDismissed(false)}
            className={`fixed bottom-[88px] right-4 z-30 w-10 h-10 rounded-full text-white flex items-center justify-center shadow-lg cursor-pointer transition-all active:scale-95 ${
              appMode === 'split'
                ? 'bg-[#2D2825]/95 hover:bg-[#3D3531] border border-rose-900/60 shadow-rose-950/20'
                : 'bg-[#4D4942]/95 hover:bg-[#3E3A35] border border-[#5C564E]'
            }`}
            title={appMode === 'split' ? '展開代墊借還看板' : '展開累計代墊'}
          >
            {appMode === 'split' ? (
              <ArrowRightLeft className="w-5 h-5 text-rose-400" />
            ) : (
              <Wallet className="w-5 h-5 text-[#EFC38E]" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* 進入網頁時的超支/省錢警告通知彈窗 */}
      <SmartAlertModal
        isOpen={showLoadAlertModal}
        onClose={() => setShowLoadAlertModal(false)}
        smartAlerts={smartAlerts}
      />

      {/* Google 試算表連線狀態提示彈窗 */}
      <SyncAlertModal
        isOpen={isSyncAlertOpen}
        onClose={() => setIsSyncAlertOpen(false)}
      />

      {/* 🛠️ 自訂極簡無印風雙鍵對話確認 Modal */}
      <CustomConfirmModal
        state={customConfirmState}
        onClose={() => setCustomConfirmState(null)}
      />

      {/* 💬 初次使用「加入官方 LINE 帳號」提醒 Modal */}
      <LinePromptModal
        isOpen={showLinePromptModal}
        onClose={() => setShowLinePromptModal(false)}
        onMarkJoined={handleMarkJoinedLine}
      />

      {/* 底部 Float 警示視窗 (Toast) */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 pointer-events-none"
          >
            <div className="bg-[#4D4942]/95 backdrop-blur-sm text-white text-xs px-5 py-4 rounded-xl shadow-lg border border-white/10 flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-300">
                {toast.type === 'error' ? '!' : '✓'}
              </span>
              <span className="font-light tracking-wide">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部功能列 Floating Dock */}
      <FloatingDock
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        appMode={appMode}
        onOpenAdd={() => {
          if (appMode === 'split') {
            setIsSplitAddOpen(true);
          } else {
            setIsAddOpen(true);
          }
        }}
        unsettledCount={splitSummary.unsettledCount}
        pendingShoppingCount={shoppingItems.filter(i => i.status === '待購買').length}
      />

      {/* 💳 代墊分帳專屬 Modals */}
      <SplitAddModal
        isOpen={isSplitAddOpen}
        onClose={() => setIsSplitAddOpen(false)}
        onAddSplit={handleAddSplitRecord}
        onSubmit={handleAddSplitRecord}
        showToast={showToast}
      />

      <SplitSettleModal
        isOpen={isSplitSettleModalOpen}
        onClose={() => setIsSplitSettleModalOpen(false)}
        summary={splitSummary}
        onConfirmSettle={handleSettleAllSplitRecords}
        onSettle={handleSettleAllSplitRecords}
      />

      {/* 快速新增項目 Modal (含記帳代墊與購物記事雙模式) */}
      <AddRecordModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        addModalType={addModalType}
        setAddModalType={setAddModalType}
        formData={formData}
        setFormData={setFormData}
        onSubmitRecord={handleSubmit}
        exchangeRates={exchangeRates}
        shoppingForm={shoppingForm}
        setShoppingForm={setShoppingForm}
        onSubmitShopping={handleAddShoppingSubmit}
        shoppingStores={shoppingStores}
        onOpenManageStores={() => setIsManageStoresOpen(true)}
      />

      {/* 🛒 新增/編輯採購項目專屬 Modal */}
      <AddShoppingModal
        isOpen={isAddShoppingOpen}
        onClose={() => setIsAddShoppingOpen(false)}
        shoppingForm={shoppingForm}
        setShoppingForm={setShoppingForm}
        onSubmitShopping={handleAddShoppingSubmit}
        shoppingStores={shoppingStores}
        onOpenManageStores={() => setIsManageStoresOpen(true)}
      />

      {/* 🏪 管理常用商店 Modal */}
      <ManageStoresModal
        isOpen={isManageStoresOpen}
        onClose={() => setIsManageStoresOpen(false)}
        shoppingStores={shoppingStores}
        isAddStoreInput={isAddStoreInput}
        setIsAddStoreInput={setIsAddStoreInput}
        onAddStore={handleAddStore}
        onDeleteStore={handleDeleteStore}
      />

      {/* 🗑️ 清空已購項目確認 Modal */}
      <ClearDoneConfirmModal
        isOpen={isClearDoneConfirmOpen}
        onClose={() => setIsClearDoneConfirmOpen(false)}
        doneCount={shoppingItems.filter(i => i.status === '已買到').length}
        shoppingItems={shoppingItems}
        onConfirm={handleClearDoneShopping}
      />

      {/* 🔍 採購項目詳情與備註 Modal */}
      <ShoppingDetailModal
        item={selectedShoppingDetail}
        onClose={() => setSelectedShoppingDetail(null)}
        onEdit={(item) => {
          setSelectedShoppingDetail(null);
          handleOpenEditShopping(item);
        }}
        onToggleStatus={handleToggleShoppingStatus}
        onDelete={handleDeleteShoppingItem}
      />

      {/* ✈️ 各國即時匯率與出國幣值試算器 Modal */}
      <CurrencyCalculatorModal
        isOpen={showTravelCalculatorModal}
        onClose={() => setShowTravelCalculatorModal(false)}
        exchangeRates={exchangeRates}
        ratesLastUpdated={ratesLastUpdated}
        isRateLoading={isRateLoading}
        rateFetchError={rateFetchError}
        onRefreshRates={() => fetchLiveExchangeRates(true)}
        calcBaseCurrency={calcBaseCurrency}
        setCalcBaseCurrency={setCalcBaseCurrency}
        calcInputAmount={calcInputAmount}
        setCalcInputAmount={setCalcInputAmount}
        calcMode={calcMode}
        setCalcMode={setCalcMode}
      />

        {/* 💬 LINE 即時通知推播開關與偏好設定 Modal */}
        <LineSettingsModal
          isOpen={isLineSettingsModalOpen}
          onClose={() => setIsLineSettingsModalOpen(false)}
          hasLineToken={hasLineToken}
          deployLineToken={deployLineToken}
          lineNotifyToken={lineNotifyToken}
          setLineNotifyToken={setLineNotifyToken}
          maskedLineToken={maskedLineToken}
          isTestingLine={isTestingLine}
          isSavingLineToken={isSavingLineToken}
          handleTestLineNotify={handleTestLineNotify}
          handleSaveLineNotifyToken={handleSaveLineNotifyToken}
          lineNotifySettings={lineNotifySettings}
          setAllLineNotifySettings={setAllLineNotifySettings}
          toggleLineNotifySetting={toggleLineNotifySetting}
        />

        {/* 💾 資料備份、還原與離線同步管理 Modal */}
        <DataBackupModal
          isOpen={isDataBackupOpen}
          onClose={() => setIsDataBackupOpen(false)}
          records={records}
          shoppingItems={shoppingItems}
          shoppingStores={shoppingStores}
          splitItems={splitItems}
          isOnline={isOnline}
          lastSyncedAt={lastSyncedAt}
          onRestoreData={handleRestoreData}
          onSyncAll={handleSyncAll}
          isSyncing={isSyncingGas}
        />

        {/* 📱 PWA 手機桌面安裝與引導 Modal */}
        <PwaInstallModal
          isOpen={isPwaInstallModalOpen}
          onClose={() => setIsPwaInstallModalOpen(false)}
          deferredPrompt={deferredPrompt}
          onInstalled={() => {
            showToast('🎉 伴伴記已成功安裝至主畫面！', 'success');
            setDeferredPrompt(null);
          }}
        />

        {/* 隱密系統部署與連線設定 Modal */}
        <GasDeployModal
          isOpen={isDeployModalOpen}
          onClose={() => setIsDeployModalOpen(false)}
          deploySheetUrl={deploySheetUrl}
          setDeploySheetUrl={setDeploySheetUrl}
          deployLineToken={deployLineToken}
          setDeployLineToken={setDeployLineToken}
          gasWebUrl={gasWebUrl}
          setGasWebUrl={setGasWebUrl}
          onOpenLineSettings={() => {
            setIsDeployModalOpen(false);
            setIsLineSettingsModalOpen(true);
          }}
          saveDeployConfig={saveDeployConfig}
          activeDeployCodeTab={activeDeployCodeTab}
          setActiveDeployCodeTab={setActiveDeployCodeTab}
          copiedCodeType={copiedCodeType}
          copyDeployCode={copyDeployCode}
          customizedCodeGs={getCustomizedCodeGs()}
        />

      {/* Footer 簡介 */}
      <footer className="w-full text-center py-6 border-t border-[#EEEDE8] bg-[#EEEDE9]/30 text-xs text-[#999489] font-light mt-auto pb-24">
        <p>©2026公積金記帳系統｜Designed by YIN-CHENG</p>
      </footer>
    </div>
  );
}
