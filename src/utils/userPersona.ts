import { AuthUser, CoupleBindingInfo } from '../types';

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
  }
  if (email) {
    const prefix = email.split('@')[0];
    return prefix.replace(/[^A-Za-z0-9_-]/g, '').toUpperCase() || 'USER';
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
  // 🛠️ 開發者沙盒模式 (DEV Sandbox)：100% 獨立隔離的角色設定，嚴格杜絕與真實 Google 用戶資料混雜
  if (currentUser?.isDevSandbox) {
    const devUserA: UserPersona = {
      id: 'developer.admin@banbanji.internal',
      name: '系統架構師 (開發模式)',
      nickname: '架構師',
      displayName: '架構師',
      shortName: '架',
      fullName2Char: '架構',
      nickname1Char: '架',
      nickname2Char: '架構',
      nicknameLengthPreference: '2-char',
      initial: 'DEV',
      romanizedName: 'DEV ARCHITECT',
      email: 'developer.admin@banbanji.internal',
      avatar: '',
      isCurrentUser: true,
      roleKey: 'userA',
      themeColor: 'sky',
      iconEmoji: '🛠️',
      isPendingBinding: false,
      bindingStatusText: '沙盒開發環境'
    };

    const devUserB: UserPersona = {
      id: 'sandbox.partner@banbanji.internal',
      name: '沙盒測試伴侶',
      nickname: '測試伴侶',
      displayName: '測試伴侶',
      shortName: '伴',
      fullName2Char: '伴侶',
      nickname1Char: '伴',
      nickname2Char: '伴侶',
      nicknameLengthPreference: '2-char',
      initial: '伴',
      romanizedName: 'SANDBOX PARTNER',
      email: 'sandbox.partner@banbanji.internal',
      avatar: '',
      isCurrentUser: false,
      roleKey: 'userB',
      themeColor: 'rose',
      iconEmoji: '👧',
      isPendingBinding: false,
      bindingStatusText: '沙盒展示伴侶'
    };

    return {
      userA: devUserA,
      userB: devUserB,
      currentUserPersona: devUserA,
      partnerPersona: devUserB
    };
  }

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

  const cleanCurrentEmail = (currentUser?.email || '').trim().toLowerCase();
  const cleanAdminEmail = (partnerBinding?.adminEmail || currentUser?.adminEmail || '').trim().toLowerCase();
  const cleanPartnerEmail = (partnerBinding?.partnerEmail || currentUser?.partnerEmail || '').trim().toLowerCase();

  // 判斷是否為伴侶登入端（需確保伴侶 Email 與管理員 Email 不同且不是自綁自）
  const isPartnerLogin = currentUser?.userRole === 'partner' || 
    (Boolean(currentUser?.adminEmail) && currentUser?.adminEmail.toLowerCase() !== cleanCurrentEmail) || 
    (Boolean(cleanPartnerEmail) && cleanPartnerEmail === cleanCurrentEmail && cleanPartnerEmail !== cleanAdminEmail);

  // ---------- 定義 Persona A (預設：管理員/首位使用者) ----------
  let userAName = '管理員';
  let userANickname = '我';
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
  // 若為管理者端，唯有當 partnerBinding 或 currentUser 明確包含與管理員不同之 partnerEmail (且非空) 時，才視為已確認綁定
  // 尚未確認綁定前，絕不擅自預設任何特定名字（任何情侶皆可自由配對），一律以「待確認 (反白)」呈現，等待對方受邀加入！
  const isPartnerBound = isPartnerLogin
    ? true
    : Boolean(
        (cleanPartnerEmail && cleanPartnerEmail.length > 0 && cleanPartnerEmail !== cleanCurrentEmail && cleanPartnerEmail !== cleanAdminEmail) ||
        (currentUser?.partnerEmail && currentUser.partnerEmail.trim().length > 0 && currentUser.partnerEmail.trim().toLowerCase() !== cleanCurrentEmail)
      );

  if (currentUser) {
    const cleanCurrentName = cleanGoogleDisplayName(currentUser.name);
    const cleanPartnerName = cleanGoogleDisplayName(partnerBinding?.partnerName || currentUser.partnerName);
    const cleanAdminName = cleanGoogleDisplayName(partnerBinding?.adminName || currentUser.adminName);

    if (isPartnerLogin) {
      // 目前登入者為伴侶端
      isUserBCurrent = true;
      userBName = cleanCurrentName || '伴侶';
      userBNickname = currentUser.nickname?.trim() || cleanCurrentName || '伴侶';
      userBEmail = currentUser.email || '';
      userBAvatar = currentUser.avatar || '';

      // User A 則由伴侶綁定資訊或 adminName 取得
      userAName = cleanAdminName || '管理員';
      userANickname = partnerBinding?.adminNickname?.trim() || cleanAdminName || '管理員';
      userAEmail = partnerBinding?.adminEmail || currentUser.adminEmail || '';
      userAAvatar = partnerBinding?.adminAvatar || '';
    } else {
      // 目前登入者為管理者 / 主帳號端
      isUserACurrent = true;
      userAName = cleanCurrentName || '管理員';
      userANickname = currentUser.nickname?.trim() || cleanCurrentName || '我';
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
  if (!userAAvatar && currentUser?.avatar) {
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
    } else if (userAName && userAName !== '管理員' && userAName.length > 0) {
      userA1Char = userAName.charAt(0);
    } else if (userANickname && userANickname !== '我' && userANickname.length > 0) {
      userA1Char = userANickname.charAt(0);
    } else {
      userA1Char = '我';
    }
  }

  // 推導 User A 雙字暱稱 (2 個字)
  if (!userA2Char) {
    if (userANickname && userANickname.length === 2) {
      userA2Char = userANickname;
    } else if (userAName && userAName !== '管理員' && userAName.length >= 2) {
      userA2Char = userAName.slice(0, 2);
    } else if (userA1Char && userA1Char !== '我') {
      userA2Char = userA1Char + userA1Char;
    } else {
      userA2Char = userANickname || userAName || '管理員';
    }
  }

  // 若使用者已輸入單字暱稱且未特別指定偏好，尊重單字
  if (userANickname && userANickname.length === 1 && !currentUser?.nicknameLengthPreference) {
    userALengthPref = '1-char';
    userA1Char = userANickname;
  }

  // 🌟 尊重使用者自訂暱稱：如果有設定暱稱了，就顯示暱稱！
  let userADisplayName = userALengthPref === '1-char' ? userA1Char : userA2Char;
  if (userANickname && userANickname !== '管理員' && userANickname !== '我') {
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
      } else if (userBName && !userBName.includes('待確認') && userBName !== '伴侶') {
        userB1Char = userBName.charAt(0);
      } else if (userBNickname && !userBNickname.includes('待確認') && userBNickname !== '伴侶') {
        userB1Char = userBNickname.charAt(0);
      } else {
        userB1Char = isPartnerBound ? '伴' : '待';
      }
    }

    if (!userB2Char) {
      if (userBNickname && userBNickname.length === 2) {
        userB2Char = userBNickname;
      } else if (userBName && !userBName.includes('待確認') && userBName !== '伴侶' && userBName.length >= 2) {
        userB2Char = userBName.slice(0, 2);
      } else if (userB1Char && userB1Char !== '待' && userB1Char !== '伴') {
        userB2Char = userB1Char + userB1Char;
      } else {
        userB2Char = isPartnerBound ? '伴侶' : '待確認';
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

  const cleanUserAId = (userAEmail || '').trim().toLowerCase();
  const cleanUserBId = (userBEmail || '').trim().toLowerCase();

  const personaA: UserPersona = {
    id: cleanUserAId || 'user-a',
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
    id: !isPartnerBound ? 'user-b-pending' : (cleanUserBId || 'user-b'),
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

export const NON_PERSON_ITEM_TERMS = [
  '晚餐', '午餐', '早餐', '宵夜', '點心', '下午茶', '夜市', '便當', '吃飯', '大餐',
  '大全聯', '全聯', '好市多', '家樂福', '7-11', '7-eleven', '全家', '萊爾富', 'ok超商', '美廉社', '愛買', '寶雅', '屈臣氏', '康是美', '大潤發', 'ikea', '特力屋',
  '日常生活支出', '日常代墊支出', '日常支出', '生活支出', '固定公積金', '公積金固定撥入', '支出-日常代墊', '收入-固定公積金',
  '餐飲', '生活用品', '交通', '娛樂', '醫療', '住宿', '購物', '其他', '支出', '收入',
  '加油', '高鐵', '台鐵', '捷運', '計程車', '停車費', '買菜', '水果', '飲料', '咖啡', '外送', 'ubereats', 'foodpanda',
  '蝦皮', '淘寶', 'momo', 'pchome', '水電費', '瓦斯費', '房租', '管理費', '電信費', '網路費', '未分類項目'
];

export function isNonPersonTerm(text?: string): boolean {
  if (!text || typeof text !== 'string') return true;
  const s = text.trim().toLowerCase();
  if (!s) return true;
  if (/^\d+(\.\d+)?$/.test(s)) return true; // 純數字
  if (s.includes('gmt') || /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(s) || /^\d{4}[-/]\d{1,2}$/.test(s)) return true; // 日期
  if (s.startsWith('rec_')) return true; // ID
  return NON_PERSON_ITEM_TERMS.some(term => s === term || (s.length <= 8 && s.includes(term)));
}

/**
 * 檢查某一筆記帳紀錄是否屬於 User A (支援自訂姓名、暱稱、簡稱及舊版相容標記)
 */
export function isRecordOfUserA(recordPayer: string, userA: UserPersona, userB: UserPersona): boolean {
  if (!recordPayer) return false;
  const p = recordPayer.trim();

  // 排除品項、類別、金額與日期等非人名字串
  if (isNonPersonTerm(p)) {
    return false;
  }

  // 排除共同帳戶
  if (p === '共同帳戶' || p === '共同基金' || p === '公積金' || p === '共同') {
    return false;
  }

  // 1. 精確符合 User A 各種可能名稱、暱稱或帳號
  if (
    p === userA.name ||
    p === userA.nickname ||
    p === userA.displayName ||
    p === userA.shortName ||
    p === userA.nickname1Char ||
    p === userA.nickname2Char ||
    p === userA.fullName2Char ||
    (userA.email && p.toLowerCase() === userA.email.toLowerCase())
  ) {
    return true;
  }

  // 2. 通用自稱／管理員名稱
  if (p === '我' || p === '本人' || p === '自己' || p === '主要付款人') {
    return userA.isCurrentUser;
  }

  // 3. User A 包含常見姓名相容比對 (例如廖尹丞、廖、尹丞、Oscar)
  if (
    (userA.name && (p.includes(userA.name) || (userA.name.length >= 2 && p.includes(userA.name.slice(0, 2))))) ||
    (userA.shortName && p === userA.shortName) ||
    (userA.nickname && p === userA.nickname)
  ) {
    return true;
  }

  // 4. 若為 DEV 沙盒環境，相容測試資料常用名（如架構師、DEV）
  if (userA.id === 'developer.admin@banbanji.internal' || userA.name.includes('架構師')) {
    if (p.includes('架構') || p === 'DEV' || p === '我' || p === '管理員' || p === '廖' || p === '廖尹丞') {
      return true;
    }
  }

  // 5. 若 User A 為特定使用者 (如 Oscar / 廖)，相容其常見代稱
  if (
    (userA.email && (userA.email.toLowerCase().includes('oscar') || userA.email.toLowerCase().includes('liao'))) ||
    userA.name.includes('廖') || userA.name.includes('尹丞')
  ) {
    if (p.includes('廖') || p.includes('尹丞') || p.toLowerCase().includes('oscar')) {
      return true;
    }
  }

  return false;
}

/**
 * 檢查某一筆記帳紀錄是否屬於 User B
 */
export function isRecordOfUserB(recordPayer: string, userA: UserPersona, userB: UserPersona): boolean {
  if (!recordPayer) return false;
  const p = recordPayer.trim();

  // 排除品項、類別、金額與日期等非人名字串
  if (isNonPersonTerm(p)) {
    return false;
  }

  // 排除共同帳戶
  if (p === '共同帳戶' || p === '共同基金' || p === '公積金' || p === '共同') {
    return false;
  }

  // 1. 若已明確符合 User A，則必定非 User B
  if (isRecordOfUserA(p, userA, userB)) {
    return false;
  }

  // 2. 精確符合 User B 各種可能名稱或暱稱
  if (
    p === userB.name ||
    p === userB.nickname ||
    p === userB.displayName ||
    p === userB.shortName ||
    p === userB.nickname1Char ||
    p === userB.nickname2Char ||
    p === userB.fullName2Char ||
    (userB.email && p.toLowerCase() === userB.email.toLowerCase())
  ) {
    return true;
  }

  // 3. 通用伴侶標記比對
  if (
    p === '伴侶' ||
    p === '待確認' ||
    p === '待' ||
    p === '待確認伴侶' ||
    p === '待配對' ||
    p === '對方' ||
    p === '另一半' ||
    p.includes('待確認') ||
    p.includes('待配對')
  ) {
    return true;
  }

  // 4. 若為 DEV 沙盒環境，相容測試伴侶常用名（如測試伴侶、伴侶）
  if (userB.id === 'sandbox.partner@banbanji.internal' || userB.name.includes('測試伴侶')) {
    if (p.includes('測試') || p.includes('伴侶') || p === '周' || p === '周沛緹') {
      return true;
    }
  }

  // 5. 若伴侶尚在待確認狀態，在雙人帳本模型中：
  // 任何非 User A 的歷史代墊人 (例如周沛緹、周、沛緹、Peiti、Chou 等等) 皆歸屬於待確認伴侶之出資
  if (userB.isPendingBinding) {
    if (p.includes('周') || p.includes('沛') || p.includes('緹') || p.toLowerCase().includes('peiti') || p.toLowerCase().includes('chou')) {
      return true;
    }
    // 雙人共筆帳本中，非 User A 且非共同帳戶之有效紀錄，均歸於待確認伴侶
    return true;
  }

  // 6. 通用前綴或簡寫比對
  if (userB.shortName && p === userB.shortName) {
    return true;
  }
  if (userB.name && p === userB.name) {
    return true;
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
