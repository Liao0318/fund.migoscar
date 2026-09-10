import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

const BENCHMARK_RATES: Record<string, number> = {
  TWD: 1,
  JPY: 4.9407,
  USD: 0.03105,
  EUR: 0.02688,
  KRW: 43.8596,
  THB: 1.0277,
  HKD: 0.2427,
  CNY: 0.2096,
  GBP: 0.02315,
  AUD: 0.04717,
  SGD: 0.04082,
  VND: 769.23,
  MYR: 0.1342,
  PHP: 1.7857,
};

function exchangeRatesPlugin(): Plugin {
  return {
    name: 'exchange-rates-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/exchange-rates')) {
          res.setHeader('Content-Type', 'application/json');
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3500);
            const externalRes = await fetch('https://open.er-api.com/v6/latest/TWD', { signal: controller.signal });
            clearTimeout(timeout);
            if (externalRes.ok) {
              const data = await externalRes.json();
              if (data && data.rates) {
                res.statusCode = 200;
                res.end(JSON.stringify(data));
                return;
              }
            }
          } catch {
            // fallback gracefully to benchmark rates
          }

          res.statusCode = 200;
          res.end(JSON.stringify({ result: 'success', rates: BENCHMARK_RATES, source: 'benchmark' }));
          return;
        }
        next();
      });
    },
  };
}

/**
 * 跨裝置資料庫設定與伴侶邀請同步 API
 * 提供持久化儲存，確保使用者更換手機、平板或電腦時，登入即可立即抓取先前綁定的資料庫 API！
 */
function userConfigApiPlugin(): Plugin {
  const DATA_DIR = path.resolve(process.cwd(), 'data');
  const USER_CONFIG_FILE = path.join(DATA_DIR, 'user_configs.json');
  const INVITES_FILE = path.join(DATA_DIR, 'partner_invites.json');
  const BINDINGS_FILE = path.join(DATA_DIR, 'couple_bindings.json');

  const readJson = (filePath: string): Record<string, any> => {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content || '{}');
      }
    } catch (e) {}
    return {};
  };

  const writeJson = (filePath: string, data: Record<string, any>) => {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {}
  };

  return {
    name: 'user-config-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlStr = req.url || '';

        // 1. 使用者雲端資料庫與帳號設定 API: /api/user-config
        if (urlStr.startsWith('/api/user-config')) {
          res.setHeader('Content-Type', 'application/json');
          const parsedUrl = new URL(urlStr, 'http://localhost');

          if (req.method === 'GET') {
            const email = (parsedUrl.searchParams.get('email') || '').trim().toLowerCase();
            const configs = readJson(USER_CONFIG_FILE);
            if (email && configs[email]) {
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, config: configs[email] }));
              return;
            }
            res.statusCode = 200;
            res.end(JSON.stringify({ success: false, config: null }));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const payload = JSON.parse(body || '{}');
                const email = (payload.email || '').trim().toLowerCase();
                if (!email) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ success: false, message: 'Email required' }));
                  return;
                }
                const configs = readJson(USER_CONFIG_FILE);
                const existing = configs[email] || {};
                
                // 智能合併：若新傳入空值但既有已有有效 gasWebUrl，嚴格保留既有網址
                const merged = {
                  ...existing,
                  ...payload,
                  gasWebUrl: (payload.gasWebUrl && payload.gasWebUrl.startsWith('http')) 
                    ? payload.gasWebUrl 
                    : (payload.gasWebUrl === '' && payload.forceClear ? '' : (existing.gasWebUrl || '')),
                  deploySheetUrl: (payload.deploySheetUrl && payload.deploySheetUrl.startsWith('http')) 
                    ? payload.deploySheetUrl 
                    : (payload.deploySheetUrl === '' && payload.forceClear ? '' : (existing.deploySheetUrl || '')),
                  updatedAt: new Date().toISOString()
                };

                configs[email] = merged;
                writeJson(USER_CONFIG_FILE, configs);
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, config: merged }));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err?.message }));
              }
            });
            return;
          }
        }

        // 2. 伴侶邀請碼 API: /api/partner-invite
        if (urlStr.startsWith('/api/partner-invite')) {
          res.setHeader('Content-Type', 'application/json');
          const parsedUrl = new URL(urlStr, 'http://localhost');

          if (req.method === 'GET') {
            const code = (parsedUrl.searchParams.get('code') || '').trim().toUpperCase();
            const email = (parsedUrl.searchParams.get('email') || '').trim().toLowerCase();
            const invites = readJson(INVITES_FILE);

            if (code && invites[code]) {
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, invite: invites[code] }));
              return;
            }

            if (email) {
              const matched = Object.values(invites).find((inv: any) => 
                inv?.adminEmail?.toLowerCase() === email
              );
              if (matched) {
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, invite: matched }));
                return;
              }
            }

            res.statusCode = 200;
            res.end(JSON.stringify({ success: false, invite: null }));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const payload = JSON.parse(body || '{}');
                const code = (payload.inviteCode || '').trim().toUpperCase();
                if (!code) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ success: false, message: 'Invite code required' }));
                  return;
                }
                const invites = readJson(INVITES_FILE);
                invites[code] = {
                  ...invites[code],
                  ...payload,
                  inviteCode: code,
                  updatedAt: new Date().toISOString()
                };
                writeJson(INVITES_FILE, invites);
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, invite: invites[code] }));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err?.message }));
              }
            });
            return;
          }
        }

        // 3. 情侶綁定狀態 API: /api/couple-binding
        if (urlStr.startsWith('/api/couple-binding')) {
          res.setHeader('Content-Type', 'application/json');
          const parsedUrl = new URL(urlStr, 'http://localhost');

          if (req.method === 'GET') {
            const email = (parsedUrl.searchParams.get('email') || '').trim().toLowerCase();
            const bindings = readJson(BINDINGS_FILE);
            if (email && bindings[email]) {
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, binding: bindings[email] }));
              return;
            }
            res.statusCode = 200;
            res.end(JSON.stringify({ success: false, binding: null }));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const payload = JSON.parse(body || '{}');
                const adminEmail = (payload.adminEmail || '').trim().toLowerCase();
                const partnerEmail = (payload.partnerEmail || '').trim().toLowerCase();
                const bindings = readJson(BINDINGS_FILE);
                const record = {
                  ...payload,
                  updatedAt: new Date().toISOString()
                };
                if (adminEmail) bindings[adminEmail] = record;
                if (partnerEmail) bindings[partnerEmail] = record;
                writeJson(BINDINGS_FILE, bindings);
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, binding: record }));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err?.message }));
              }
            });
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(({ command }) => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      exchangeRatesPlugin(),
      userConfigApiPlugin(),
      ...(command === 'build' ? [viteSingleFile()] : [])
    ],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'motion', 'lucide-react', 'xlsx'],
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
