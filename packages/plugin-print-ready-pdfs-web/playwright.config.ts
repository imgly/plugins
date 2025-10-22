import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  timeout: 120000, // 120s per test (module loading can take time)
  expect: {
    timeout: 30000, // 30s for expect assertions
  },
  webServer: {
    command: 'npx http-server . -p 9000 --cors',
    port: 9000,
    timeout: 120000, // 2 minutes to start server
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:9000',
    // Add navigation timeout
    navigationTimeout: 30000,
  },
});