import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  webServer: {
    command: 'npx http-server . -p 8080 --cors',
    port: 8080,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:8080',
  },
});