/**
 * Playwright test for Angular + Webpack 5 runtime compatibility
 *
 * This test verifies that @imgly/plugin-print-ready-pdfs-web works correctly
 * when bundled with Angular CLI (which uses Webpack 5 internally).
 *
 * Customer issue: Runtime error
 * "Cannot find module 'file:///.../node_modules/@imgly/plugin-print-ready-pdfs-web/dist/gs.js'"
 *
 * The test builds an Angular app that imports the plugin and attempts
 * to use convertToPDFX3 at runtime.
 */
import { test, expect } from '@playwright/test';
import { execSync, spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const TEST_PROJECT_DIR = join(__dirname, 'webpack5-angular-project');
const PLUGIN_DIR = join(__dirname, '..');
const TEST_PORT = 4299;
const TEST_URL = `http://localhost:${TEST_PORT}`;

interface TestResults {
  importSuccess: boolean;
  initializationError: string | null;
  conversionAttempted: boolean;
  conversionError: string | null;
  conversionSuccess: boolean;
  testComplete: boolean;
}

test.describe('Angular + Webpack 5 Runtime Compatibility', () => {
  let serverProcess: ChildProcess | null = null;
  let consoleMessages: string[] = [];
  let consoleErrors: string[] = [];

  test.beforeAll(async () => {
    console.log('Setting up Angular + Webpack 5 test project...');

    // Ensure plugin is built
    if (!existsSync(join(PLUGIN_DIR, 'dist', 'index.mjs'))) {
      console.log('Building plugin...');
      execSync('pnpm run build', { cwd: PLUGIN_DIR, stdio: 'inherit' });
    }

    // Install dependencies if needed
    if (!existsSync(join(TEST_PROJECT_DIR, 'node_modules'))) {
      console.log('Installing Angular project dependencies...');
      execSync('npm install', { cwd: TEST_PROJECT_DIR, stdio: 'inherit' });

      // Link local plugin
      const pluginNodeModulesDir = join(TEST_PROJECT_DIR, 'node_modules', '@imgly', 'plugin-print-ready-pdfs-web');
      mkdirSync(join(TEST_PROJECT_DIR, 'node_modules', '@imgly'), { recursive: true });
      execSync(`cp -r "${join(PLUGIN_DIR, 'dist')}" "${pluginNodeModulesDir}"`, { stdio: 'inherit' });
      execSync(`cp "${join(PLUGIN_DIR, 'package.json')}" "${pluginNodeModulesDir}/"`, { stdio: 'inherit' });
    }

    // Build Angular project
    console.log('Building Angular project with Webpack 5...');
    try {
      execSync('npm run build', {
        cwd: TEST_PROJECT_DIR,
        stdio: 'pipe',
        timeout: 120000
      });
      console.log('Angular build completed successfully');
    } catch (error: any) {
      console.error('Angular build failed:');
      console.error(error.stdout?.toString());
      console.error(error.stderr?.toString());
      throw new Error('Angular build failed - see output above');
    }

    // Start server for built files
    console.log('Starting HTTP server for Angular app...');
    serverProcess = spawn('npx', ['http-server', 'dist/webpack5-angular-runtime-test', '-p', String(TEST_PORT), '-c-1', '--cors'], {
      cwd: TEST_PROJECT_DIR,
      stdio: 'pipe'
    });

    // Wait for server to be ready
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server startup timeout')), 30000);

      serverProcess!.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log('Server:', output);
        if (output.includes('Available on') || output.includes('Hit CTRL-C')) {
          clearTimeout(timeout);
          setTimeout(resolve, 1000); // Give server a moment to fully start
        }
      });

      serverProcess!.stderr?.on('data', (data) => {
        console.error('Server error:', data.toString());
      });
    });
  });

  test.afterAll(async () => {
    if (serverProcess) {
      console.log('Stopping HTTP server...');
      serverProcess.kill('SIGTERM');
      serverProcess = null;
    }
  });

  test.beforeEach(async ({ page }) => {
    consoleMessages = [];
    consoleErrors = [];

    // Capture all console output
    page.on('console', (msg) => {
      const text = `${msg.type()}: ${msg.text()}`;
      consoleMessages.push(text);
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(`Page error: ${error.message}`);
    });

    page.on('requestfailed', (request) => {
      const failure = request.failure();
      consoleErrors.push(`Request failed: ${request.url()} - ${failure?.errorText || 'Unknown'}`);
    });
  });

  test('should load Angular app without import errors', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    // Wait for Angular to bootstrap
    await page.waitForSelector('#test-container', { timeout: 10000 });

    // Check import status
    const importStatus = await page.locator('#import-status').textContent();
    console.log('Import status:', importStatus);
    console.log('Console messages:', consoleMessages);
    console.log('Console errors:', consoleErrors);

    // Check for the specific file:// error the customer reported
    const hasFileProtocolError = consoleErrors.some(e =>
      e.includes('file://') && e.includes('gs.js')
    );

    if (hasFileProtocolError) {
      console.error('DETECTED: file:// protocol error for gs.js - this is the customer-reported issue');
    }

    expect(importStatus).toContain('SUCCESS');
    expect(hasFileProtocolError).toBe(false);
  });

  test('should initialize Ghostscript WASM module at runtime', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    // Wait for test to complete (auto-runs on load)
    await page.waitForFunction(
      () => (window as any).testResults?.testComplete === true,
      { timeout: 60000 }
    );

    const results: TestResults = await page.evaluate(() => (window as any).testResults);

    console.log('Test results:', JSON.stringify(results, null, 2));
    console.log('Console errors:', consoleErrors);

    // Check for gs.js loading errors
    const gsJsErrors = consoleErrors.filter(e =>
      e.includes('gs.js') || e.includes('gs.wasm') || e.includes('Ghostscript')
    );

    if (gsJsErrors.length > 0) {
      console.error('Ghostscript loading errors detected:', gsJsErrors);
    }

    expect(results.importSuccess).toBe(true);
    expect(results.initializationError).toBeNull();
  });

  test('should successfully convert PDF to PDF/X-3', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    // Wait for test to complete
    await page.waitForFunction(
      () => (window as any).testResults?.testComplete === true,
      { timeout: 90000 }
    );

    const results: TestResults = await page.evaluate(() => (window as any).testResults);

    console.log('Final test results:', JSON.stringify(results, null, 2));
    console.log('All console messages:', consoleMessages);
    console.log('All console errors:', consoleErrors);

    // This is the critical test - conversion should succeed
    if (!results.conversionSuccess) {
      console.error('CONVERSION FAILED:', results.conversionError);

      // Check if it's the specific file:// issue
      if (results.conversionError?.includes('file://')) {
        console.error('>>> CONFIRMED: This is the customer-reported file:// protocol issue <<<');
      }
    }

    expect(results.conversionAttempted).toBe(true);
    expect(results.conversionSuccess).toBe(true);
    expect(results.conversionError).toBeNull();
  });

  test('should not have file:// protocol errors in browser context', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    // Wait for test to complete
    await page.waitForFunction(
      () => (window as any).testResults?.testComplete === true,
      { timeout: 60000 }
    );

    // Specifically check for the customer's reported error pattern
    const fileProtocolErrors = consoleErrors.filter(e =>
      e.includes('file://') ||
      e.includes('Cannot find module') ||
      (e.includes('gs.js') && e.includes('load'))
    );

    if (fileProtocolErrors.length > 0) {
      console.error('File protocol errors detected (customer-reported issue):');
      fileProtocolErrors.forEach(e => console.error('  -', e));
    }

    expect(fileProtocolErrors.length).toBe(0);
  });
});
