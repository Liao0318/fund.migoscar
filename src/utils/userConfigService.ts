import { db, isFirestoreAvailable } from './googleOAuthService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AppNotifySettings } from '../types';

export interface UserCloudConfig {
  email: string;
  name: string;
  nickname?: string;
  nickname1Char?: string;
  nickname2Char?: string;
  nicknameLengthPreference?: '1-char' | '2-char';
  avatar?: string;
  gasWebUrl?: string;
  deploySheetUrl?: string;
  inviteCode?: string;
  notifySettings?: AppNotifySettings;
  calcBaseCurrency?: string;
  updatedAt: string;
}

const LOCAL_USER_CONFIG_PREFIX = 'banban_user_cloud_config_';

/**
 * 取得依使用者 Gmail 隔離的 LocalStorage Key
 */
export function getUserStorageKey(baseKey: string, email?: string): string {
  if (!email) return baseKey;
  const cleanEmail = email.trim().toLowerCase();
  return `${baseKey}_${cleanEmail}`;
}

export interface PersistentDbResult {
  gasWebUrl: string;
  deploySheetUrl: string;
  source: string;
}

/**
 * 🛡️ 全域多層級智慧掃描與復原引擎
 * 搜尋本機所有儲存位置（使用者專屬鍵、裝置永久鍵、邀請碼、伴侶設定、全域快取，以及 LocalStorage 深度字串掃描）
 * 確保只要本機曾設定過任何 Google Apps Script API，登入或重新載入時絕對不丟失！
 */
