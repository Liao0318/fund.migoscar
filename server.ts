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

function isValidGasUrl(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.trim().toLowerCase();
  return lower.startsWith('http') && !lower.includes('/test/') && !lower.endsWith('/test') && !lower.includes('example.com');
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

      // 若此帳號尚無有效獨立資料庫設定，自動嘗試從全系統或綁定推導
      if (!config || !isValidGasUrl(config.gasWebUrl)) {
        const sysDb = readJsonFile<any>(SYSTEM_DATABASE_FILE, null);
        if (sysDb && isValidGasUrl(sysDb.gasWebUrl)) {
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

      // 🛡️ 嚴格防止現有有效網址被空字串或測試網址覆蓋
      const safeGas = isValidGasUrl(payload.gasWebUrl)
        ? payload.gasWebUrl.trim()
        : (payload.forceClear ? '' : (isValidGasUrl(existing.gasWebUrl) ? existing.gasWebUrl : ''));

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

      // 當有有效 GAS 網址時，同步至全系統資料庫
      if (isValidGasUrl(safeGas)) {
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

  // 1.5 System Database API
  app.get('/api/system-database', (_req, res) => {
    try {
      const sysDb = readJsonFile<any>(SYSTEM_DATABASE_FILE, null);
      if (sysDb && isValidGasUrl(sysDb.gasWebUrl)) {
        return res.json({ success: true, database: sysDb });
      }
      // 搜尋是否有任一使用者已儲存真實有效網址
      const configs = readJsonFile<Record<string, any>>(USER_CONFIGS_FILE, {});
      const anyWithGas = Object.values(configs).find((c: any) => c && isValidGasUrl(c.gasWebUrl));
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
      if (isValidGasUrl(gasWebUrl)) {
        const cleanGas = gasWebUrl.trim();
        const cleanSheet = typeof deploySheetUrl === 'string' ? deploySheetUrl.trim() : '';
        const sysDb = {
          gasWebUrl: cleanGas,
          deploySheetUrl: cleanSheet,
          configuredBy: email || '',
          updatedAt: new Date().toISOString(),
        };
        writeJsonFile(SYSTEM_DATABASE_FILE, sysDb);

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
      let rawCode = typeof req.query.code === 'string' ? req.query.code.trim().toUpperCase() : '';
      const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
      const invites = readJsonFile<Record<string, any>>(PARTNER_INVITES_FILE, {});
      const userConfigs = readJsonFile<Record<string, any>>(USER_CONFIGS_FILE, {});
      const sysDb = readJsonFile<any>(SYSTEM_DATABASE_FILE, null);

      // 若傳入整段網址或訊息，智慧萃取 BB-XXXX
      const matchBB = rawCode.match(/BB\s*[-_]?\s*([A-Za-z0-9]{3,10})/i);
      if (matchBB && matchBB[1]) {
        rawCode = `BB-${matchBB[1].toUpperCase()}`;
      } else {
        const matchBracket = rawCode.match(/[【「\[]([A-Za-z0-9_-]{3,10})[】」\]]/);
        if (matchBracket && matchBracket[1]) {
          const inner = matchBracket[1].toUpperCase();
          rawCode = inner.startsWith('BB-') ? inner : `BB-${inner}`;
        }
      }

      const checkExpired = (inv: any) => {
        if (!inv) return true;
        if (inv.expiresAt) {
          return Date.now() > new Date(inv.expiresAt).getTime();
        }
        return false;
      };

      const enrichInviteGas = (inv: any) => {
        if (!inv) return null;
        let gas = isValidGasUrl(inv.gasWebUrl) ? inv.gasWebUrl : '';
        let sheet = inv.deploySheetUrl || '';
        if (!gas && inv.adminEmail) {
          const cfg = userConfigs[inv.adminEmail.toLowerCase()];
          if (cfg && isValidGasUrl(cfg.gasWebUrl)) {
            gas = cfg.gasWebUrl;
            sheet = cfg.deploySheetUrl || sheet;
          }
        }
        if (!gas && isValidGasUrl(sysDb?.gasWebUrl)) {
          gas = sysDb.gasWebUrl;
          sheet = sysDb.deploySheetUrl || sheet;
        }
        return {
          ...inv,
          gasWebUrl: gas,
          deploySheetUrl: sheet
        };
      };

      if (rawCode) {
        const cleanNoPrefix = rawCode.replace(/^BB-?/, '');
        const withPrefix = `BB-${cleanNoPrefix}`;
        const candidates = [rawCode, withPrefix, cleanNoPrefix];

        // 1. 直接比對 partner_invites.json
        for (const c of candidates) {
          if (invites[c]) {
            const inv = invites[c];
            if (checkExpired(inv)) {
              return res.json({ 
                success: false, 
                expired: true, 
                message: `此邀請碼 ${rawCode} 已超過 15 分鐘有效時限，請向伴侶索取最新邀請碼！`, 
                invite: null 
              });
            }
            const enriched = enrichInviteGas(inv);
            if (isValidGasUrl(enriched.gasWebUrl)) {
              return res.json({ success: true, invite: enriched });
            }
          }
        }

        // 2. 模糊比對 partner_invites.json 內物件
        const foundInInvites = Object.values(invites).find((inv: any) => {
          const invCode = (inv.inviteCode || '').toUpperCase();
          const invClean = invCode.replace(/^BB-?/, '');
          return candidates.includes(invCode) || candidates.includes(invClean);
        });

        if (foundInInvites) {
          if (checkExpired(foundInInvites)) {
            return res.json({ 
              success: false, 
              expired: true, 
              message: `此邀請碼 ${rawCode} 已超過 15 分鐘有效時限，請向伴侶索取最新邀請碼！`, 
              invite: null 
            });
          }
          const enriched = enrichInviteGas(foundInInvites);
          if (isValidGasUrl(enriched.gasWebUrl)) {
            return res.json({ success: true, invite: enriched });
          }
        }

        // 3. 比對 user_configs.json 中有無該 inviteCode
        for (const [cfgEmail, cfg] of Object.entries(userConfigs)) {
          const cfgCode = (cfg.inviteCode || '').toUpperCase();
          const cfgClean = cfgCode.replace(/^BB-?/, '');
          if (cfgCode && (candidates.includes(cfgCode) || candidates.includes(cfgClean))) {
            const candidateGas = isValidGasUrl(cfg.gasWebUrl) ? cfg.gasWebUrl : (isValidGasUrl(sysDb?.gasWebUrl) ? sysDb.gasWebUrl : '');
            if (candidateGas) {
              const synthesizedInvite = {
                inviteCode: cfgCode.startsWith('BB-') ? cfgCode : `BB-${cfgClean}`,
                adminEmail: cfg.email || cfgEmail,
                adminName: cfg.name || '主管理員',
                gasWebUrl: candidateGas,
                deploySheetUrl: cfg.deploySheetUrl || (sysDb && sysDb.deploySheetUrl) || '',
                createdAt: cfg.updatedAt || new Date().toISOString(),
                expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                validMinutes: 15
              };
              invites[withPrefix] = synthesizedInvite;
              invites[cleanNoPrefix] = synthesizedInvite;
              writeJsonFile(PARTNER_INVITES_FILE, invites);
              return res.json({ success: true, invite: synthesizedInvite });
            }
          }
        }

        // 4. 若以上比對皆查無此邀請碼，回傳找不到邀請碼
        return res.json({ success: false, message: `查無邀請碼 ${rawCode}，請確認代碼是否輸入正確或已重新產生`, invite: null });
      }

      if (email) {
        // 1. 比對 partner_invites
        const found = Object.values(invites).find((inv: any) => 
          ((inv.adminEmail && inv.adminEmail.toLowerCase() === email) ||
          (inv.email && inv.email.toLowerCase() === email)) &&
          !checkExpired(inv)
        );
        if (found) {
          const enriched = enrichInviteGas(found);
          if (isValidGasUrl(enriched.gasWebUrl)) {
            return res.json({ success: true, invite: enriched });
          }
        }

        // 2. 比對 user_configs (僅當該帳號本身有 inviteCode 且有專屬 gasWebUrl 時)
        const userCfg = userConfigs[email];
        if (userCfg && isValidGasUrl(userCfg.gasWebUrl) && userCfg.inviteCode) {
          const inviteCode = userCfg.inviteCode;
          const synInvite = {
            inviteCode,
            adminEmail: userCfg.email || email,
            adminName: userCfg.name || '主管理員',
            gasWebUrl: userCfg.gasWebUrl,
            deploySheetUrl: userCfg.deploySheetUrl || '',
            createdAt: userCfg.updatedAt || new Date().toISOString(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            validMinutes: 15
          };
          invites[inviteCode] = synInvite;
          writeJsonFile(PARTNER_INVITES_FILE, invites);
          return res.json({ success: true, invite: synInvite });
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
      const userConfigs = readJsonFile<Record<string, any>>(USER_CONFIGS_FILE, {});
      const sysDb = readJsonFile<any>(SYSTEM_DATABASE_FILE, null);

      let gasToSave = isValidGasUrl(invite.gasWebUrl) ? invite.gasWebUrl : '';
      let sheetToSave = invite.deploySheetUrl || '';

      const adminEmailClean = invite.adminEmail ? String(invite.adminEmail).trim().toLowerCase() : '';
      if (!gasToSave && adminEmailClean && userConfigs[adminEmailClean] && isValidGasUrl(userConfigs[adminEmailClean].gasWebUrl)) {
        gasToSave = userConfigs[adminEmailClean].gasWebUrl;
        sheetToSave = userConfigs[adminEmailClean].deploySheetUrl || sheetToSave;
      }
      if (!gasToSave && isValidGasUrl(sysDb?.gasWebUrl)) {
        gasToSave = sysDb.gasWebUrl;
        sheetToSave = sysDb.deploySheetUrl || sheetToSave;
      }

      const validMinutes = typeof invite?.validMinutes === 'number' && invite.validMinutes > 0 ? invite.validMinutes : 15;
      const expiresAt = invite.expiresAt || new Date(Date.now() + validMinutes * 60 * 1000).toISOString();

      const enrichedInvite = {
        ...invite,
        inviteCode: code,
        gasWebUrl: gasToSave,
        deploySheetUrl: sheetToSave,
        validMinutes,
        expiresAt,
        createdAt: invite.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      invites[code] = enrichedInvite;
      invites[rawCode] = enrichedInvite;
      invites[code.replace(/^BB-/, '')] = enrichedInvite;
      writeJsonFile(PARTNER_INVITES_FILE, invites);

      if (adminEmailClean) {
        if (userConfigs[adminEmailClean]) {
          userConfigs[adminEmailClean].inviteCode = code;
          if (gasToSave) userConfigs[adminEmailClean].gasWebUrl = gasToSave;
          if (sheetToSave) userConfigs[adminEmailClean].deploySheetUrl = sheetToSave;
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
      const bindings = readJsonFile<Record<string, any>>(COUPLE_BINDINGS_FILE, {});
      const userConfigs = readJsonFile<Record<string, any>>(USER_CONFIGS_FILE, {});
      const sysDb = readJsonFile<any>(SYSTEM_DATABASE_FILE, null);

      const sanitize = (b: any, queryEmail?: string) => {
        if (!b) return null;
        const adm = (b.adminEmail || '').trim().toLowerCase();
        const prt = (b.partnerEmail || '').trim().toLowerCase();
        // 拒絕自綁自
        if (adm && prt && adm === prt) {
          if (queryEmail && queryEmail === adm) {
            return { ...b, partnerEmail: '', partnerName: '', isBound: false };
          }
          return null;
        }
        return b;
      };

      if (!email) {
        for (const b of Object.values(bindings)) {
          const clean = sanitize(b);
          if (clean && clean.adminEmail && clean.partnerEmail && clean.adminEmail.toLowerCase() !== clean.partnerEmail.toLowerCase()) {
            return res.json({ success: true, binding: clean });
          }
        }
        return res.json({ success: true, binding: null });
      }

      let rawBinding = bindings[email] || null;

      if (!rawBinding) {
        rawBinding = Object.values(bindings).find((b: any) => 
          (b.adminEmail && b.adminEmail.toLowerCase() === email) ||
          (b.partnerEmail && b.partnerEmail.toLowerCase() === email)
        ) || null;
      }

      // 檢查 userConfigs 中是否有已綁定伴侶
      if (!rawBinding || (rawBinding.adminEmail && rawBinding.partnerEmail && rawBinding.adminEmail.toLowerCase() === rawBinding.partnerEmail.toLowerCase())) {
        const userCfg = userConfigs[email];
        if (userCfg && userCfg.userRole === 'partner' && userCfg.adminEmail && userCfg.adminEmail.toLowerCase() !== email) {
          rawBinding = {
            adminEmail: userCfg.adminEmail.toLowerCase(),
            adminName: userCfg.adminName || '主管理員',
            partnerEmail: email,
            partnerName: userCfg.name || '伴侶',
            inviteCode: userCfg.inviteCode || '',
            gasWebUrl: isValidGasUrl(userCfg.gasWebUrl) ? userCfg.gasWebUrl : (isValidGasUrl(sysDb?.gasWebUrl) ? sysDb.gasWebUrl : ''),
            deploySheetUrl: userCfg.deploySheetUrl || sysDb?.deploySheetUrl || '',
            boundAt: userCfg.updatedAt || new Date().toISOString()
          };
          bindings[email] = rawBinding;
          bindings[userCfg.adminEmail.toLowerCase()] = rawBinding;
          writeJsonFile(COUPLE_BINDINGS_FILE, bindings);
        } else {
          // 搜尋是否有其他人綁定此 email 作為 admin
          const partnerMatch = Object.values(userConfigs).find((c: any) => 
            c && c.email && c.email.toLowerCase() !== email &&
            ((c.adminEmail && c.adminEmail.toLowerCase() === email) ||
             (c.partnerEmail && c.partnerEmail.toLowerCase() === email))
          );
          if (partnerMatch && partnerMatch.email) {
            rawBinding = {
              adminEmail: email,
              adminName: userConfigs[email]?.name || '主管理員',
              partnerEmail: partnerMatch.email.toLowerCase(),
              partnerName: partnerMatch.name || '伴侶',
              inviteCode: partnerMatch.inviteCode || userConfigs[email]?.inviteCode || '',
              gasWebUrl: isValidGasUrl(userConfigs[email]?.gasWebUrl) ? userConfigs[email].gasWebUrl : (isValidGasUrl(sysDb?.gasWebUrl) ? sysDb.gasWebUrl : ''),
              deploySheetUrl: userConfigs[email]?.deploySheetUrl || sysDb?.deploySheetUrl || '',
              boundAt: partnerMatch.updatedAt || new Date().toISOString()
            };
            bindings[email] = rawBinding;
            bindings[partnerMatch.email.toLowerCase()] = rawBinding;
            writeJsonFile(COUPLE_BINDINGS_FILE, bindings);
          }
        }
      }

      const finalBinding = sanitize(rawBinding, email);
      return res.json({ success: true, binding: finalBinding });
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

      const userConfigs = readJsonFile<Record<string, any>>(USER_CONFIGS_FILE, {});
      const bindings = readJsonFile<Record<string, any>>(COUPLE_BINDINGS_FILE, {});

      // 🛡️ 同帳號自我操作（非情侶綁定，僅為多裝置資料庫同步）
      if (adminEmail && partnerEmail && adminEmail === partnerEmail) {
        if (adminEmail) {
          userConfigs[adminEmail] = {
            ...(userConfigs[adminEmail] || {}),
            email: adminEmail,
            gasWebUrl: isValidGasUrl(binding.gasWebUrl) ? binding.gasWebUrl : (userConfigs[adminEmail]?.gasWebUrl || ''),
            deploySheetUrl: binding.deploySheetUrl || userConfigs[adminEmail]?.deploySheetUrl || '',
            updatedAt: new Date().toISOString()
          };
          writeJsonFile(USER_CONFIGS_FILE, userConfigs);
        }
        return res.json({ success: true, isSelfSync: true, message: '跨裝置資料庫設定已同步' });
      }

      const cleanBinding = {
        adminEmail,
        adminName: binding.adminName || userConfigs[adminEmail]?.name || '主管理員',
        partnerEmail,
        partnerName: binding.partnerName || userConfigs[partnerEmail]?.name || '伴侶',
        inviteCode: binding.inviteCode || '',
        gasWebUrl: isValidGasUrl(binding.gasWebUrl) ? binding.gasWebUrl : (userConfigs[adminEmail]?.gasWebUrl || ''),
        deploySheetUrl: binding.deploySheetUrl || userConfigs[adminEmail]?.deploySheetUrl || '',
        boundAt: binding.boundAt || new Date().toISOString()
      };

      if (adminEmail) bindings[adminEmail] = cleanBinding;
      if (partnerEmail) bindings[partnerEmail] = cleanBinding;
      writeJsonFile(COUPLE_BINDINGS_FILE, bindings);

      // 同步更新管理者在 user_configs.json 的伴侶綁定資訊
      if (adminEmail) {
        userConfigs[adminEmail] = {
          ...(userConfigs[adminEmail] || {}),
          email: adminEmail,
          partnerEmail: partnerEmail,
          partnerName: cleanBinding.partnerName,
          gasWebUrl: isValidGasUrl(cleanBinding.gasWebUrl) ? cleanBinding.gasWebUrl : (userConfigs[adminEmail]?.gasWebUrl || ''),
          deploySheetUrl: cleanBinding.deploySheetUrl || userConfigs[adminEmail]?.deploySheetUrl || '',
          updatedAt: new Date().toISOString()
        };
      }

      // 同步更新伴侶在 user_configs.json 的資料庫與模式
      if (partnerEmail) {
        userConfigs[partnerEmail] = {
          ...(userConfigs[partnerEmail] || {}),
          email: partnerEmail,
          name: cleanBinding.partnerName,
          userRole: 'partner',
          adminEmail: adminEmail,
          adminName: cleanBinding.adminName,
          gasWebUrl: isValidGasUrl(cleanBinding.gasWebUrl) ? cleanBinding.gasWebUrl : (userConfigs[partnerEmail]?.gasWebUrl || ''),
          deploySheetUrl: cleanBinding.deploySheetUrl || userConfigs[partnerEmail]?.deploySheetUrl || '',
          inviteCode: cleanBinding.inviteCode,
          updatedAt: new Date().toISOString()
        };
      }
      writeJsonFile(USER_CONFIGS_FILE, userConfigs);

      if (isValidGasUrl(cleanBinding.gasWebUrl)) {
        writeJsonFile(SYSTEM_DATABASE_FILE, {
          gasWebUrl: cleanBinding.gasWebUrl,
          deploySheetUrl: cleanBinding.deploySheetUrl || '',
          configuredBy: adminEmail || partnerEmail || 'system',
          updatedAt: new Date().toISOString()
        });
      }

      return res.json({ success: true, binding: cleanBinding });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/partner-unbind', (req, res) => {
    try {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email required' });
      }
      const bindings = readJsonFile<Record<string, any>>(COUPLE_BINDINGS_FILE, {});
      const userConfigs = readJsonFile<Record<string, any>>(USER_CONFIGS_FILE, {});

      const currentBinding = bindings[email];
      if (currentBinding) {
        const adm = (currentBinding.adminEmail || '').toLowerCase();
        const prt = (currentBinding.partnerEmail || '').toLowerCase();
        if (adm) delete bindings[adm];
        if (prt) delete bindings[prt];
        writeJsonFile(COUPLE_BINDINGS_FILE, bindings);

        if (adm && userConfigs[adm]) {
          delete userConfigs[adm].partnerEmail;
          delete userConfigs[adm].partnerName;
          writeJsonFile(USER_CONFIGS_FILE, userConfigs);
        }
        if (prt && userConfigs[prt]) {
          userConfigs[prt].userRole = 'admin';
          delete userConfigs[prt].adminEmail;
          delete userConfigs[prt].adminName;
          writeJsonFile(USER_CONFIGS_FILE, userConfigs);
        }
      }
      return res.json({ success: true, message: '已解除伴侶綁定' });
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
