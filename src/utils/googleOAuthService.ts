/**
 * Google 官方身分驗證與彈跳視窗登入整合模組
 * 結合 Firebase Auth 與 Google Identity Services (GSI OAuth2 Token Client)
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut,
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AuthUser } from '../types';
import { cleanGoogleDisplayName } from './userPersona';

declare global {
  interface Window {
    google?: any;
  }
}

// 初始化 Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

let firestoreInstance: Firestore | null = null;
try {
  firestoreInstance = getFirestore(app);
} catch (e) {
  console.warn('Firestore initialization failed:', e);
}
export const db = firestoreInstance;
export const isFirestoreAvailable = () => Boolean(db);

export const OAUTH_CLIENT_ID = firebaseConfig.oAuthClientId || '795114622721-m4d0gm78bdd4es3om7hjmvot8mfhhfki.apps.googleusercontent.com';

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account'
});

let cachedAccessToken: string | null = null;

// 根據使用者 Email 或姓名判斷伴伴角色
export function determineUserRole(name: string, email: string): '廖' | '周' | 'admin' {
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  if (cleanName.includes('廖') || cleanName.includes('尹丞') || cleanEmail.includes('oscar')) {
    return '廖';
  }
  if (cleanName.includes('周') || cleanName.includes('沛緹') || cleanEmail.includes('peiti') || cleanEmail.includes('chou')) {
    return '周';
  }
  return 'admin';
}

/**
 * 使用 Firebase Auth 官方彈跳視窗登入 (Google Popup Sign-In)
 */
export async function signInWithGooglePopup(): Promise<{ user: AuthUser; accessToken?: string } | null> {
  try {
    const result = await signInWithPopup(auth, provider);

    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    if (accessToken) {
      cachedAccessToken = accessToken;
    }

    const fbUser = result.user;
    const cleanFbName = cleanGoogleDisplayName(fbUser.displayName || '');
    const role = determineUserRole(cleanFbName, fbUser.email || '');

    const user: AuthUser = {
      id: fbUser.email || fbUser.uid,
      name: cleanFbName || fbUser.email?.split('@')[0] || (role === '廖' ? '廖尹丞' : '周沛緹'),
      email: fbUser.email || '',
      avatar: fbUser.photoURL || undefined,
      role,
      googleVerified: true,
      googleSub: fbUser.uid,
      accessToken: accessToken,
      authMethod: 'google_oauth',
      isDevSandbox: false,
      loginTime: new Date().toISOString()
    };

    return { user, accessToken };
  } catch (err: any) {
    const errCode = err?.code || '';
    const errMsg = err?.message || '';
    console.warn('Firebase signInWithPopup info:', errCode || errMsg);
    throw err;
  }
}

/**
 * 透過 Google OAuth Access Token 取得使用者的 Google 個人資料 (userinfo API)
 */
export async function fetchGoogleUserInfo(accessToken: string): Promise<{
  id: string;
  email: string;
  name: string;
  picture?: string;
} | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!res.ok) {
      console.error('Failed to fetch userinfo from Google API', res.statusText);
      return null;
    }

    const data = await res.json();
    return {
      id: data.email || data.sub || data.id,
      email: data.email,
      name: data.name || data.given_name || data.email.split('@')[0],
      picture: data.picture
    };
  } catch (err) {
    console.error('Error fetching Google userinfo:', err);
    return null;
  }
}

/**
 * 透過 Google GSI OAuth2 Token Client 請求存取權杖
 */
export async function requestGoogleOAuthToken(): Promise<{ user: AuthUser; accessToken: string }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services 尚未載入，請稍候重試。'));
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: OAUTH_CLIENT_ID,
        scope: SCOPES.join(' '),
        callback: async (response: { access_token?: string; error?: string }) => {
          if (response.error) {
            reject(new Error(`Google 授權失敗：${response.error}`));
            return;
          }

          if (!response.access_token) {
            reject(new Error('未取得 Google 授權 Token'));
            return;
          }

          cachedAccessToken = response.access_token;
          const userInfo = await fetchGoogleUserInfo(response.access_token);
          if (!userInfo || !userInfo.email) {
            reject(new Error('無法自 Google API 取得個人資料'));
            return;
          }

          const cleanName = cleanGoogleDisplayName(userInfo.name || '');
          const role = determineUserRole(cleanName, userInfo.email);
          const user: AuthUser = {
            id: userInfo.email,
            name: cleanName || (role === '廖' ? '廖尹丞' : '周沛緹'),
            email: userInfo.email,
            avatar: userInfo.picture,
            role,
            googleVerified: true,
            googleSub: userInfo.id,
            accessToken: response.access_token,
            authMethod: 'google_oauth',
            isDevSandbox: false,
            loginTime: new Date().toISOString()
          };

          resolve({ user, accessToken: response.access_token });
        },
        error_callback: (err: any) => {
          reject(err);
        }
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      reject(err);
    }
  });
}

export async function syncGoogleUserProfile(): Promise<{ avatar?: string; name?: string; email?: string } | null> {
  try {
    const fbUser = auth.currentUser;
    if (fbUser) {
      // 重新整理 Firebase 使用者資訊
      await fbUser.reload().catch(() => {});
      return {
        avatar: fbUser.photoURL || undefined,
        name: fbUser.displayName || undefined,
        email: fbUser.email || undefined
      };
    }

    if (cachedAccessToken) {
      const userInfo = await fetchGoogleUserInfo(cachedAccessToken);
      if (userInfo) {
        return {
          avatar: userInfo.picture,
          name: userInfo.name,
          email: userInfo.email
        };
      }
    }
  } catch (err) {
    console.warn('syncGoogleUserProfile error:', err);
  }
  return null;
}

export async function signOutGoogle() {
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.warn('Sign out error:', e);
  }
  cachedAccessToken = null;
}
