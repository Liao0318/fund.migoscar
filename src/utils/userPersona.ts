import { AuthUser, CoupleBindingInfo, RecordItem, ShoppingItem } from '../types';

export interface UserPersona {
  id: string;
  name: string;             // 完整姓名，例如: "廖尹丞" 或 "王小明"
  nickname: string;         // 暱稱，例如: "廖廖" 或 "小明"
  displayName: string;      // 依使用者挑選之字數偏好 (1字或2字) 顯示的名稱
  shortName: string;        // 強制單字簡稱 (1 個字，例如: "廖"、"周"、"待")
  fullName2Char: string;    // 強制雙字暱稱 (2 個字，例如: "廖廖"、"周周"、"待確認")
  nickname1Char: string;    // 單字稱呼 (1 個字)
  nickname2Char: string;    // 雙字暱稱 (2 個字)
  nicknameLengthPreference: '1-char' | '2-char'; // 使用者挑選的偏好字數
  initial: string;          // 字母縮寫 (例如: "L"、"W"、"待")
  romanizedName: string;    // 英文/羅馬拼音或帳號前綴，例如: "LIAO YIN-CHENG" 或 "WAITING FOR PARTNER"
  email?: string;           // Google Gmail
  avatar?: string;          // Google 帳號頭貼圖片 URL
  isCurrentUser: boolean;   // 是否為目前登入者
  roleKey: 'userA' | 'userB';
  themeColor: 'sky' | 'rose' | 'amber' | 'emerald';
  iconEmoji: string;        // 👦 或 👧 或 ⏳
  isPendingBinding?: boolean;     // 🌟 是否為尚未確認綁定的伴侶（等待受邀，女友尚未確定）
  bindingStatusText?: string;   // 🌟 狀態標籤文字，例如 "待確認 (等待受邀)" 或 "已綁定"
}

export interface PersonaPair {
  userA: UserPersona;
  userB: UserPersona;
  currentUserPersona: UserPersona | null;
  partnerPersona: UserPersona | null;
}

/**
 * 輔助函式：自姓名或 Email 產生乾淨的英文縮寫/羅馬標題
 */
export function cleanGoogleDisplayName(rawName?: string): string {
  if (!rawName) return '';
  // 去除 Google 帳號自動帶入的羅馬拼音或護照括號，例如: "廖尹丞 (YIN-CHENG, LIAO)" -> "廖尹丞"
  return rawName.replace(/\s*\([A-Za-z0-9\s,\-\.]+\)/g, '').trim();
}

export function deriveRomanizedName(name?: string, email?: string): string {
  if (name) {
    // 若本來就是英文
    if (/^[A-Za-z\s.-]+$/.test(name.trim())) {
      return name.trim().toUpperCase();
    }
    // 常見姓名對應 (相容既有設定)
    if (name.includes('廖') || name.includes('尹丞')) return 'Liao Yin-Cheng';
    if (name.includes('周') || name.includes('沛緹')) return 'Chou Pei-Ti';
  }
  if (email) {
    const prefix = email.split('@')[0];
    if (prefix.toLowerCase().includes('oscar')) return 'Liao Yin-Cheng';
    if (prefix.toLowerCase().includes('peiti') || prefix.toLowerCase().includes('chou')) return 'Chou Pei-Ti';
    return prefix.toUpperCase();
  }
  return name ? name.toUpperCase() : 'USER';
}

/**
 * 輔助函式：取得單字或首字首字母
 */
export function deriveInitial(name?: string, email?: string): string {
  if (name && name.trim()) {
    const clean = name.trim();
    if (/^[A-Za-z]/.test(clean)) {
      return clean.charAt(0).toUpperCase();
    }
    return clean.charAt(0);
  }
  if (email && email.trim()) {
    return email.charAt(0).toUpperCase();
  }
  return 'U';
}

/**
 * 核心：根據目前登入的使用者與伴侶綁定資訊，動態生成自適應的雙人角色檔案 (Personas)
 */
