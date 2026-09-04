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

/**
 * 儲存使用者的專屬個人化設定（雙層儲存：本地 + Firestore 雲端，確保設定跟隨個別使用者）
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

  const payload: UserCloudConfig = {
    email: cleanEmail,
    name: config.name !== undefined ? config.name : (existing.name || ''),
    nickname: config.nickname !== undefined ? config.nickname : (existing.nickname || ''),
    nickname1Char: config.nickname1Char !== undefined ? config.nickname1Char : existing.nickname1Char,
    nickname2Char: config.nickname2Char !== undefined ? config.nickname2Char : existing.nickname2Char,
    nicknameLengthPreference: config.nicknameLengthPreference !== undefined ? config.nicknameLengthPreference : existing.nicknameLengthPreference,
    avatar: config.avatar !== undefined ? config.avatar : (existing.avatar || ''),
    gasWebUrl: config.gasWebUrl !== undefined ? config.gasWebUrl : (existing.gasWebUrl || ''),
    deploySheetUrl: config.deploySheetUrl !== undefined ? config.deploySheetUrl : (existing.deploySheetUrl || ''),
    inviteCode: config.inviteCode !== undefined ? config.inviteCode : (existing.inviteCode || ''),
    notifySettings: config.notifySettings !== undefined ? config.notifySettings : existing.notifySettings,
    calcBaseCurrency: config.calcBaseCurrency !== undefined ? config.calcBaseCurrency : existing.calcBaseCurrency,
    updatedAt: new Date().toISOString()
  };

  // 1. 本地儲存備份 (依 Gmail 獨立隔離)
  try {
    localStorage.setItem(`${LOCAL_USER_CONFIG_PREFIX}${cleanEmail}`, JSON.stringify(payload));
  } catch (e) {}

  // 2. 雲端 Firestore 同步儲存（跨裝置登入無縫讀取）
  if (isFirestoreAvailable() && db) {
    try {
      const userRef = doc(db, 'user_configs', cleanEmail);
      await setDoc(userRef, payload, { merge: true });
    } catch (err) {
      console.warn('Firestore saveUserCloudConfig sync failed (fallback to local):', err);
    }
  }
}

/**
 * 取得使用者的專屬個人化設定（優先從 Firestore 雲端讀取，無網路時降級讀取本地）
 */
export async function getUserCloudConfig(email: string): Promise<UserCloudConfig | null> {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();

  // 1. 嘗試從 Firestore 雲端抓取最新資料
  if (isFirestoreAvailable() && db) {
    try {
      const userRef = doc(db, 'user_configs', cleanEmail);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        const cloudData = snapshot.data() as UserCloudConfig;
        if (cloudData) {
          // 同步快取至本地
          try {
            localStorage.setItem(`${LOCAL_USER_CONFIG_PREFIX}${cleanEmail}`, JSON.stringify(cloudData));
          } catch (e) {}
          return cloudData;
        }
      }
    } catch (err) {
      console.warn('Firestore getUserCloudConfig query failed (trying local cache):', err);
    }
  }

  // 2. 降級讀取本地快取
  try {
    const cached = localStorage.getItem(`${LOCAL_USER_CONFIG_PREFIX}${cleanEmail}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {}

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
