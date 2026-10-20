import { defineConfig } from '@playwright/test';

const CI = Boolean(process.env.CI);

export default defineConfig({
  // Config is itself inside e2e/, so resolve tests relative to this directory.
  testDir: '.',
  testMatch: '**/*.spec.mjs',
  fullyParallel: false,
  timeout: 45_000,
  expect: { timeout: 15_000 },
  retries: CI ? 1 : 0,
  workers: CI ? 1 : undefined,
  reporter: CI
    ? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'mobile-320',
      use: { browserName: 'chromium', viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true },
    },
    {
      name: 'mobile-390',
      use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
    {
      name: 'desktop-1440',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
});
