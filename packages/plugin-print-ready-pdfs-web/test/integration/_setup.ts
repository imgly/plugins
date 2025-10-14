/**
 * Test setup - loads the PDF/X plugin into the browser for testing
 */
import { Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function setupPluginInBrowser(page: Page): Promise<void> {
  // Load the built plugin
  const pluginCode = readFileSync(
    join(__dirname, '../../dist/index.mjs'),
    'utf-8'
  );

  // Inject into page
  await page.addScriptTag({ content: pluginCode });

  // Wait for plugin to be available
  await page.waitForFunction(() => typeof window.convertToPDFX3 !== 'undefined');
}