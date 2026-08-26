import { ShoppingItem } from '../types';

/**
 * 鎖定為「yyyy-MM-dd 上午/下午 hh:mm」格式，不含時區或 ISO 字串
 */
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

/**
 * 輔助函式：可靠取得採購項目的標準格式化時間
 */
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

/**
 * 規範月份字串為 YYYY-MM
 */
export const normalizeMonth = (m: string): string => {
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

/**
 * 判斷指定月份是否已核銷
 */
export const isMonthReconciled = (month: string, list: string[]): boolean => {
  const normMonth = normalizeMonth(month);
  return list.some(item => normalizeMonth(item) === normMonth);
};
