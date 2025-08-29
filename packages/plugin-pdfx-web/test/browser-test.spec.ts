import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

test.describe('PDF/X Conversion Browser Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test page via HTTP server
    await page.goto('/test/index.html');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should load PDF/X plugin successfully', async ({ page }) => {
    // Check if the plugin loaded without errors
    const errors = [];
    const consoleMessages = [];
    page.on('console', (msg) => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit for any async loading
    await page.waitForTimeout(2000);

    // Debug: Check what's available on window
    const windowDebug = await page.evaluate(() => {
      return {
        hasPDFXPlugin: typeof window.PDFXPlugin !== 'undefined',
        PDFXPluginKeys: window.PDFXPlugin ? Object.keys(window.PDFXPlugin) : null,
        windowKeys: Object.keys(window).filter(k => k.includes('PDF') || k.includes('convert')),
        moduleErrors: window.moduleErrors || null
      };
    });

    console.log('Window Debug Info:', JSON.stringify(windowDebug, null, 2));
    console.log('Console messages:', consoleMessages);
    console.log('Errors:', errors);

    // Check that basic functions are available
    const isSupported = await page.evaluate(() => {
      return (
        typeof window.PDFXPlugin !== 'undefined' &&
        typeof window.PDFXPlugin.convertToPDFX3 === 'function'
      );
    });

    expect(isSupported).toBe(true);

    // Check for critical errors (some warnings are expected)
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes('Warning') &&
        !error.includes('Experimental') &&
        !error.includes('deprecated')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('should have conversion function available', async ({ page }) => {
    const hasFunction = await page.evaluate(async () => {
      if (typeof window.PDFXPlugin === 'undefined') {
        throw new Error('PDF/X Plugin not loaded');
      }

      return typeof window.PDFXPlugin.convertToPDFX3 === 'function';
    });

    expect(hasFunction).toBe(true);
  });

  test('should validate PDF input correctly', async ({ page }) => {
    // Test with invalid blob and no ICC profile
    const result = await page.evaluate(async () => {
      const invalidBlob = new Blob(['not a pdf'], { type: 'application/pdf' });

      try {
        // Should fail because no ICC profile provided
        await window.PDFXPlugin.convertToPDFX3(invalidBlob, {});
        return { success: true, error: null };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('ICC profile');
  });

  test('should handle missing ICC profile gracefully', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const testBlob = new Blob(
          [
            '%PDF-1.4\n1 0 obj\n<</Type/Catalog>>\nendobj\nxref\ntrailer\n%%EOF',
          ],
          { type: 'application/pdf' }
        );

        // Should fail without ICC profile
        await window.PDFXPlugin.convertToPDFX3(testBlob, {});

        return { success: true, error: null };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Should fail gracefully when no ICC profile is provided
    expect(result.success).toBe(false);
    expect(result.error).toContain('ICC profile');

    // At minimum, the attempt should not crash the page
    const pageError = await page.evaluate(() => window.lastError || null);
    expect(pageError).toBeNull();
  });

  test('should require ICC profile for conversion', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const testBlob = new Blob(
        ['%PDF-1.4\n1 0 obj\n<</Type/Catalog>>\nendobj\nxref\ntrailer\n%%EOF'],
        { type: 'application/pdf' }
      );

      try {
        // Try conversion without ICC profile
        await window.PDFXPlugin.convertToPDFX3(testBlob, {});
        return { success: true, error: null };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Should fail without ICC profile
    expect(result.success).toBe(false);
    expect(result.error).toContain('ICC profile');
  });

  test('should handle batch conversion correctly', async ({ page }) => {
    const batchResult = await page.evaluate(async () => {
      const testBlobs = [
        new Blob(['test1'], { type: 'application/pdf' }),
        new Blob(['test2'], { type: 'application/pdf' }),
      ];

      try {
        // Test batch conversion using Promise.all with convertToPDFX3
        const results = await Promise.all(
          testBlobs.map(blob => window.PDFXPlugin.convertToPDFX3(blob, {
            outputProfile: 'srgb',
            title: 'Test Document'
          }))
        );

        return {
          success: true,
          resultCount: results.length,
          error: null,
        };
      } catch (error) {
        return {
          success: false,
          resultCount: 0,
          error: error.message,
        };
      }
    });

    // Should return same number of results as input
    expect(batchResult.success).toBe(true);
    expect(batchResult.resultCount).toBe(2);
  });
});