export function resolveUserPersonas(
  currentUser?: AuthUser | null,
  partnerBinding?: CoupleBindingInfo | null
): PersonaPair {
  // 📱 訪客模式或未登入狀態：嚴格確保不洩漏任何其他使用者的真實姓名與 Gmail
  if (!currentUser) {
    const guestUserA: UserPersona = {
      id: 'guest',
      name: '訪客',
      nickname: '訪客',
      displayName: '訪客',
      shortName: '訪',
      fullName2Char: '訪客',
      nickname1Char: '訪',
      nickname2Char: '訪客',
      nicknameLengthPreference: '2-char',
      initial: '訪',
      romanizedName: 'GUEST',
      email: '',
      avatar: '',
      isCurrentUser: true,
      roleKey: 'userA',
      themeColor: 'sky',
      iconEmoji: '👤',
      isPendingBinding: false,
      bindingStatusText: '未登入 (訪客模式)'
    };

    const guestUserB: UserPersona = {
      id: 'pending_partner',
      name: '伴侶 (未登入)',
      nickname: '伴侶',
      displayName: '伴侶',
      shortName: '伴',
      fullName2Char: '伴侶',
      nickname1Char: '伴',
      nickname2Char: '伴侶',
      nicknameLengthPreference: '2-char',
      initial: '伴',
      romanizedName: 'PARTNER',
      email: '',
      avatar: '',
      isCurrentUser: false,
      roleKey: 'userB',
      themeColor: 'rose',
      iconEmoji: '👥',
      isPendingBinding: false,
      bindingStatusText: '未登入 (訪客模式)'
    };

    return {
      userA: guestUserA,
      userB: guestUserB,
      currentUserPersona: guestUserA,
      partnerPersona: guestUserB
    };
  }

  const isPartnerLogin = currentUser?.userRole === 'partner';
  const isOscarEmail = currentUser?.email?.toLowerCase().includes('oscar');
  const isPeitiEmail = currentUser?.email?.toLowerCase().includes('peiti') || currentUser?.email?.toLowerCase().includes('chou');

  // ---------- 定義 Persona A (預設：管理員/首位使用者) ----------
  let userAName = '廖尹丞';
  let userANickname = '廖廖';
  let userAEmail = '';
  let userAAvatar = '';
  let isUserACurrent = false;

  // ---------- 定義 Persona B (伴侶/第二位使用者) ----------
  let userBName = '待確認伴侶';
  let userBNickname = '待確認';
  let userBEmail = '';
  let userBAvatar = '';
  let isUserBCurrent = false;

  // 💌 判斷伴侶是否已完成確認受邀綁定
  // 若為伴侶本人登入 (userRole === 'partner')，自身即伴侶
  // 若為管理者端，唯有當 partnerBinding 或 currentUser 明確包含有效之 partnerEmail (且非空) 時，才視為已確認綁定
  // 尚未確認綁定前，絕不擅自預設任何女性名字（伴侶可能會換），一律以「待確認 (反白)」呈現，等待對方受邀加入！
  const isPartnerBound = isPartnerLogin
    ? true
    : Boolean(
        (partnerBinding?.partnerEmail && partnerBinding.partnerEmail.trim().length > 0) ||
        (currentUser?.partnerEmail && currentUser.partnerEmail.trim().length > 0)
      );

  if (currentUser) {
    const cleanCurrentName = cleanGoogleDisplayName(currentUser.name);
    const cleanPartnerName = cleanGoogleDisplayName(partnerBinding?.partnerName || currentUser.partnerName);
    const cleanAdminName = cleanGoogleDisplayName(partnerBinding?.adminName || currentUser.adminName);

    if (isPartnerLogin) {
      // 目前登入者為伴侶端
      isUserBCurrent = true;
      userBName = cleanCurrentName || (isPeitiEmail ? '周沛緹' : '伴侶');
      userBNickname = currentUser.nickname?.trim() || cleanCurrentName || (isPeitiEmail ? '周周' : '伴侶');
      userBEmail = currentUser.email || '';
      userBAvatar = currentUser.avatar || '';

      // User A 則由伴侶綁定資訊或 adminName 取得
      userAName = cleanAdminName || (isOscarEmail ? '廖尹丞' : '管理員');
      userANickname = partnerBinding?.adminNickname?.trim() || cleanAdminName || (isOscarEmail ? '廖廖' : '管理員');
      userAEmail = partnerBinding?.adminEmail || currentUser.adminEmail || '';
      userAAvatar = partnerBinding?.adminAvatar || '';
    } else {
      // 目前登入者為管理者 / 主帳號端
      isUserACurrent = true;
      userAName = cleanCurrentName || (isOscarEmail ? '廖尹丞' : '管理員');
      userANickname = currentUser.nickname?.trim() || cleanCurrentName || (isOscarEmail ? '廖廖' : '管理員');
      userAEmail = currentUser.email || '';
      userAAvatar = currentUser.avatar || '';

      // User B：唯有已確認受邀綁定，才讀取伴侶資訊；否則一律維持「待確認伴侶」
      if (isPartnerBound) {
        userBName = cleanPartnerName || '伴侶';
        userBNickname = partnerBinding?.partnerNickname?.trim() || cleanPartnerName || '伴侶';
        userBEmail = partnerBinding?.partnerEmail || currentUser.partnerEmail || '';
        userBAvatar = partnerBinding?.partnerAvatar || '';
      } else {
        userBName = '待確認伴侶';
        userBNickname = '待確認';
        userBEmail = '';
        userBAvatar = '';
      }
    }
  }

  // 🖼️ 強化 Google Gmail 帳戶大頭貼解析 (自本地快取與帳號中取得真實 Gmail 圖片)
  if (typeof window !== 'undefined') {
    try {
      if (currentUser?.email && currentUser.avatar) {
        localStorage.setItem(`banban_user_avatar_${currentUser.email.trim().toLowerCase()}`, currentUser.avatar);
      }
      if (!userAAvatar && userAEmail) {
        userAAvatar = localStorage.getItem(`banban_user_avatar_${userAEmail.trim().toLowerCase()}`) || '';
      }
      if (!userBAvatar && userBEmail) {
        userBAvatar = localStorage.getItem(`banban_user_avatar_${userBEmail.trim().toLowerCase()}`) || '';
      }
    } catch (e) {}
  }
  if (!userAAvatar && isOscarEmail && currentUser?.avatar) {
    userAAvatar = currentUser.avatar;
  }

  // 🏷️ 解析 User A 稱呼字數偏好 (單字 1 個字 vs 雙字 2 個字)
  let userA1Char = '';
  let userA2Char = '';
  let userALengthPref: '1-char' | '2-char' = '2-char';

  if (isUserACurrent && currentUser) {
    userA1Char = currentUser.nickname1Char || '';
    userA2Char = currentUser.nickname2Char || '';
    if (currentUser.nicknameLengthPreference) {
      userALengthPref = currentUser.nicknameLengthPreference;
    }
  }
  if (!userA1Char && partnerBinding?.adminNickname1Char) {
    userA1Char = partnerBinding.adminNickname1Char;
  }
  if (!userA2Char && partnerBinding?.adminNickname2Char) {
    userA2Char = partnerBinding.adminNickname2Char;
  }
  if (partnerBinding?.adminNicknameLengthPreference) {
    userALengthPref = partnerBinding.adminNicknameLengthPreference;
  }

  if (typeof window !== 'undefined' && userAEmail) {
    const cleanA = userAEmail.trim().toLowerCase();
    try {
      const savedPref = localStorage.getItem(`banban_user_nickname_length_${cleanA}`);
      if (savedPref === '1-char' || savedPref === '2-char') {
        userALengthPref = savedPref;
      }
      const saved1 = localStorage.getItem(`banban_user_nickname_1char_${cleanA}`);
      if (saved1 && !userA1Char) userA1Char = saved1;
      const saved2 = localStorage.getItem(`banban_user_nickname_2char_${cleanA}`);
      if (saved2 && !userA2Char) userA2Char = saved2;
    } catch (e) {}
  }

  // 推導 User A 單字稱呼 (1 個字)
  if (!userA1Char) {
    if (userANickname && userANickname.length === 1) {
      userA1Char = userANickname;
    } else if (userAName.includes('廖') || userANickname.includes('廖') || isOscarEmail) {
      userA1Char = '廖';
    } else {
      userA1Char = userANickname?.[0] || userAName?.[0] || '廖';
    }
  }

  // 推導 User A 雙字暱稱 (2 個字)
  if (!userA2Char) {
    if (userANickname && userANickname.length === 2) {
      userA2Char = userANickname;
    } else if (userAName.includes('廖') || userANickname.includes('廖') || isOscarEmail) {
      userA2Char = '廖廖';
    } else if (userAName.length >= 2) {
      userA2Char = userAName.slice(0, 2);
    } else {
      userA2Char = userA1Char + userA1Char;
    }
  }

  // 若使用者已輸入單字暱稱且未特別指定偏好，尊重單字
  if (userANickname && userANickname.length === 1 && !currentUser?.nicknameLengthPreference) {
    userALengthPref = '1-char';
    userA1Char = userANickname;
  }

  // 🌟 尊重使用者自訂暱稱：如果有設定暱稱了，就顯示暱稱！
  let userADisplayName = userALengthPref === '1-char' ? userA1Char : userA2Char;
  if (userANickname && userANickname !== '廖廖' && userANickname !== '管理員') {
    if (userALengthPref === '1-char' && userA1Char) {
      userADisplayName = userA1Char;
    } else if (userALengthPref === '2-char' && userA2Char) {
      userADisplayName = userA2Char;
    } else {
      userADisplayName = userANickname;
    }
  }

  // 🏷️ 解析 User B 稱呼字數偏好 (單字 1 個字 vs 雙字 2 個字)
  let userB1Char = '';
  let userB2Char = '';
  let userBLengthPref: '1-char' | '2-char' = '2-char';

  if (isUserBCurrent && currentUser) {
    userB1Char = currentUser.nickname1Char || '';
    userB2Char = currentUser.nickname2Char || '';
    if (currentUser.nicknameLengthPreference) {
      userBLengthPref = currentUser.nicknameLengthPreference;
    }
  }
  if (!userB1Char && partnerBinding?.partnerNickname1Char) {
    userB1Char = partnerBinding.partnerNickname1Char;
  }
  if (!userB2Char && partnerBinding?.partnerNickname2Char) {
    userB2Char = partnerBinding.partnerNickname2Char;
  }
  if (partnerBinding?.partnerNicknameLengthPreference) {
    userBLengthPref = partnerBinding.partnerNicknameLengthPreference;
  }

  if (typeof window !== 'undefined' && userBEmail) {
    const cleanB = userBEmail.trim().toLowerCase();
    try {
      const savedPref = localStorage.getItem(`banban_user_nickname_length_${cleanB}`);
      if (savedPref === '1-char' || savedPref === '2-char') {
        userBLengthPref = savedPref;
      }
      const saved1 = localStorage.getItem(`banban_user_nickname_1char_${cleanB}`);
      if (saved1 && !userB1Char) userB1Char = saved1;
      const saved2 = localStorage.getItem(`banban_user_nickname_2char_${cleanB}`);
      if (saved2 && !userB2Char) userB2Char = saved2;
    } catch (e) {}
  }

  // 🏷️ 推導 User B 單字與雙字稱呼
  if (!isPartnerBound) {
    userB1Char = '待';
    userB2Char = '待確認';
  } else {
    // 只有已確認綁定伴侶後才推導其真實稱呼
    if (!userB1Char) {
      if (userBNickname && userBNickname.length === 1) {
        userB1Char = userBNickname;
      } else if (userBName.includes('周') || userBNickname.includes('周') || isPeitiEmail) {
        userB1Char = '周';
      } else {
        userB1Char = userBNickname?.[0] || userBName?.[0] || '伴';
      }
    }

    if (!userB2Char) {
      if (userBNickname && userBNickname.length === 2) {
        userB2Char = userBNickname;
      } else if (userBName.includes('周') || userBNickname.includes('周') || isPeitiEmail) {
        userB2Char = '周周';
      } else if (userBName.length >= 2) {
        userB2Char = userBName.slice(0, 2);
      } else {
        userB2Char = userB1Char + userB1Char;
      }
    }
  }

  // 若使用者已輸入單字暱稱且未特別指定偏好，尊重單字
  if (isPartnerBound && userBNickname && userBNickname.length === 1 && !currentUser?.nicknameLengthPreference) {
    userBLengthPref = '1-char';
    userB1Char = userBNickname;
  }

  // 🌟 尊重伴侶自訂暱稱：如果有設定暱稱了，就顯示暱稱！
  let userBDisplayName = !isPartnerBound ? '待確認' : (userBLengthPref === '1-char' ? userB1Char : userB2Char);
  if (isPartnerBound && userBNickname && userBNickname !== '待確認' && userBNickname !== '伴侶') {
    if (userBLengthPref === '1-char' && userB1Char) {
      userBDisplayName = userB1Char;
    } else if (userBLengthPref === '2-char' && userB2Char) {
      userBDisplayName = userB2Char;
    } else {
      userBDisplayName = userBNickname;
    }
  }

  const personaA: UserPersona = {
    id: userAEmail || 'user-a',
    name: userAName,
    nickname: userANickname,
    displayName: userADisplayName,
    shortName: userA1Char,
    fullName2Char: userA2Char,
    nickname1Char: userA1Char,
    nickname2Char: userA2Char,
    nicknameLengthPreference: userALengthPref,
    initial: deriveInitial(userADisplayName || userAName, userAEmail),
    romanizedName: deriveRomanizedName(userAName, userAEmail),
    email: userAEmail,
    avatar: userAAvatar,
    isCurrentUser: isUserACurrent,
    roleKey: 'userA',
    themeColor: 'sky',
    iconEmoji: '👦',
    isPendingBinding: false,
    bindingStatusText: '已綁定'
  };

  const personaB: UserPersona = {
    id: !isPartnerBound ? 'user-b-pending' : (userBEmail || 'user-b'),
    name: !isPartnerBound ? '待確認伴侶' : userBName,
    nickname: !isPartnerBound ? '待確認' : userBNickname,
    displayName: userBDisplayName,
    shortName: !isPartnerBound ? '待' : userB1Char,
    fullName2Char: !isPartnerBound ? '待確認' : userB2Char,
    nickname1Char: !isPartnerBound ? '待' : userB1Char,
    nickname2Char: !isPartnerBound ? '待確認' : userB2Char,
    nicknameLengthPreference: userBLengthPref,
    initial: !isPartnerBound ? '待' : deriveInitial(userBDisplayName || userBName, userBEmail),
    romanizedName: !isPartnerBound ? 'WAITING FOR INVITE' : deriveRomanizedName(userBName, userBEmail),
    email: !isPartnerBound ? '' : userBEmail,
    avatar: !isPartnerBound ? '' : userBAvatar,
    isCurrentUser: isUserBCurrent,
    roleKey: 'userB',
    themeColor: 'rose',
    iconEmoji: !isPartnerBound ? '⏳' : '👧',
    isPendingBinding: !isPartnerBound,
    bindingStatusText: !isPartnerBound ? '待確認 (等待受邀)' : '已綁定'
  };

  return {
    userA: personaA,
    userB: personaB,
    currentUserPersona: isUserACurrent ? personaA : isUserBCurrent ? personaB : null,
    partnerPersona: isUserACurrent ? personaB : isUserBCurrent ? personaA : null
  };
}

