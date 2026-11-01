import { defineConfig, devices } from '@playwright/test';

const webURL = process.env.WEB_URL ?? 'http://localhost:3000';
const apiURL = process.env.API_URL ?? 'http://localhost:3001/api/v1';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: webURL,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run start:dev',
      cwd: '../../apps/api',
      url: `${apiURL.replace(/\/api\/v1$/, '')}/api/v1/health`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run dev',
      cwd: '../../apps/web',
      url: `${webURL}/login`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
  ],
});
