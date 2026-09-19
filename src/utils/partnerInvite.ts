import { PartnerInviteData, CoupleBindingInfo } from '../types';
import { db, isFirestoreAvailable } from './googleOAuthService';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { hasBackendServer } from './environment';

/**
 * 具有合理超時限制的非同步調用，防止網絡阻塞造成介面轉圈凍結
 */
async function asyncWithTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000, fallback: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), timeoutMs);
  });
  try {
    return await Promise.race([
      promise.finally(() => clearTimeout(timer)),
      timeoutPromise
    ]);
  } catch (e) {
    clearTimeout(timer);
    return fallback;
  }
}

const REGISTRY_STORAGE_KEY = 'banban_invite_registry';
const ACTIVE_INVITE_STORAGE_KEY = 'banban_active_invite';
const PARTNER_BINDING_STORAGE_KEY = 'banban_partner_binding';

export const DEFAULT_INVITE_VALID_MINUTES = 30 * 24 * 60; // 預設 30 天超長有效期，杜絕短時效失效問題

/**
 * 檢查邀請碼是否已過期
 */
export function isInviteExpired(invite?: PartnerInviteData | null): boolean {
  if (!invite) return true;
  if (invite.expiresAt) {
    return Date.now() > new Date(invite.expiresAt).getTime();
  }
  if (invite.createdAt) {
    const createdTime = new Date(invite.createdAt).getTime();
    if (!isNaN(createdTime)) {
      const validMins = invite.validMinutes && invite.validMinutes > 0 ? invite.validMinutes : DEFAULT_INVITE_VALID_MINUTES;
      return Date.now() > (createdTime + validMins * 60 * 1000);
    }
  }
  return false;
}

/**
 * 取得邀請碼剩餘有效秒數
 */
export function getInviteRemainingSeconds(invite?: PartnerInviteData | null): number {
  if (!invite) return 0;
  const expiryTime = invite.expiresAt 
    ? new Date(invite.expiresAt).getTime()
    : (invite.createdAt ? new Date(invite.createdAt).getTime() + DEFAULT_INVITE_VALID_MINUTES * 60 * 1000 : 0);
  if (!expiryTime || isNaN(expiryTime)) return 0;
  return Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
}

/**
 * 格式化剩餘時間為 MM:SS
 */
export function formatRemainingTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * 建立全新具備時效性 (15分鐘) 的邀請資料
 */
export function createFreshInvite(
  adminEmail: string,
  adminName: string,
  gasWebUrl: string,
  deploySheetUrl: string = '',
  validMinutes: number = DEFAULT_INVITE_VALID_MINUTES
): PartnerInviteData {
  const inviteCode = generateRandomInviteCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + validMinutes * 60 * 1000).toISOString();
  return {
    inviteCode,
    adminEmail,
    adminName: adminName || '主管理員',
    gasWebUrl,
    deploySheetUrl,
    validMinutes,
    createdAt: now.toISOString(),
    expiresAt
  };
}

/**
 * 隨機生成 6 碼情侶專屬邀請碼 (格式：BB-XXXX)
 * 使用 Web Crypto API (高隨機性安全隨機數) 與排除混淆字元的字符池
 */
