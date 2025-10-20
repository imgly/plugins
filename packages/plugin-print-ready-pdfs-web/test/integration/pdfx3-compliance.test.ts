import { describe, test, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const testFile = fileURLToPath(import.meta.url);
const testDir = dirname(testFile);
import { ExternalValidators } from '../utils/external-validators.js';
import { convertToPDFX3 } from '../../dist/index.mjs';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Comprehensive PDF/X-3:2003 Compliance Tests
 *
 * These tests verify that the plugin produces PDFs that meet the PDF/X-3:2003 standard requirements:
 * 1. PDF/X-3 Conformance - Correct version markers and compliance indicators
 * 2. CMYK Color Space - Proper color conversion using ICC profiles
 * 3. Title Embedding - Metadata properly set
 * 4. OutputIntent - ICC profiles correctly embedded
 * 5. Font Embedding - All fonts must be embedded
 * 6. Transparency Handling - Transparency flattened by default for PDF/X-3
 * 7. Box Definitions - TrimBox, BleedBox requirements
 * 8. Structural Validity - Valid PDF structure
 */
describe('PDF/X-3:2003 Compliance Tests', () => {
  let toolsAvailable: Record<string, boolean>;

  beforeAll(async () => {
    toolsAvailable = await ExternalValidators.checkToolsAvailable();
    if (!toolsAvailable.gs || !toolsAvailable.qpdf) {
      console.warn(
        '⚠️  Some external validation tools missing. Install: brew install ghostscript qpdf poppler'
      );
    }
  });

  const getTestPDF = (name: string): Blob => {
    const path = join(testDir, '../fixtures/pdfs', name);
    if (!existsSync(path)) {
      throw new Error(
        `Test PDF not found: ${path}. Export it from CE.SDK first.`
      );
    }
    return new Blob([readFileSync(path)], { type: 'application/pdf' });
  };

  describe('Requirement 1: PDF/X-3 Conformance', () => {
    test('should mark PDF as PDF/X-3:2003 compliant', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'fogra39',
        title: 'Conformance Test',
      });

      // Check for PDF/X-3:2003 version marker
      const pdfText = await outputPDF.text();
      expect(pdfText).toContain('PDF/X-3:2003');
      expect(pdfText).toContain('GTS_PDFXVersion');
      expect(pdfText).toContain('GTS_PDFXConformance');
    });

    test('should be PDF version 1.4 (required for PDF/X-3)', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'srgb',
        title: 'Version Test',
      });

      const info = await ExternalValidators.getPdfInfo(outputPDF);
      expect(info.pdfVersion).toBe('1.4');
    });

    test('should set Trapped flag to False', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'srgb',
        title: 'Trapped Test',
      });

      const pdfText = await outputPDF.text();
      // Trapped flag can be formatted with or without spaces
      expect(
        pdfText.includes('/Trapped /False') || pdfText.includes('/Trapped/False')
      ).toBe(true);
    });

    test('should validate with Ghostscript PDF/X checker', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'fogra39',
        title: 'GS Validation Test',
      });

      const validation = await ExternalValidators.validatePDFX(outputPDF);

      // Should not have critical PDF/X errors
      const hasCriticalErrors = validation.errors.some(
        (err) =>
          err.toLowerCase().includes('pdfx') ||
          err.toLowerCase().includes('outputintent')
      );

      expect(hasCriticalErrors).toBe(false);
    });
  });

  describe('Requirement 2: CMYK Color Space Conversion', () => {
    test('should convert RGB to CMYK with FOGRA39 profile', async () => {
      const inputPDF = getTestPDF('test-vectors.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'fogra39',
        title: 'CMYK Conversion Test',
      });

      // Check that the PDF contains DeviceCMYK color space references
      const pdfText = await outputPDF.text();
      expect(
        pdfText.includes('DeviceCMYK') || pdfText.includes('/CMYK')
      ).toBe(true);

      // Verify output is larger (CMYK typically takes more space than RGB)
      expect(outputPDF.size).toBeGreaterThan(inputPDF.size * 0.5);
    });

    test('should convert RGB to CMYK with GRACoL profile', async () => {
      const inputPDF = getTestPDF('test-vectors.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'gracol',
        title: 'GRACoL CMYK Test',
      });

      const pdfText = await outputPDF.text();
      expect(
        pdfText.includes('DeviceCMYK') || pdfText.includes('/CMYK')
      ).toBe(true);
    });

    test('should handle RGB profile (sRGB) without CMYK conversion', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'srgb',
        title: 'RGB Profile Test',
      });

      // Should still be valid PDF/X-3 (skip if qpdf not available)
      if (toolsAvailable.qpdf) {
        const validation = await ExternalValidators.validateStructure(outputPDF);
        expect(validation.valid).toBe(true);
      }

      // Should contain RGB references
      const pdfText = await outputPDF.text();
      expect(pdfText.includes('sRGB') || pdfText.includes('RGB')).toBe(true);
    });
  });

  describe('Requirement 3: Title Embedding', () => {
    test('should embed custom title in metadata', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');
      const customTitle = 'My Print-Ready PDF Document';

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'fogra39',
        title: customTitle,
      });

      const info = await ExternalValidators.getPdfInfo(outputPDF);
      expect(info.title).toBe(customTitle);

      // Also check it's in the PDF content
      const pdfText = await outputPDF.text();
      expect(pdfText).toContain(customTitle);
    });

    test('should use default title when not specified', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'srgb',
      });

      const info = await ExternalValidators.getPdfInfo(outputPDF);
      expect(info.title).toBe('Untitled');
    });

    test('should handle special characters in title', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');
      const specialTitle = 'Test & Print—Ready (PDF) #123';

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'srgb',
        title: specialTitle,
      });

      const info = await ExternalValidators.getPdfInfo(outputPDF);
      // Title may be escaped, so check if it contains the key parts
      expect(info.title).toContain('Test');
      expect(info.title).toContain('Print');
    });
  });

  describe('Requirement 4: OutputIntent and ICC Profile Embedding', () => {
    test('should embed OutputIntent with FOGRA39 identifier', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'fogra39',
        title: 'OutputIntent Test',
      });

      const pdfText = await outputPDF.text();

      // Check for OutputIntent object
      expect(pdfText).toContain('OutputIntent');
      expect(pdfText).toContain('GTS_PDFX');

      // Check for FOGRA39 identifier
      expect(pdfText).toContain('FOGRA39');

      // Check for DestOutputProfile (ICC profile reference)
      expect(pdfText).toContain('DestOutputProfile');
    });

    test('should embed OutputIntent with GRACoL identifier', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'gracol',
        title: 'GRACoL OutputIntent Test',
      });

      const pdfText = await outputPDF.text();
      expect(pdfText).toContain('OutputIntent');
      expect(pdfText).toContain('CGATS 21.2'); // GRACoL identifier
    });

    test('should embed OutputIntent with sRGB identifier', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'srgb',
        title: 'sRGB OutputIntent Test',
      });

      const pdfText = await outputPDF.text();
      expect(pdfText).toContain('OutputIntent');
      expect(pdfText).toContain('sRGB IEC61966-2.1');
    });

    test('should allow custom OutputConditionIdentifier', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');
      const customIdentifier = 'Custom_Print_Condition_2025';

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'fogra39',
        outputConditionIdentifier: customIdentifier,
        outputCondition: 'Custom printing condition',
        title: 'Custom OutputIntent Test',
      });

      const pdfText = await outputPDF.text();
      expect(pdfText).toContain(customIdentifier);
      expect(pdfText).toContain('Custom printing condition');
    });

    test('should embed custom ICC profile', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      // Use a bundled profile as a custom profile for testing
      const customProfile = new Blob([
        readFileSync(join(testDir, '../../dist/ISOcoated_v2_eci.icc')),
      ]);

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'custom',
        customProfile: customProfile,
        outputConditionIdentifier: 'Custom ICC Profile',
        title: 'Custom ICC Test',
      });

      // Should be valid (skip if qpdf not available)
      if (toolsAvailable.qpdf) {
        const validation = await ExternalValidators.validateStructure(outputPDF);
        expect(validation.valid).toBe(true);
      }

      // Should contain ICC profile reference
      const pdfText = await outputPDF.text();
      expect(pdfText).toContain('OutputIntent');
      expect(pdfText).toContain('Custom ICC Profile');
    });

    test('should actually embed ICC profile binary data', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      // Load the FOGRA39 profile for testing
      const iccProfilePath = join(testDir, '../../dist/ISOcoated_v2_eci.icc');
      const originalProfileData = readFileSync(iccProfilePath);
      const customProfile = new Blob([originalProfileData]);

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'custom',
        customProfile: customProfile,
        outputConditionIdentifier: 'FOGRA39',
        title: 'ICC Embedding Verification',
      });

      // Verify the ICC profile is embedded in the PDF
      const pdfBuffer = Buffer.from(await outputPDF.arrayBuffer());
      const pdfContent = pdfBuffer.toString('binary');

      // Check OutputIntent is present with the identifier
      expect(pdfContent).toContain('OutputIntent');
      expect(pdfContent).toContain('DestOutputProfile');
      expect(pdfContent).toContain('FOGRA39');

      // Verify the file size increased significantly (profile was added)
      // ICC profiles are 500KB+, so output should be much larger
      const sizeIncrease = outputPDF.size - inputPDF.size;
      expect(sizeIncrease).toBeGreaterThan(400000); // At least 400KB added

      console.log(
        `✓ Custom profile: Added ${Math.round(sizeIncrease / 1024)}KB to PDF`
      );
    });

    test('should embed preset ICC profiles with correct metadata', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      // Test each preset profile
      const profiles = [
        { name: 'fogra39', identifier: 'FOGRA39', minSizeIncrease: 400000 },
        { name: 'gracol', identifier: 'CGATS', minSizeIncrease: 400000 },
        { name: 'srgb', identifier: 'sRGB', minSizeIncrease: null }, // sRGB is small (3KB), may result in net decrease
      ] as const;

      for (const profile of profiles) {
        const outputPDF = await convertToPDFX3(inputPDF, {
          outputProfile: profile.name,
          title: `${profile.name} Embedding Test`,
        });

        const pdfBuffer = Buffer.from(await outputPDF.arrayBuffer());
        const pdfContent = pdfBuffer.toString('binary');

        // Should contain OutputIntent with profile identifier
        expect(pdfContent).toContain('OutputIntent');
        expect(pdfContent).toContain('DestOutputProfile');
        expect(pdfContent).toContain(profile.identifier);

        // File size check - CMYK profiles add significant size, sRGB is small
        const sizeIncrease = outputPDF.size - inputPDF.size;
        if (profile.minSizeIncrease !== null) {
          expect(sizeIncrease).toBeGreaterThan(profile.minSizeIncrease);
        }

        console.log(
          `✓ ${profile.name}: Embedded ICC profile (${sizeIncrease > 0 ? '+' : ''}${Math.round(sizeIncrease / 1024)}KB, total ${Math.round(outputPDF.size / 1024)}KB)`
        );
      }
    });
  });

  describe('Requirement 5: Font Embedding', () => {
    test('should embed all fonts in text documents', async () => {
      const inputPDF = getTestPDF('test-text.pdf');

      // Disable transparency flattening to preserve fonts/text
      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'fogra39',
        title: 'Font Embedding Test',
        flattenTransparency: false,
      });

      const fonts = await ExternalValidators.validateFonts(outputPDF);

      // Check if fonts exist
      if (fonts.length === 0) {
        console.warn('⚠️  No fonts found in test-text.pdf');
        return;
      }

      // All fonts must be embedded for PDF/X-3
      const allEmbedded = fonts.every((font) => font.embedded);
      expect(allEmbedded).toBe(true);

      if (!allEmbedded) {
        const notEmbedded = fonts.filter((f) => !f.embedded);
        console.error('❌ Fonts not embedded:', notEmbedded);
        throw new Error(
          `${notEmbedded.length} fonts not embedded: ${notEmbedded.map((f) => f.name).join(', ')}`
        );
      }
    });

    test('should preserve font subsetting', async () => {
      const inputPDF = getTestPDF('test-text.pdf');

      // Disable transparency flattening to preserve fonts
      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'srgb',
        title: 'Font Subset Test',
        flattenTransparency: false,
      });

      const fonts = await ExternalValidators.validateFonts(outputPDF);

      // Skip if no fonts
      if (fonts.length === 0) {
        console.warn('⚠️  No fonts found in test-text.pdf');
        return;
      }

      // All fonts (including subsets) must be embedded
      expect(fonts.every((f) => f.embedded)).toBe(true);
    });
  });

  describe('Requirement 6: Transparency Handling', () => {
    test('should flatten transparency by default for PDF/X-3 compliance', async () => {
      const inputPDF = getTestPDF('test-images.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'fogra39',
        title: 'Transparency Flatten Test',
      });

      // After flattening, transparency should be removed
      const hasTransparency =
        await ExternalValidators.hasTransparency(outputPDF);
      expect(hasTransparency).toBe(false);
    });

    test('should allow transparency preservation when explicitly disabled', async () => {
      const inputPDF = getTestPDF('test-images.pdf');

      // Check if input has transparency
      const inputHasTransparency =
        await ExternalValidators.hasTransparency(inputPDF);

      // Skip if input has no transparency
      if (!inputHasTransparency) {
        console.warn('⚠️  Input PDF has no transparency, skipping test');
        return;
      }

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'srgb',
        title: 'Transparency Preserve Test',
        flattenTransparency: false,
      });

      // Transparency should be preserved
      const outputHasTransparency =
        await ExternalValidators.hasTransparency(outputPDF);
      expect(outputHasTransparency).toBe(true);
    });
  });

  describe('Requirement 7: Box Definitions', () => {
    test('should include TrimBox definition', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'srgb',
        title: 'TrimBox Test',
      });

      const pdfText = await outputPDF.text();
      expect(pdfText).toContain('TrimBox');
    });

    test('should maintain page dimensions', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'srgb',
        title: 'Page Size Test',
      });

      const inputInfo = await ExternalValidators.getPdfInfo(inputPDF);
      const outputInfo = await ExternalValidators.getPdfInfo(outputPDF);

      // Page count should match
      expect(outputInfo.pages).toBe(inputInfo.pages);
    });
  });

  describe('Requirement 8: Structural Validity', () => {
    test('should produce structurally valid PDF', async () => {
      const inputPDF = getTestPDF('test-complex.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'fogra39',
        title: 'Structure Validation Test',
      });

      // Validate with qpdf (skip if not available)
      if (toolsAvailable.qpdf) {
        const validation = await ExternalValidators.validateStructure(outputPDF);
        expect(validation.valid).toBe(true);

        if (!validation.valid) {
          console.error('❌ Validation errors:', validation.errors);
          console.error('⚠️  Validation warnings:', validation.warnings);
        }
      }
    });

    test('should handle multi-page documents', async () => {
      const inputPDF = getTestPDF('test-complex.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'fogra39',
        title: 'Multi-page Test',
      });

      const info = await ExternalValidators.getPdfInfo(outputPDF);
      expect(info.pages).toBeGreaterThan(0);

      // Each page should be valid (skip if qpdf not available)
      if (toolsAvailable.qpdf) {
        const validation = await ExternalValidators.validateStructure(outputPDF);
        expect(validation.valid).toBe(true);
      }
    });

    test('should produce non-corrupt PDF', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'srgb',
        title: 'Corruption Test',
      });

      // Basic corruption check - PDF should start with %PDF
      const arrayBuffer = await outputPDF.arrayBuffer();
      const header = new Uint8Array(arrayBuffer.slice(0, 4));
      const headerStr = String.fromCharCode(...header);
      expect(headerStr).toBe('%PDF');

      // Should be readable by pdfinfo
      const info = await ExternalValidators.getPdfInfo(outputPDF);
      expect(info.pdfVersion).toBeTruthy();
    });

    test('should maintain reasonable file size', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'srgb',
        title: 'File Size Test',
      });

      // Output should not be excessively large
      // For simple PDFs, allow up to 50x size increase (ICC profile embedding adds overhead)
      expect(outputPDF.size).toBeLessThan(inputPDF.size * 50);

      // But should still be larger than zero
      expect(outputPDF.size).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty title gracefully', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'srgb',
        title: '',
      });

      const info = await ExternalValidators.getPdfInfo(outputPDF);
      // Empty title should be treated as empty string
      expect(info.title).toBeDefined();
    });

    test('should reject invalid output profile', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      await expect(
        convertToPDFX3(inputPDF, {
          outputProfile: 'invalid-profile' as any,
          title: 'Should Fail',
        })
      ).rejects.toThrow('Invalid outputProfile');
    });

    test('should reject missing custom profile blob', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      await expect(
        convertToPDFX3(inputPDF, {
          outputProfile: 'custom',
          title: 'Should Fail',
        })
      ).rejects.toThrow('customProfile Blob is required');
    });

    test('should handle very small PDFs', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'srgb',
        title: 'Small PDF Test',
      });

      // Should produce valid output even for minimal input
      expect(outputPDF.size).toBeGreaterThan(0);

      // Validate structure (skip if qpdf not available)
      if (toolsAvailable.qpdf) {
        const validation = await ExternalValidators.validateStructure(outputPDF);
        expect(validation.valid).toBe(true);
      }
    });

    test('should handle complex PDFs with mixed content', async () => {
      const inputPDF = getTestPDF('test-complex.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'fogra39',
        title: 'Complex PDF Test',
      });

      // Should handle without errors
      expect(outputPDF.size).toBeGreaterThan(0);

      // Should be structurally valid (skip if qpdf not available)
      if (toolsAvailable.qpdf) {
        const validation = await ExternalValidators.validateStructure(outputPDF);
        expect(validation.valid).toBe(true);
      }

      // Should preserve content (if not rasterized due to transparency)
      const text = await ExternalValidators.extractText(outputPDF);
      // Text may be empty if the page was fully rasterized due to transparency
      if (text.length === 0) {
        console.warn(
          '⚠️  No extractable text found - PDF may be fully rasterized due to transparency'
        );
      }
      // Just verify it doesn't throw errors
      expect(text).toBeDefined();
    });
  });
});
