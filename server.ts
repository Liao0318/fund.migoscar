import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {}
}

const USER_CONFIGS_FILE = path.join(DATA_DIR, 'user_configs.json');
const PARTNER_INVITES_FILE = path.join(DATA_DIR, 'partner_invites.json');
const COUPLE_BINDINGS_FILE = path.join(DATA_DIR, 'couple_bindings.json');
const SYSTEM_DATABASE_FILE = path.join(DATA_DIR, 'system_database.json');

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    }
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
  }
  return defaultValue;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`Error writing ${filePath}:`, e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. User Configs API (跨裝置、手機與電腦無縫同步專用)
  app.get('/api/user-config', (req, res) => {
    try {
      const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email required' });
      }
      const configs = readJsonFile<Record<string, any>>(USER_CONFIGS_FILE, {});
      let config = configs[email] || null;

      // 若此帳號尚無獨立資料庫設定，自動回退使用全系統現有已配置之資料庫（情侶共同帳本預設）
      if (!config || !config.gasWebUrl) {
        const sysDb = readJsonFile<any>(SYSTEM_DATABASE_FILE, null);
        if (sysDb && sysDb.gasWebUrl) {
          config = {
            ...(config || {}),
            email,
            gasWebUrl: sysDb.gasWebUrl,
            deploySheetUrl: sysDb.deploySheetUrl || '',
            updatedAt: sysDb.updatedAt,
          };
        }
      }

      return res.json({ success: true, config });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/user-config', (req, res) => {
    try {
      const payload = req.body;
      const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email required' });
      }
      const configs = readJsonFile<Record<string, any>>(USER_CONFIGS_FILE, {});
      const existing = configs[email] || {};

      // 🛡️ 嚴格防止現有有效網址被空字串意外覆蓋清空
      const safeGas = (payload.gasWebUrl && typeof payload.gasWebUrl === 'string' && payload.gasWebUrl.trim().startsWith('http'))
        ? payload.gasWebUrl.trim()
        : (payload.forceClear ? '' : (existing.gasWebUrl || ''));

      const safeSheet = (payload.deploySheetUrl && typeof payload.deploySheetUrl === 'string' && payload.deploySheetUrl.trim().startsWith('http'))
        ? payload.deploySheetUrl.trim()
        : (payload.forceClear ? '' : (existing.deploySheetUrl || ''));

      configs[email] = {
        ...existing,
        ...payload,
        email,
        gasWebUrl: safeGas,
        deploySheetUrl: safeSheet,
        updatedAt: new Date().toISOString(),
      };
      writeJsonFile(USER_CONFIGS_FILE, configs);

      // 當有有效 GAS 網址時，同步至全系統資料庫 fallback 檔案
      if (safeGas) {
        const sysDb = {
          gasWebUrl: safeGas,
          deploySheetUrl: safeSheet,
          configuredBy: email,
          updatedAt: new Date().toISOString(),
        };
        writeJsonFile(SYSTEM_DATABASE_FILE, sysDb);
      }

      return res.json({ success: true, config: configs[email] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 1.5 System Database API (單一全域資料庫端點，只要任何一台電腦或手機設定過一次，全體共享即刻同步)
  app.get('/api/system-database', (_req, res) => {
    try {
      const sysDb = readJsonFile<any>(SYSTEM_DATABASE_FILE, null);
      if (sysDb && sysDb.gasWebUrl) {
        return res.json({ success: true, database: sysDb });
      }
      // 搜尋是否有任一使用者已儲存有效網址
      const configs = readJsonFile<Record<string, any>>(USER_CONFIGS_FILE, {});
      const anyWithGas = Object.values(configs).find((c: any) => c && c.gasWebUrl && typeof c.gasWebUrl === 'string' && c.gasWebUrl.startsWith('http'));
      if (anyWithGas) {
        const derived = {
          gasWebUrl: anyWithGas.gasWebUrl,
          deploySheetUrl: anyWithGas.deploySheetUrl || '',
          configuredBy: anyWithGas.email || '',
          updatedAt: anyWithGas.updatedAt || new Date().toISOString(),
        };
        writeJsonFile(SYSTEM_DATABASE_FILE, derived);
        return res.json({ success: true, database: derived });
      }
      return res.json({ success: false, database: null });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/system-database', (req, res) => {
    try {
      const { gasWebUrl, deploySheetUrl, email } = req.body || {};
      if (gasWebUrl && typeof gasWebUrl === 'string' && gasWebUrl.trim().startsWith('http')) {
        const cleanGas = gasWebUrl.trim();
        const cleanSheet = typeof deploySheetUrl === 'string' ? deploySheetUrl.trim() : '';
        const sysDb = {
          gasWebUrl: cleanGas,
          deploySheetUrl: cleanSheet,
          configuredBy: email || '',
          updatedAt: new Date().toISOString(),
        };
        writeJsonFile(SYSTEM_DATABASE_FILE, sysDb);

        // 同步寫入此使用者的個人設定中
        if (email && typeof email === 'string') {
          const cleanEmail = email.trim().toLowerCase();
          const configs = readJsonFile<Record<string, any>>(USER_CONFIGS_FILE, {});
          configs[cleanEmail] = {
            ...(configs[cleanEmail] || {}),
            email: cleanEmail,
            gasWebUrl: cleanGas,
            deploySheetUrl: cleanSheet,
            updatedAt: new Date().toISOString(),
          };
          writeJsonFile(USER_CONFIGS_FILE, configs);
        }

        return res.json({ success: true, database: sysDb });
      }
      return res.status(400).json({ success: false, message: 'Invalid gasWebUrl' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Partner Invites API
  app.get('/api/partner-invite', (req, res) => {
    try {
      const rawCode = typeof req.query.code === 'string' ? req.query.code.trim().toUpperCase() : '';
      const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
      const invites = readJsonFile<Record<string, any>>(PARTNER_INVITES_FILE, {});
      const userConfigs = readJsonFile<Record<string, any>>(USER_CONFIGS_FILE, {});
      const sysDb = readJsonFile<any>(SYSTEM_DATABASE_FILE, null);

      if (rawCode) {
        const cleanNoPrefix = rawCode.replace(/^BB-?/, '');
        const withPrefix = `BB-${cleanNoPrefix}`;
        const candidates = [rawCode, withPrefix, cleanNoPrefix];

        // 1. 直接比對 partner_invites.json
        for (const c of candidates) {
          if (invites[c] && invites[c].gasWebUrl) {
            return res.json({ success: true, invite: invites[c] });
          }
        }

        // 2. 模糊比對 partner_invites.json 內物件
        const foundInInvites = Object.values(invites).find((inv: any) => {
          const invCode = (inv.inviteCode || '').toUpperCase();
          const invClean = invCode.replace(/^BB-?/, '');
          return candidates.includes(invCode) || candidates.includes(invClean);
        });

        if (foundInInvites && foundInInvites.gasWebUrl) {
          return res.json({ success: true, invite: foundInInvites });
        }

        // 3. 比對 user_configs.json 中有無該 inviteCode
        for (const [cfgEmail, cfg] of Object.entries(userConfigs)) {
          const cfgCode = (cfg.inviteCode || '').toUpperCase();
          const cfgClean = cfgCode.replace(/^BB-?/, '');
          if (cfgCode && (candidates.includes(cfgCode) || candidates.includes(cfgClean))) {
            const synthesizedInvite = {
              inviteCode: cfgCode.startsWith('BB-') ? cfgCode : `BB-${cfgClean}`,
              adminEmail: cfg.email || cfgEmail,
              adminName: cfg.name || '主管理員',
              gasWebUrl: cfg.gasWebUrl || (sysDb && sysDb.gasWebUrl) || '',
              deploySheetUrl: cfg.deploySheetUrl || (sysDb && sysDb.deploySheetUrl) || '',
              createdAt: cfg.updatedAt || new Date().toISOString()
            };
            invites[withPrefix] = synthesizedInvite;
            invites[cleanNoPrefix] = synthesizedInvite;
            writeJsonFile(PARTNER_INVITES_FILE, invites);
            return res.json({ success: true, invite: synthesizedInvite });
          }
        }

        // 4. 🛡️ 深度容錯備援：若系統已有任一有效資料庫（如 oscargh3359@gmail.com 或 system_database）
        // 且伴侶輸入了標準 4~8 碼代碼，自動將此代碼與現有資料庫對接！
        const adminWithGas = Object.values(userConfigs).find((c: any) => 
          c && c.gasWebUrl && typeof c.gasWebUrl === 'string' && c.gasWebUrl.startsWith('http')
        ) || (sysDb?.gasWebUrl ? { 
          email: sysDb.configuredBy || 'oscargh3359@gmail.com',
          name: '主管理員',
          gasWebUrl: sysDb.gasWebUrl,
          deploySheetUrl: sysDb.deploySheetUrl || ''
        } : null);

        if (adminWithGas && (cleanNoPrefix.length >= 4 || rawCode.startsWith('BB-'))) {
          const matchedCode = rawCode.startsWith('BB-') ? rawCode : withPrefix;
          const fallbackInvite = {
            inviteCode: matchedCode,
            adminEmail: adminWithGas.email || 'oscargh3359@gmail.com',
            adminName: adminWithGas.name || '主管理員',
            gasWebUrl: adminWithGas.gasWebUrl,
            deploySheetUrl: adminWithGas.deploySheetUrl || '',
            createdAt: new Date().toISOString()
          };
          invites[matchedCode] = fallbackInvite;
          invites[cleanNoPrefix] = fallbackInvite;
          writeJsonFile(PARTNER_INVITES_FILE, invites);

          // 同步註冊回該管理員的 user_configs
          if (adminWithGas.email && userConfigs[adminWithGas.email.toLowerCase()]) {
            userConfigs[adminWithGas.email.toLowerCase()].inviteCode = matchedCode;
            writeJsonFile(USER_CONFIGS_FILE, userConfigs);
          }

          return res.json({ success: true, invite: fallbackInvite });
        }
      }

      if (email) {
        // 1. 比對 partner_invites
        const found = Object.values(invites).find((inv: any) => 
          (inv.adminEmail && inv.adminEmail.toLowerCase() === email) ||
          (inv.email && inv.email.toLowerCase() === email)
        );
        if (found && found.gasWebUrl) {
          return res.json({ success: true, invite: found });
        }

        // 2. 比對 user_configs
        const userCfg = userConfigs[email];
        if (userCfg && (userCfg.gasWebUrl || sysDb?.gasWebUrl)) {
          const inviteCode = userCfg.inviteCode || 'BB-8888';
          const synInvite = {
            inviteCode,
            adminEmail: userCfg.email || email,
            adminName: userCfg.name || '主管理員',
            gasWebUrl: userCfg.gasWebUrl || sysDb?.gasWebUrl || '',
            deploySheetUrl: userCfg.deploySheetUrl || sysDb?.deploySheetUrl || '',
            createdAt: userCfg.updatedAt || new Date().toISOString()
          };
          invites[inviteCode] = synInvite;
          writeJsonFile(PARTNER_INVITES_FILE, invites);
          return res.json({ success: true, invite: synInvite });
        }
      }

      // 若完全無指定參數或未命中，但系統已有任一有效資料庫，回傳預設邀請物件
      if (!rawCode && !email) {
        const anyInvite = Object.values(invites).find((inv: any) => inv && inv.gasWebUrl);
        if (anyInvite) {
          return res.json({ success: true, invite: anyInvite });
        }
      }

      return res.json({ success: false, invite: null });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/partner-invite', (req, res) => {
    try {
      const invite = req.body;
      const rawCode = typeof invite?.inviteCode === 'string' ? invite.inviteCode.trim().toUpperCase() : '';
      if (!rawCode) {
        return res.status(400).json({ success: false, message: 'inviteCode required' });
      }
      const code = rawCode.startsWith('BB-') ? rawCode : (rawCode.startsWith('BB') && rawCode.length > 2 ? `BB-${rawCode.slice(2)}` : `BB-${rawCode}`);
      const invites = readJsonFile<Record<string, any>>(PARTNER_INVITES_FILE, {});
      const enrichedInvite = {
        ...invite,
        inviteCode: code,
        updatedAt: new Date().toISOString(),
      };
      invites[code] = enrichedInvite;
      invites[rawCode] = enrichedInvite;
      invites[code.replace(/^BB-/, '')] = enrichedInvite;
      writeJsonFile(PARTNER_INVITES_FILE, invites);

      // 同步回 user_configs
      if (invite.adminEmail) {
        const adminEmailClean = String(invite.adminEmail).trim().toLowerCase();
        const userConfigs = readJsonFile<Record<string, any>>(USER_CONFIGS_FILE, {});
        if (userConfigs[adminEmailClean]) {
          userConfigs[adminEmailClean].inviteCode = code;
          if (invite.gasWebUrl) userConfigs[adminEmailClean].gasWebUrl = invite.gasWebUrl;
          if (invite.deploySheetUrl) userConfigs[adminEmailClean].deploySheetUrl = invite.deploySheetUrl;
          writeJsonFile(USER_CONFIGS_FILE, userConfigs);
        }
      }

      return res.json({ success: true, invite: enrichedInvite });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Couple Bindings API
  app.get('/api/couple-binding', (req, res) => {
    try {
      const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email required' });
      }
      const bindings = readJsonFile<Record<string, any>>(COUPLE_BINDINGS_FILE, {});
      let binding = bindings[email] || null;

      // 若以 partnerEmail 或 adminEmail 查詢
      if (!binding) {
        binding = Object.values(bindings).find((b: any) => 
          (b.adminEmail && b.adminEmail.toLowerCase() === email) ||
          (b.partnerEmail && b.partnerEmail.toLowerCase() === email)
        ) || null;
      }

      return res.json({ success: true, binding });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/couple-binding', (req, res) => {
    try {
      const binding = req.body;
      const adminEmail = typeof binding?.adminEmail === 'string' ? binding.adminEmail.trim().toLowerCase() : '';
      const partnerEmail = typeof binding?.partnerEmail === 'string' ? binding.partnerEmail.trim().toLowerCase() : '';
      if (!adminEmail && !partnerEmail) {
        return res.status(400).json({ success: false, message: 'Email required' });
      }
      const bindings = readJsonFile<Record<string, any>>(COUPLE_BINDINGS_FILE, {});
      if (adminEmail) bindings[adminEmail] = binding;
      if (partnerEmail) bindings[partnerEmail] = binding;
      writeJsonFile(COUPLE_BINDINGS_FILE, bindings);

      // 同步更新伴侶在 user_configs.json 的資料庫與模式
      if (partnerEmail) {
        const userConfigs = readJsonFile<Record<string, any>>(USER_CONFIGS_FILE, {});
        userConfigs[partnerEmail] = {
          ...(userConfigs[partnerEmail] || {}),
          email: partnerEmail,
          name: binding.partnerName || userConfigs[partnerEmail]?.name || '伴侶',
          userRole: 'partner',
          adminEmail: adminEmail,
          adminName: binding.adminName || '主管理員',
          gasWebUrl: binding.gasWebUrl || userConfigs[partnerEmail]?.gasWebUrl || '',
          deploySheetUrl: binding.deploySheetUrl || userConfigs[partnerEmail]?.deploySheetUrl || '',
          inviteCode: binding.inviteCode,
          updatedAt: new Date().toISOString()
        };
        writeJsonFile(USER_CONFIGS_FILE, userConfigs);
      }

      return res.json({ success: true, binding });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Exchange Rates API
  app.get('/api/exchange-rates', async (_req, res) => {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/TWD');
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
      return res.json({ result: 'fallback', rates: { TWD: 1, USD: 0.031, JPY: 4.8, KRW: 42.5, EUR: 0.029, GBP: 0.025 } });
    } catch (e) {
      return res.json({ result: 'fallback', rates: { TWD: 1, USD: 0.031, JPY: 4.8, KRW: 42.5, EUR: 0.029, GBP: 0.025 } });
    }
  });

  // Vite middleware in dev mode / static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
