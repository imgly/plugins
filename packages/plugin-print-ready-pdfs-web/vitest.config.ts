import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test file patterns
    include: ['test/integration/**/*.test.ts'],

    // Setup files
    setupFiles: ['./test/setup.ts'],

    // Timeout for tests (30 seconds)
    testTimeout: 30000,

    // Environment
    environment: 'node',

    // Enable globals (describe, test, expect) without imports
    globals: false, // We'll use explicit imports for clarity
  },
});
