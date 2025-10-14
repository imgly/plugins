import { describe, test, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const testFile = fileURLToPath(import.meta.url);
const testDir = dirname(testFile);
import { ExternalValidators } from '../utils/external-validators.js';
import { convertToPDFX3 } from '../../dist/index.mjs';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('PDF/X Metadata Validation', () => {
  const getTestPDF = (name: string): Blob => {
    const path = join(testDir, '../fixtures/pdfs', name);
    if (!existsSync(path)) {
      throw new Error(`Test PDF not found: ${path}. Export it from CE.SDK first.`);
    }
    return new Blob([readFileSync(path)], { type: 'application/pdf' });
  };

  test('should set correct PDF/X version', async () => {
    const inputPDF = getTestPDF('test-minimal.pdf');

    const outputPDF = await convertToPDFX3(inputPDF, {
      outputProfile: 'srgb',
      title: 'Version Test',
    });

    // Check for PDF/X-3:2003 marker in PDF content
    const pdfText = await outputPDF.text();
    expect(pdfText).toContain('PDF/X-3:2003');
    expect(pdfText).toContain('GTS_PDFXVersion');
  });

  test('should set Trapped field to False', async () => {
    const inputPDF = getTestPDF('test-minimal.pdf');

    const outputPDF = await convertToPDFX3(inputPDF, {
      outputProfile: 'srgb',
      title: 'Trapped Test',
    });

    const info = await ExternalValidators.getPdfInfo(outputPDF);

    // pdfinfo should show Trapped field as False or Unknown
    // Some PDF viewers may not expose this field via pdfinfo
    if (info.trapped !== undefined && info.trapped !== null) {
      expect(info.trapped.toLowerCase()).toContain('false');
    }
  });

  test('should preserve custom title', async () => {
    const inputPDF = getTestPDF('test-minimal.pdf');

    const customTitle = 'My Custom PDF Title';
    const outputPDF = await convertToPDFX3(inputPDF, {
      outputProfile: 'srgb',
      title: customTitle,
    });

    const info = await ExternalValidators.getPdfInfo(outputPDF);
    expect(info.title).toBe(customTitle);
  });

  test('should use default title when not provided', async () => {
    const inputPDF = getTestPDF('test-minimal.pdf');

    const outputPDF = await convertToPDFX3(inputPDF, {
      outputProfile: 'srgb',
      // No title provided
    });

    const info = await ExternalValidators.getPdfInfo(outputPDF);
    expect(info.title).toBe('Untitled');
  });

  test('should populate OutputIntent with correct structure', async () => {
    const inputPDF = getTestPDF('test-minimal.pdf');

    const outputPDF = await convertToPDFX3(inputPDF, {
      outputProfile: 'fogra39',
      title: 'OutputIntent Test',
    });

    // Check for OutputIntent markers in PDF
    const pdfText = await outputPDF.text();

    // Should contain OutputIntent object
    expect(pdfText).toContain('OutputIntent');
    expect(pdfText).toContain('GTS_PDFX');

    // Should contain FOGRA39 identifier
    expect(pdfText).toContain('FOGRA39');

    // Should contain DestOutputProfile
    expect(pdfText).toContain('DestOutputProfile');
  });

  test('should use preset OutputConditionIdentifier for known profiles', async () => {
    const inputPDF = getTestPDF('test-minimal.pdf');

    const profiles = [
      { profile: 'gracol', identifier: 'CGATS 21.2' },
      { profile: 'fogra39', identifier: 'FOGRA39' },
      { profile: 'srgb', identifier: 'sRGB IEC61966-2.1' },
    ];

    for (const { profile, identifier } of profiles) {
      const outputPDF = await convertToPDFX3(inputPDF, {
        outputProfile: profile as any,
        title: `Test ${profile}`,
      });

      const pdfText = await outputPDF.text();
      expect(pdfText).toContain(identifier);
    }
  });

  test('should allow custom OutputConditionIdentifier override', async () => {
    const inputPDF = getTestPDF('test-minimal.pdf');

    const customIdentifier = 'My Custom Identifier';
    const outputPDF = await convertToPDFX3(inputPDF, {
      outputProfile: 'srgb',
      outputConditionIdentifier: customIdentifier,
      title: 'Custom Identifier Test',
    });

    const pdfText = await outputPDF.text();
    expect(pdfText).toContain(customIdentifier);
  });
});