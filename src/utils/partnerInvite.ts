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
 * 儲存伴侶綁定資訊 (三軌：本地 + 伺服器 API + Firestore)
 */
export async function savePartnerBindingInfo(info: CoupleBindingInfo): Promise<void> {
  try {
    localStorage.setItem(PARTNER_BINDING_STORAGE_KEY, JSON.stringify(info));
  } catch (e) {
    console.error('Error saving partner binding info locally', e);
  }

  // 伺服器 API 同步（僅在有後端伺服器環境下調用）
  if (hasBackendServer()) {
    try {
      fetch('/api/couple-binding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info)
      }).catch(() => {});
    } catch (e) {}
  }

  if (isFirestoreAvailable() && db) {
    const cleanAdmin = (info.adminEmail || '').trim().toLowerCase();
    const cleanPartner = (info.partnerEmail || '').trim().toLowerCase();
    const codeKey = (info.inviteCode || '').trim().toUpperCase();
    const codeNoPrefix = codeKey.replace(/^BB[-_]?/i, '');

    const syncPromises: Promise<any>[] = [];

    if (cleanAdmin) {
      const adminBindRef = doc(db, 'couple_bindings', cleanAdmin);
      syncPromises.push(setDoc(adminBindRef, { ...info, isBound: true, updatedAt: new Date().toISOString() }, { merge: true }));
      syncPromises.push(setDoc(doc(db, 'user_configs', cleanAdmin), {
        partnerEmail: cleanPartner,
        partnerName: info.partnerName || '伴侶',
        isBound: true,
        updatedAt: new Date().toISOString()
      }, { merge: true }));
    }
    if (cleanPartner) {
      const partnerBindRef = doc(db, 'couple_bindings', cleanPartner);
      syncPromises.push(setDoc(partnerBindRef, { ...info, isBound: true, updatedAt: new Date().toISOString() }, { merge: true }));
      syncPromises.push(setDoc(doc(db, 'user_configs', cleanPartner), {
        adminEmail: cleanAdmin,
        adminName: info.adminName || '主管理員',
        gasWebUrl: info.gasWebUrl || '',
        deploySheetUrl: info.deploySheetUrl || '',
        inviteCode: info.inviteCode,
        isBound: true,
        userRole: 'partner',
        updatedAt: new Date().toISOString()
      }, { merge: true }));
    }
    if (codeKey) {
      const boundInvitePayload = {
        isBound: true,
        partnerEmail: cleanPartner,
        partnerName: info.partnerName || '伴侶',
        boundAt: info.boundAt || new Date().toISOString()
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
export function getPartnerBindingInfo(): CoupleBindingInfo | null {
  try {
    const data = localStorage.getItem(PARTNER_BINDING_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return null;
}

/**
 * 從伺服器 API、Firestore 或本地讀取最新伴侶綁定資訊（具備跨裝置即時同步）
 */
export async function fetchPartnerBindingInfoOnline(email?: string): Promise<CoupleBindingInfo | null> {
  const local = getPartnerBindingInfo();
  const cleanEmail = (email || '').trim().toLowerCase();

  // 1. 優先從伺服器持久 API 抓取（僅在有後端伺服器環境下調用）
  if (hasBackendServer() && cleanEmail) {
    try {
      const res = await asyncWithTimeout(fetch(`/api/couple-binding?email=${encodeURIComponent(cleanEmail)}`), 1500, null as any);
      if (res && res.ok) {
        const data = await res.json();
        if (data && data.success && data.binding) {
          const bindData = data.binding as CoupleBindingInfo;
          savePartnerBindingInfo(bindData);
          return bindData;
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
          if (data && (data.partnerEmail || data.adminEmail)) {
            savePartnerBindingInfo(data);
            return data;
          }
        }

        // B. 查詢 user_configs 檢查是否有伴侶綁定紀錄
        const userRef = doc(db, 'user_configs', cleanEmail);
        const userSnap = await asyncWithTimeout(getDoc(userRef), 2500, null as any);
        if (userSnap && userSnap.exists && userSnap.exists()) {
          const udata = userSnap.data() as any;
          if (udata && (udata.partnerEmail || udata.partnerName)) {
            const synthesized: CoupleBindingInfo = {
              adminEmail: cleanEmail,
              adminName: udata.name || '主管理員',
              partnerEmail: udata.partnerEmail || '',
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

      // C. 檢查當前 active invite code 是否已被伴侶綁定
      const activeInvite = getActiveInviteCode();
      if (activeInvite && activeInvite.inviteCode) {
        const codeKey = activeInvite.inviteCode.toUpperCase();
        const inviteRef = doc(db, 'partner_invites', codeKey);
        const invSnap = await asyncWithTimeout(getDoc(inviteRef), 2500, null as any);
        if (invSnap && invSnap.exists && invSnap.exists()) {
          const invData = invSnap.data() as any;
          if (invData && (invData.isBound || invData.partnerEmail || invData.partnerName)) {
            const synthesized: CoupleBindingInfo = {
              adminEmail: activeInvite.adminEmail || cleanEmail || 'oscargh3359@gmail.com',
              adminName: activeInvite.adminName || '主管理員',
              partnerEmail: invData.partnerEmail || '',
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
 * 從任意輸入文字、邀請卡內容、或 URL 網址中智慧萃取出標準的 6 碼伴侶邀請碼 (BB-XXXX) 或 Token
 */
export function extractInviteCode(input: string): string | null {
  if (!input) return null;
  const str = input.trim();

  // 1. 若含有 token= 或 invite= (Base64 Token)
  const matchToken = str.match(/(?:#|\?|&)(?:token|invite)=([A-Za-z0-9_-]+)/i);
  if (matchToken && matchToken[1]) {
    return matchToken[1];
  }

  if (str.includes('invite=') || str.includes('token=')) {
    try {
      const url = new URL(str.startsWith('http') ? str : `https://dummy.local/${str}`);
      const token = url.searchParams.get('token') || url.searchParams.get('invite');
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
          if (inv && inv.adminEmail && inv.gasWebUrl) {
            saveActiveInviteCode(inv);
            return inv;
          }
        }
      }
    } catch (e) {}

    // 備援查詢：若以代碼查無結果，嘗試抓取伺服器全域資料庫並自動綁定
    try {
      const sysRes = await fetch('/api/system-database');
      if (sysRes.ok) {
        const sysData = await sysRes.json();
        if (sysData && sysData.success && sysData.database && sysData.database.gasWebUrl) {
          const sysInvite: PartnerInviteData = {
            inviteCode: codeToQuery.startsWith('BB-') ? codeToQuery : `BB-${codeToQuery.replace(/^BB-?/, '')}`,
            adminEmail: sysData.database.configuredBy || 'oscargh3359@gmail.com',
            adminName: '主管理員',
            gasWebUrl: sysData.database.gasWebUrl,
            deploySheetUrl: sysData.database.deploySheetUrl || '',
            createdAt: sysData.database.updatedAt || new Date().toISOString()
          };
          saveActiveInviteCode(sysInvite);
          return sysInvite;
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

            if (cloudInvite.gasWebUrl && cloudInvite.gasWebUrl.startsWith('http')) {
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
          if (cloudInvite && cloudInvite.gasWebUrl && cloudInvite.gasWebUrl.startsWith('http')) {
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

  // 6. 🛡️ 最終保險：若本機已有有效 GAS 網址（如管理員在同台裝置或曾設定過），自動對接
  try {
    const backupGas = (
      localStorage.getItem('muji_gas_web_url') || 
      localStorage.getItem('banban_permanent_gas_url') || 
      localStorage.getItem('banban_device_master_gas') || 
      ''
    ).trim();
    const backupSheet = (localStorage.getItem('muji_sheet_url') || '').trim();
    if (backupGas && backupGas.startsWith('http') && !backupGas.includes('/test/')) {
      const emergencyInvite: PartnerInviteData = {
        inviteCode: codeToQuery.startsWith('BB-') ? codeToQuery : `BB-${codeToQuery.replace(/^BB-?/, '')}`,
        adminEmail: 'oscargh3359@gmail.com',
        adminName: '主管理員',
        gasWebUrl: backupGas,
        deploySheetUrl: backupSheet,
        createdAt: new Date().toISOString()
      };
      saveActiveInviteCode(emergencyInvite);
      return emergencyInvite;
    }
  } catch (e) {}

  // 查無此邀請碼
  return null;
}

export const CUSTOM_PORTAL_BASE_URL = 'https://liao0318.github.io/fund.migoscar/';

/**
 * 取得當前應用程式的標準分享基底網址
 */
export function getAppShareBaseUrl(): string {
  // 優先使用自訂短網址/入口網址
  if (CUSTOM_PORTAL_BASE_URL) {
    return CUSTOM_PORTAL_BASE_URL.endsWith('/') ? CUSTOM_PORTAL_BASE_URL : `${CUSTOM_PORTAL_BASE_URL}/`;
  }
  if (typeof window !== 'undefined' && window.location.origin) {
    const origin = window.location.origin;
    const pathname = window.location.pathname || '';
    return `${origin}${pathname}`;
  }
  return 'https://liao0318.github.io/fund.migoscar/';
}

/**
 * 產生分享給伴侶的甜蜜邀請文案與專屬連結
 */
export function generatePartnerInviteShare(invite: PartnerInviteData, baseUrl?: string): {
  shareText: string;
  shareUrl: string;
} {
  const base = baseUrl || getAppShareBaseUrl();
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const token = encodeInvitePayload(invite);
  const shareUrl = token 
    ? `${cleanBase}#join=${invite.inviteCode}&token=${token}`
    : `${cleanBase}#join=${invite.inviteCode}`;

  const shareText = `💌【伴伴記❤️】情侶共同帳本邀請函

嗨！${invite.adminName || '你的另一半'} 邀請你加入《伴伴記》情侶專屬生活帳本！

🔑 你的專屬伴侶邀請碼：【 ${invite.inviteCode} 】
📲 點擊專屬連結立即加入綁定：
${shareUrl}

✨ 綁定說明：
點擊上方連結即可自動配對並同步生活公積金、代墊分帳與採購清單！`;

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

const PENDING_INVITE_STORAGE_KEY = 'banban_pending_invite';

/**
 * 從網址 (Query 或 Hash) 或 Session/Local 快取中偵測是否有尚未完成的伴侶邀請
 */
export function parseInviteFromCurrentUrl(): { raw: string; invite: PartnerInviteData | null } | null {
  if (typeof window === 'undefined') return null;

  try {
    const fullHref = window.location.href;
    const search = window.location.search;
    const hash = window.location.hash;

    let targetTokenOrCode = '';

    // 1. 檢查 URL 參數與 Hash
    const matchToken = fullHref.match(/(?:#|\?|&)(?:token|invite)=([A-Za-z0-9_-]+)/i);
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
