import { PartnerInviteData, CoupleBindingInfo } from '../types';
import { db, isFirestoreAvailable } from './googleOAuthService';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const REGISTRY_STORAGE_KEY = 'banban_invite_registry';
const ACTIVE_INVITE_STORAGE_KEY = 'banban_active_invite';
const PARTNER_BINDING_STORAGE_KEY = 'banban_partner_binding';

/**
 * 隨機生成 6 碼情侶專屬邀請碼 (格式：BB-XXXX)
 */
export function generateRandomInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomStr = '';
  for (let i = 0; i < 4; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BB-${randomStr}`;
}

/**
 * 將邀請資料轉換為 URL-Safe 的 Base64 Token
 */
export function encodeInvitePayload(payload: PartnerInviteData): string {
  try {
    const jsonStr = JSON.stringify(payload);
    const base64 = btoa(encodeURIComponent(jsonStr));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (err) {
    console.error('Failed to encode invite payload', err);
    return '';
  }
}

/**
 * 從 URL-Safe Base64 Token 解碼邀請資料
 */
export function decodeInvitePayload(token: string): PartnerInviteData | null {
  try {
    if (!token) return null;
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonStr = decodeURIComponent(atob(base64));
    const parsed = JSON.parse(jsonStr);
    if (parsed && (parsed.inviteCode || parsed.adminEmail)) {
      return parsed as PartnerInviteData;
    }
    return null;
  } catch (err) {
    console.warn('Failed to decode invite token', err);
    return null;
  }
}

/**
 * 儲存邀請碼至本地註冊表，並同步至 Firestore 雲端（跨裝置支援）
 */
export async function saveActiveInviteCode(invite: PartnerInviteData): Promise<void> {
  try {
    localStorage.setItem(ACTIVE_INVITE_STORAGE_KEY, JSON.stringify(invite));
    const existing = getInviteRegistry();
    existing[invite.inviteCode.toUpperCase()] = invite;
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Error saving active invite code locally', e);
  }

  // 雲端 Firestore 同步
  if (isFirestoreAvailable() && db && invite.inviteCode) {
    try {
      const codeKey = invite.inviteCode.toUpperCase();
      const inviteRef = doc(db, 'partner_invites', codeKey);
      await setDoc(inviteRef, {
        ...invite,
        inviteCode: codeKey,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore saveActiveInviteCode sync failed:', err);
    }
  }
}

export function saveInviteToRegistry(invite: PartnerInviteData): void {
  saveActiveInviteCode(invite);
}

/**
 * 取得目前啟用的邀請碼
 */
export function getActiveInviteCode(): PartnerInviteData | null {
  try {
    const active = localStorage.getItem(ACTIVE_INVITE_STORAGE_KEY);
    if (active) {
      return JSON.parse(active);
    }
  } catch (e) {}
  return null;
}

/**
 * 取得所有已發出的邀請紀錄
 */
export function getInviteRegistry(): Record<string, PartnerInviteData> {
  try {
    const data = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return {};
}

/**
 * 儲存伴侶綁定資訊 (雙軌：本地 + Firestore)
 */
export async function savePartnerBindingInfo(info: CoupleBindingInfo): Promise<void> {
  try {
    localStorage.setItem(PARTNER_BINDING_STORAGE_KEY, JSON.stringify(info));
  } catch (e) {
    console.error('Error saving partner binding info locally', e);
  }

  if (isFirestoreAvailable() && db) {
    try {
      const cleanAdmin = (info.adminEmail || '').trim().toLowerCase();
      const cleanPartner = (info.partnerEmail || '').trim().toLowerCase();
      
      if (cleanAdmin) {
        const adminBindRef = doc(db, 'couple_bindings', cleanAdmin);
        await setDoc(adminBindRef, info, { merge: true });
      }
      if (cleanPartner) {
        const partnerBindRef = doc(db, 'couple_bindings', cleanPartner);
        await setDoc(partnerBindRef, info, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore savePartnerBindingInfo failed:', err);
    }
  }
}

/**
 * 讀取伴侶綁定資訊 (本地快取)
 */
export function getPartnerBindingInfo(): CoupleBindingInfo | null {
  try {
    const data = localStorage.getItem(PARTNER_BINDING_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return null;
}

/**
 * 從 Firestore 或本地讀取最新伴侶綁定資訊
 */
export async function fetchPartnerBindingInfoOnline(email?: string): Promise<CoupleBindingInfo | null> {
  const local = getPartnerBindingInfo();
  if (!email) return local;
  
  const cleanEmail = email.trim().toLowerCase();
  if (isFirestoreAvailable() && db) {
    try {
      const bindRef = doc(db, 'couple_bindings', cleanEmail);
      const snap = await getDoc(bindRef);
      if (snap.exists()) {
        const data = snap.data() as CoupleBindingInfo;
        if (data) {
          savePartnerBindingInfo(data);
          return data;
        }
      }
    } catch (e) {}
  }
  return local;
}

/**
 * 解除伴侶綁定紀錄
 */
export async function removePartnerBinding(email?: string): Promise<void> {
  const cached = getPartnerBindingInfo();
  try {
    localStorage.removeItem(PARTNER_BINDING_STORAGE_KEY);
  } catch (e) {}

  if (isFirestoreAvailable() && db) {
    try {
      const adminEmail = (cached?.adminEmail || email || '').trim().toLowerCase();
      const partnerEmail = (cached?.partnerEmail || '').trim().toLowerCase();
      if (adminEmail) {
        await deleteDoc(doc(db, 'couple_bindings', adminEmail));
      }
      if (partnerEmail) {
        await deleteDoc(doc(db, 'couple_bindings', partnerEmail));
      }
    } catch (err) {}
  }
}

/**
 * 根據邀請碼或 Token 搜尋邀請資訊（同步解析本地與 Token）
 */
export function resolveInviteCodeOrToken(input: string): PartnerInviteData | null {
  if (!input) return null;
  const clean = input.trim();

  // 1. 若 input 包含 URL (例如 https://.../?invite=xxx 或 #invite=xxx)
  try {
    if (clean.includes('invite=') || clean.includes('code=')) {
      const url = new URL(clean.startsWith('http') ? clean : `https://dummy.local/${clean}`);
      const tokenParam = url.searchParams.get('invite');
      if (tokenParam) {
        const decoded = decodeInvitePayload(tokenParam);
        if (decoded) return decoded;
      }
      const codeParam = url.searchParams.get('code');
      if (codeParam) {
        return resolveInviteCodeOrToken(codeParam);
      }
    }
  } catch (e) {}

  // 2. 若 input 本身為 Base64 Token
  const fromToken = decodeInvitePayload(clean);
  if (fromToken) return fromToken;

  // 3. 從本地註冊表比對
  const registry = getInviteRegistry();
  const upper = clean.toUpperCase().startsWith('BB-') ? clean.toUpperCase() : `BB-${clean.toUpperCase()}`;
  if (registry[clean.toUpperCase()]) {
    return registry[clean.toUpperCase()];
  }
  if (registry[upper]) {
    return registry[upper];
  }

  // 4. 比對目前啟用的邀請碼
  try {
    const active = localStorage.getItem(ACTIVE_INVITE_STORAGE_KEY);
    if (active) {
      const parsed = JSON.parse(active);
      if (parsed && parsed.inviteCode && (parsed.inviteCode.toUpperCase() === clean.toUpperCase() || parsed.inviteCode.toUpperCase() === upper)) {
        return parsed;
      }
    }
  } catch (e) {}

  // 5. 若格式符合 BB-XXXX 但在本地尚未登錄 (跨裝置短碼暫存回退)
  if (/^BB-[A-Z0-9]{4,8}$/i.test(upper)) {
    return {
      inviteCode: upper,
      adminEmail: '',
      adminName: '另一半',
      gasWebUrl: localStorage.getItem('muji_gas_web_url') || '',
      deploySheetUrl: localStorage.getItem('muji_deploy_sheet_url') || localStorage.getItem('muji_spreadsheet_url') || '',
      createdAt: new Date().toISOString()
    };
  }

  return null;
}

