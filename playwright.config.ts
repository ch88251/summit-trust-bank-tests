import { defineConfig, devices } from '@playwright/test';

export const BASE_URL = process.env.BASE_URL ?? 'https://bank.cfhayes.com';
export const DEMO_STORAGE_STATE = '.auth/demo.json';
const SERENITY_OUTPUT_DIR = 'target/site/serenity';

export default defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./src/global-setup'),
  // Every test restores the seed data via POST /api/test/reset, which wipes the
  // whole database. Tests therefore run one at a time against a single app instance.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [
    ['list'],
    ['html', { open: process.env.CI ? 'never' : 'on-failure' }],
    ...(process.env.CI ? [['junit', { outputFile: 'test-results/junit.xml' }] as const] : []),
    // Serenity/JS is used for reporting only: it turns Playwright's results into
    // Serenity BDD JSON, and `npm run serenity:report` renders the HTML report from it.
    [
      '@serenity-js/playwright-test',
      {
        crew: [
          '@serenity-js/serenity-bdd',
          ['@serenity-js/core:ArtifactArchiver', { outputDirectory: SERENITY_OUTPUT_DIR }],
        ],
      },
    ],
  ],
  use: {
    baseURL: BASE_URL,
    testIdAttribute: 'data-testid',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'ui',
      testDir: './tests/ui',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: DEMO_STORAGE_STATE,
      },
    },
    {
      name: 'api',
      testDir: './tests/api',
    },
  ],
});
