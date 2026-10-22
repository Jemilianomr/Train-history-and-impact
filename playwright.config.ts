import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const systemChromium = existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined;
const software = process.env.PLAYWRIGHT_SOFTWARE_GPU === '1' || (process.platform === 'linux' && !!systemChromium);

export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1, timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173', viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce', trace: 'retain-on-failure', screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || systemChromium,
      args: ['--disable-dev-shm-usage', ...(software ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [])],
    },
  },
  webServer: { command: 'npm run preview -- --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: false, timeout: 30_000 },
});