export function scanAndRecoverGasUrl(email?: string): PersistentDbResult {
  const cleanEmail = (email || '').trim().toLowerCase();

  // 1. 使用者專屬金鑰優先
  if (cleanEmail) {
    try {
      const u1 = localStorage.getItem(`muji_gas_web_url_${cleanEmail}`)?.trim();
      if (u1 && u1.startsWith('http')) {
        return {
          gasWebUrl: u1,
          deploySheetUrl: localStorage.getItem(`muji_sheet_url_${cleanEmail}`)?.trim() || '',
          source: 'user_storage'
        };
      }
      const u2 = localStorage.getItem(`banban_permanent_gas_url_${cleanEmail}`)?.trim();
      if (u2 && u2.startsWith('http')) {
        return {
          gasWebUrl: u2,
          deploySheetUrl: localStorage.getItem(`banban_permanent_sheet_url_${cleanEmail}`)?.trim() || '',
          source: 'user_permanent'
        };
      }
      const cfgRaw = localStorage.getItem(`${LOCAL_USER_CONFIG_PREFIX}${cleanEmail}`);
      if (cfgRaw) {
        const parsed = JSON.parse(cfgRaw);
        if (parsed.gasWebUrl && parsed.gasWebUrl.startsWith('http')) {
          return {
            gasWebUrl: parsed.gasWebUrl.trim(),
            deploySheetUrl: parsed.deploySheetUrl?.trim() || '',
            source: 'user_cached_config'
          };
        }
      }
    } catch (e) {}
  }

  // 2. 本機全域專屬金鑰
  try {
    const g1 = localStorage.getItem('muji_gas_web_url')?.trim();
    if (g1 && g1.startsWith('http')) {
      return {
        gasWebUrl: g1,
        deploySheetUrl: localStorage.getItem('muji_sheet_url')?.trim() || '',
        source: 'device_storage'
      };
    }

    const g2 = localStorage.getItem('banban_permanent_gas_url')?.trim();
    if (g2 && g2.startsWith('http')) {
      return {
        gasWebUrl: g2,
        deploySheetUrl: localStorage.getItem('banban_permanent_sheet_url')?.trim() || '',
        source: 'device_permanent'
      };
    }

    const g3 = localStorage.getItem('banban_device_master_gas')?.trim();
    if (g3 && g3.startsWith('http')) {
      return {
        gasWebUrl: g3,
        deploySheetUrl: localStorage.getItem('banban_device_master_sheet')?.trim() || '',
        source: 'device_master'
      };
    }
  } catch (e) {}

  // 3. 伴侶與邀請碼備援紀錄
  try {
    const invRaw = localStorage.getItem('banban_active_invite');
    if (invRaw) {
      const parsed = JSON.parse(invRaw);
      if (parsed.gasWebUrl && parsed.gasWebUrl.startsWith('http')) {
        return {
          gasWebUrl: parsed.gasWebUrl.trim(),
          deploySheetUrl: parsed.deploySheetUrl?.trim() || '',
          source: 'active_invite'
        };
      }
    }
  } catch (e) {}

  try {
    const bindRaw = localStorage.getItem('banban_partner_binding');
    if (bindRaw) {
      const parsed = JSON.parse(bindRaw);
      if (parsed.gasWebUrl && parsed.gasWebUrl.startsWith('http')) {
        return {
          gasWebUrl: parsed.gasWebUrl.trim(),
          deploySheetUrl: parsed.deploySheetUrl?.trim() || '',
          source: 'partner_binding'
        };
      }
    }
  } catch (e) {}

  // 4. 深度掃描全域 LocalStorage 鍵值，萃取包含 script.google.com/macros/s 的 Web App 網址
  try {
    const gasRegex = /https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_\-\/]+/;
    const sheetRegex = /https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_\-]+/;
    let foundGas = '';
    let foundSheet = '';

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const val = localStorage.getItem(key);
      if (!val) continue;

      if (!foundGas) {
        const m = val.match(gasRegex);
        if (m && m[0]) {
          foundGas = m[0];
          if (!foundGas.endsWith('/exec') && val.includes(foundGas + '/exec')) {
            foundGas = foundGas + '/exec';
          }
        }
      }
      if (!foundSheet) {
        const m = val.match(sheetRegex);
        if (m && m[0]) {
          foundSheet = m[0];
        }
      }
      if (foundGas && foundSheet) break;
    }

    if (foundGas) {
      // 自動鞏固儲存以加速下次讀取
      try {
        localStorage.setItem('muji_gas_web_url', foundGas);
        localStorage.setItem('banban_permanent_gas_url', foundGas);
        localStorage.setItem('banban_device_master_gas', foundGas);
        if (cleanEmail) {
          localStorage.setItem(`muji_gas_web_url_${cleanEmail}`, foundGas);
          localStorage.setItem(`banban_permanent_gas_url_${cleanEmail}`, foundGas);
        }
        if (foundSheet) {
          localStorage.setItem('muji_sheet_url', foundSheet);
          localStorage.setItem('banban_permanent_sheet_url', foundSheet);
          localStorage.setItem('banban_device_master_sheet', foundSheet);
          if (cleanEmail) {
            localStorage.setItem(`muji_sheet_url_${cleanEmail}`, foundSheet);
            localStorage.setItem(`banban_permanent_sheet_url_${cleanEmail}`, foundSheet);
          }
        }
      } catch (e) {}

      return {
        gasWebUrl: foundGas,
        deploySheetUrl: foundSheet,
        source: 'deep_scan'
      };
    }
  } catch (e) {}

  return { gasWebUrl: '', deploySheetUrl: '', source: 'none' };
}

/**
 * 儲存使用者的專屬個人化設定（三軌防護：本地全域 + 伺服器持久 API + Firestore 雲端，確保設定隨帳號零時差同步）
 */
