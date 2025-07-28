import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import { resolve } from 'path';

let server;

test.beforeAll(async () => {
  // Start the test server
  server = spawn('node', [resolve(__dirname, 'server.mjs')], {
    detached: false,
    stdio: 'pipe'
  });
  
  server.stdout.on('data', (data) => {
    console.log(`Server: ${data.toString().trim()}`);
  });
  
  server.stderr.on('data', (data) => {
    console.error(`Server error: ${data.toString().trim()}`);
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
});

test.afterAll(async () => {
  // Stop the test server
  if (server) {
    server.kill('SIGTERM');
  }
});

test('PDF/X-3 conversion in browser', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Browser error: ${msg.text()}`);
    } else {
      console.log(`Browser: ${msg.text()}`);
    }
  });

  // Handle uncaught exceptions
  page.on('pageerror', error => {
    console.error(`Browser page error: ${error.message}`);
  });

  // Navigate to our test page served by HTTP server
  await page.goto('http://localhost:3000/test');

  // Wait for page to load
  await expect(page.locator('h1')).toContainText('PDFX Plugin Browser Test');

  // Check initial status
  await expect(page.locator('#status')).toContainText('Ready to test');

  // Click the test button
  await page.click('#runTest');

  // Wait for the test to complete (ghoulscript can take some time to load)
  await expect(page.locator('#status')).toContainText('completed', { timeout: 60000 });

  // Check if it succeeded
  const statusText = await page.locator('#status').textContent();
  expect(statusText).toContain('successfully');

  // Verify the log contains expected messages
  const logContent = await page.locator('#log').textContent();
  expect(logContent).toContain('Starting PDF/X-3 browser test');
  expect(logContent).toContain('Starting PDF/X-3 conversion using ghoulscript');
  expect(logContent).toContain('Conversion completed');
  expect(logContent).toContain('Download started');

  // Wait a bit for any final processing
  await page.waitForTimeout(2000);
});

test('Browser environment check', async ({ page }) => {
  // Simple test to verify browser environment is working
  await page.goto('data:text/html,<h1>Test</h1>');
  
  // Check that Worker is available (needed for ghoulscript)
  const workerAvailable = await page.evaluate(() => typeof Worker !== 'undefined');
  expect(workerAvailable).toBe(true);
  
  // Check that Blob is available (needed for PDF handling)
  const blobAvailable = await page.evaluate(() => typeof Blob !== 'undefined');
  expect(blobAvailable).toBe(true);
  
  console.log('✅ Browser environment has required APIs');
});