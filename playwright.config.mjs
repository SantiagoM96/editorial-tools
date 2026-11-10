import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 12_000 },
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
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
        }]
      : []),
  ],
});
