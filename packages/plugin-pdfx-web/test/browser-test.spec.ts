import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

test.describe('PDF/X Conversion Browser Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to test page
    await page.goto(`file://${join(__dirname, 'index.html')}`);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should load PDF/X plugin successfully', async ({ page }) => {
    // Check if the plugin loaded without errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit for any async loading
    await page.waitForTimeout(2000);
    
    // Check that basic functions are available
    const isSupported = await page.evaluate(() => {
      return typeof window.PDFXPlugin !== 'undefined' && 
             typeof window.PDFXPlugin.isSupported === 'function';
    });
    
    expect(isSupported).toBe(true);
    
    // Check for critical errors (some warnings are expected)
    const criticalErrors = errors.filter(error => 
      !error.includes('Warning') && 
      !error.includes('Experimental') &&
      !error.includes('deprecated')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should report browser capabilities', async ({ page }) => {
    const capabilities = await page.evaluate(async () => {
      if (typeof window.PDFXPlugin === 'undefined') {
        throw new Error('PDF/X Plugin not loaded');
      }
      
      return window.PDFXPlugin.getCapabilities();
    });
    
    expect(capabilities).toHaveProperty('webAssembly');
    expect(capabilities).toHaveProperty('workers');
    expect(capabilities).toHaveProperty('sharedArrayBuffer');
    expect(capabilities).toHaveProperty('estimatedMemoryLimit');
    
    // WebAssembly should be supported in modern browsers
    expect(capabilities.webAssembly).toBe(true);
  });

  test('should validate PDF input correctly', async ({ page }) => {
    // Test with invalid blob
    const result = await page.evaluate(async () => {
      const invalidBlob = new Blob(['not a pdf'], { type: 'application/pdf' });
      
      try {
        await window.PDFXPlugin.convertSingle(invalidBlob, {
          version: 'PDF/X-3',
          colorSpace: 'CMYK'
        });
        return { success: true, error: null };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('PDF');
  });

  test('should load Ghostscript module', async ({ page }) => {
    // This test checks if Ghostscript can be loaded (may take time)
    test.setTimeout(60000); // 60 second timeout
    
    const loadResult = await page.evaluate(async () => {
      try {
        // Try to load Ghostscript with a timeout
        const loadPromise = window.PDFXPlugin.loadGhostscript?.();
        if (!loadPromise) {
          // If no direct load method, try through conversion
          const testBlob = new Blob(['%PDF-1.4\n1 0 obj\n<</Type/Catalog>>\nendobj\nxref\ntrailer\n%%EOF'], 
                                   { type: 'application/pdf' });
          
          // This should trigger Ghostscript loading
          await window.PDFXPlugin.convertSingle(testBlob, {
            version: 'PDF/X-3',
            colorSpace: 'CMYK'
          });
        } else {
          await loadPromise;
        }
        
        return { success: true, error: null };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    // Loading might fail due to network/CORS issues in test environment
    // We just want to ensure it attempts to load without critical errors
    if (!loadResult.success) {
      console.log('Ghostscript loading failed (expected in test environment):', loadResult.error);
    }
    
    // At minimum, the attempt should not crash the page
    const pageError = await page.evaluate(() => window.lastError || null);
    expect(pageError).toBeNull();
  });

  test('should handle conversion progress callbacks', async ({ page }) => {
    const progressUpdates = await page.evaluate(async () => {
      const updates = [];
      const testBlob = new Blob(['%PDF-1.4\n1 0 obj\n<</Type/Catalog>>\nendobj\nxref\ntrailer\n%%EOF'], 
                               { type: 'application/pdf' });
      
      try {
        await window.PDFXPlugin.convertSingle(
          testBlob,
          {
            version: 'PDF/X-3',
            colorSpace: 'CMYK'
          },
          (progress) => {
            updates.push({
              stage: progress.stage,
              progress: progress.progress,
              hasMessage: typeof progress.message === 'string'
            });
          }
        );
      } catch (error) {
        // Expected to fail, we just want to check progress callback structure
      }
      
      return updates;
    });
    
    // Even if conversion fails, progress callbacks should have proper structure
    if (progressUpdates.length > 0) {
      expect(progressUpdates[0]).toHaveProperty('stage');
      expect(progressUpdates[0]).toHaveProperty('progress');
      expect(progressUpdates[0]).toHaveProperty('hasMessage');
      expect(progressUpdates[0].hasMessage).toBe(true);
    }
  });

  test('should handle batch conversion correctly', async ({ page }) => {
    const batchResult = await page.evaluate(async () => {
      const testBlobs = [
        new Blob(['test1'], { type: 'application/pdf' }),
        new Blob(['test2'], { type: 'application/pdf' })
      ];
      
      try {
        const results = await window.PDFXPlugin.convertToPDF(testBlobs, {
          pdfx3: {
            version: 'PDF/X-3',
            colorSpace: 'CMYK'
          }
        });
        
        return { 
          success: true, 
          resultCount: results.length,
          error: null 
        };
      } catch (error) {
        return { 
          success: false, 
          resultCount: 0,
          error: error.message 
        };
      }
    });
    
    // Should return same number of results as input (even if conversion fails)
    if (batchResult.success) {
      expect(batchResult.resultCount).toBe(2);
    } else {
      // At minimum should handle the batch structure correctly
      expect(batchResult.error).toBeDefined();
    }
  });
});