export async function saveUserCloudConfig(email: string, config: Partial<UserCloudConfig>): Promise<void> {
  if (!email) return;
  const cleanEmail = email.trim().toLowerCase();

  // 先取出既有設定合併，避免欄位被覆蓋為空
  let existing: Partial<UserCloudConfig> = {};
  try {
    const cached = localStorage.getItem(`${LOCAL_USER_CONFIG_PREFIX}${cleanEmail}`);
    if (cached) {
      existing = JSON.parse(cached);
    }
  } catch (e) {}

  // 🛡️ 防誤清機制：若傳入為空字串，但既有已有有效網址時，嚴格保留既有網址，避免意外被重置為空
  const safeGas = (config.gasWebUrl && config.gasWebUrl.trim().startsWith('http')) 
    ? config.gasWebUrl.trim() 
    : (config.gasWebUrl === '' && (config as any).forceClear ? '' : (existing.gasWebUrl || ''));
  
  const safeSheet = (config.deploySheetUrl && config.deploySheetUrl.trim().startsWith('http')) 
    ? config.deploySheetUrl.trim() 
    : (config.deploySheetUrl === '' && (config as any).forceClear ? '' : (existing.deploySheetUrl || ''));

  const payload: UserCloudConfig = {
    email: cleanEmail,
    name: config.name !== undefined ? config.name : (existing.name || ''),
    nickname: config.nickname !== undefined ? config.nickname : (existing.nickname || ''),
    nickname1Char: config.nickname1Char !== undefined ? config.nickname1Char : existing.nickname1Char,
    nickname2Char: config.nickname2Char !== undefined ? config.nickname2Char : existing.nickname2Char,
    nicknameLengthPreference: config.nicknameLengthPreference !== undefined ? config.nicknameLengthPreference : existing.nicknameLengthPreference,
    avatar: config.avatar !== undefined ? config.avatar : (existing.avatar || ''),
    gasWebUrl: safeGas,
    deploySheetUrl: safeSheet,
    inviteCode: config.inviteCode !== undefined ? config.inviteCode : (existing.inviteCode || ''),
    notifySettings: config.notifySettings !== undefined ? config.notifySettings : existing.notifySettings,
    calcBaseCurrency: config.calcBaseCurrency !== undefined ? config.calcBaseCurrency : existing.calcBaseCurrency,
    updatedAt: new Date().toISOString()
  };

  // 1. 本地多重永久備份 (依 Gmail 獨立隔離 + 裝置永久鍵)
  try {
    localStorage.setItem(`${LOCAL_USER_CONFIG_PREFIX}${cleanEmail}`, JSON.stringify(payload));
    if (safeGas) {
      localStorage.setItem('muji_gas_web_url', safeGas);
      localStorage.setItem('banban_permanent_gas_url', safeGas);
      localStorage.setItem('banban_device_master_gas', safeGas);
      localStorage.setItem(`muji_gas_web_url_${cleanEmail}`, safeGas);
      localStorage.setItem(`banban_permanent_gas_url_${cleanEmail}`, safeGas);
      localStorage.setItem(`banban_user_has_logged_in_${cleanEmail}`, 'true');
    }
    if (safeSheet) {
      localStorage.setItem('muji_sheet_url', safeSheet);
      localStorage.setItem('banban_permanent_sheet_url', safeSheet);
      localStorage.setItem('banban_device_master_sheet', safeSheet);
      localStorage.setItem(`muji_sheet_url_${cleanEmail}`, safeSheet);
      localStorage.setItem(`banban_permanent_sheet_url_${cleanEmail}`, safeSheet);
    }
  } catch (e) {}

  // 2. 跨裝置 API 持久化儲存（更換手機或另一台電腦時，直接向後端 API 提取）
  try {
    fetch('/api/user-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (e) {}

  // 3. 雲端 Firestore 同步儲存（若專案已啟用 Firestore）
  if (isFirestoreAvailable() && db) {
    try {
      const userRef = doc(db, 'user_configs', cleanEmail);
      await setDoc(userRef, payload, { merge: true });
    } catch (err) {}
  }
}

/**
 * 取得使用者的專屬個人化設定（優先從後端 API / Firestore 雲端讀取，降級讀取本地與深度掃描）
 */
export async function getUserCloudConfig(email: string): Promise<UserCloudConfig | null> {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();

  // 1. 優先從伺服器持久化 API 讀取（跨裝置、換電腦登入零遺失）
  try {
    const res = await fetch(`/api/user-config?email=${encodeURIComponent(cleanEmail)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.config) {
        const serverConfig = data.config as UserCloudConfig;
        if (serverConfig.gasWebUrl && serverConfig.gasWebUrl.startsWith('http')) {
          // 同步快取至本地以加速後續載入
          try {
            localStorage.setItem(`${LOCAL_USER_CONFIG_PREFIX}${cleanEmail}`, JSON.stringify(serverConfig));
            localStorage.setItem('muji_gas_web_url', serverConfig.gasWebUrl);
            localStorage.setItem(`muji_gas_web_url_${cleanEmail}`, serverConfig.gasWebUrl);
            localStorage.setItem('banban_permanent_gas_url', serverConfig.gasWebUrl);
            localStorage.setItem(`banban_permanent_gas_url_${cleanEmail}`, serverConfig.gasWebUrl);
            if (serverConfig.deploySheetUrl) {
              localStorage.setItem('muji_sheet_url', serverConfig.deploySheetUrl);
              localStorage.setItem(`muji_sheet_url_${cleanEmail}`, serverConfig.deploySheetUrl);
            }
          } catch (e) {}
          return serverConfig;
        }
      }
    }
  } catch (e) {}

  // 2. 嘗試從 Firestore 雲端抓取最新資料
  if (isFirestoreAvailable() && db) {
    try {
      const userRef = doc(db, 'user_configs', cleanEmail);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        const cloudData = snapshot.data() as UserCloudConfig;
        if (cloudData && cloudData.gasWebUrl && cloudData.gasWebUrl.startsWith('http')) {
          try {
            localStorage.setItem(`${LOCAL_USER_CONFIG_PREFIX}${cleanEmail}`, JSON.stringify(cloudData));
          } catch (e) {}
          return cloudData;
        }
      }
    } catch (err) {}
  }

  // 3. 讀取本地快取
  try {
    const cached = localStorage.getItem(`${LOCAL_USER_CONFIG_PREFIX}${cleanEmail}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.gasWebUrl && parsed.gasWebUrl.startsWith('http')) {
        return parsed;
      }
    }
  } catch (e) {}

  // 4. 深度掃描全域本機設定備援
  const recovered = scanAndRecoverGasUrl(cleanEmail);
  if (recovered.gasWebUrl) {
    const recoveredConfig: UserCloudConfig = {
      email: cleanEmail,
      name: '',
      gasWebUrl: recovered.gasWebUrl,
      deploySheetUrl: recovered.deploySheetUrl,
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(`${LOCAL_USER_CONFIG_PREFIX}${cleanEmail}`, JSON.stringify(recoveredConfig));
    } catch (e) {}
    // 異步同步至伺服器 API
    fetch('/api/user-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recoveredConfig)
    }).catch(() => {});
    return recoveredConfig;
  }

  return null;
}

