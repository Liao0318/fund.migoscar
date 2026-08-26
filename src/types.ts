export interface SplitRecordItem {
  id: string;
  rowNumber?: number;
  time: string;
  payer: '廖' | '周';
  splitMode: 'AA平分' | '全額代付' | '自訂金額';
  itemName: string;
  totalAmount: number;
  splitResult: string;
  debtor: '廖' | '周';
  debtorAmount: number;
  status: '未結清' | '已結清';
  settledTime?: string;
  note?: string;
}

export interface SplitSummary {
  liaoOwesZhou: number;
  zhouOwesLiao: number;
  netDebtor: '廖' | '周' | 'none';
  netAmount: number;
  summaryText: string;
  unsettledCount: number;
  settledCount: number;
}

export interface TravelMember {
  id: string;
  name: string;
  avatar?: string;
  isDefaultCouple?: boolean;
}

export interface TravelTrip {
  id: string;
  title: string;
  destination: string;
  coverEmoji: string;
  startDate: string;
  endDate: string;
  currency: string;
  exchangeRate: number; // 外幣換台幣匯率 (例如 JPY=0.215, USD=32.2)
  budgetTWD?: number;
  status: '進行中' | '規劃中' | '已結算';
  themeColor?: string; // e.g. 'rose', 'sky', 'emerald', 'amber', 'purple', 'stone', 'indigo', 'orange'
  members?: string[]; // 成員名稱清單，例如 ['廖', '周', '小明', '阿美']
  createdAt: string;
}

export interface TravelExpenseItem {
  id: string;
  tripId: string;
  date: string;
  category: '機票交通' | '住宿訂房' | '美食餐廳' | '門票景點' | '購物伴手禮' | '租車加油' | '體驗活動' | '其他雜支';
  itemName: string;
  payer: string; // 支援任意成員或 '共同基金'
  originalCurrency: string;
  originalAmount: number;
  exchangeRate: number;
  totalAmountTWD: number;
  splitMode: '全體AA' | '參與者AA' | '全額代墊' | '指定分攤' | '自訂金額' | 'AA平分' | '廖廖全出' | '周周全出';
  participants?: string[]; // 共同分攤的成員清單
  memberSplits?: Record<string, number>; // 每位成員應分攤之 TWD 金額
  customDebtorAmountTWD?: number;
  debtor: string;
  debtorAmountTWD: number;
  location?: string;
  note?: string;
  syncedToSplit: boolean;
  createdAt: string;
}

export interface TravelWishItem {
  id: string;
  tripId: string;
  itemName: string;
  category: string;
  estimatedAmountTWD?: number;
  addedBy: '廖' | '周' | '共同';
  status: '待預訂' | '已完成';
  note?: string;
}

// ------------------- 生活公積金 (Living Fund) 相關資料模型 -------------------

export interface RecordItem {
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

export interface AppNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: 'expense' | 'income' | 'system' | 'delete' | 'settle';
  timestamp?: number;
}

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

export interface LineNotifySettings {
  notifyOnAdd: boolean;
  notifyOnIncome: boolean;
  notifyOnEdit: boolean;
  notifyOnDelete: boolean;
  notifyOnSettle: boolean;
  showBalance: boolean;
  notifyOnShoppingAdd: boolean;
  notifyOnShoppingComplete: boolean;
  notifyOnShoppingDelete: boolean;
}

export interface CustomConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
}

