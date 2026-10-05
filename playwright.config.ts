import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './framework/config';

export default defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./framework/global-setup'),
  // Every test restores the seed data via POST /api/test/reset, which wipes the
  // whole database. Tests therefore run one at a time against a single app instance.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['list'], ['html', { open: 'on-failure' }]],
  use: {
    baseURL: BASE_URL,
    testIdAttribute: 'data-testid',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // Any *.spec.ts dropped into tests/ui or tests/api is picked up automatically.
  projects: [
    {
      name: 'ui',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'api',
      testDir: './tests/api',
    },
  ],
});
