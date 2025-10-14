import { describe, test, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const testFile = fileURLToPath(import.meta.url);
const testDir = dirname(testFile);
import { ExternalValidators } from '../utils/external-validators.js';
import { convertToPDFX3 } from '../../dist/index.mjs';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('ICC Profile Conversion Tests', () => {
  let toolsAvailable: Record<string, boolean>;

  beforeAll(async () => {
    // Check if external tools are available
    toolsAvailable = await ExternalValidators.checkToolsAvailable();
    if (!toolsAvailable.pdffonts || !toolsAvailable.pdfimages || !toolsAvailable.qpdf) {
      console.warn('⚠️  Some external tools missing. Run: cd test && ./setup.sh');
    }
  });

  const getTestPDF = (name: string): Blob => {
    const path = join(testDir, '../fixtures/pdfs', name);
    if (!existsSync(path)) {
      throw new Error(`Test PDF not found: ${path}. Export it from CE.SDK first.`);
    }
    return new Blob([readFileSync(path)], { type: 'application/pdf' });
  };

  describe('Preset Profiles', () => {
    test('should convert with GRACoL profile', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'gracol',
        title: 'GRACoL Test',
      });

      expect(outputPDF.size).toBeGreaterThan(0);

      // Validate structure
      const validation = await ExternalValidators.validateStructure(outputPDF);
      expect(validation.valid).toBe(true);

      // Check basic info
      const info = await ExternalValidators.getPdfInfo(outputPDF);
      expect(info.title).toBe('GRACoL Test');
    });

    test('should convert with FOGRA39 profile', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'fogra39',
        title: 'FOGRA39 Test',
      });

      expect(outputPDF.size).toBeGreaterThan(0);

      const validation = await ExternalValidators.validateStructure(outputPDF);
      expect(validation.valid).toBe(true);
    });

    test('should convert with sRGB profile', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'srgb',
        title: 'sRGB Test',
      });

      expect(outputPDF.size).toBeGreaterThan(0);

      const validation = await ExternalValidators.validateStructure(outputPDF);
      expect(validation.valid).toBe(true);
    });
  });

  describe('Custom Profile', () => {
    test('should accept custom ICC profile', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      // Use one of the bundled profiles as a "custom" profile for testing
      const customProfile = new Blob([
        readFileSync('src/wasm/profiles/GRACoL2013_CRPC6.icc'),
      ]);

      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: 'custom',
        customProfile: customProfile,
        outputConditionIdentifier: 'Custom Test Profile',
        outputCondition: 'Custom Profile Description',
        title: 'Custom Profile Test',
      });

      expect(outputPDF.size).toBeGreaterThan(0);

      const validation = await ExternalValidators.validateStructure(outputPDF);
      expect(validation.valid).toBe(true);

      const info = await ExternalValidators.getPdfInfo(outputPDF);
      expect(info.title).toBe('Custom Profile Test');
    });

    test('should reject missing custom profile', async () => {
      const inputPDF = getTestPDF('test-minimal.pdf');

      await expect(
        convertToPDFX3(inputPDF, {
          outputProfile: 'custom',
          title: 'Should Fail',
        })
      ).rejects.toThrow('customProfile Blob is required');
    });
  });
});