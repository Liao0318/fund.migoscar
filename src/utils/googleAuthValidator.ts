/**
 * Google 帳戶安全性驗證與檢查工具
 */

export interface GoogleValidationResult {
  isValidGoogleAccount: boolean;
  errorMessage?: string;
  domain?: string;
  normalizedEmail: string;
}

export function validateGoogleAccount(email: string): GoogleValidationResult {
  const cleanEmail = (email || '').trim().toLowerCase();
  
  if (!cleanEmail) {
    return {
      isValidGoogleAccount: false,
      errorMessage: '請輸入 Google 帳號 Email',
      normalizedEmail: ''
    };
  }

  // 基本 Email 格式檢驗
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return {
      isValidGoogleAccount: false,
      errorMessage: 'Email 格式不正確，請輸入完整的 Google 電子郵件地址',
      normalizedEmail: cleanEmail
    };
  }

  const parts = cleanEmail.split('@');
  const domain = parts[1];

  // 1. 標準 Gmail 帳號
  if (domain === 'gmail.com' || domain === 'googlemail.com' || domain === 'google.com') {
    return {
      isValidGoogleAccount: true,
      domain,
      normalizedEmail: cleanEmail
    };
  }

  // 2. 已知白名單或 Google Workspace 網域
  const googleKnownDomains = ['gmail.com', 'googlemail.com', 'google.com'];
  const isGoogleDomain = googleKnownDomains.includes(domain);

  // 若非直接 @gmail.com，檢查是否具備合格 Workspace 格式並提醒
  if (!isGoogleDomain) {
    // 阻擋常見非 Google 郵件服務商以落實嚴格把關
    const blockedNonGoogle = ['yahoo.com', 'hotmail.com', 'outlook.com', 'qq.com', '163.com', 'icloud.com', 'live.com', 'msn.com', 'mail.com'];
    if (blockedNonGoogle.includes(domain)) {
      return {
        isValidGoogleAccount: false,
        errorMessage: `此帳號網域 (@${domain}) 為第三方郵箱，本系統僅准許 Google 帳戶 (@gmail.com 或 Google Workspace) 登入！`,
        domain,
        normalizedEmail: cleanEmail
      };
    }
  }

  return {
    isValidGoogleAccount: true,
    domain,
    normalizedEmail: cleanEmail
  };
}

/**
 * 解析 Google GSI ID Token (JWT)
 */
export function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse JWT token', e);
    return null;
  }
}