/**
 * 線上非同步解析邀請碼（優先查詢 Firestore 雲端資料庫，讓伴侶在全新裝置上輸入 6 碼短碼即可自動繼承 API 與試算表）
 */
export async function fetchInviteCodeOnline(input: string): Promise<PartnerInviteData | null> {
  const localResolved = resolveInviteCodeOrToken(input);
  if (localResolved && localResolved.gasWebUrl && localResolved.adminEmail) {
    return localResolved;
  }

  const clean = input.trim().toUpperCase();
  const formattedCode = clean.startsWith('BB-') ? clean : `BB-${clean}`;

  if (isFirestoreAvailable() && db) {
    try {
      const inviteRef = doc(db, 'partner_invites', formattedCode);
      const snap = await getDoc(inviteRef);
      if (snap.exists()) {
        const cloudInvite = snap.data() as PartnerInviteData;
        if (cloudInvite && cloudInvite.inviteCode) {
          // 快取至本地
          saveActiveInviteCode(cloudInvite);
          return cloudInvite;
        }
      }
    } catch (err) {
      console.warn('Firestore fetchInviteCodeOnline failed:', err);
    }
  }

  return localResolved;
}

/**
 * 產生分享給伴侶的甜蜜邀請文案與專屬連結
 */
export function generatePartnerInviteShare(invite: PartnerInviteData, baseUrl?: string): {
  shareText: string;
  shareUrl: string;
} {
  const token = encodeInvitePayload(invite);
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '');
  const shareUrl = `${origin}?invite=${token}#partner-join`;

  const shareText = `💌【伴伴記❤️】情侶共同帳本邀請函

嗨！${invite.adminName || '你的另一半'} 邀請你加入《伴伴記》情侶專屬生活帳本！

🔑 你的專屬伴侶邀請碼：【 ${invite.inviteCode} 】
📲 點擊專屬連結立即加入綁定：
${shareUrl}

✨ 綁定說明：
只要使用你的 Google 帳戶登入並輸入邀請碼，系統將自動同步生活公積金、代墊分帳與採購清單，無須繁瑣設定！`;

  return {
    shareText,
    shareUrl
  };
}

/**
 * 產生便於一鍵複製的文字邀請卡
 */
export function createShareableInviteCard(invite: PartnerInviteData, baseUrl?: string): string {
  return generatePartnerInviteShare(invite, baseUrl).shareText;
}