export function generateRandomInviteCode(): string {
  // 排除易混淆字符 0, O, 1, I 以確保行動裝置與手動輸入時零錯誤
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const len = 4;
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const randomBytes = new Uint8Array(len);
    window.crypto.getRandomValues(randomBytes);
    let randomStr = '';
    for (let i = 0; i < len; i++) {
      randomStr += chars[randomBytes[i] % chars.length];
    }
    return `BB-${randomStr}`;
  }

  // 備用隨機生成
  let randomStr = '';
  for (let i = 0; i < len; i++) {
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
  const codeKey = (invite.inviteCode || '').trim().toUpperCase();
  const codeNoPrefix = codeKey.replace(/^BB[-_]?/i, '');

  try {
    localStorage.setItem(ACTIVE_INVITE_STORAGE_KEY, JSON.stringify(invite));
    const existing = getInviteRegistry();
    if (codeKey) existing[codeKey] = invite;
    if (codeNoPrefix) existing[codeNoPrefix] = invite;
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Error saving active invite code locally', e);
  }

  // 伺服器持久 API 同步（僅在有後端伺服器環境下調用）
  if (hasBackendServer()) {
    try {
      fetch('/api/partner-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invite)
      }).catch(() => {});
    } catch (e) {}
  }

  // 雲端 Firestore 同步（同時寫入標準代碼、無字首代碼與管理者專屬設定）
  if (isFirestoreAvailable() && db && codeKey) {
    try {
      const invitePayload = {
        ...invite,
        inviteCode: codeKey,
        updatedAt: new Date().toISOString()
      };
      
      const p1 = setDoc(doc(db, 'partner_invites', codeKey), invitePayload, { merge: true });
      const p2 = codeNoPrefix ? setDoc(doc(db, 'partner_invites', codeNoPrefix), invitePayload, { merge: true }) : Promise.resolve();
      
      let p3 = Promise.resolve();
      if (invite.adminEmail) {
        const cleanAdmin = invite.adminEmail.trim().toLowerCase();
        p3 = setDoc(doc(db, 'user_configs', cleanAdmin), {
          email: cleanAdmin,
          name: invite.adminName || '主管理員',
          inviteCode: codeKey,
          gasWebUrl: invite.gasWebUrl || '',
          deploySheetUrl: invite.deploySheetUrl || '',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      await asyncWithTimeout(Promise.all([p1, p2, p3]), 5000, null);
    } catch (err) {
      console.warn('Firestore saveActiveInviteCode error:', err);
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
 * 清理與校驗情侶綁定資訊，杜絕「自己綁定自己」的錯誤邏輯
 */
export function sanitizeBindingInfo(info?: CoupleBindingInfo | null): CoupleBindingInfo | null {
  if (!info) return null;
  const admin = (info.adminEmail || '').trim().toLowerCase();
  const partner = (info.partnerEmail || '').trim().toLowerCase();
  if (admin && partner && admin === partner) {
    return {
      ...info,
      partnerEmail: '',
      partnerName: ''
    };
  }
  return info;
}

/**
 * 儲存伴侶綁定資訊 (三軌：本地 + 伺服器 API + Firestore)
 */
export async function savePartnerBindingInfo(info: CoupleBindingInfo): Promise<void> {
  const cleanAdmin = (info.adminEmail || '').trim().toLowerCase();
  const cleanPartner = (info.partnerEmail || '').trim().toLowerCase();

  // 🛡️ 拒絕將自己設定為伴侶
  const sanitized = sanitizeBindingInfo(info) || info;

  try {
    localStorage.setItem(PARTNER_BINDING_STORAGE_KEY, JSON.stringify(sanitized));
  } catch (e) {
    console.error('Error saving partner binding info locally', e);
  }

  // 伺服器 API 同步（僅在有後端伺服器環境下調用）
  if (hasBackendServer()) {
    try {
      await fetch('/api/couple-binding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitized)
      });
    } catch (e) {}
  }

  if (isFirestoreAvailable() && db) {
    const codeKey = (sanitized.inviteCode || '').trim().toUpperCase();
    const codeNoPrefix = codeKey.replace(/^BB[-_]?/i, '');

    const syncPromises: Promise<any>[] = [];

    if (cleanAdmin) {
      const adminBindRef = doc(db, 'couple_bindings', cleanAdmin);
      const isRealPartner = Boolean(cleanPartner && cleanPartner !== cleanAdmin);
      syncPromises.push(setDoc(adminBindRef, {
        ...sanitized,
        isBound: isRealPartner,
        partnerEmail: isRealPartner ? cleanPartner : '',
        partnerName: isRealPartner ? (sanitized.partnerName || '伴侶') : '',
        updatedAt: new Date().toISOString()
      }, { merge: true }));
      syncPromises.push(setDoc(doc(db, 'user_configs', cleanAdmin), {
        partnerEmail: isRealPartner ? cleanPartner : '',
        partnerName: isRealPartner ? (sanitized.partnerName || '伴侶') : '',
        isBound: isRealPartner,
        updatedAt: new Date().toISOString()
      }, { merge: true }));
    }
    if (cleanPartner && cleanPartner !== cleanAdmin) {
      const partnerBindRef = doc(db, 'couple_bindings', cleanPartner);
      syncPromises.push(setDoc(partnerBindRef, { ...sanitized, isBound: true, updatedAt: new Date().toISOString() }, { merge: true }));
      syncPromises.push(setDoc(doc(db, 'user_configs', cleanPartner), {
        adminEmail: cleanAdmin,
        adminName: sanitized.adminName || '主管理員',
        gasWebUrl: sanitized.gasWebUrl || '',
        deploySheetUrl: sanitized.deploySheetUrl || '',
        inviteCode: sanitized.inviteCode,
        isBound: true,
        userRole: 'partner',
        updatedAt: new Date().toISOString()
      }, { merge: true }));
    }
    if (codeKey) {
      const isRealPartner = Boolean(cleanPartner && cleanPartner !== cleanAdmin);
      const boundInvitePayload = {
        isBound: isRealPartner,
        partnerEmail: isRealPartner ? cleanPartner : '',
        partnerName: isRealPartner ? (sanitized.partnerName || '伴侶') : '',
        boundAt: sanitized.boundAt || new Date().toISOString()
      };
      syncPromises.push(setDoc(doc(db, 'partner_invites', codeKey), boundInvitePayload, { merge: true }));
      if (codeNoPrefix) {
        syncPromises.push(setDoc(doc(db, 'partner_invites', codeNoPrefix), boundInvitePayload, { merge: true }));
      }
    }

    try {
      await asyncWithTimeout(Promise.all(syncPromises), 5000, null);
    } catch (e) {
      console.warn('Firestore savePartnerBindingInfo error:', e);
    }
  }
}

/**
 * 讀取伴侶綁定資訊 (本地快取)
 */
export function getPartnerBindingInfo(email?: string): CoupleBindingInfo | null {
  try {
    const data = localStorage.getItem(PARTNER_BINDING_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      const sanitized = sanitizeBindingInfo(parsed);
      if (email && sanitized) {
        const cleanEmail = email.trim().toLowerCase();
        const a = (sanitized.adminEmail || '').trim().toLowerCase();
        const p = (sanitized.partnerEmail || '').trim().toLowerCase();
        // 嚴格隔離：此伴侶綁定必須包含該帳號（作為 admin 或 partner）
        if (a !== cleanEmail && p !== cleanEmail) {
          return null;
        }
      }
      return sanitized;
    }
  } catch (e) {}
  return null;
}

/**
 * 從伺服器 API、Firestore 或本地讀取最新伴侶綁定資訊（具備跨裝置即時同步）
 */
export async function fetchPartnerBindingInfoOnline(email?: string): Promise<CoupleBindingInfo | null> {
  const local = getPartnerBindingInfo(email);
  const cleanEmail = (email || '').trim().toLowerCase();

  // 1. 優先從伺服器持久 API 抓取（僅在有後端伺服器環境下調用）
  if (hasBackendServer() && cleanEmail) {
    try {
      const res = await asyncWithTimeout(fetch(`/api/couple-binding?email=${encodeURIComponent(cleanEmail)}`), 1500, null as any);
      if (res && res.ok) {
        const data = await res.json();
        if (data && data.success && data.binding) {
          const bindData = sanitizeBindingInfo(data.binding as CoupleBindingInfo);
          if (bindData) {
            try {
              localStorage.setItem(PARTNER_BINDING_STORAGE_KEY, JSON.stringify(bindData));
            } catch (e) {}
            return bindData;
          }
        }
      }
    } catch (e) {}
  }

  // 2. 嘗試從 Firestore 讀取
  if (isFirestoreAvailable() && db) {
    try {
      // A. 若有 cleanEmail，直接查 couple_bindings
      if (cleanEmail) {
        const bindRef = doc(db, 'couple_bindings', cleanEmail);
        const snap = await asyncWithTimeout(getDoc(bindRef), 3000, null as any);
        if (snap && snap.exists && snap.exists()) {
          const data = snap.data() as CoupleBindingInfo;
          const sanitized = sanitizeBindingInfo(data);
          if (sanitized && (sanitized.partnerEmail || sanitized.adminEmail)) {
            savePartnerBindingInfo(sanitized);
            return sanitized;
          }
        }

        // B. 查詢 user_configs 檢查是否有伴侶綁定紀錄
        const userRef = doc(db, 'user_configs', cleanEmail);
        const userSnap = await asyncWithTimeout(getDoc(userRef), 2500, null as any);
        if (userSnap && userSnap.exists && userSnap.exists()) {
          const udata = userSnap.data() as any;
          if (udata && (udata.partnerEmail || udata.partnerName)) {
            const pEmail = (udata.partnerEmail || '').trim().toLowerCase();
            if (pEmail && pEmail !== cleanEmail) {
              const synthesized: CoupleBindingInfo = {
                adminEmail: cleanEmail,
                adminName: udata.name || '主管理員',
                partnerEmail: pEmail,
                partnerName: udata.partnerName || '伴侶',
                inviteCode: udata.inviteCode || '',
                gasWebUrl: udata.gasWebUrl || '',
                deploySheetUrl: udata.deploySheetUrl || '',
                boundAt: udata.updatedAt || new Date().toISOString()
              };
              savePartnerBindingInfo(synthesized);
              return synthesized;
            }
          }
        }
      }

      // C. 檢查當前 active invite code 是否已被伴侶綁定（嚴格限制該邀請碼必須屬於 cleanEmail 本人）
      const activeInvite = getActiveInviteCode();
      if (activeInvite && activeInvite.inviteCode && cleanEmail && activeInvite.adminEmail?.trim().toLowerCase() === cleanEmail) {
        const codeKey = activeInvite.inviteCode.toUpperCase();
        const inviteRef = doc(db, 'partner_invites', codeKey);
        const invSnap = await asyncWithTimeout(getDoc(inviteRef), 2500, null as any);
        if (invSnap && invSnap.exists && invSnap.exists()) {
          const invData = invSnap.data() as any;
          const pEmail = (invData.partnerEmail || '').trim().toLowerCase();
          const aEmail = (activeInvite.adminEmail || cleanEmail || '').trim().toLowerCase();
          if (invData && (invData.isBound || pEmail) && pEmail && pEmail !== aEmail) {
            const synthesized: CoupleBindingInfo = {
              adminEmail: aEmail,
              adminName: activeInvite.adminName || '主管理員',
              partnerEmail: pEmail,
              partnerName: invData.partnerName || '伴侶',
              inviteCode: activeInvite.inviteCode,
              gasWebUrl: activeInvite.gasWebUrl || invData.gasWebUrl || '',
              deploySheetUrl: activeInvite.deploySheetUrl || invData.deploySheetUrl || '',
              boundAt: invData.boundAt || new Date().toISOString()
            };
            savePartnerBindingInfo(synthesized);
            return synthesized;
          }
        }
      }
    } catch (e) {
      console.warn('fetchPartnerBindingInfoOnline Firestore query error:', e);
    }
  }

  return sanitizeBindingInfo(local);
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
 * 從任意輸入文字、邀請卡內容、或 URL 網址中智慧萃取出標準的 6 碼伴侶邀請碼 (BB-XXXX) 或 Token
 */
export function extractInviteCode(input: string): string | null {
  if (!input) return null;
  const str = input.trim();

  // 1. 若含有 partner_invite=, token= 或 invite= 或 pairing= (Base64 Token 或 代碼)
  const matchToken = str.match(/(?:#|\?|&)(?:token|partner_invite|invite|pairing)=([A-Za-z0-9_-]+)/i);
  if (matchToken && matchToken[1]) {
    return matchToken[1];
  }

  if (str.includes('invite=') || str.includes('token=') || str.includes('partner_invite=')) {
    try {
      const url = new URL(str.startsWith('http') ? str : `https://dummy.local/${str}`);
      const token = url.searchParams.get('token') || url.searchParams.get('partner_invite') || url.searchParams.get('invite') || url.searchParams.get('pairing');
      if (token) return token;
    } catch (e) {}
  }

  // 2. 若含有【BB-XXXX】或 BB- 開頭的 4~8 碼正規格式（例如 BB-XXXX、BB - 1234 等）
  const matchBB = str.match(/BB\s*[-_]?\s*([A-Za-z0-9]{4,8})/i);
  if (matchBB && matchBB[1]) {
    return `BB-${matchBB[1].toUpperCase()}`;
  }

  // 3. 若含有 #join= 或 #code= 或 join= 或 code=
  const matchParam = str.match(/(?:#|\?|&)(?:join|code)=([A-Za-z0-9_-]+)/i);
  if (matchParam && matchParam[1]) {
    const raw = matchParam[1].toUpperCase();
    return raw.startsWith('BB-') ? raw : (raw.startsWith('BB') ? `BB-${raw.slice(2)}` : `BB-${raw}`);
  }

  // 4. 若輸入內容為純 email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
    return str.toLowerCase();
  }

  // 5. 若含有中文字卡中的【 XXXX 】或「XXXX」標記
  const matchBracket = str.match(/[【「\[]([A-Za-z0-9_-]{4,10})[】」\]]/);
  if (matchBracket && matchBracket[1]) {
    const bCode = matchBracket[1].toUpperCase();
    return bCode.startsWith('BB-') ? bCode : (bCode.startsWith('BB') ? `BB-${bCode.slice(2)}` : `BB-${bCode}`);
  }

  // 6. 若去除空格與符號後為 4~8 碼英數字
  const cleanChars = str.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (cleanChars.length >= 4 && cleanChars.length <= 10) {
    return cleanChars.startsWith('BB') && cleanChars.length > 4 
      ? `BB-${cleanChars.slice(2)}` 
      : `BB-${cleanChars}`;
  }

  return null;
}

/**
 * 根據邀請碼或 Token 搜尋邀請資訊（同步解析本地與 Token，嚴格拒絕偽造無效代碼）
 */
export function resolveInviteCodeOrToken(input: string): PartnerInviteData | null {
  if (!input) return null;
  const clean = input.trim();

  // 1. 若 input 為 Base64 Token，直接解碼
  const fromToken = decodeInvitePayload(clean);
  if (fromToken && fromToken.adminEmail && (fromToken.gasWebUrl || fromToken.inviteCode)) {
    return fromToken;
  }

  // 2. 智慧萃取標準代碼或網址內的 token
  const extracted = extractInviteCode(clean);
  if (extracted) {
    // 檢查是否為解碼 token
    const tokenDecoded = decodeInvitePayload(extracted);
    if (tokenDecoded && tokenDecoded.adminEmail) {
      return tokenDecoded;
    }

    const upperCode = extracted.toUpperCase();
    const registry = getInviteRegistry();
    if (registry[upperCode] && registry[upperCode].adminEmail) {
      return registry[upperCode];
    }

    // 比對目前啟用的邀請碼
    try {
      const active = localStorage.getItem(ACTIVE_INVITE_STORAGE_KEY);
      if (active) {
        const parsed = JSON.parse(active) as PartnerInviteData;
        if (parsed && parsed.adminEmail && (
          parsed.inviteCode?.toUpperCase() === upperCode ||
          parsed.inviteCode?.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === upperCode.replace(/[^A-Za-z0-9]/g, '')
        )) {
          return parsed;
        }
      }
    } catch (e) {}
  }

  // 3. 原生從本地註冊表與快取進行相容比對
  const rawUpper = clean.toUpperCase();
  const formattedUpper = rawUpper.startsWith('BB-') ? rawUpper : `BB-${rawUpper}`;
  const registry = getInviteRegistry();

  if (registry[rawUpper] && registry[rawUpper].adminEmail) {
    return registry[rawUpper];
  }
  if (registry[formattedUpper] && registry[formattedUpper].adminEmail) {
    return registry[formattedUpper];
  }

  return null;
}

/**
 * 線上非同步解析邀請碼（向 Firestore 雲端資料庫查詢真實存在的邀請碼，具備多層備援機制）
 */
export async function fetchInviteCodeOnline(input: string): Promise<PartnerInviteData | null> {
  if (!input) return null;
  const cleanInput = input.trim();

  // 1. 先嘗試以 Token 或本機既有真實紀錄解析
  const localResolved = resolveInviteCodeOrToken(cleanInput);
  if (localResolved && localResolved.gasWebUrl && localResolved.adminEmail) {
    return localResolved;
  }

  // 2. 智慧萃取出乾淨的代碼 (例如 BB-XXXX)
  const extractedCode = extractInviteCode(cleanInput);
  const codeToQuery = (extractedCode || cleanInput).toUpperCase();

  // 2.5 優先向伺服器持久化 API 查詢（僅在有後端伺服器環境下調用）
  if (hasBackendServer()) {
    try {
      const queryUrl = cleanInput.includes('@') 
        ? `/api/partner-invite?email=${encodeURIComponent(cleanInput.trim().toLowerCase())}`
        : `/api/partner-invite?code=${encodeURIComponent(codeToQuery)}`;
      const res = await fetch(queryUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.invite) {
          const inv = data.invite as PartnerInviteData;
          if (inv && (inv.adminEmail || inv.inviteCode)) {
            saveActiveInviteCode(inv);
            return inv;
          }
        } else if (data && data.expired) {
          // 邀請碼已逾期，明確返回 null 杜絕任意配對
          return null;
        }
      }
    } catch (e) {}
  }

  // 3. 向 Firestore 查詢真實存在的邀請紀錄
  if (isFirestoreAvailable() && db && codeToQuery) {
    try {
      const candidateKeys = Array.from(new Set([
        codeToQuery,
        codeToQuery.replace(/[^A-Za-z0-9]/g, ''),
        codeToQuery.startsWith('BB-') ? codeToQuery : `BB-${codeToQuery.replace(/^BB[-_]?/i, '')}`,
        codeToQuery.replace(/^BB[-_]?/i, '')
      ]));

      for (const key of candidateKeys) {
        if (!key) continue;
        const inviteRef = doc(db, 'partner_invites', key);
        const snap = await asyncWithTimeout(getDoc(inviteRef), 3500, null as any);
        if (snap && snap.exists && snap.exists()) {
          const cloudInvite = snap.data() as PartnerInviteData;
          if (cloudInvite && (cloudInvite.inviteCode || cloudInvite.adminEmail)) {
            // 若雲端邀請紀錄齊全且具有有效 gasWebUrl，直接快取並返回
            if (cloudInvite.gasWebUrl && cloudInvite.gasWebUrl.startsWith('http') && !cloudInvite.gasWebUrl.includes('/test/')) {
              saveActiveInviteCode(cloudInvite);
              return cloudInvite;
            }

            // 🛡️ 雙重保險備援：若邀請紀錄缺失 gasWebUrl，自動向管理者的 user_configs 集合查詢補齊
            if (cloudInvite.adminEmail) {
              try {
                const adminEmailClean = cloudInvite.adminEmail.trim().toLowerCase();
                const adminConfigRef = doc(db, 'user_configs', adminEmailClean);
                const adminSnap = await asyncWithTimeout(getDoc(adminConfigRef), 3000, null as any);
                if (adminSnap && adminSnap.exists && adminSnap.exists()) {
                  const adminData = adminSnap.data() as any;
                  if (adminData && adminData.gasWebUrl && adminData.gasWebUrl.startsWith('http')) {
                    const enrichedInvite: PartnerInviteData = {
                      ...cloudInvite,
                      gasWebUrl: adminData.gasWebUrl,
                      deploySheetUrl: adminData.deploySheetUrl || cloudInvite.deploySheetUrl || ''
                    };
                    saveActiveInviteCode(enrichedInvite);
                    return enrichedInvite;
                  }
                }
              } catch (err) {}
            }

            if (cloudInvite.adminEmail || cloudInvite.inviteCode) {
              saveActiveInviteCode(cloudInvite);
              return cloudInvite;
            }
          }
        }
      }

      // 3.5 透過 collection 欄位查詢備援
      try {
        const invCol = collection(db, 'partner_invites');
        const q1 = query(invCol, where('inviteCode', '==', codeToQuery), limit(1));
        const qSnap = await asyncWithTimeout(getDocs(q1), 3000, null as any);
        if (qSnap && !qSnap.empty) {
          const docItem = qSnap.docs[0];
          const cloudInvite = docItem.data() as PartnerInviteData;
          if (cloudInvite && (cloudInvite.adminEmail || cloudInvite.inviteCode)) {
            saveActiveInviteCode(cloudInvite);
            return cloudInvite;
          }
        }
      } catch (e) {}
    } catch (err) {
      console.warn('Firestore fetchInviteCodeOnline query failed:', err);
    }
  }

  // 4. 若輸入的是伴侶或管理員的 Email，直接從該管理員的 user_configs 中查詢最新邀請資訊
  if (isFirestoreAvailable() && db && cleanInput.includes('@')) {
    try {
      const emailClean = cleanInput.trim().toLowerCase();
      const userDoc = await asyncWithTimeout(getDoc(doc(db, 'user_configs', emailClean)), 3000, null as any);
      if (userDoc && userDoc.exists && userDoc.exists()) {
        const udata = userDoc.data() as any;
        if (udata && udata.gasWebUrl && udata.gasWebUrl.startsWith('http')) {
          const inviteData: PartnerInviteData = {
            inviteCode: udata.inviteCode || codeToQuery,
            adminEmail: emailClean,
            adminName: udata.name || '主管理員',
            gasWebUrl: udata.gasWebUrl,
            deploySheetUrl: udata.deploySheetUrl || '',
            createdAt: new Date().toISOString()
          };
          saveActiveInviteCode(inviteData);
          return inviteData;
        }
      }
    } catch (e) {}
  }

  // 5. 若 Token 解碼出有效資料，亦予認可
  if (localResolved && localResolved.adminEmail && localResolved.gasWebUrl) {
    return localResolved;
  }

  // 查無此邀請碼
  return null;
}

export const CUSTOM_PORTAL_BASE_URL = 'https://liao0318.github.io/fund.migoscar/';

/**
 * 取得當前應用程式的標準分享基底網址
 * 優先採用用戶指定的 GitHub Pages 網址（https://liao0318.github.io/fund.migoscar/），
 * 避免使用 Google AI Studio / Cloud Run 臨時開發網址，以確保伴侶與外部使用者能永久且穩定連線。
 */
export function getAppShareBaseUrl(): string {
  // 若設定了自訂入口網址（如 GitHub Pages），優先固定使用該網址
  if (CUSTOM_PORTAL_BASE_URL) {
    return CUSTOM_PORTAL_BASE_URL.endsWith('/') ? CUSTOM_PORTAL_BASE_URL : `${CUSTOM_PORTAL_BASE_URL}/`;
  }
  if (typeof window !== 'undefined' && window.location.origin) {
    const origin = window.location.origin;
    const pathname = window.location.pathname || '';
    // 移除結尾的 hash 或 query
    const cleanPath = pathname.replace(/\/index\.html$/i, '/');
    return `${origin}${cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`}`;
  }
  return 'https://liao0318.github.io/fund.migoscar/';
}

/**
 * 產生分享給伴侶的專屬 Magic Pairing 網址（支援 Query 與 Hash 雙重相容，LINE 與瀏覽器無障礙開啟）
 */
export function getMagicPairingUrl(invite: PartnerInviteData, baseUrl?: string): string {
  const base = baseUrl || getAppShareBaseUrl();
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const token = encodeInvitePayload(invite);
  const queryParts: string[] = [];
  if (invite.inviteCode) queryParts.push(`partner_invite=${encodeURIComponent(invite.inviteCode)}`);
  if (token) queryParts.push(`token=${encodeURIComponent(token)}`);
  if (invite.adminEmail) queryParts.push(`admin=${encodeURIComponent(invite.adminEmail)}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  return `${cleanBase}${queryString}#join=${encodeURIComponent(invite.inviteCode)}`;
}

/**
 * 產生分享給伴侶的甜蜜邀請文案與專屬連結
 */
export function generatePartnerInviteShare(invite: PartnerInviteData, baseUrl?: string): {
  shareText: string;
  shareUrl: string;
} {
  const shareUrl = getMagicPairingUrl(invite, baseUrl);

  const shareText = `💌【伴伴記❤️】情侶共同帳本邀請函

嗨！${invite.adminName || '你的另一半'} 邀請你加入《伴伴記》情侶專屬生活帳本！

🔑 專屬伴侶邀請碼：【 ${invite.inviteCode} 】
📲 點擊專屬連結立即加入配對：
${shareUrl}

✨ 配對超簡單：
點擊上方連結或打開相機掃描 QR Code，即可一秒自動完成雙方帳本連線，共同管理公積金、分帳與願望採購清單！`;

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

const DIRECT_SENT_STORAGE_KEY = 'banban_sent_direct_invite';

/**
 * 發送直接 Email 伴侶邀請（零出錯方案：指定伴侶 Gmail，伴侶登入即自動跳出接受確認）
 */
export async function sendDirectPartnerEmailInvite(
  adminEmail: string,
  adminName: string,
  partnerEmail: string,
  gasWebUrl: string,
  deploySheetUrl: string = '',
  adminAvatar: string = ''
): Promise<{ success: boolean; invite?: PartnerInviteData; message?: string }> {
  const cleanAdmin = (adminEmail || '').trim().toLowerCase();
  const cleanPartner = (partnerEmail || '').trim().toLowerCase();

  if (!cleanAdmin || !cleanPartner) {
    return { success: false, message: '請提供完整的管理者與伴侶 Google Email' };
  }

  if (cleanAdmin === cleanPartner) {
    return { success: false, message: '伴侶 Email 不可與自己的 Email 相同' };
  }

  // 驗證 Email 格式
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanPartner)) {
    return { success: false, message: '伴侶 Email 格式不正確，請輸入有效的 Google Gmail' };
  }

  const existingActive = getActiveInviteCode();
  const inviteCode = existingActive?.inviteCode || generateRandomInviteCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + DEFAULT_INVITE_VALID_MINUTES * 60 * 1000).toISOString();

  const directInvite: PartnerInviteData = {
    inviteCode,
    adminEmail: cleanAdmin,
    adminName: adminName || '主管理員',
    adminAvatar: adminAvatar || '',
    partnerEmail: cleanPartner,
    status: 'pending',
    gasWebUrl,
    deploySheetUrl,
    createdAt: now.toISOString(),
    expiresAt,
    validMinutes: DEFAULT_INVITE_VALID_MINUTES
  };

  // 1. 本地快取
  try {
    localStorage.setItem(DIRECT_SENT_STORAGE_KEY, JSON.stringify(directInvite));
    saveActiveInviteCode(directInvite);
  } catch (e) {}

  // 2. 伺服器 API 持久化
  if (hasBackendServer()) {
    try {
      const res = await fetch('/api/partner-direct-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(directInvite)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.pendingInvite) {
          saveActiveInviteCode(data.pendingInvite);
        }
      }
    } catch (e) {
      console.warn('sendDirectPartnerEmailInvite API error:', e);
    }
  }

  // 3. 雲端 Firestore 同步
  if (isFirestoreAvailable() && db) {
    try {
      const pendingRef = doc(db, 'pending_partner_invites', cleanPartner);
      await setDoc(pendingRef, directInvite, { merge: true });

      const inviteRef = doc(db, 'partner_invites', inviteCode.toUpperCase());
      await setDoc(inviteRef, directInvite, { merge: true });
    } catch (e) {
      console.warn('sendDirectPartnerEmailInvite Firestore sync error:', e);
    }
  }

  return { success: true, invite: directInvite };
}

/**
 * 查詢特定用戶是否有收到伴侶直接邀請，或管理者發出的未結邀請
 */
export async function checkPendingDirectInvite(
  email: string
): Promise<{ incomingInvite: PartnerInviteData | null; sentInvite: PartnerInviteData | null }> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return { incomingInvite: null, sentInvite: null };

  let incomingInvite: PartnerInviteData | null = null;
  let sentInvite: PartnerInviteData | null = null;

  // 1. 本地快取發出的邀請
  try {
    const localSent = localStorage.getItem(DIRECT_SENT_STORAGE_KEY);
    if (localSent) {
      const parsed = JSON.parse(localSent) as PartnerInviteData;
      if (parsed && parsed.adminEmail?.toLowerCase() === cleanEmail && !isInviteExpired(parsed)) {
        sentInvite = parsed;
      }
    }
  } catch (e) {}

  // 2. 優先向伺服器查詢
  if (hasBackendServer()) {
    try {
      const res = await asyncWithTimeout(fetch(`/api/pending-invite?email=${encodeURIComponent(cleanEmail)}`), 2500, null as any);
      if (res && res.ok) {
        const data = await res.json();
        if (data && data.success) {
          if (data.incomingInvite && !isInviteExpired(data.incomingInvite)) {
            incomingInvite = data.incomingInvite as PartnerInviteData;
          }
          if (data.sentInvite && !isInviteExpired(data.sentInvite)) {
            sentInvite = data.sentInvite as PartnerInviteData;
          }
        }
      }
    } catch (e) {}
  }

  // 3. Firestore 備援查詢
  if (isFirestoreAvailable() && db) {
    try {
      if (!incomingInvite) {
        const docRef = doc(db, 'pending_partner_invites', cleanEmail);
        const snap = await asyncWithTimeout(getDoc(docRef), 2500, null as any);
        if (snap && snap.exists && snap.exists()) {
          const inv = snap.data() as PartnerInviteData;
          if (inv && inv.adminEmail && !isInviteExpired(inv)) {
            incomingInvite = inv;
          }
        }
      }

      if (!sentInvite) {
        const invCol = collection(db, 'pending_partner_invites');
        const q = query(invCol, where('adminEmail', '==', cleanEmail), limit(1));
        const qSnap = await asyncWithTimeout(getDocs(q), 2500, null as any);
        if (qSnap && !qSnap.empty) {
          const inv = qSnap.docs[0].data() as PartnerInviteData;
          if (inv && !isInviteExpired(inv)) {
            sentInvite = inv;
          }
        }
      }
    } catch (e) {}
  }

  return { incomingInvite, sentInvite };
}

/**
 * 取消管理者所發出的直接 Email 邀請
 */
export async function cancelDirectPartnerEmailInvite(
  adminEmail: string,
  partnerEmail?: string
): Promise<boolean> {
  const cleanAdmin = (adminEmail || '').trim().toLowerCase();
  const cleanPartner = (partnerEmail || '').trim().toLowerCase();

  try {
    localStorage.removeItem(DIRECT_SENT_STORAGE_KEY);
  } catch (e) {}

  if (hasBackendServer()) {
    try {
      await fetch('/api/cancel-direct-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: cleanAdmin, partnerEmail: cleanPartner })
      });
    } catch (e) {}
  }

  if (isFirestoreAvailable() && db) {
    try {
      if (cleanPartner) {
        await deleteDoc(doc(db, 'pending_partner_invites', cleanPartner));
      }
      if (cleanAdmin) {
        const invCol = collection(db, 'pending_partner_invites');
        const q = query(invCol, where('adminEmail', '==', cleanAdmin));
        const qSnap = await getDocs(q);
        qSnap.forEach(d => deleteDoc(d.ref));
      }
    } catch (e) {}
  }

  return true;
}

const PENDING_INVITE_STORAGE_KEY = 'banban_pending_invite';

/**
 * 從網址 (Query 或 Hash) 或 Session/Local 快取中偵測是否有尚未完成的伴侶邀請
 */
export function parseInviteFromCurrentUrl(): { raw: string; invite: PartnerInviteData | null } | null {
  if (typeof window === 'undefined') return null;

  try {
    const fullHref = window.location.href;

    let targetTokenOrCode = '';

    // 1. 檢查 URL 參數與 Hash
    const matchToken = fullHref.match(/(?:#|\?|&)(?:token|partner_invite|invite|pairing)=([A-Za-z0-9_-]+)/i);
    if (matchToken && matchToken[1]) {
      targetTokenOrCode = matchToken[1];
    } else {
      const matchJoin = fullHref.match(/(?:#|\?|&)(?:join|code)=([A-Za-z0-9_-]+)/i);
      if (matchJoin && matchJoin[1]) {
        targetTokenOrCode = matchJoin[1];
      }
    }

    if (targetTokenOrCode) {
      const resolved = resolveInviteCodeOrToken(targetTokenOrCode);
      const res = { raw: targetTokenOrCode, invite: resolved };
      try {
        localStorage.setItem(PENDING_INVITE_STORAGE_KEY, JSON.stringify(res));
      } catch (e) {}
      return res;
    }

    // 2. 檢查之前暫存的 pending invite
    const saved = localStorage.getItem(PENDING_INVITE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.raw || parsed.invite)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error parsing invite from URL:', e);
  }

  return null;
}

/**
 * 非同步智慧解析網址中的邀請資訊（支援即時向雲端與伺服器查詢）
 */
export async function parseAndResolveInviteFromCurrentUrl(): Promise<{ raw: string; invite: PartnerInviteData | null } | null> {
  const syncResult = parseInviteFromCurrentUrl();
  if (syncResult && syncResult.invite && syncResult.invite.adminEmail && syncResult.invite.gasWebUrl) {
    return syncResult;
  }

  const raw = syncResult?.raw || '';
  if (!raw && typeof window !== 'undefined') {
    const fullHref = window.location.href;
    const match = fullHref.match(/(?:#|\?|&)(?:token|partner_invite|invite|pairing|join|code)=([A-Za-z0-9_-]+)/i);
    if (match && match[1]) {
      const onlineResolved = await fetchInviteCodeOnline(match[1]);
      if (onlineResolved) {
        const res = { raw: match[1], invite: onlineResolved };
        try {
          localStorage.setItem(PENDING_INVITE_STORAGE_KEY, JSON.stringify(res));
        } catch (e) {}
        return res;
      }
    }
  } else if (raw) {
    const onlineResolved = await fetchInviteCodeOnline(raw);
    if (onlineResolved) {
      const res = { raw, invite: onlineResolved };
      try {
        localStorage.setItem(PENDING_INVITE_STORAGE_KEY, JSON.stringify(res));
      } catch (e) {}
      return res;
    }
  }

  return syncResult;
}

/**
 * 取得當前暫存的待綁定邀請
 */
export function getPendingInvite(): { raw: string; invite: PartnerInviteData | null } | null {
  return parseInviteFromCurrentUrl();
}

/**
 * 清除已完成綁定的待綁定邀請
 */
export function clearPendingInvite(): void {
  try {
    localStorage.removeItem(PENDING_INVITE_STORAGE_KEY);
  } catch (e) {}
}
