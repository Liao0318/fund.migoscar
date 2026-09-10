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
      const config = configs[email] || null;
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
      configs[email] = {
        ...(configs[email] || {}),
        ...payload,
        email,
        updatedAt: new Date().toISOString(),
      };
      writeJsonFile(USER_CONFIGS_FILE, configs);
      return res.json({ success: true, config: configs[email] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Partner Invites API
  app.get('/api/partner-invite', (req, res) => {
    try {
      const code = typeof req.query.code === 'string' ? req.query.code.trim().toUpperCase() : '';
      const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
      const invites = readJsonFile<Record<string, any>>(PARTNER_INVITES_FILE, {});

      if (code && invites[code]) {
        return res.json({ success: true, invite: invites[code] });
      }
      if (email) {
        const found = Object.values(invites).find((inv: any) => 
          (inv.adminEmail && inv.adminEmail.toLowerCase() === email) ||
          (inv.email && inv.email.toLowerCase() === email)
        );
        if (found) {
          return res.json({ success: true, invite: found });
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
      const code = typeof invite?.inviteCode === 'string' ? invite.inviteCode.trim().toUpperCase() : '';
      if (!code) {
        return res.status(400).json({ success: false, message: 'inviteCode required' });
      }
      const invites = readJsonFile<Record<string, any>>(PARTNER_INVITES_FILE, {});
      invites[code] = {
        ...invite,
        inviteCode: code,
        updatedAt: new Date().toISOString(),
      };
      writeJsonFile(PARTNER_INVITES_FILE, invites);
      return res.json({ success: true, invite: invites[code] });
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
      const binding = bindings[email] || null;
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
