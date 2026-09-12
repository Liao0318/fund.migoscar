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
 * 播放 Apple Pay 經典雙音清脆叮鈴聲 (使用 Web Audio API 高擬真合成，無需外掛音檔)
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
    
    // 主音量與防破音壓縮器
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.28, now);

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-12, now);
    compressor.knee.setValueAtTime(8, now);
    compressor.ratio.setValueAtTime(4, now);
    compressor.attack.setValueAtTime(0.002, now);
    compressor.release.setValueAtTime(0.15, now);

    masterGain.connect(compressor);
    compressor.connect(ctx.destination);

    // 🍎 1. 觸感微低音輕敲 (Sub-bass Haptic Tap: 140Hz -> 50Hz)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.04);
    subGain.gain.setValueAtTime(0.2, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    subOsc.connect(subGain);
    subGain.connect(masterGain);
    subOsc.start(now);
    subOsc.stop(now + 0.05);

    // 🍎 2. 第一聲清脆鈴音 (Tone 1: D#6 / Eb6 ~ 1244.5 Hz)
    const t1 = now;
    const osc1Main = ctx.createOscillator();
    const osc1Harmonic = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1Main.type = 'sine';
    osc1Main.frequency.setValueAtTime(1244.5, t1);

    osc1Harmonic.type = 'sine';
    osc1Harmonic.frequency.setValueAtTime(2489, t1); // 2nd Harmonic

    gain1.gain.setValueAtTime(0.0001, t1);
    gain1.gain.linearRampToValueAtTime(0.35, t1 + 0.004);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.26);

    osc1Main.connect(gain1);
    osc1Harmonic.connect(gain1);
    gain1.connect(masterGain);

    osc1Main.start(t1);
    osc1Harmonic.start(t1);
    osc1Main.stop(t1 + 0.28);
    osc1Harmonic.stop(t1 + 0.28);

    // 🍎 3. 第二聲標誌性高頻晶透尾韻 (Tone 2: A#6 / Bb6 ~ 1864.7 Hz - Apple Pay 標誌性高五度和弦)
    const t2 = now + 0.088; // 約 88ms 後清脆接續
    const osc2Main = ctx.createOscillator();
    const osc2H1 = ctx.createOscillator();
    const osc2H2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2Main.type = 'sine';
    osc2Main.frequency.setValueAtTime(1864.7, t2);

    osc2H1.type = 'sine';
    osc2H1.frequency.setValueAtTime(3729.4, t2); // 晶亮泛音

    osc2H2.type = 'sine';
    osc2H2.frequency.setValueAtTime(5594.1, t2); // 金屬光澤泛音

    gain2.gain.setValueAtTime(0.0001, t2);
    gain2.gain.linearRampToValueAtTime(0.48, t2 + 0.004);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.82); // 0.82 秒晶透長延音尾韻

    osc2Main.connect(gain2);
    osc2H1.connect(gain2);
    osc2H2.connect(gain2);
    gain2.connect(masterGain);

    osc2Main.start(t2);
    osc2H1.start(t2);
    osc2H2.start(t2);
    osc2Main.stop(t2 + 0.85);
    osc2H1.stop(t2 + 0.85);
    osc2H2.stop(t2 + 0.85);

    // 播放完畢後自動釋放 AudioContext 節省資源
    setTimeout(() => {
      try {
        if (ctx.state !== 'closed') ctx.close().catch(() => {});
      } catch (e) {}
    }, 1100);

  } catch (e) {
    // 忽略自動播放限制錯誤
  }
}

/**
 * 觸發手機震動回饋 (Apple Pay 風格俐落雙震動)
 */
export function triggerVibration(pattern: number | number[] = [35, 45, 55]) {
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
