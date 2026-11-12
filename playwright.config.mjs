import { defineConfig } from '@playwright/test';

const deploySmoke = process.env.EDITORIAL_DEPLOY_SMOKE === '1';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 12_000 },
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: deploySmoke ? 'http://127.0.0.1:4177' : 'http://127.0.0.1:4173',
    browserName: 'chromium',
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
    // El resto de pruebas simula un usuario que ya completó la guía de Crónica.
    // La prueba dedicada fuerza y verifica los ocho pasos con ?onboarding=force.
    storageState: { cookies: [], origins: [
          {
                "origin": "http://127.0.0.1:4173",
                "localStorage": [
                      {
                            "name": "cronica-dev-tour-desktop-v1",
                            "value": "complete"
                      }
                ]
          },
          {
                "origin": "http://127.0.0.1:4174",
                "localStorage": [
                      {
                            "name": "cronica-dev-tour-desktop-v1",
                            "value": "complete"
                      }
                ]
          },
          {
                "origin": "http://127.0.0.1:4175",
                "localStorage": [
                      {
                            "name": "cronica-dev-tour-desktop-v1",
                            "value": "complete"
                      }
                ]
          },
          {
                "origin": "http://127.0.0.1:4177",
                "localStorage": [
                      {
                            "name": "cronica-dev-tour-desktop-v1",
                            "value": "complete"
                      }
                ]
          }
    ] },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: deploySmoke ? [{
    command: 'SERVE_ROOT=../dist-pages SERVE_PREFIX=/editorial-tools/ PORT=4177 node scripts/serve.mjs',
    url: 'http://127.0.0.1:4177/editorial-tools/',
    reuseExistingServer: false,
    timeout: 30_000,
  }] : [
    {
      command: 'npm run dev',
      url: 'http://127.0.0.1:4173/',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    ...(process.env.CI
      ? [{
          command: 'SERVE_ROOT=reference/public PORT=4174 node scripts/serve.mjs',
          url: 'http://127.0.0.1:4174/dev/',
          timeout: 30_000,
        }, {
          command: 'SERVE_ROOT=reference-latest/public PORT=4175 node scripts/serve.mjs',
          url: 'http://127.0.0.1:4175/dev/',
          timeout: 30_000,
        }]
      : []),
  ],
});