/**
 * 檢查某一筆記帳紀錄是否屬於 User A (支援自訂姓名、暱稱、簡稱及舊版相容標記)
 */
export function isRecordOfUserA(recordPayer: string, userA: UserPersona, userB: UserPersona): boolean {
  if (!recordPayer) return false;
  const p = recordPayer.trim();

  // 1. 精確符合 User A
  if (
    p === userA.name ||
    p === userA.nickname ||
    p === userA.displayName ||
    p === userA.shortName ||
    p === userA.nickname1Char ||
    p === userA.nickname2Char ||
    p === userA.fullName2Char ||
    (userA.email && p === userA.email)
  ) {
    return true;
  }

  // 2. 若為既有廖之別名
  if (userA.name.includes('廖') || userA.nickname.includes('廖') || userA.name === '廖尹丞') {
    if (p.includes('廖') || p === 'Liao' || p === 'L') {
      return true;
    }
  }

  // 3. 反向排除：若已符合 User B 則必定不是 User A
  if (isRecordOfUserB(p, userA, userB)) {
    return false;
  }

  return false;
}

/**
 * 檢查某一筆記帳紀錄是否屬於 User B
 */
export function isRecordOfUserB(recordPayer: string, userA: UserPersona, userB: UserPersona): boolean {
  if (!recordPayer) return false;
  const p = recordPayer.trim();

  // 1. 精確符合 User B
  if (
    p === userB.name ||
    p === userB.nickname ||
    p === userB.displayName ||
    p === userB.shortName ||
    p === userB.nickname1Char ||
    p === userB.nickname2Char ||
    p === userB.fullName2Char ||
    (userB.email && p === userB.email)
  ) {
    return true;
  }

  // 2. 若伴侶尚在待確認狀態，相容歷史紀錄之標記（如周、周周、伴侶、待確認）
  if (userB.isPendingBinding) {
    if (
      p === '周' ||
      p === '周周' ||
      p === '周沛緹' ||
      p === '伴侶' ||
      p === '待確認' ||
      p === '待' ||
      p === '待確認伴侶' ||
      p.includes('待確認')
    ) {
      return true;
    }
  }

  // 3. 若為既有周之別名
  if (userB.name.includes('周') || userB.nickname.includes('周') || userB.name === '周沛緹') {
    if (p.includes('周') || p === 'Chou' || p === 'P') {
      return true;
    }
  }

  return false;
}

/**
 * 格式化記帳人顯示標籤
 */
export function formatPayerDisplayName(payer: string, userA: UserPersona, userB: UserPersona): string {
  if (!payer) return '無';
  if (payer === '共同帳戶' || payer === '共同基金') return '共同帳戶';
  if (isRecordOfUserA(payer, userA, userB)) return userA.displayName;
  if (isRecordOfUserB(payer, userA, userB)) return userB.displayName;
  return payer;
}
