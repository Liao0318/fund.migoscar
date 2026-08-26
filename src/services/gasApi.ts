/**
 * Google Apps Script / Web App API Communication Service
 */

export async function callGasApi(action: string, payload?: any): Promise<any> {
  // 1. Native Google Apps Script iframe environment
  if (typeof window !== 'undefined' && (window as any).google?.script?.run) {
    return new Promise((resolve) => {
      const runner = (window as any).google.script.run
        .withSuccessHandler((res: any) => resolve(res))
        .withFailureHandler((err: any) => resolve({ success: false, error: String(err) }));
      if (typeof runner[action] === 'function') {
        runner[action](payload);
      } else {
        resolve({ success: false, error: `Function ${action} not found` });
      }
    });
  }

  // 2. Standalone Web App / AI Studio Preview via HTTP fetch
  let targetUrl = '';
  try {
    targetUrl = localStorage.getItem('muji_gas_web_url') || '';
  } catch (e) {}

  if (targetUrl && targetUrl.trim().startsWith('http')) {
    try {
      const res = await fetch(targetUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn(`callGasApi HTTP POST to ${action} failed:`, err);
    }
  }

  return { success: false, isLocalFallback: true };
}
