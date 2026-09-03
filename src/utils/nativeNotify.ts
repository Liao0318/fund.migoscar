/**
 * 伴伴記 原生裝置 / PWA 系統推播通知管理員
 * 支援 Web Notification API、Service Worker 推播、震動回饋與 Web Audio 輕巧音效
 */

export type NativeNotificationStatus = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * 取得當前裝置通知權限狀態
 */
export function getNativeNotificationPermission(): NativeNotificationStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NativeNotificationStatus;
}

/**
 * 請求手機 / 瀏覽器系統通知權限
 */
export async function requestNativeNotificationPermission(): Promise<NativeNotificationStatus> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NativeNotificationStatus;
  } catch (error) {
    console.warn('請求系統通知權限失敗:', error);
    return Notification.permission as NativeNotificationStatus;
  }
}

/**
 * 播放輕巧溫和的通知提示音 (使用 Web Audio API，無需外掛音檔)
 */
export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    
    // 雙音和弦 (柔和的清脆提示鈴聲: E5 -> B5)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(659.25, now); // E5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.frequency.setValueAtTime(1318.5, now + 0.05); // E6
    osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.25); // A6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.05);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  } catch (e) {
    // 忽略自動播放限制錯誤
  }
}

/**
 * 觸發手機震動回饋
 */
export function triggerVibration(pattern: number | number[] = [120, 60, 120]) {
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {}
  }
}

export interface SendNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  playSound?: boolean;
}

/**
 * 發送手機/桌面原生系統通知
 */
export async function sendNativeNotification({
  title,
  body,
  icon = './icon.svg',
  badge = './icon.svg',
  tag = 'banban-notify',
  data = {},
  playSound = true
}: SendNotificationOptions): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  // 播放提示聲與震動
  if (playSound) {
    playNotificationSound();
    triggerVibration();
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    // 優先使用 ServiceWorker Registration 推播 (支援行動裝置背景通知與自訂點擊跳轉)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, {
            body,
            icon,
            badge,
            tag,
            vibrate: [150, 80, 150],
            data: {
              url: window.location.href,
              ...data
            }
          } as NotificationOptions);
          return true;
        }
      } catch (swErr) {
        console.warn('Service Worker showNotification 降級至標準 Notification:', swErr);
      }
    }

    // 降級為標準 Web Notification 物件
    const notif = new Notification(title, {
      body,
      icon,
      badge,
      tag
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    return true;
  } catch (error) {
    console.warn('發送原生通知失敗:', error);
    return false;
  }
}
