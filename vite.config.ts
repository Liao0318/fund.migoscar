import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';
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

export default defineConfig(({ command }) => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      exchangeRatesPlugin(),
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
