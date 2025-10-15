import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  timeout: 60000, // 60s per test (increased from default 30s)
  webServer: {
    command: 'npx http-server . -p 8081 --cors',
    port: 8081,
    timeout: 120000, // 2 minutes to start server
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:8081',
  },
});