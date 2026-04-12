import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:4200';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  outputDir: 'e2e/test-results',

  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    // Auth setup — runs before tests that need it
    {
      name: 'setup',
      testDir: './e2e/fixtures',
      testMatch: /auth\.setup\.ts/,
    },

    // Smoke tests — fast sanity checks
    {
      name: 'smoke',
      testDir: './e2e/smoke',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Full E2E suite
    {
      name: 'full',
      testDir: './e2e',
      testIgnore: ['**/smoke/**', '**/fixtures/**'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