/**
 * 儲存使用者的專屬通知設定（依 Gmail 隔離）
 */
export async function saveUserNotifySettings(email: string, settings: AppNotifySettings): Promise<void> {
  if (!email) return;
  const cleanEmail = email.trim().toLowerCase();
  try {
    localStorage.setItem(`muji_notification_settings_${cleanEmail}`, JSON.stringify(settings));
    localStorage.setItem('muji_notification_settings', JSON.stringify(settings)); // 全域快取備份
  } catch (e) {}
  await saveUserCloudConfig(cleanEmail, { notifySettings: settings });
}

/**
 * 取得使用者的專屬通知設定（依 Gmail 隔離）
 */
export function getUserNotifySettings(email?: string): AppNotifySettings | null {
  if (email) {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const perUser = localStorage.getItem(`muji_notification_settings_${cleanEmail}`);
      if (perUser) return JSON.parse(perUser);
    } catch (e) {}
  }
  try {
    const fallback = localStorage.getItem('muji_notification_settings');
    if (fallback) return JSON.parse(fallback);
  } catch (e) {}
  return null;
}

/**
  * 登出時清空當前工作階段快取（切換帳號或登出時，絕不清除本機資料庫與伴侶連線設定！）
  */
export function clearAllSessionLedgerCache(): void {
  const keysToRemove = [
    'banban_auth_user',
    'muji_ledger_data',
    'banban_split_records',
    'banban_shopping_items',
    'banban_chat_messages',
    'muji_notifications',
    'muji_notification_day',
    'banban_is_sandbox_mode',
    'banban_is_guest_mode'
  ];

  // ⚠️ 嚴格注意：絕不刪除資料庫連線金鑰與伴侶綁定設定！
  // muji_gas_web_url, muji_sheet_url, banban_permanent_gas_url, banban_device_master_gas,
  // 以及伴侶綁定設定與邀請碼，均為本機與使用者之持久設定，登出絕不可抹除！
  keysToRemove.forEach(k => {
    try {
      localStorage.removeItem(k);
    } catch (e) {}
  });
}
