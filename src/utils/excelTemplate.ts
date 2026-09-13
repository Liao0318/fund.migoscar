import * as XLSX from 'xlsx';

/**
 * 伴伴記 8 大工作表欄位定義與樣式設定
 */
export interface SheetDef {
  name: string;
  headers: string[];
  sampleData?: any[][];
  description?: string;
  colWidths?: number[];
}

export const BANBAN_SHEETS_SPEC: SheetDef[] = [
  {
    name: '流水帳資料庫',
    headers: ['ID', '月份', '日期', '項目', '出錢人', '出錢金額', '類型', '時間戳記'],
    sampleData: [],
    description: '公積金日常消費與注資紀錄',
    colWidths: [18, 12, 14, 26, 12, 14, 12, 22]
  },
  {
    name: '月度核銷狀態',
    headers: ['月份', '已撥款核銷'],
    sampleData: [],
    description: '公積金各月份結算與核銷狀態 (true/false)',
    colWidths: [14, 16]
  },
  {
    name: '代墊明細',
    headers: ['ID', '時間', '代墊人', '分帳模式', '項目描述', '總金額', '分帳結果', '狀態', '結清時間', '備註'],
    sampleData: [],
    description: '情侶私人物品代墊、平分 AA 與轉帳結算',
    colWidths: [18, 16, 12, 14, 26, 14, 24, 12, 18, 20]
  },
  {
    name: '購物清單',
    headers: ['ID', '分類', '品項名稱', '購買地點', '預計購買日期', '狀態', '建立者', '建立時間', '備註細項'],
    sampleData: [],
    description: '情侶生活採購記事與待買清單',
    colWidths: [18, 14, 26, 16, 14, 12, 12, 20, 24]
  },
  {
    name: '常用商店',
    headers: ['商店名稱', '備註'],
    sampleData: [
      ['全聯福利中心', '生活日用品與食材'],
      ['家樂福', '量販大採購'],
      ['好市多 Costco', '大包裝與牛肉熟食'],
      ['無印良品 MUJI', '文具收納與零食'],
      ['屈臣氏 / 康是美', '藥妝與清潔'],
      ['7-ELEVEN / 全家', '超商臨時採買']
    ],
    description: '快速選單常用商店與通路',
    colWidths: [22, 28]
  },
  {
    name: '旅遊行程',
    headers: ['ID', '行程名稱', '目的地', '代表圖示', '開始日期', '結束日期', '幣別', '匯率', '預算台幣', '狀態', '主題顏色', '成員清單', '建立時間', '登錄者ID (Gmail)', '登錄者姓名'],
    sampleData: [],
    description: '海內外旅遊專案與匯率預算設定',
    colWidths: [18, 24, 16, 12, 14, 14, 10, 10, 16, 12, 14, 20, 20, 26, 16]
  },
  {
    name: '旅遊支出明細',
    headers: ['ID', '行程ID', '日期', '分類', '品項名稱', '付款人', '幣別', '原幣金額', '匯率', '台幣總額', '分攤模式', '分攤成員', '成員分攤細項', '代墊欠款對象', '代墊金額', '地點', '備註', '已轉日常代墊', '建立時間', '登錄者ID (Gmail)', '登錄者姓名'],
    sampleData: [],
    description: '旅遊多幣別消費、即時換算與成員分攤明細',
    colWidths: [18, 18, 14, 14, 26, 12, 10, 14, 10, 16, 14, 18, 24, 14, 14, 18, 22, 14, 20, 26, 16]
  },
  {
    name: '旅遊心願清單',
    headers: ['ID', '行程ID', '心願項目', '分類', '預估金額台幣', '提議人', '狀態', '備註', '登錄者ID (Gmail)', '登錄者姓名'],
    sampleData: [],
    description: '出遊打卡景點、必吃美食與必買願望清單',
    colWidths: [18, 18, 26, 14, 16, 12, 12, 22, 26, 16]
  }
];

/**
 * 產生並下載完整「伴伴記 8 大工作表空白資料庫 Excel 範本 (.xlsx)」
 */
export function downloadDatabaseExcelTemplate(filename = '伴伴記_私有雲端資料庫範本.xlsx') {
  try {
    const wb = XLSX.utils.book_new();

    BANBAN_SHEETS_SPEC.forEach(spec => {
      // 組織資料列：第一列為 Headers，接著為樣例或空列
      const rows: any[][] = [spec.headers];
      if (spec.sampleData && spec.sampleData.length > 0) {
        rows.push(...spec.sampleData);
      }

      const ws = XLSX.utils.aoa_to_sheet(rows);

      // 設定欄寬
      if (spec.colWidths) {
        ws['!cols'] = spec.colWidths.map(w => ({ wch: w }));
      } else {
        ws['!cols'] = spec.headers.map(() => ({ wch: 18 }));
      }

      // 將工作表加入 Workbook
      XLSX.utils.book_append_sheet(wb, ws, spec.name);
    });

    // 匯出二進位檔案並觸發下載
    XLSX.writeFile(wb, filename);
    return true;
  } catch (error) {
    console.error('Failed to generate Excel database template:', error);
    alert('產生 Excel 範本失敗，請稍後再試！');
    return false;
  }
}

/**
 * 建立全新 Google 試算表之官方預備捷徑 (一鍵開啟 Google 試算表建立新檔)
 */
export const GOOGLE_SHEETS_NEW_URL = 'https://sheets.new';
