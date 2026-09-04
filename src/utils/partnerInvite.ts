import { PartnerInviteData, CoupleBindingInfo } from '../types';

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
    if (parsed && parsed.inviteCode) {
      return parsed as PartnerInviteData;
    }
    return null;
  } catch (err) {
    console.warn('Failed to decode invite token', err);
    return null;
  }
}

/**
 * 儲存邀請碼至本地註冊表
 */
export function saveActiveInviteCode(invite: PartnerInviteData): void {
  try {
    localStorage.setItem(ACTIVE_INVITE_STORAGE_KEY, JSON.stringify(invite));
    const existing = getInviteRegistry();
    existing[invite.inviteCode.toUpperCase()] = invite;
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Error saving active invite code', e);
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
 * 儲存伴侶綁定資訊
 */
export function savePartnerBindingInfo(info: CoupleBindingInfo): void {
  try {
    localStorage.setItem(PARTNER_BINDING_STORAGE_KEY, JSON.stringify(info));
  } catch (e) {
    console.error('Error saving partner binding info', e);
  }
}

/**
 * 讀取伴侶綁定資訊
 */
export function getPartnerBindingInfo(): CoupleBindingInfo | null {
  try {
    const data = localStorage.getItem(PARTNER_BINDING_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return null;
}

/**
 * 解除伴侶綁定紀錄
 */
export function removePartnerBinding(): void {
  try {
    localStorage.removeItem(PARTNER_BINDING_STORAGE_KEY);
  } catch (e) {}
}

/**
 * 根據邀請碼或 Token 搜尋邀請資訊
 */
export function resolveInviteCodeOrToken(input: string): PartnerInviteData | null {
  if (!input) return null;
  const clean = input.trim();

  // 1. 若 input 本身為 Base64 Token
  const fromToken = decodeInvitePayload(clean);
  if (fromToken) return fromToken;

  // 2. 若 input 包含 URL (例如 https://.../?invite=xxx 或 ?code=xxx)
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

  // 3. 從本地註冊表比對
  const registry = getInviteRegistry();
  const upper = clean.toUpperCase();
  if (registry[upper]) {
    return registry[upper];
  }

  // 4. 比對目前啟用的邀請碼
  try {
    const active = localStorage.getItem(ACTIVE_INVITE_STORAGE_KEY);
    if (active) {
      const parsed = JSON.parse(active);
      if (parsed && parsed.inviteCode && parsed.inviteCode.toUpperCase() === upper) {
        return parsed;
      }
    }
  } catch (e) {}

  // 5. 若格式符合 BB-XXXX 但在註冊表中尚未登錄 (跨裝置容錯)
  if (/^BB-[A-Z0-9]{4,8}$/i.test(upper)) {
    return {
      inviteCode: upper,
      adminEmail: '',
      adminName: '主管理員',
      gasWebUrl: localStorage.getItem('muji_gas_web_url') || '',
      deploySheetUrl: localStorage.getItem('muji_deploy_sheet_url') || localStorage.getItem('muji_spreadsheet_url') || '',
      createdAt: new Date().toISOString()
    };
  }

  return null;
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
