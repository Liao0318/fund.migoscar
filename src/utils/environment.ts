/**
 * 伴伴記 環境偵測與靜態部署優化公用函式
 */

/**
 * 判斷當前環境是否為無 Node.js 後端伺服器的純靜態託管環境（例如 GitHub Pages）
 * 在靜態環境下直接避開呼叫相對路徑 /api/*，避免瀏覽器 DevTools 產生 404 (Not Found) 紅色叉叉錯誤 (❌)
 */
export function isStaticDeployment(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname || '';
  return (
    host.endsWith('github.io') ||
    host.endsWith('gitlab.io') ||
    host.endsWith('pages.dev') ||
    host.endsWith('web.app') ||
    host.endsWith('firebaseapp.com') ||
    window.location.protocol === 'file:'
  );
}

export function hasBackendServer(): boolean {
  return !isStaticDeployment();
}
