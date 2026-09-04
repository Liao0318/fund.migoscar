import { ShoppingItem, AppNotification, AuthUser } from '../types';

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
    // 檢查是否為 JS Date.toString() 格式 (例如 Wed Aug 12 2026 12:08:00 GMT+0800 ...)
    const parsedJsDate = new Date(strVal);
    if (!isNaN(parsedJsDate.getTime()) && !/^\d{4}-\d{2}$/.test(strVal)) {
      d = parsedJsDate;
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
 * 判斷指定的時間戳記或日期字串是否為「今天」（依使用者當地時間）
 */
export function isTodayNotification(timeInput: any): boolean {
  if (!timeInput) return false;
  let d: Date | null = null;
  if (timeInput instanceof Date) {
    d = timeInput;
  } else if (typeof timeInput === 'number') {
    d = new Date(timeInput);
  } else {
    const strVal = String(timeInput).trim();
    // 優先比對 yyyy-mm-dd 或 yyyy/mm/dd 前綴
    const dateMatch = strVal.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (dateMatch) {
      const year = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1;
      const day = parseInt(dateMatch[3], 10);
      const now = new Date();
      return (
        year === now.getFullYear() &&
        month === now.getMonth() &&
        day === now.getDate()
      );
    }
    const cleanStr = strVal.replace(/上午|下午/g, '').replace(/T/g, ' ').replace(/-/g, '/');
    const ms = Date.parse(cleanStr);
    if (!isNaN(ms)) {
      d = new Date(ms);
    }
  }

  if (!d || isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * 判斷通知是否為伴侶發送給我的（我記帳，對方收到通知；他記帳，我的手機收到通知）
 */
export function isIncomingFromPartner(n: AppNotification, currentUser?: AuthUser | null): boolean {
  if (!n) return false;

  // 1. 如果有明確的 actorEmail
  if (currentUser?.email && n.actorEmail) {
    if (n.actorEmail.toLowerCase() === currentUser.email.toLowerCase()) {
      return false; // 自己發的
    }
    return true; // 伴侶發的
  }

  // 2. 如果有明確的 actorRole / targetRole
  const currentRole = currentUser?.role || (currentUser?.email?.toLowerCase().includes('oscar') ? '廖' : undefined);
  if (currentRole) {
    if (n.actorRole && n.actorRole === currentRole) return false;
    if (n.targetRole && n.targetRole === currentRole) return true;
  }

  // 3. 從 title, desc, actorName 辨識是否為自己操作的
  const myNames: string[] = [];
  if (currentUser?.name) myNames.push(currentUser.name);
  if (currentUser?.nickname) myNames.push(currentUser.nickname);
  if (currentUser?.role) myNames.push(currentUser.role);
  if (currentRole === '廖' || currentUser?.email?.toLowerCase().includes('oscar')) {
    myNames.push('廖尹丞', '廖', '尹丞');
  } else if (currentRole === '周') {
    myNames.push('周沛緹', '周', '沛緹');
  }

  const titleAndDesc = `${n.title || ''} ${n.desc || ''} ${n.actorName || ''}`;
  const isSelfAction = myNames.some(name => name && titleAndDesc.includes(name));
  if (isSelfAction) {
    return false;
  }

  // 4. 比對是否包含伴侶的名字
  const partnerNames: string[] = [];
  if (currentUser?.partnerName) partnerNames.push(currentUser.partnerName);
  if (currentUser?.adminName) partnerNames.push(currentUser.adminName);
  if (currentRole === '廖' || currentUser?.email?.toLowerCase().includes('oscar')) {
    partnerNames.push('周沛緹', '周', '沛緹');
  } else if (currentRole === '周') {
    partnerNames.push('廖尹丞', '廖', '尹丞');
  }
  const isPartnerAction = partnerNames.some(name => name && titleAndDesc.includes(name));
  if (isPartnerAction) {
    return true;
  }

  // 系統通知預設為 incoming
  if (n.type === 'system') return true;

  return false;
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
