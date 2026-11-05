import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3200',
    viewport: { width: 1440, height: 1100 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run lab',
    url: 'http://127.0.0.1:3201',
    reuseExistingServer: process.env.LAB_REUSE_SERVER === '1',
    timeout: 240_000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
  },
});
