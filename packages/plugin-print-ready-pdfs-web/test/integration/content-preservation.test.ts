import { describe, test, expect, beforeAll } from '@jest/globals';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { describe as _describe, test, expect } from '@jest/globals';
import { ExternalValidators } from '../utils/external-validators.js';
import { convertToPDFX3 } from '../../dist/index.mjs';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Content Preservation Tests', () => {
  const getTestPDF = (name: string): Blob => {
    const path = join(__dirname, '../fixtures/pdfs', name);
    if (!existsSync(path)) {
      throw new Error(`Test PDF not found: ${path}. Export it from CE.SDK first.`);
    }
    return new Blob([readFileSync(path)], { type: 'application/pdf' });
  };

  test('should not rasterize vector graphics', async () => {
    const inputPDF = getTestPDF('test-vectors.pdf');

    const outputPDF = await convertToPDFX3(inputPDF, {
      outputProfile: 'srgb',
      title: 'Vector Test',
    });

    // Count images in input vs output
    const inputImages = await ExternalValidators.listImages(inputPDF);
    const outputImages = await ExternalValidators.listImages(outputPDF);

    // Output should not have significantly more images than input
    // (would indicate rasterization of vectors)
    expect(outputImages.length).toBeLessThanOrEqual(inputImages.length + 2);

    // Check for large images that would indicate rasterization
    const largeImages = outputImages.filter(
      (img) => img.width > 1000 || img.height > 1000
    );

    expect(largeImages.length).toBe(0);
  });

  test('should preserve text as searchable', async () => {
    const inputPDF = getTestPDF('test-text.pdf');

    const outputPDF = await convertToPDFX3(inputPDF, {
      outputProfile: 'srgb',
      title: 'Text Test',
    });

    // Extract text from both PDFs
    const inputText = await ExternalValidators.extractText(inputPDF);
    const outputText = await ExternalValidators.extractText(outputPDF);

    // Output should contain similar text (allowing for minor differences)
    expect(outputText.length).toBeGreaterThan(0);
    expect(outputText.length).toBeGreaterThan(inputText.length * 0.8);
  });

  test('should embed all fonts', async () => {
    const inputPDF = getTestPDF('test-text.pdf');

    const outputPDF = await convertToPDFX3(inputPDF, {
      outputProfile: 'srgb',
      title: 'Font Embedding Test',
    });

    const fonts = await ExternalValidators.validateFonts(outputPDF);

    // Should have fonts
    expect(fonts.length).toBeGreaterThan(0);

    // All fonts must be embedded for PDF/X
    const allEmbedded = fonts.every((font) => font.embedded);
    expect(allEmbedded).toBe(true);

    if (!allEmbedded) {
      const notEmbedded = fonts.filter((f) => !f.embedded);
      console.error('Fonts not embedded:', notEmbedded);
    }
  });

  test('should maintain reasonable object count', async () => {
    const inputPDF = getTestPDF('test-complex.pdf');

    const outputPDF = await convertToPDFX3(inputPDF, {
      outputProfile: 'srgb',
      title: 'Object Count Test',
    });

    const inputObjects = await ExternalValidators.countPdfObjects(inputPDF);
    const outputObjects = await ExternalValidators.countPdfObjects(outputPDF);

    // Output should not drastically reduce object count
    // (which would indicate flattening/rasterization)
    // Allow some reduction for optimization, but not more than 50%
    expect(outputObjects).toBeGreaterThan(inputObjects * 0.5);
  });

  test('should preserve images without re-encoding', async () => {
    const inputPDF = getTestPDF('test-images.pdf');

    const outputPDF = await convertToPDFX3(inputPDF, {
      outputProfile: 'srgb',
      title: 'Image Test',
    });

    const inputImages = await ExternalValidators.listImages(inputPDF);
    const outputImages = await ExternalValidators.listImages(outputPDF);

    // Should have same number of images
    expect(outputImages.length).toBe(inputImages.length);

    // Images should have similar dimensions (allowing for minor differences)
    for (let i = 0; i < inputImages.length; i++) {
      const inputImg = inputImages[i];
      const outputImg = outputImages[i];

      expect(outputImg.width).toBeGreaterThan(inputImg.width * 0.9);
      expect(outputImg.height).toBeGreaterThan(inputImg.height * 0.9);
    }
  });

  test('should handle mixed content without rasterizing', async () => {
    const inputPDF = getTestPDF('test-complex.pdf');

    const outputPDF = await convertToPDFX3(inputPDF, {
      outputProfile: 'srgb',
      title: 'Mixed Content Test',
    });

    // Validate overall structure
    const validation = await ExternalValidators.validateStructure(outputPDF);
    expect(validation.valid).toBe(true);

    // Check text is preserved
    const text = await ExternalValidators.extractText(outputPDF);
    expect(text.length).toBeGreaterThan(0);

    // Check fonts are embedded
    const allFontsEmbedded = await ExternalValidators.areAllFontsEmbedded(
      outputPDF
    );
    expect(allFontsEmbedded).toBe(true);

    // Check images are reasonable
    const images = await ExternalValidators.listImages(outputPDF);
    const largeImages = images.filter(
      (img) => img.width > 2000 || img.height > 2000
    );
    expect(largeImages.length).toBe(0);
  });
});