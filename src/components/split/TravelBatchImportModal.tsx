import React, { useState, useMemo, useRef } from 'react';
import { 
  FileSpreadsheet, 
  X, 
  Check, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Users, 
  User, 
  ShoppingBag, 
  Layers, 
  HelpCircle,
  Copy,
  Download,
  Upload,
  FileText,
  CreditCard,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { TravelExpenseItem, TravelTrip, AuthUser } from '../../types';

interface TravelBatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTrip: TravelTrip;
  tripMembers: string[];
  currentUser?: AuthUser | null;
  onAddTripMembers: (newMembers: string[]) => void;
  onImportExpenses: (expenses: TravelExpenseItem[]) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface ParsedRow {
  id: string;
  selected: boolean;
  date: string;
  location: string;
  itemName: string;
  category: TravelExpenseItem['category'];
  unitPrice: number;
  quantity: number;
  discount: number;
  totalAmount: number; // 原幣小計
  totalAmountTWD?: number; // 台幣小計 (若有直接採用)
  payer: string;
  splitMode: TravelExpenseItem['splitMode'];
  splitTarget: string;
  participants: string[];
  note: string;
  paymentMethod: string;
  creatorEmail?: string;
  createdBy?: string;
}

const CATEGORY_KEYWORDS: Record<string, TravelExpenseItem['category']> = {
  '機票': '機票交通',
  'GMP': '機票交通',
  'KHH': '機票交通',
  '地鐵': '機票交通',
  'JR': '機票交通',
  '新幹線': '機票交通',
  '車資': '機票交通',
  '計程車': '機票交通',
  'Uber': '機票交通',
  '巴士': '機票交通',
  '網卡': '機票交通',
  '運費': '機票交通',
  '行李箱': '購物伴手禮',
  '住宿': '住宿訂房',
  '青年旅舍': '住宿訂房',
  '飯店': '住宿訂房',
  '旅館': '住宿訂房',
  '民宿': '住宿訂房',
  '韓服': '體驗活動',
  '化妝': '體驗活動',
  '攝影': '體驗活動',
  '門票': '門票景點',
  '展望台': '門票景點',
  '影城': '門票景點',
  '樂園': '門票景點',
  '餐廳': '美食餐廳',
  '燒肉': '美食餐廳',
  '咖啡': '美食餐廳',
  '拉麵': '美食餐廳',
  '飯捲': '美食餐廳',
  '一隻雞': '美食餐廳',
  '烤肉': '美食餐廳',
  '點心': '美食餐廳',
  '優格': '美食餐廳',
  '燒酒': '美食餐廳',
  '梅酒': '美食餐廳',
  '泡麵': '美食餐廳',
  '零食': '購物伴手禮',
  '餅乾': '購物伴手禮',
  '洋芋片': '購物伴手禮',
  '巧克力': '購物伴手禮',
  '海苔': '購物伴手禮',
  '棉被': '購物伴手禮',
  '床墊': '購物伴手禮',
  '涼被': '購物伴手禮',
  '四季被': '購物伴手禮',
  '衣服': '購物伴手禮',
  '襯衫': '購物伴手禮',
  '背心': '購物伴手禮',
  '襪': '購物伴手禮',
  '飾品': '購物伴手禮',
  '耳環': '購物伴手禮',
  '戒指': '購物伴手禮',
  '藥妝': '購物伴手禮',
  '面膜': '購物伴手禮',
  '精華': '購物伴手禮',
  '化妝水': '購物伴手禮',
  '乳霜': '購物伴手禮',
  '防曬': '購物伴手禮',
  '唇膏': '購物伴手禮',
  '牙膏': '購物伴手禮',
  '眼霜': '購物伴手禮',
  '伴手禮': '購物伴手禮',
  'Lotte': '購物伴手禮',
  'Mart': '購物伴手禮',
  'Olive Young': '購物伴手禮',
  'Daiso': '購物伴手禮',
  'DAISO': '購物伴手禮',
  '超市': '購物伴手禮',
  '超商': '美食餐廳',
  '租車': '租車加油',
  '加油': '租車加油',
};

// 清理數字字串 (支援 3,294NTD, 4,000, 160,000, 0.5 等)
function cleanNum(val: any): number {
  if (val === undefined || val === null) return 0;
  const s = String(val).replace(/,/g, '').replace(/NTD|TWD|KRW|JPY|USD|EUR|₩|¥|\$/gi, '').trim();
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

// 正規化日期 (支援 2026年8月14日 8:41, 2026/08/31 18:02, 2026-08-29, 8月29日 10:30 等)
function normalizeDateStr(rawDate: string, defaultYear: string): string {
  if (!rawDate || !rawDate.trim()) {
    return new Date().toISOString().split('T')[0];
  }
  const clean = rawDate.trim();

  // 1. 2026年8月14日 8:41 或 2026年08月14日
  const ymdMatch = clean.match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日?/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. 8月14日 8:41
  const mdMatch = clean.match(/(\d{1,2})月\s*(\d{1,2})日?/);
  if (mdMatch) {
    const m = mdMatch[1].padStart(2, '0');
    const d = mdMatch[2].padStart(2, '0');
    return `${defaultYear}-${m}-${d}`;
  }

  // 3. 2026/8/14 或 2026/08/14 18:02
  const datePart = clean.split(/\s+/)[0];
  if (datePart.includes('/')) {
    const parts = datePart.split('/');
    if (parts.length === 3) {
      const y = parts[0].length === 4 ? parts[0] : `20${parts[0]}`;
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${y}-${m}-${d}`;
    } else if (parts.length === 2) {
      const m = parts[0].padStart(2, '0');
      const d = parts[1].padStart(2, '0');
      return `${defaultYear}-${m}-${d}`;
    }
  }

  // 4. 2026-08-14
  if (datePart.includes('-')) {
    const parts = datePart.split('-');
    if (parts.length === 3) {
      const y = parts[0].length === 4 ? parts[0] : `20${parts[0]}`;
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  return new Date().toISOString().split('T')[0];
}

// CSV 正則解析器（支援處理引號包裹、逗號與換行）
function parseCsvLine(line: string, delimiter: string = '\t'): string[] {
  if (delimiter === '\t') {
    return line.split('\t').map(c => c.trim().replace(/^["']|["']$/g, ''));
  }

  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(cur.trim().replace(/^["']|["']$/g, ''));
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim().replace(/^["']|["']$/g, ''));
  return result;
}

export const TravelBatchImportModal: React.FC<TravelBatchImportModalProps> = ({
  isOpen,
  onClose,
  activeTrip,
  tripMembers,
  currentUser,
  onAddTripMembers,
  onImportExpenses,
  showToast,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [currency, setCurrency] = useState(activeTrip.currency || 'KRW');
  const [exchangeRate, setExchangeRate] = useState(String(activeTrip.exchangeRate || (activeTrip.currency === 'KRW' ? 0.024 : activeTrip.currency === 'JPY' ? 0.22 : 1)));
  const [defaultPayer, setDefaultPayer] = useState(tripMembers[0] || '廖');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [discoveredNewMembers, setDiscoveredNewMembers] = useState<string[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 11 欄標準表頭名稱 (對齊真實代購/分帳 Excel 格式)
  const exactHeaders = [
    '時間戳記',
    '購物地點',
    '品項（韓文 / 中文翻譯）',
    `單價 (${currency})`,
    '數量',
    `小計 (${currency})`,
    '小計 (NTD)',
    '備註/折扣',
    '款項支付方式',
    '代墊人(先行付款)',
    '需收款人 / 分帳人(償還代墊款者)'
  ];

  // 產生範例資料陣列 (包含代購家人親友、超商、棉被店等真實情境)
  const getSampleData = () => {
    const p1 = tripMembers[0] || '廖尹丞';
    const p2 = tripMembers[1] || '周沛緹';
    const isKrw = currency === 'KRW';
    const isJpy = currency === 'JPY';

    if (isKrw) {
      return [
        ['2026/08/28 16:50', 'Lotte Mart 首爾站店', '롯데 빼빼로 杏仁巧克力棒 (Pepero)', '5,360', '1', '5,360', '129NTD', '零食採買', '信用卡', p1, '公積金'],
        ['2026/08/28 16:50', 'Lotte Mart 首爾站店', '해태 자가비 Jagabee 薯條 (紫蘇海苔味)', '3,410', '1', '3,410', '82NTD', '零食採買', '信用卡', p1, '公積金'],
        ['2026/08/29 15:31', '廣藏市場88號棉被店', '四季被 (薄款床墊套)', '55,000', '2', '110,000', '2,640NTD', '沛緹家自用', '信用卡', p1, p2],
        ['2026/08/29 15:31', '廣藏市場88號棉被店', '四季被 (深顏色圖案)', '75,000', '1', '75,000', '1,800NTD', '尹丞家自用', '信用卡', p1, p1],
        ['2026/08/29 10:30', '明月閣高端韓服店', '女生韓服2H + 精緻化妝造型', '120,000', '1', '120,000', '2,880NTD', '韓服個人寫真', '現金', p1, p2],
        ['2026/08/29 10:30', '明月閣高端韓服店', '男生韓服2H + 化妝造型', '110,000', '1', '110,000', '2,640NTD', '韓服個人造型', '現金', p1, p1],
        ['2026/08/29 12:30', '陳玉華一隻雞 東大門總店', '經典一隻雞 + 年糕與麵條套餐', '38,000', '1', '38,000', '912NTD', '午餐合菜', '信用卡', p2, '全體AA'],
        ['2026/08/30 14:00', 'Olive Young 明洞旗艦店', 'Torriden 低分子玻尿酸保濕精華 (代購)', '28,000', '2', '56,000', '1,344NTD', '秋女阿姨代購長輩禮物', '信用卡', p2, '秋女阿姨'],
        ['2026/08/30 19:00', 'Daiso 大創江南店', '旅行收納袋 + 轉接頭 (代購)', '15,000', '1', '15,000', '360NTD', '緹媽代購居家日用', '信用卡', p1, '緹媽'],
      ];
    } else if (isJpy) {
      return [
        ['2026/09/01 19:30', '唐吉訶德 澀谷本店', '合利他命 EX PLUS 270錠 (代購)', '5,480', '2', '10,960', '2,411NTD', '長輩藥妝代購', '信用卡', p1, '秋女阿姨'],
        ['2026/09/01 19:30', '唐吉訶德 澀谷本店', 'Royce 抹茶生巧克力', '800', '3', '2,400', '528NTD', '伴手禮', '信用卡', p1, p1],
        ['2026/09/02 12:00', 'HARBS 六本木店', '水果千層蛋糕 + 拿鐵咖啡', '3,500', '1', '3,500', '770NTD', '下午茶共同分攤', '現金', p2, '全體AA'],
        ['2026/09/02 18:00', '敘敘苑 晴空塔店', '特選燒肉套餐', '18,000', '1', '18,000', '3,960NTD', '晚餐合菜', '信用卡', p1, '全體AA'],
      ];
    } else {
      return [
        ['2026/09/01 12:30', '機場免稅店', '精品香水 (代購)', '3,500', '1', '3,500', '3,500NTD', '親友託買', '信用卡', p1, '緹媽'],
        ['2026/09/01 18:00', '特色景觀餐廳', '四人分享合菜晚餐', '2,400', '1', '2,400', '2,400NTD', '合菜平攤', '信用卡', p1, '全體AA'],
        ['2026/09/02 10:00', '城市地標觀景台', '快速通關門票', '600', '2', '1,200', '1,200NTD', '景點門票', '現金', p2, '全體AA'],
      ];
    }
  };

  // 下載標準 Excel 範本 (.xlsx 試算表，繁中韓日語系不亂碼、排版格式不跑掉)
  const handleDownloadExcelTemplate = () => {
    try {
      const sampleRows = getSampleData();
      const wsData = [
        exactHeaders,
        ...sampleRows
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // 設定 11 欄欄位寬度，讓 Excel 打開時整齊漂亮不被截斷
      ws['!cols'] = [
        { wch: 18 }, // 時間戳記
        { wch: 22 }, // 購物地點
        { wch: 32 }, // 品項（韓文 / 中文翻譯）
        { wch: 14 }, // 單價
        { wch: 8 },  // 數量
        { wch: 14 }, // 小計 (KRW)
        { wch: 14 }, // 小計 (NTD)
        { wch: 18 }, // 備註/折扣
        { wch: 14 }, // 支付方式
        { wch: 12 }, // 代墊人
        { wch: 16 }  // 分帳人
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '旅遊分帳記帳');

      const fileName = `旅遊分帳記帳範本_${activeTrip.title || '旅程'}_${currency}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast(`📥 已成功下載 Excel 檔案 (.xlsx)！用 Excel 開啟格式與語系皆 100% 完美不亂碼`, 'success');
    } catch (err) {
      console.error('Download XLSX error:', err);
      showToast('下載 Excel 檔案失敗，請改用複製範本方式', 'error');
    }
  };

  // 複製試算表範本 (TSV，可直接在 Excel/Google Sheets 貼上)
  const handleCopyTsvTemplate = () => {
    const sampleRows = getSampleData();
    const tsvContent = [
      exactHeaders.join('\t'),
      ...sampleRows.map(row => row.join('\t'))
    ].join('\n');

    navigator.clipboard.writeText(tsvContent);
    showToast('📋 已複製 11 欄位試算表範本！可直接在 Excel 或 Google 試算表按 Ctrl+V 貼上', 'success');
  };

  // 讀取上傳之 Excel (.xlsx/.xls) 或 CSV / 試算表檔案
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

        if (!rawJsonData || rawJsonData.length === 0) {
          showToast('Excel 檔案內沒有資料', 'error');
          return;
        }

        // 轉換為 TSV 貼到文字區，並自動啟動解析
        const tsvText = rawJsonData
          .map(row => row.map(cell => String(cell !== undefined && cell !== null ? cell : '')).join('\t'))
          .join('\n');

        setPasteText(tsvText);
        showToast(`📁 已成功載入 Excel 檔案「${file.name}」！`, 'success');
      } catch (err) {
        console.error('Read Excel error:', err);
        showToast('解析 Excel (.xlsx) 檔案失敗，請確認檔案格式', 'error');
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          setPasteText(text);
          showToast(`📁 已載入檔案「${file.name}」，已自動填入貼上區！`, 'info');
        }
      };
      reader.onerror = () => {
        showToast('讀取檔案失敗，請改用複製貼上方式', 'error');
      };
      reader.readAsText(file, 'utf-8');
    }
  };

  // 解析 Excel 複製內容 (Tab 分隔或逗號分隔)
  const handleParseText = () => {
    if (!pasteText.trim()) {
      showToast('請先貼上 Excel 內容或上傳檔案', 'error');
      return;
    }

    const lines = pasteText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      showToast('未偵測到有效文字內容', 'error');
      return;
    }

    const defaultYear = activeTrip.startDate ? activeTrip.startDate.split('-')[0] : String(new Date().getFullYear());
    const newRows: ParsedRow[] = [];
    const newMembersFound = new Set<string>();

    // 自動偵測分隔符號 (Tab 或逗號)
    const firstLine = lines[0];
    const isTabDelimited = firstLine.includes('\t');
    const delimiter = isTabDelimited ? '\t' : ',';

    // 檢查是否有標題列並嘗試建立欄位索引對應
    let startIndex = 0;
    const headerCols = parseCsvLine(firstLine, delimiter);
    let colMap: Record<string, number> = {
      date: -1,
      location: -1,
      item: -1,
      unitPrice: -1,
      quantity: -1,
      subtotal: -1,
      subtotalNTD: -1,
      note: -1,
      paymentMethod: -1,
      payer: -1,
      splitTarget: -1
    };

    let hasHeader = false;
    headerCols.forEach((col, idx) => {
      const c = col.toLowerCase();
      if (c.includes('時間') || c.includes('日期') || c.includes('timestamp') || c.includes('date')) { colMap.date = idx; hasHeader = true; }
      else if (c.includes('地點') || c.includes('商店') || c.includes('location') || c.includes('shop')) { colMap.location = idx; hasHeader = true; }
      else if (c.includes('品項') || c.includes('名稱') || c.includes('商品') || c.includes('item') || c.includes('name')) { colMap.item = idx; hasHeader = true; }
      else if (c.includes('單價') || c.includes('price')) { colMap.unitPrice = idx; hasHeader = true; }
      else if (c.includes('數量') || c.includes('數量') || c.includes('qty') || c.includes('count')) { colMap.quantity = idx; hasHeader = true; }
      else if ((c.includes('小計') || c.includes('金額') || c.includes('總額')) && (c.includes('ntd') || c.includes('nt') || c.includes('台幣') || c.includes('twd'))) { colMap.subtotalNTD = idx; hasHeader = true; }
      else if (c.includes('小計') || c.includes('金額') || c.includes('krw') || c.includes('jpy') || c.includes('原幣') || c.includes('subtotal') || c.includes('total')) { colMap.subtotal = idx; hasHeader = true; }
      else if (c.includes('備註') || c.includes('折扣') || c.includes('note') || c.includes('memo')) { colMap.note = idx; hasHeader = true; }
      else if (c.includes('支付') || c.includes('付款') || c.includes('payment') || c.includes('method')) { colMap.paymentMethod = idx; hasHeader = true; }
      else if (c.includes('代墊') || c.includes('出資') || c.includes('誰付') || c.includes('payer')) { colMap.payer = idx; hasHeader = true; }
      else if (c.includes('分帳') || c.includes('對象') || c.includes('誰要還') || c.includes('自付') || c.includes('split')) { colMap.splitTarget = idx; hasHeader = true; }
    });

    if (hasHeader) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const cleanParts = parseCsvLine(line, delimiter);
      if (cleanParts.length === 0 || cleanParts.every(p => !p.trim())) continue;

      let dateVal = '';
      let locationVal = '';
      let itemNameVal = '';
      let unitPriceVal = 0;
      let quantityVal = 1;
      let subtotalVal = 0;
      let subtotalNTDVal: number | undefined = undefined;
      let noteVal = '';
      let paymentMethodVal = '信用卡';
      let payerVal = defaultPayer;
      let splitVal = '全體AA';

      if (hasHeader) {
        // 使用偵測到的標頭欄位索引
        if (colMap.date >= 0 && cleanParts[colMap.date]) dateVal = cleanParts[colMap.date];
        if (colMap.location >= 0 && cleanParts[colMap.location]) locationVal = cleanParts[colMap.location];
        if (colMap.item >= 0 && cleanParts[colMap.item]) itemNameVal = cleanParts[colMap.item];
        if (colMap.unitPrice >= 0 && cleanParts[colMap.unitPrice]) unitPriceVal = cleanNum(cleanParts[colMap.unitPrice]);
        if (colMap.quantity >= 0 && cleanParts[colMap.quantity]) quantityVal = cleanNum(cleanParts[colMap.quantity]) || 1;
        if (colMap.subtotal >= 0 && cleanParts[colMap.subtotal]) subtotalVal = cleanNum(cleanParts[colMap.subtotal]);
        if (colMap.subtotalNTD >= 0 && cleanParts[colMap.subtotalNTD]) {
          const parsedNTD = cleanNum(cleanParts[colMap.subtotalNTD]);
          if (parsedNTD > 0) subtotalNTDVal = parsedNTD;
        }
        if (colMap.note >= 0 && cleanParts[colMap.note]) noteVal = cleanParts[colMap.note];
        if (colMap.paymentMethod >= 0 && cleanParts[colMap.paymentMethod]) paymentMethodVal = cleanParts[colMap.paymentMethod];
        if (colMap.payer >= 0 && cleanParts[colMap.payer]) payerVal = cleanParts[colMap.payer];
        if (colMap.splitTarget >= 0 && cleanParts[colMap.splitTarget]) splitVal = cleanParts[colMap.splitTarget];
      } else {
        // 沒有標頭時的固定欄位位置推測
        if (cleanParts.length >= 11) {
          // 完整 11 欄格式：時間戳記, 購物地點, 品項, 單價, 數量, 小計(KRW), 小計(NTD), 備註/折扣, 支付方式, 代墊人, 分帳人
          dateVal = cleanParts[0];
          locationVal = cleanParts[1];
          itemNameVal = cleanParts[2];
          unitPriceVal = cleanNum(cleanParts[3]);
          quantityVal = cleanNum(cleanParts[4]) || 1;
          subtotalVal = cleanNum(cleanParts[5]);
          const ntd = cleanNum(cleanParts[6]);
          if (ntd > 0) subtotalNTDVal = ntd;
          noteVal = cleanParts[7] || '';
          paymentMethodVal = cleanParts[8] || '信用卡';
          payerVal = cleanParts[9] || defaultPayer;
          splitVal = cleanParts[10] || '全體AA';
        } else if (cleanParts.length === 10) {
          dateVal = cleanParts[0];
          locationVal = cleanParts[1];
          itemNameVal = cleanParts[2];
          unitPriceVal = cleanNum(cleanParts[3]);
          quantityVal = cleanNum(cleanParts[4]) || 1;
          subtotalVal = cleanNum(cleanParts[5]);
          noteVal = cleanParts[6] || '';
          paymentMethodVal = cleanParts[7] || '信用卡';
          payerVal = cleanParts[8] || defaultPayer;
          splitVal = cleanParts[9] || '全體AA';
        } else if (cleanParts.length >= 6) {
          dateVal = cleanParts[0];
          locationVal = cleanParts[1];
          itemNameVal = cleanParts[2];
          unitPriceVal = cleanNum(cleanParts[3]);
          quantityVal = cleanNum(cleanParts[4]) || 1;
          subtotalVal = cleanNum(cleanParts[5]);
          if (cleanParts[6]) noteVal = cleanParts[6];
          if (cleanParts[7]) payerVal = cleanParts[7];
          if (cleanParts[8]) splitVal = cleanParts[8];
        } else if (cleanParts.length >= 3) {
          itemNameVal = cleanParts[0];
          subtotalVal = cleanNum(cleanParts[1]);
          unitPriceVal = subtotalVal;
          if (cleanParts[2]) splitVal = cleanParts[2];
          if (cleanParts[3]) payerVal = cleanParts[3];
          if (cleanParts[4]) locationVal = cleanParts[4];
        } else {
          itemNameVal = cleanParts[0] || '';
          if (cleanParts[1]) {
            subtotalVal = cleanNum(cleanParts[1]);
            unitPriceVal = subtotalVal;
          }
        }
      }

      if (!itemNameVal && !locationVal && subtotalVal === 0) continue;
      if (!itemNameVal) itemNameVal = locationVal ? `${locationVal} 消費` : '旅費支出';

      // 若小計為 0 但有單價與數量，自動計算
      if (subtotalVal === 0 && unitPriceVal > 0) {
        subtotalVal = unitPriceVal * quantityVal;
      }
      if (unitPriceVal === 0 && subtotalVal > 0 && quantityVal > 0) {
        unitPriceVal = subtotalVal / quantityVal;
      }

      // 日期與時間戳記正規化
      const normalizedDate = normalizeDateStr(dateVal, defaultYear);

      // 自動推測類別
      let detectedCategory: TravelExpenseItem['category'] = '購物伴手禮';
      for (const [kw, cat] of Object.entries(CATEGORY_KEYWORDS)) {
        if (itemNameVal.includes(kw) || locationVal.includes(kw) || noteVal.includes(kw)) {
          detectedCategory = cat;
          break;
        }
      }

      // 代墊人正規化 (例如 廖尹丞 -> 廖 / 廖尹丞)
      let matchedPayer = defaultPayer;
      if (payerVal) {
        const cleanPayer = payerVal.trim();
        const found = tripMembers.find(m => m === cleanPayer || cleanPayer.includes(m) || m.includes(cleanPayer));
        if (found) {
          matchedPayer = found;
        } else {
          matchedPayer = cleanPayer;
          if (cleanPayer !== '共同基金' && cleanPayer !== '公費' && !tripMembers.includes(cleanPayer)) {
            newMembersFound.add(cleanPayer);
          }
        }
      }

      // 分帳模式與對象解析 (誰要還給代墊人)
      let splitMode: TravelExpenseItem['splitMode'] = '全體AA';
      let splitTarget = '';
      let participants: string[] = [...tripMembers];

      const cleanSplit = (splitVal || '').trim();
      if (!cleanSplit || cleanSplit === '全體AA' || cleanSplit === '公積金' || cleanSplit === '全體均分' || cleanSplit === '全體' || cleanSplit === 'AA' || cleanSplit === '平分' || cleanSplit === '全部') {
        splitMode = '全體AA';
        participants = [...tripMembers];
      } else if (cleanSplit === '部分均分' || cleanSplit.includes(',') || cleanSplit.includes('+') || cleanSplit.includes('、')) {
        const rawParts = cleanSplit.split(/[,+、\s]+/).filter(Boolean);
        const mappedParts = rawParts.map(p => {
          const m = tripMembers.find(member => member === p || p.includes(member) || member.includes(p)) || p;
          if (!tripMembers.includes(m)) newMembersFound.add(m);
          return m;
        });

        if (mappedParts.length === 1) {
          splitMode = '個人自付';
          splitTarget = mappedParts[0];
          participants = mappedParts;
        } else if (mappedParts.length >= tripMembers.length && tripMembers.every(m => mappedParts.includes(m))) {
          splitMode = '全體AA';
          participants = [...tripMembers];
        } else {
          splitMode = '參與者AA';
          participants = mappedParts;
        }
      } else {
        // 特定人名 (100% 個人自付 / 全額代墊)
        const targetMember = tripMembers.find(m => m === cleanSplit || cleanSplit.includes(m) || m.includes(cleanSplit)) || cleanSplit;
        splitMode = '個人自付';
        splitTarget = targetMember;
        participants = [targetMember];
        if (!tripMembers.includes(targetMember)) {
          newMembersFound.add(targetMember);
        }
      }

      newRows.push({
        id: `parsed-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        selected: true,
        date: normalizedDate,
        location: locationVal,
        itemName: itemNameVal,
        category: detectedCategory,
        unitPrice: unitPriceVal,
        quantity: quantityVal,
        discount: 0,
        totalAmount: subtotalVal,
        totalAmountTWD: subtotalNTDVal,
        payer: matchedPayer,
        splitMode,
        splitTarget,
        participants,
        note: noteVal,
        paymentMethod: paymentMethodVal,
        creatorEmail: currentUser?.email || '',
        createdBy: currentUser?.name || currentUser?.nickname || currentUser?.role || '訪客'
      });
    }

    if (newRows.length === 0) {
      showToast('未能成功解析有效資料，請確認格式', 'error');
      return;
    }

    setParsedRows(newRows);
    setDiscoveredNewMembers(Array.from(newMembersFound));
    setStep('preview');
    showToast(`✨ 成功解析 ${newRows.length} 筆明細！請確認各欄位對齊後點擊「確認匯入」`, 'success');
  };

  // 匯入至旅程
  const handleConfirmImport = () => {
    if (isImporting) return;
    const rate = parseFloat(exchangeRate) || 1;
    const selectedRows = parsedRows.filter(r => r.selected);
    if (selectedRows.length === 0) {
      showToast('請至少勾選一筆要匯入的明細', 'error');
      return;
    }

    setIsImporting(true);

    setTimeout(() => {
      try {
        // 若有發現新成員，自動合併至旅程成員
        if (discoveredNewMembers.length > 0) {
          onAddTripMembers(discoveredNewMembers);
        }

        const currentTripAllMembers = Array.from(new Set([...tripMembers, ...discoveredNewMembers]));

        const importedExpenses: TravelExpenseItem[] = selectedRows.map((row, idx) => {
          const origAmt = row.totalAmount;
          // 若有明確填寫台幣小計 (NTD)，優先採用精準台幣金額；否則以匯率換算
          const totalTWD = row.totalAmountTWD && row.totalAmountTWD > 0 
            ? row.totalAmountTWD 
            : Math.round(origAmt * rate);

          // 計算各成員應分擔金額
          const memberSplits: Record<string, number> = {};
          currentTripAllMembers.forEach(m => { memberSplits[m] = 0; });

          let debtor = 'none';
          let debtorAmtTWD = 0;

          if (row.splitMode === '個人自付' && row.splitTarget) {
            // 個人專屬 100% 由該成員負擔
            memberSplits[row.splitTarget] = totalTWD;
            if (row.payer !== row.splitTarget) {
              debtor = row.splitTarget;
              debtorAmtTWD = totalTWD;
            }
          } else if (row.splitMode === '全體AA' || row.splitMode === 'AA平分') {
            const share = Math.round(totalTWD / (currentTripAllMembers.length || 1));
            currentTripAllMembers.forEach(m => { memberSplits[m] = share; });
            if (row.payer !== '共同基金' && row.payer !== '公費') {
              const nonPayers = currentTripAllMembers.filter(m => m !== row.payer);
              if (nonPayers.length === 1) {
                debtor = nonPayers[0];
                debtorAmtTWD = memberSplits[debtor] || 0;
              } else {
                debtor = '多位成員';
                debtorAmtTWD = totalTWD - (memberSplits[row.payer] || share);
              }
            }
          } else if (row.splitMode === '參與者AA') {
            const parts = row.participants.length > 0 ? row.participants : currentTripAllMembers;
            if (parts.length === 1) {
              const singleTarget = parts[0];
              memberSplits[singleTarget] = totalTWD;
              if (row.payer !== '共同基金' && row.payer !== '公費' && row.payer !== singleTarget) {
                debtor = singleTarget;
                debtorAmtTWD = totalTWD;
              }
            } else {
              const share = Math.round(totalTWD / (parts.length || 1));
              parts.forEach(p => { memberSplits[p] = share; });
              if (row.payer !== '共同基金' && row.payer !== '公費') {
                debtor = '部分成員';
                debtorAmtTWD = totalTWD - (memberSplits[row.payer] || 0);
              }
            }
          }

          return {
            id: `exp-import-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
            tripId: activeTrip.id,
            date: row.date || new Date().toISOString().split('T')[0],
            category: row.category,
            itemName: row.itemName,
            payer: row.payer,
            originalCurrency: currency,
            originalAmount: origAmt,
            exchangeRate: rate,
            totalAmountTWD: totalTWD,
            splitMode: row.splitMode,
            splitTarget: row.splitTarget,
            unitPrice: row.unitPrice,
            quantity: row.quantity,
            paymentMethod: row.paymentMethod,
            participants: row.participants,
            memberSplits,
            debtor,
            debtorAmountTWD: debtorAmtTWD,
            location: row.location,
            note: row.note,
            creatorEmail: row.creatorEmail || currentUser?.email || '',
            createdBy: row.createdBy || currentUser?.nickname || currentUser?.name || currentUser?.role || '訪客',
            syncedToSplit: false,
            createdAt: new Date().toISOString().split('T')[0]
          };
        });

        onImportExpenses(importedExpenses);
        onClose();
        showToast(`🎉 成功匯入 ${importedExpenses.length} 筆旅費明細！已為您自動重算「誰該還誰」結算總表並同步 Google Sheets`, 'success');
      } finally {
        setIsImporting(false);
      }
    }, 150);
  };

  // 範例 Excel 格式快速帶入
  const handleLoadSample = () => {
    const sampleRows = getSampleData();
    const tsvContent = [
      exactHeaders.join('\t'),
      ...sampleRows.map(row => row.join('\t'))
    ].join('\n');
    setPasteText(tsvContent);
    showToast('已帶入 11 欄標準範例資料，點擊下方「開始智慧解析」查看效果！', 'info');
  };

  const selectedCount = parsedRows.filter(r => r.selected).length;
  const totalOriginalAmount = parsedRows.filter(r => r.selected).reduce((sum, r) => sum + r.totalAmount, 0);
  const totalTWDAmount = parsedRows.filter(r => r.selected).reduce((sum, r) => {
    if (r.totalAmountTWD && r.totalAmountTWD > 0) return sum + r.totalAmountTWD;
    return sum + Math.round(r.totalAmount * (parseFloat(exchangeRate) || 1));
  }, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl border border-[#E8E4D9] max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-[#F0ECE1] bg-gradient-to-r from-emerald-50/50 via-white to-amber-50/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-[#3E3A36]">
                Excel 試算表 11 欄批次匯入
              </h3>
              <p className="text-[11px] text-[#8C8475]">
                支援直接複製 Excel / Google Sheets 整張表格貼上，支援韓幣與台幣雙欄位及自訂分帳人
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#A09A8F] hover:text-[#3E3A36] hover:bg-[#F5F2EB] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-6 overflow-hidden text-xs">
          {step === 'input' ? (
            <div className="flex-1 flex flex-col gap-3.5 min-h-0 overflow-y-auto pr-1">
              {/* 頂部功能列：下載 Excel 範本 & 複製範本按鈕 */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-extrabold text-emerald-900 text-xs flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-700" />
                    <span>提供 Excel 記帳標準 11 欄模板下載</span>
                  </div>
                  <div className="text-[11px] text-emerald-800">
                    標準欄位：時間戳記、購物地點、品項（韓文/中文）、單價({currency})、數量、小計({currency})、小計(NTD)、備註/折扣、支付方式、代墊人、分帳人
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={handleDownloadExcelTemplate}
                    className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    title="下載原生 Excel 試算表活頁簿 (.xlsx)，開啟不跑版、語系 100% 正確"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>📥 下載 Excel 範本 (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyTsvTemplate}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                    title="複製可直接貼上 Google 試算表或 Excel 的格式"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>複製試算表範本</span>
                  </button>
                </div>
              </div>

              {/* 設定全域幣別、匯率與預設代墊人 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E8E4D9]">
                <div className="space-y-1">
                  <label className="font-bold text-[#5C564E] flex items-center gap-1">
                    <span>消費外幣 ({currency})</span>
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => {
                      const cur = e.target.value;
                      setCurrency(cur);
                      if (cur === 'KRW') setExchangeRate('0.024');
                      else if (cur === 'JPY') setExchangeRate('0.22');
                      else if (cur === 'USD') setExchangeRate('32.0');
                      else if (cur === 'EUR') setExchangeRate('35.0');
                      else if (cur === 'TWD') setExchangeRate('1');
                    }}
                    className="w-full p-2 bg-white border border-[#DDD8CC] rounded-xl font-bold text-xs cursor-pointer"
                  >
                    <option value="KRW">韓元 (KRW ₩)</option>
                    <option value="JPY">日圓 (JPY ¥)</option>
                    <option value="TWD">新台幣 (TWD NT$)</option>
                    <option value="USD">美金 (USD $)</option>
                    <option value="EUR">歐元 (EUR €)</option>
                    <option value="THB">泰銖 (THB ฿)</option>
                    <option value="VND">越南盾 (VND ₫)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#5C564E]">折算台幣匯率 (1外幣 = ? TWD)</label>
                  <input
                    type="number"
                    step="any"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    placeholder="0.024"
                    className="w-full p-2 bg-white border border-[#DDD8CC] rounded-xl font-bold font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#5C564E]">預設出資代墊人</label>
                  <select
                    value={defaultPayer}
                    onChange={(e) => setDefaultPayer(e.target.value)}
                    className="w-full p-2 bg-white border border-[#DDD8CC] rounded-xl font-bold text-xs cursor-pointer"
                  >
                    {tripMembers.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    <option value="共同基金">共同公費/基金</option>
                  </select>
                </div>
              </div>

              {/* 貼上與拖曳上傳區域 */}
              <div className="flex-1 flex flex-col min-h-[220px] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#3E3A36] flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>貼上 Excel 內容 或 拖曳 Excel (.xlsx/.xls) 檔案至此：</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".xlsx,.xls,.csv,.tsv,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                    >
                      <Upload className="w-3 h-3" />
                      <span>上傳 Excel 檔案 (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadSample}
                      className="text-[11px] text-rose-700 hover:text-rose-800 font-bold underline cursor-pointer ml-1"
                    >
                      帶入範例示範
                    </button>
                  </div>
                </div>

                <div 
                  className={`flex-1 relative flex flex-col rounded-2xl border-2 transition-all ${
                    isDragging 
                      ? 'border-dashed border-emerald-500 bg-emerald-50/50' 
                      : 'border-solid border-[#DDD8CD] bg-[#FAF9F6]'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                >
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={`直接從 Excel 選取整列（含 11 欄）並按 Ctrl+C，然後貼到這裡：\n\n【範例欄位】：\n時間戳記\t購物地點\t品項（韓文 / 中文翻譯）\t單價(${currency})\t數量\t小計(${currency})\t小計 (NTD)\t備註/折扣\t款項支付方式\t代墊人(先行付款)\t需收款人 / 分帳人(償還代墊款者)\n2026/08/28 16:50\tLotte Mart 首爾站店\t杏仁巧克力棒\t5,360\t1\t5,360\t129NTD\t零食採買\t信用卡\t廖尹丞\t全體AA\n2026/08/29 15:31\t廣藏市場88號棉被店\t四季被 (薄款床墊套)\t55,000\t2\t110,000\t2,640NTD\t沛緹家自用\t信用卡\t廖尹丞\t周沛緹\n2026/08/30 14:00\tOlive Young\tTorriden 保濕精華\t28,000\t2\t56,000\t1,344NTD\t長輩禮物代購\t信用卡\t周沛緹\t秋女阿姨\n2026/08/30 19:00\tDaiso 江南店\t旅行收納袋\t15,000\t1\t15,000\t360NTD\t居家日用代購\t信用卡\t廖尹丞\t緹媽`}
                    className="flex-1 w-full p-3.5 bg-transparent font-mono text-xs text-[#3E3A36] focus:outline-none focus:bg-white rounded-2xl resize-none leading-relaxed"
                  />
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-[#EAE5DA] text-[11px] text-[#7A7366] space-y-1">
                  <div className="font-bold text-[#5C564E] flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>代購與分帳規則說明：</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-[#8C8475]">
                    <li><b>代墊人先行付款：</b>出遊者（例如廖尹丞、周沛緹）先行支付全額款項。</li>
                    <li><b>需收款人（代購親友自行 Key in）：</b>在「需收款人/分帳人」欄位可自由輸入任何親友名字（例如：<b>秋女阿姨</b>、<b>緹媽</b>、<b>丞媽</b>、<b>培培</b>），系統自動計算該親友需 100% 償還代墊款給代墊人！</li>
                    <li><b>雙幣別精準對齊：</b>若表格中有「小計 (NTD)」欄位（例如 3,294NTD、95），系統將直接採用該數值，避免四捨五入誤差！</li>
                    <li><b>全體均分：</b>分帳人填寫「全體AA」或「公積金」，自動由同行成員平分。</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            /* Preview Step */
            <div className="flex-1 flex flex-col min-h-0 gap-3">
              {/* 新成員提示 */}
              {discoveredNewMembers.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <span className="font-bold text-amber-900">偵測到表格中包含新成員：</span>
                      <span className="font-black text-rose-800 ml-1">
                        {discoveredNewMembers.join('、')}
                      </span>
                      <span className="text-amber-700 ml-1">（匯入時將自動加入本趟旅程同行名單並同步更新 Google Sheets）</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 統計摘要列 */}
              <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E4D9] shrink-0 text-xs">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 font-bold text-[#3E3A36] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={parsedRows.length > 0 && parsedRows.every(r => r.selected)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setParsedRows(parsedRows.map(r => ({ ...r, selected: checked })));
                      }}
                      className="rounded text-emerald-600 focus:ring-0"
                    />
                    <span>全選 ({selectedCount}/{parsedRows.length})</span>
                  </label>
                  <span className="text-[#DDD8CC]">|</span>
                  <span className="text-[#5C564E]">
                    原幣小計：<b className="text-[#3E3A36] font-mono">{currency} {totalOriginalAmount.toLocaleString()}</b>
                  </span>
                </div>
                <div className="font-black text-rose-700 text-sm font-mono">
                  折合總台幣：NT$ {totalTWDAmount.toLocaleString()}
                </div>
              </div>

              {/* 明細預覽列表 Table (精準對齊 11 欄) */}
              <div className="flex-1 min-h-0 overflow-y-auto border border-[#E8E4D9] rounded-2xl">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-[#F5F2EB] text-[#5C564E] font-bold sticky top-0 z-10 border-b border-[#E2DDD2]">
                    <tr>
                      <th className="p-2.5 w-8 text-center">選取</th>
                      <th className="p-2.5 min-w-[95px]">時間戳記</th>
                      <th className="p-2.5 min-w-[100px]">購物地點</th>
                      <th className="p-2.5 min-w-[140px]">品項</th>
                      <th className="p-2.5 min-w-[70px] text-right">單價({currency})</th>
                      <th className="p-2.5 min-w-[45px] text-center">數量</th>
                      <th className="p-2.5 min-w-[85px] text-right">小計({currency})</th>
                      <th className="p-2.5 min-w-[85px] text-right">小計(NTD)</th>
                      <th className="p-2.5 min-w-[80px]">代墊人</th>
                      <th className="p-2.5 min-w-[150px]">需收款人 / 分帳對象</th>
                      <th className="p-2.5 min-w-[75px]">支付方式</th>
                      <th className="p-2.5 min-w-[80px]">備註/折扣</th>
                      <th className="p-2.5 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2EEE6]">
                    {parsedRows.map((row) => {
                      const twd = row.totalAmountTWD && row.totalAmountTWD > 0 
                        ? row.totalAmountTWD 
                        : Math.round(row.totalAmount * (parseFloat(exchangeRate) || 1));
                      const isPersonal = row.splitMode === '個人自付';
                      return (
                        <tr
                          key={row.id}
                          className={`hover:bg-amber-50/40 transition-colors ${
                            !row.selected ? 'opacity-40 bg-stone-50' : 'bg-white'
                          }`}
                        >
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setParsedRows(parsedRows.map(r => r.id === row.id ? { ...r, selected: checked } : r));
                              }}
                              className="rounded text-emerald-600 focus:ring-0"
                            />
                          </td>
                          <td className="p-2 text-[#7A7366]">
                            <input
                              type="text"
                              value={row.date}
                              onChange={(e) => {
                                const val = e.target.value;
                                setParsedRows(parsedRows.map(r => r.id === row.id ? { ...r, date: val } : r));
                              }}
                              className="w-full bg-transparent border-b border-transparent hover:border-[#DDD8CC] focus:border-emerald-600 focus:bg-white px-1 py-0.5 font-mono text-[10px]"
                            />
                          </td>
                          <td className="p-2 text-[#7A7366]">
                            <input
                              type="text"
                              value={row.location}
                              onChange={(e) => {
                                const val = e.target.value;
                                setParsedRows(parsedRows.map(r => r.id === row.id ? { ...r, location: val } : r));
                              }}
                              className="w-full bg-transparent border-b border-transparent hover:border-[#DDD8CC] focus:border-emerald-600 focus:bg-white px-1 py-0.5"
                            />
                          </td>
                          <td className="p-2 font-bold text-[#3E3A36]">
                            <input
                              type="text"
                              value={row.itemName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setParsedRows(parsedRows.map(r => r.id === row.id ? { ...r, itemName: val } : r));
                              }}
                              className="w-full bg-transparent border-b border-transparent hover:border-[#DDD8CC] focus:border-emerald-600 focus:bg-white px-1 py-0.5 font-bold text-[#3E3A36]"
                            />
                          </td>
                          <td className="p-2 text-right font-mono text-[#7A7366]">
                            <input
                              type="number"
                              value={row.unitPrice}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setParsedRows(parsedRows.map(r => {
                                  if (r.id !== row.id) return r;
                                  const total = val * r.quantity - r.discount;
                                  return { ...r, unitPrice: val, totalAmount: total > 0 ? total : 0 };
                                }));
                              }}
                              className="w-16 text-right bg-transparent border-b border-transparent hover:border-[#DDD8CC] focus:border-emerald-600 focus:bg-white font-mono text-[10px]"
                            />
                          </td>
                          <td className="p-2 text-center font-mono text-[#7A7366]">
                            <input
                              type="number"
                              step="any"
                              value={row.quantity}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 1;
                                setParsedRows(parsedRows.map(r => {
                                  if (r.id !== row.id) return r;
                                  const total = r.unitPrice * val - r.discount;
                                  return { ...r, quantity: val, totalAmount: total > 0 ? total : 0 };
                                }));
                              }}
                              className="w-10 text-center bg-transparent border-b border-transparent hover:border-[#DDD8CC] focus:border-emerald-600 focus:bg-white font-mono text-[10px]"
                            />
                          </td>
                          <td className="p-2 text-right font-black font-mono text-[#3E3A36]">
                            <input
                              type="number"
                              value={row.totalAmount}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setParsedRows(parsedRows.map(r => r.id === row.id ? { ...r, totalAmount: val } : r));
                              }}
                              className="w-20 text-right bg-transparent border-b border-transparent hover:border-[#DDD8CC] focus:border-emerald-600 focus:bg-white font-mono font-black text-xs"
                            />
                          </td>
                          <td className="p-2 text-right font-black font-mono text-rose-700">
                            <input
                              type="number"
                              value={twd}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setParsedRows(parsedRows.map(r => r.id === row.id ? { ...r, totalAmountTWD: val } : r));
                              }}
                              className="w-20 text-right bg-transparent border-b border-transparent hover:border-[#DDD8CC] focus:border-emerald-600 focus:bg-white font-mono font-black text-xs text-rose-700"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={row.payer}
                              onChange={(e) => {
                                const val = e.target.value;
                                setParsedRows(parsedRows.map(r => r.id === row.id ? { ...r, payer: val } : r));
                              }}
                              className="p-1 rounded bg-[#FAF8F5] border border-[#DDD8CC] text-[10px] font-bold"
                            >
                              {Array.from(new Set([...tripMembers, ...discoveredNewMembers])).map((m, idx) => (
                                <option key={`payer-m-${m}-${idx}`} value={m}>{m} 付</option>
                              ))}
                              <option value="共同基金">公費</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <select
                                value={row.splitMode === '個人自付' ? (row.splitTarget || '個人自付') : row.splitMode}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '全體AA') {
                                    setParsedRows(parsedRows.map(r => r.id === row.id ? { ...r, splitMode: '全體AA', splitTarget: '' } : r));
                                  } else if (val === '參與者AA') {
                                    setParsedRows(parsedRows.map(r => r.id === row.id ? { ...r, splitMode: '參與者AA', splitTarget: '' } : r));
                                  } else {
                                    // 指定人名
                                    setParsedRows(parsedRows.map(r => r.id === row.id ? { ...r, splitMode: '個人自付', splitTarget: val } : r));
                                  }
                                }}
                                className={`p-1 rounded border text-[10px] font-bold ${
                                  isPersonal 
                                    ? 'bg-purple-50 text-purple-800 border-purple-300' 
                                    : 'bg-[#FAF8F5] border-[#DDD8CC]'
                                }`}
                              >
                                <option value="全體AA">全體AA (均攤)</option>
                                <optgroup label="指定需收款人 / 代購親友">
                                  {Array.from(new Set([...tripMembers, ...discoveredNewMembers])).map((m, idx) => (
                                    <option key={`target-m-${m}-${idx}`} value={m}>{m} (需還款)</option>
                                  ))}
                                </optgroup>
                                <option value="個人自付">自訂需收款人...</option>
                              </select>

                              {row.splitMode === '個人自付' && (
                                <input
                                  type="text"
                                  placeholder="Key in 需收款人"
                                  value={row.splitTarget}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setParsedRows(parsedRows.map(r => r.id === row.id ? { ...r, splitTarget: val } : r));
                                    if (val && !tripMembers.includes(val) && !discoveredNewMembers.includes(val)) {
                                      setDiscoveredNewMembers(prev => Array.from(new Set([...prev, val])));
                                    }
                                  }}
                                  className="w-24 p-1 rounded bg-purple-100 border border-purple-300 text-[10px] font-black text-purple-900 placeholder:text-purple-400"
                                  title="輸入需償還款項給代墊人的親友姓名"
                                />
                              )}
                            </div>
                          </td>
                          <td className="p-2">
                            <select
                              value={row.paymentMethod}
                              onChange={(e) => {
                                const val = e.target.value;
                                setParsedRows(parsedRows.map(r => r.id === row.id ? { ...r, paymentMethod: val } : r));
                              }}
                              className="p-1 rounded bg-[#FAF8F5] border border-[#DDD8CC] text-[10px]"
                            >
                              <option value="信用卡">信用卡</option>
                              <option value="現金">現金</option>
                              <option value="WOWPASS">WOWPASS</option>
                              <option value="交通卡">交通卡</option>
                              <option value="行動支付">行動支付</option>
                            </select>
                          </td>
                          <td className="p-2 text-[#8C8475]">
                            <input
                              type="text"
                              value={row.note}
                              onChange={(e) => {
                                const val = e.target.value;
                                setParsedRows(parsedRows.map(r => r.id === row.id ? { ...r, note: val } : r));
                              }}
                              placeholder="備註"
                              className="w-full bg-transparent border-b border-transparent hover:border-[#DDD8CC] focus:border-emerald-600 focus:bg-white text-[10px]"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setParsedRows(parsedRows.filter(r => r.id !== row.id));
                              }}
                              className="text-[#A09A8F] hover:text-rose-600 cursor-pointer"
                              title="移除此列"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-[#F0ECE1] bg-white shrink-0 flex items-center justify-between gap-3">
          {step === 'input' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#DDD8CC] text-[#7A7366] font-bold hover:bg-[#FAF8F5] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleParseText}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>開始智慧解析與預覽</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('input')}
                className="px-4 py-2.5 rounded-xl border border-[#DDD8CC] text-[#7A7366] font-bold hover:bg-[#FAF8F5] cursor-pointer"
              >
                返回重新編輯
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={handleConfirmImport}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold shadow-md cursor-pointer flex items-center gap-2 active:scale-95 transition-all"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>正在批次匯入並同步至 Google 試算表...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>確認匯入 {selectedCount} 筆旅費明細</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

