/**
 * 伴伴記 • 系統版本號與環境配置中心
 * 集中管理版本號、建置時間、環境識別與更新日誌
 */

export const APP_VERSION = 'v2.5.3';
export const APP_BUILD_DATE = '2026.09.12';
export const APP_NAME = '伴伴記';
export const APP_FULL_NAME = '伴伴記 • BanBan Accounting';

export interface AppReleaseNote {
  version: string;
  date: string;
  title: string;
  highlights: string[];
}

export const APP_RELEASE_NOTES: AppReleaseNote[] = [
  {
    version: 'v2.5.3',
    date: '2026.09.12',
    title: '中央動畫 HUD 彈窗與專屬邀請入口',
    highlights: [
      '所有操作通知（刪除、記帳、結清、同步）升級為螢幕正中央快速動畫打勾 HUD',
      '伴侶邀請連結全面切換為專屬極簡短網址（https://liao0318.github.io/fund.migoscar/）',
      '登入頁面智慧偵測伴侶邀請碼，支援一鍵配對與雙向即時雲端同步',
      '強化 6 碼伴侶代碼容錯解析與管理者防自我覆寫保護機制'
    ]
  },
  {
    version: 'v2.5.2',
    date: '2026.09.10',
    title: '全螢幕同步動畫與版本辨識',
    highlights: [
      '新增全螢幕平滑登入同步動畫，取代右下角 Toast 彈窗干擾',
      '全面支援在登入頁、頂部導覽列、側邊選單與彈窗註記版本號',
      '點擊版本徽章即可隨時查看當前運行環境（正式／DEV／GitHub Pages）',
      '加強 Google Apps Script Web App 與 Firestore 雙軌防滲漏保護'
    ]
  },
  {
    version: 'v2.5.1',
    date: '2026.09.05',
    title: 'Google 身分驗證與伴侶自動綁定',
    highlights: [
      '導入 Google 帳號憑證直連與情侶 6 碼邀請碼一鍵配對',
      '支援純靜態主機（GitHub Pages）全前端運作，杜絕 404 報錯',
      '帳本資料與設定依 Google Email 嚴格隔離'
    ]
  },
  {
    version: 'v2.5.0',
    date: '2026.08.20',
    title: '無印極簡介面與旅費出國分帳',
    highlights: [
      '全面採用日系無印溫潤木質調設計，提升視覺與操作質感',
      '公積金模式與代墊借還模式一鍵流暢切換',
      '出國旅費即時匯率換算與記帳明細'
    ]
  }
];

export interface RuntimeEnvironmentInfo {
  version: string;
  buildDate: string;
  envType: 'prod' | 'dev' | 'guest';
  envLabel: string;
  hostingPlatform: 'github_pages' | 'cloud_run' | 'localhost' | 'web';
  hostingLabel: string;
  displayBadge: string;
}

/**
 * 取得目前正在運行的環境資訊 (PROD / DEV / 訪客模式，以及 GitHub Pages / 本機)
 */
export function getRuntimeEnvironmentInfo(
  isSandboxMode: boolean = false,
  isGuestMode: boolean = false,
  isDevUser: boolean = false
): RuntimeEnvironmentInfo {
  const isDev = isSandboxMode || isDevUser;
  
  let envType: 'prod' | 'dev' | 'guest' = 'prod';
  let envLabel = '🟢 正式版 (雲端同步)';
  
  if (isGuestMode) {
    envType = 'guest';
    envLabel = '🎒 本機訪客體驗';
  } else if (isDev) {
    envType = 'dev';
    envLabel = '🛠️ DEV 測試沙盒';
  }

  // 偵測託管平台
  let hostingPlatform: 'github_pages' | 'cloud_run' | 'localhost' | 'web' = 'web';
  let hostingLabel = '雲端網頁版';

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('github.io')) {
      hostingPlatform = 'github_pages';
      hostingLabel = 'GitHub Pages 靜態版';
    } else if (hostname.includes('run.app') || hostname.includes('googleusercontent.com')) {
      hostingPlatform = 'cloud_run';
      hostingLabel = 'Cloud Run 容器版';
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
      hostingPlatform = 'localhost';
      hostingLabel = 'Localhost 開發機';
    }
  }

  const displayBadge = isDev ? `${APP_VERSION} (DEV)` : APP_VERSION;

  return {
    version: APP_VERSION,
    buildDate: APP_BUILD_DATE,
    envType,
    envLabel,
    hostingPlatform,
    hostingLabel,
    displayBadge
  };
}
