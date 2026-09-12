/**
 * 伴伴記 • 系統版本號與環境配置中心
 * 集中管理版本號、建置時間、環境識別與更新日誌
 */

export const APP_VERSION = 'v2.5.7';
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
    version: 'v2.5.7',
    date: '2026.09.12',
    title: '伴侶驗證並加入急速無延遲響應',
    highlights: [
      '徹底解決伴侶點擊「驗證並加入」長時間轉圈等待的問題，將驗證與加入流程加速至毫秒級響應',
      '重構雲端資料庫與 Firestore 連線機制，全面引入非阻塞背景同步與限時超時保護（Anti-Hanging）',
      '後端 API 自動解析完整邀請網址、短代碼、管理者信箱，並提供多層備援即時對接',
      '加入成功後立即完成情侶帳本綁定並自動加載共享數據，提供流暢無阻的配對體驗'
    ]
  },
  {
    version: 'v2.5.6',
    date: '2026.09.12',
    title: '伴侶配對模式深度修復與智慧秒對接',
    highlights: [
      '全面修復伴侶輸入 6 碼邀請碼（例如 BB-7QEY、純代碼或連結）顯示「不符合」的問題',
      '後端 API 與雲端資料庫新增智慧容錯自動對接機制，自動同步管理者帳本與 Google 試算表設定',
      '強化邀請碼即時輸入體驗，解決輸入中途跳出錯誤提示與代碼格式不一致之問題',
      '支援整段邀請文案、短網址、中括號代碼、純數字代碼與管理者 Email 多維度自動解析'
    ]
  },
  {
    version: 'v2.5.5',
    date: '2026.09.12',
    title: 'Apple Pay 經典雙音清脆提示鈴聲',
    highlights: [
      '提醒與推播鈴聲升級為 Apple Pay 經典雙音高擬真晶透鈴聲（D#6 ➔ A#6 高五度和弦）',
      '內建微觸感低頻輕敲與金屬光澤晶亮泛音，搭配 DynamicsCompressor 防破音立體聲音場',
      '優化手機原生雙擊微震動回饋（Haptic Feedback），提供如同刷卡成功般的俐落爽快感',
      '支援即時通知、系統推播、測試鈴聲與各類財務變動提醒'
    ]
  },
  {
    version: 'v2.5.4',
    date: '2026.09.12',
    title: '公積金月度核銷即時同步 Google 試算表',
    highlights: [
      '公積金「月度結算與核銷」操作（核銷結清／取消核銷）即時雙向連線同步至 Google 試算表「月度核銷狀態」工作表',
      '強化 GAS 後端 API 核銷狀態處理邏輯，支援核銷核取方塊與年月格式自動容錯校正',
      '本地快取與雲端後台即時聯動，換裝置或刷新頁面自動維持一致的核銷狀態',
      '優化結算對帳按鈕互動回饋與 App 內建通知提醒'
    ]
  },
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
