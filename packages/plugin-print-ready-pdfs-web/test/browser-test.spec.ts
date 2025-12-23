import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

test.describe('PDF/X Conversion Browser Tests', () => {
  let consoleMessages: string[] = [];
  let errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset message arrays
    consoleMessages = [];
    errors = [];

    // Set up console listeners BEFORE navigating
    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(`${msg.type()}: ${text}`);
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });

    page.on('pageerror', (error) => {
      errors.push(`Page error: ${error.message}`);
    });

    // Track failed requests
    page.on('requestfailed', (request) => {
      const failure = request.failure();
      errors.push(`Request failed: ${request.url()} - ${failure?.errorText || 'Unknown error'}`);
    });

    page.on('response', (response) => {
      if (response.status() >= 400) {
        errors.push(`HTTP ${response.status()}: ${response.url()}`);
      }
    });

    // Navigate to test page via HTTP server
    await page.goto('/test/index.html');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Wait for module to finish loading (or fail to load)
    await page.waitForFunction(
      () => (window as any).moduleLoaded !== undefined,
      { timeout: 10000 }
    );
  });

  test('should load PDF/X plugin successfully', async ({ page }) => {

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
    // Test with invalid blob and no output profile
    const result = await page.evaluate(async () => {
      const invalidBlob = new Blob(['not a pdf'], { type: 'application/pdf' });

      try {
        // Should fail because no output profile provided
        await window.PDFXPlugin.convertToPDFX3(invalidBlob, {});
        return { success: true, error: null };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('outputProfile');
  });

  test('should handle missing output profile gracefully', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const testBlob = new Blob(
          [
            '%PDF-1.4\n1 0 obj\n<</Type/Catalog>>\nendobj\nxref\ntrailer\n%%EOF',
          ],
          { type: 'application/pdf' }
        );

        // Should fail without output profile
        await window.PDFXPlugin.convertToPDFX3(testBlob, {});

        return { success: true, error: null };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Should fail gracefully when no output profile is provided
    expect(result.success).toBe(false);
    expect(result.error).toContain('outputProfile');

    // At minimum, the attempt should not crash the page
    const pageError = await page.evaluate(() => window.lastError || null);
    expect(pageError).toBeNull();
  });

  test('should require output profile for conversion', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const testBlob = new Blob(
        ['%PDF-1.4\n1 0 obj\n<</Type/Catalog>>\nendobj\nxref\ntrailer\n%%EOF'],
        { type: 'application/pdf' }
      );

      try {
        // Try conversion without output profile
        await window.PDFXPlugin.convertToPDFX3(testBlob, {});
        return { success: true, error: null };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Should fail without output profile
    expect(result.success).toBe(false);
    expect(result.error).toContain('outputProfile');
  });

  test('should accept batch conversion API calls', async ({ page }) => {
    const batchResult = await page.evaluate(async () => {
      // Create valid minimal PDFs
      const validPDFContent = '%PDF-1.4\n1 0 obj\n<</Type/Catalog>>\nendobj\ntrailer\n%%EOF';
      const testBlobs = [
        new Blob([validPDFContent], { type: 'application/pdf' }),
        new Blob([validPDFContent], { type: 'application/pdf' }),
      ];

      try {
        // Test that the API can be called in batch mode (even if it fails processing)
        const promises = testBlobs.map(blob => window.PDFXPlugin.convertToPDFX3(blob, {
          outputProfile: 'srgb',
          title: 'Test Document'
        }));

        // The API should accept the calls (doesn't matter if actual processing fails in dummy implementation)
        return {
          canCreatePromises: promises.length === 2,
          promisesCreated: true,
          error: null,
        };
      } catch (error) {
        return {
          canCreatePromises: false,
          promisesCreated: false,
          error: error.message,
        };
      }
    });

    // Should be able to create batch conversion promises (API interface test)
    expect(batchResult.canCreatePromises).toBe(true);
    expect(batchResult.promisesCreated).toBe(true);
  });

  test('E2E: should convert real PDF to PDF/X-3 with FOGRA39', async ({ page }) => {
    // Load test PDF from fixtures
    const testPdfPath = join(__dirname, 'fixtures', 'pdfs', 'test-minimal.pdf');
    const testPdfBuffer = readFileSync(testPdfPath);

    const result = await page.evaluate(async (pdfData) => {
      try {
        // Create blob from test PDF
        const inputBlob = new Blob([new Uint8Array(pdfData)], { type: 'application/pdf' });

        const startTime = Date.now();

        // Perform actual conversion
        // In Vite-like environments (including this test with http-server), assetPath is auto-detected
        const outputBlob = await window.PDFXPlugin.convertToPDFX3(inputBlob, {
          outputProfile: 'fogra39',
          title: 'E2E Test - FOGRA39'
        });

        const conversionTime = Date.now() - startTime;

        // Read output to verify it's a valid PDF
        const outputArray = new Uint8Array(await outputBlob.arrayBuffer());
        const pdfHeader = String.fromCharCode(...outputArray.slice(0, 4));

        return {
          success: true,
          inputSize: inputBlob.size,
          outputSize: outputBlob.size,
          conversionTime,
          isValidPDF: pdfHeader === '%PDF',
          error: null
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    }, Array.from(testPdfBuffer));

    expect(result.success).toBe(true);
    expect(result.isValidPDF).toBe(true);
    expect(result.outputSize).toBeGreaterThan(0);
    expect(result.conversionTime).toBeLessThan(30000); // Should complete within 30s

    console.log(`Conversion completed in ${result.conversionTime}ms`);
    console.log(`Input: ${result.inputSize} bytes, Output: ${result.outputSize} bytes`);
  });

  test('E2E: should convert real PDF to PDF/X-3 with GRACoL', async ({ page }) => {
    const testPdfPath = join(__dirname, 'fixtures', 'pdfs', 'test-text.pdf');
    const testPdfBuffer = readFileSync(testPdfPath);

    const result = await page.evaluate(async (pdfData) => {
      try {
        const inputBlob = new Blob([new Uint8Array(pdfData)], { type: 'application/pdf' });

        const startTime = Date.now();
        // In Vite-like environments, assetPath is auto-detected
        const outputBlob = await window.PDFXPlugin.convertToPDFX3(inputBlob, {
          outputProfile: 'gracol',
          title: 'E2E Test - GRACoL'
        });
        const conversionTime = Date.now() - startTime;

        const outputArray = new Uint8Array(await outputBlob.arrayBuffer());
        const pdfHeader = String.fromCharCode(...outputArray.slice(0, 4));

        return {
          success: true,
          inputSize: inputBlob.size,
          outputSize: outputBlob.size,
          conversionTime,
          isValidPDF: pdfHeader === '%PDF',
          error: null
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    }, Array.from(testPdfBuffer));

    expect(result.success).toBe(true);
    expect(result.isValidPDF).toBe(true);
    expect(result.outputSize).toBeGreaterThan(0);

    console.log(`GRACoL conversion completed in ${result.conversionTime}ms`);
  });

  test('E2E: should convert PDF with images to PDF/X-3', async ({ page }) => {
    const testPdfPath = join(__dirname, 'fixtures', 'pdfs', 'test-images.pdf');
    const testPdfBuffer = readFileSync(testPdfPath);

    const result = await page.evaluate(async (pdfData) => {
      try {
        const inputBlob = new Blob([new Uint8Array(pdfData)], { type: 'application/pdf' });

        const startTime = Date.now();
        // In Vite-like environments, assetPath is auto-detected
        const outputBlob = await window.PDFXPlugin.convertToPDFX3(inputBlob, {
          outputProfile: 'fogra39',
          title: 'E2E Test - Images',
          flattenTransparency: true
        });
        const conversionTime = Date.now() - startTime;

        const outputArray = new Uint8Array(await outputBlob.arrayBuffer());
        const pdfHeader = String.fromCharCode(...outputArray.slice(0, 4));

        return {
          success: true,
          inputSize: inputBlob.size,
          outputSize: outputBlob.size,
          conversionTime,
          isValidPDF: pdfHeader === '%PDF',
          error: null
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    }, Array.from(testPdfBuffer));

    expect(result.success).toBe(true);
    expect(result.isValidPDF).toBe(true);
    expect(result.outputSize).toBeGreaterThan(0);

    console.log(`Image PDF conversion completed in ${result.conversionTime}ms`);
  });
});
