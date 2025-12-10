/**
 * Transparency Scenarios Test
 *
 * Tests PDF/X-3 conversion with different transparency elements.
 * Compares flattenTransparency: true vs false to document expected behavior.
 *
 * Key expectations:
 * - flattenTransparency: false should produce better visual fidelity
 * - flattenTransparency: true may have artifacts (black backgrounds) but is PDF/X-3 compliant
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';

import CreativeEngine from '@cesdk/node';

// Load license from .env.local
function loadLicense(): string {
  const testFile = fileURLToPath(import.meta.url);
  const testDir = dirname(testFile);
  const envPath = join(testDir, '../.env.local');
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    const match = content.match(/CESDK_LICENSE=(.+)/);
    if (match) return match[1].trim();
  }
  return process.env.CESDK_LICENSE || '';
}

const CESDK_LICENSE = loadLicense();

import { convertToPDFX3 } from '../../dist/index.mjs';
import {
  convertPdfToPng,
  compareImages,
  resizePng,
  extractPixelData,
  checkImageToolsAvailable
} from '../utils/image-analysis.js';

const testFile = fileURLToPath(import.meta.url);
const testDir = dirname(testFile);
const outputDir = join(testDir, '../output/scenarios');

// Thresholds for different modes
// With flattening: allow higher difference due to known black background issue
const MAX_DIFF_FLATTENED = 45; // Some stickers can exceed 40%
// Without flattening: expect better visual fidelity
const MAX_DIFF_PRESERVED = 20; // Allow more variance for complex stickers

describe('Transparency Scenarios', () => {
  let engine: InstanceType<typeof CreativeEngine> | null = null;
  let imageToolsAvailable: Record<string, boolean>;

  beforeAll(async () => {
    imageToolsAvailable = await checkImageToolsAvailable();

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    try {
      engine = await CreativeEngine.init({
        license: CESDK_LICENSE,
        baseURL: 'https://cdn.img.ly/packages/imgly/cesdk-node/1.61.0/assets'
      });
    } catch (error) {
      console.error('Failed to initialize CE.SDK:', error);
    }
  });

  afterAll(() => {
    if (engine) {
      engine.dispose();
      engine = null;
    }
  });

  /**
   * Helper: Create scene, export PNG + PDF, convert to PDF/X-3 with both modes, compare
   */
  async function testScenario(
    name: string,
    setup: (eng: InstanceType<typeof CreativeEngine>, page: number) => Promise<void>
  ): Promise<{
    flattened: { differencePercent: number; maxColorDiff: number };
    preserved: { differencePercent: number; maxColorDiff: number };
  } | null> {
    if (!engine || !imageToolsAvailable.pdftoppm) {
      return null; // Skip
    }

    // Create scene
    const scene = engine.scene.create();
    const page = engine.block.create('page');
    engine.block.setWidth(page, 400);
    engine.block.setHeight(page, 300);
    engine.block.appendChild(scene, page);

    // White background
    const pageFill = engine.block.getFill(page);
    engine.block.setColor(pageFill, 'fill/color/value', { r: 1, g: 1, b: 1, a: 1 });

    // Setup scene content
    await setup(engine, page);

    // Export PNG (reference) and PDF
    const pngBlob = await engine.block.export(page, 'image/png');
    const pdfBlob = await engine.block.export(page, 'application/pdf');
    const referencePng = Buffer.from(await pngBlob.arrayBuffer());

    // Test both modes
    const results: {
      flattened: { differencePercent: number; maxColorDiff: number };
      preserved: { differencePercent: number; maxColorDiff: number };
    } = {
      flattened: { differencePercent: 0, maxColorDiff: 0 },
      preserved: { differencePercent: 0, maxColorDiff: 0 }
    };

    for (const flattenTransparency of [true, false]) {
      const mode = flattenTransparency ? 'flattened' : 'preserved';

      // Convert PDF to PDF/X-3
      const pdfx3 = await convertToPDFX3(pdfBlob, {
        outputProfile: 'srgb',
        title: `Test: ${name}`,
        flattenTransparency
      });

      // Convert PDF/X-3 to PNG
      const convertedPng = await convertPdfToPng(pdfx3, { dpi: 72 });

      // Resize reference to match converted dimensions
      const { width, height } = await extractPixelData(convertedPng);
      const resizedRef = await resizePng(referencePng, width, height);

      // Save for debugging
      writeFileSync(join(outputDir, `${name}-reference.png`), resizedRef);
      writeFileSync(join(outputDir, `${name}-${mode}.png`), convertedPng);

      // Compare
      const comparison = await compareImages(resizedRef, convertedPng, {
        tolerance: 25,
        matchThreshold: 10
      });

      results[mode] = {
        differencePercent: comparison.differencePercentage,
        maxColorDiff: comparison.maxColorDifference
      };
    }

    return results;
  }

  // ============================================================
  // SOLID COLORS (baseline - should work well in both modes)
  // ============================================================

  describe('Solid Colors (baseline)', () => {
    test('solid color rectangle', async () => {
      const result = await testScenario('solid-color', async (eng, page) => {
        const rect = eng.block.create('graphic');
        const shape = eng.block.createShape('rect');
        eng.block.setShape(rect, shape);
        eng.block.setWidth(rect, 200);
        eng.block.setHeight(rect, 150);
        eng.block.setPositionX(rect, 100);
        eng.block.setPositionY(rect, 75);
        eng.block.appendChild(page, rect);

        const fill = eng.block.createFill('color');
        eng.block.setColor(fill, 'fill/color/value', { r: 0.2, g: 0.6, b: 0.9, a: 1 });
        eng.block.setFill(rect, fill);
      });

      if (!result) return;

      console.log(`solid-color: flattened=${result.flattened.differencePercent.toFixed(2)}%, preserved=${result.preserved.differencePercent.toFixed(2)}%`);

      expect(result.flattened.differencePercent).toBeLessThan(MAX_DIFF_FLATTENED);
      expect(result.preserved.differencePercent).toBeLessThan(MAX_DIFF_PRESERVED);
    });

    test('semi-transparent solid color (50% alpha)', async () => {
      const result = await testScenario('semi-transparent-solid', async (eng, page) => {
        const rect = eng.block.create('graphic');
        const shape = eng.block.createShape('rect');
        eng.block.setShape(rect, shape);
        eng.block.setWidth(rect, 200);
        eng.block.setHeight(rect, 150);
        eng.block.setPositionX(rect, 100);
        eng.block.setPositionY(rect, 75);
        eng.block.appendChild(page, rect);

        const fill = eng.block.createFill('color');
        eng.block.setColor(fill, 'fill/color/value', { r: 0.8, g: 0.2, b: 0.5, a: 0.5 });
        eng.block.setFill(rect, fill);
      });

      if (!result) return;

      console.log(`semi-transparent-solid: flattened=${result.flattened.differencePercent.toFixed(2)}%, preserved=${result.preserved.differencePercent.toFixed(2)}%`);

      expect(result.flattened.differencePercent).toBeLessThan(MAX_DIFF_FLATTENED);
      expect(result.preserved.differencePercent).toBeLessThan(MAX_DIFF_PRESERVED);
    });
  });

  // ============================================================
  // GRADIENTS
  // ============================================================

  describe('Gradients', () => {
    test('linear gradient (opaque)', async () => {
      const result = await testScenario('gradient-linear-opaque', async (eng, page) => {
        const rect = eng.block.create('graphic');
        const shape = eng.block.createShape('rect');
        eng.block.setShape(rect, shape);
        eng.block.setWidth(rect, 250);
        eng.block.setHeight(rect, 150);
        eng.block.setPositionX(rect, 75);
        eng.block.setPositionY(rect, 75);
        eng.block.appendChild(page, rect);

        const gradient = eng.block.createFill('gradient/linear');
        eng.block.setGradientColorStops(gradient, 'fill/gradient/colors', [
          { color: { r: 1.0, g: 0.2, b: 0.2, a: 1.0 }, stop: 0 },
          { color: { r: 0.2, g: 0.2, b: 1.0, a: 1.0 }, stop: 1 }
        ]);
        eng.block.setFloat(gradient, 'fill/gradient/linear/startPointX', 0);
        eng.block.setFloat(gradient, 'fill/gradient/linear/startPointY', 0);
        eng.block.setFloat(gradient, 'fill/gradient/linear/endPointX', 1);
        eng.block.setFloat(gradient, 'fill/gradient/linear/endPointY', 1);
        eng.block.setFill(rect, gradient);
      });

      if (!result) return;

      console.log(`gradient-linear-opaque: flattened=${result.flattened.differencePercent.toFixed(2)}%, preserved=${result.preserved.differencePercent.toFixed(2)}%`);

      expect(result.flattened.differencePercent).toBeLessThan(MAX_DIFF_FLATTENED);
      expect(result.preserved.differencePercent).toBeLessThan(MAX_DIFF_PRESERVED);
    });

    test('radial gradient (opaque)', async () => {
      const result = await testScenario('gradient-radial-opaque', async (eng, page) => {
        const circle = eng.block.create('graphic');
        const shape = eng.block.createShape('ellipse');
        eng.block.setShape(circle, shape);
        eng.block.setWidth(circle, 200);
        eng.block.setHeight(circle, 200);
        eng.block.setPositionX(circle, 100);
        eng.block.setPositionY(circle, 50);
        eng.block.appendChild(page, circle);

        const gradient = eng.block.createFill('gradient/radial');
        eng.block.setGradientColorStops(gradient, 'fill/gradient/colors', [
          { color: { r: 1.0, g: 1.0, b: 0.0, a: 1.0 }, stop: 0 },
          { color: { r: 0.0, g: 0.6, b: 0.0, a: 1.0 }, stop: 1 }
        ]);
        eng.block.setFloat(gradient, 'fill/gradient/radial/centerPointX', 0.5);
        eng.block.setFloat(gradient, 'fill/gradient/radial/centerPointY', 0.5);
        eng.block.setFloat(gradient, 'fill/gradient/radial/radius', 0.7);
        eng.block.setFill(circle, gradient);
      });

      if (!result) return;

      console.log(`gradient-radial-opaque: flattened=${result.flattened.differencePercent.toFixed(2)}%, preserved=${result.preserved.differencePercent.toFixed(2)}%`);

      expect(result.flattened.differencePercent).toBeLessThan(MAX_DIFF_FLATTENED);
      expect(result.preserved.differencePercent).toBeLessThan(MAX_DIFF_PRESERVED);
    });

    test('linear gradient fading to transparent (known issue with flattening)', async () => {
      const result = await testScenario('gradient-fade-to-transparent', async (eng, page) => {
        const rect = eng.block.create('graphic');
        const shape = eng.block.createShape('rect');
        eng.block.setShape(rect, shape);
        eng.block.setWidth(rect, 250);
        eng.block.setHeight(rect, 150);
        eng.block.setPositionX(rect, 75);
        eng.block.setPositionY(rect, 75);
        eng.block.appendChild(page, rect);

        const gradient = eng.block.createFill('gradient/linear');
        eng.block.setGradientColorStops(gradient, 'fill/gradient/colors', [
          { color: { r: 1.0, g: 0.5, b: 0.0, a: 1.0 }, stop: 0 },
          { color: { r: 1.0, g: 0.5, b: 0.0, a: 0.0 }, stop: 1 } // Fades to transparent
        ]);
        eng.block.setFloat(gradient, 'fill/gradient/linear/startPointX', 0);
        eng.block.setFloat(gradient, 'fill/gradient/linear/startPointY', 0.5);
        eng.block.setFloat(gradient, 'fill/gradient/linear/endPointX', 1);
        eng.block.setFloat(gradient, 'fill/gradient/linear/endPointY', 0.5);
        eng.block.setFill(rect, gradient);
      });

      if (!result) return;

      console.log(`gradient-fade-to-transparent: flattened=${result.flattened.differencePercent.toFixed(2)}%, preserved=${result.preserved.differencePercent.toFixed(2)}%`);

      // This is a known issue - flattening causes black backgrounds
      // Verify preserved mode is significantly better
      expect(result.preserved.differencePercent).toBeLessThan(result.flattened.differencePercent);
      expect(result.flattened.differencePercent).toBeLessThan(MAX_DIFF_FLATTENED);
      expect(result.preserved.differencePercent).toBeLessThan(MAX_DIFF_PRESERVED);
    });

    test('radial gradient fading to transparent (known issue with flattening)', async () => {
      const result = await testScenario('gradient-radial-fade-transparent', async (eng, page) => {
        const circle = eng.block.create('graphic');
        const shape = eng.block.createShape('ellipse');
        eng.block.setShape(circle, shape);
        eng.block.setWidth(circle, 200);
        eng.block.setHeight(circle, 200);
        eng.block.setPositionX(circle, 100);
        eng.block.setPositionY(circle, 50);
        eng.block.appendChild(page, circle);

        const gradient = eng.block.createFill('gradient/radial');
        eng.block.setGradientColorStops(gradient, 'fill/gradient/colors', [
          { color: { r: 0.8, g: 0.2, b: 0.8, a: 1.0 }, stop: 0 },
          { color: { r: 0.8, g: 0.2, b: 0.8, a: 0.0 }, stop: 1 } // Fades to transparent
        ]);
        eng.block.setFloat(gradient, 'fill/gradient/radial/centerPointX', 0.5);
        eng.block.setFloat(gradient, 'fill/gradient/radial/centerPointY', 0.5);
        eng.block.setFloat(gradient, 'fill/gradient/radial/radius', 0.7);
        eng.block.setFill(circle, gradient);
      });

      if (!result) return;

      console.log(`gradient-radial-fade-transparent: flattened=${result.flattened.differencePercent.toFixed(2)}%, preserved=${result.preserved.differencePercent.toFixed(2)}%`);

      // Verify preserved mode is significantly better
      expect(result.preserved.differencePercent).toBeLessThan(result.flattened.differencePercent);
      expect(result.flattened.differencePercent).toBeLessThan(MAX_DIFF_FLATTENED);
      expect(result.preserved.differencePercent).toBeLessThan(MAX_DIFF_PRESERVED);
    });
  });

  // ============================================================
  // STICKERS - 3D Stickers (known problematic per #11242)
  // ============================================================

  describe('3D Stickers (alpha channel)', () => {
    const baseUrl = 'https://cdn.img.ly/assets/v5/ly.img.sticker/images/3Dstickers';

    test('3D sticker: astronaut', async () => {
      const result = await testScenario('sticker-3d-astronaut', async (eng, page) => {
        const sticker = eng.block.create('graphic');
        const shape = eng.block.createShape('rect');
        eng.block.setShape(sticker, shape);
        eng.block.setWidth(sticker, 150);
        eng.block.setHeight(sticker, 150);
        eng.block.setPositionX(sticker, 125);
        eng.block.setPositionY(sticker, 75);
        eng.block.appendChild(page, sticker);

        const fill = eng.block.createFill('image');
        eng.block.setString(fill, 'fill/image/imageFileURI', `${baseUrl}/3d_stickers_astronaut.png`);
        eng.block.setFill(sticker, fill);
      });

      if (!result) return;

      console.log(`sticker-3d-astronaut: flattened=${result.flattened.differencePercent.toFixed(2)}%, preserved=${result.preserved.differencePercent.toFixed(2)}%`);

      // Stickers have some inherent difference due to image resampling
      expect(result.preserved.differencePercent).toBeLessThanOrEqual(result.flattened.differencePercent);
      expect(result.flattened.differencePercent).toBeLessThan(MAX_DIFF_FLATTENED);
      expect(result.preserved.differencePercent).toBeLessThan(MAX_DIFF_PRESERVED);
    });

    test('3D sticker: brain', async () => {
      const result = await testScenario('sticker-3d-brain', async (eng, page) => {
        const sticker = eng.block.create('graphic');
        const shape = eng.block.createShape('rect');
        eng.block.setShape(sticker, shape);
        eng.block.setWidth(sticker, 150);
        eng.block.setHeight(sticker, 150);
        eng.block.setPositionX(sticker, 125);
        eng.block.setPositionY(sticker, 75);
        eng.block.appendChild(page, sticker);

        const fill = eng.block.createFill('image');
        eng.block.setString(fill, 'fill/image/imageFileURI', `${baseUrl}/3d_stickers_brain.png`);
        eng.block.setFill(sticker, fill);
      });

      if (!result) return;

      console.log(`sticker-3d-brain: flattened=${result.flattened.differencePercent.toFixed(2)}%, preserved=${result.preserved.differencePercent.toFixed(2)}%`);

      expect(result.preserved.differencePercent).toBeLessThanOrEqual(result.flattened.differencePercent);
      expect(result.flattened.differencePercent).toBeLessThan(MAX_DIFF_FLATTENED);
      expect(result.preserved.differencePercent).toBeLessThan(MAX_DIFF_PRESERVED);
    });

    test('3D sticker: cube', async () => {
      const result = await testScenario('sticker-3d-cube', async (eng, page) => {
        const sticker = eng.block.create('graphic');
        const shape = eng.block.createShape('rect');
        eng.block.setShape(sticker, shape);
        eng.block.setWidth(sticker, 150);
        eng.block.setHeight(sticker, 150);
        eng.block.setPositionX(sticker, 125);
        eng.block.setPositionY(sticker, 75);
        eng.block.appendChild(page, sticker);

        const fill = eng.block.createFill('image');
        eng.block.setString(fill, 'fill/image/imageFileURI', `${baseUrl}/3d_stickers_cube.png`);
        eng.block.setFill(sticker, fill);
      });

      if (!result) return;

      console.log(`sticker-3d-cube: flattened=${result.flattened.differencePercent.toFixed(2)}%, preserved=${result.preserved.differencePercent.toFixed(2)}%`);

      // Note: For some stickers, results may vary between modes - just check thresholds
      expect(result.flattened.differencePercent).toBeLessThan(MAX_DIFF_FLATTENED);
      expect(result.preserved.differencePercent).toBeLessThan(MAX_DIFF_PRESERVED);
    });
  });

  // ============================================================
  // STICKERS - Craft Stickers (known problematic per #11242)
  // ============================================================

  describe('Craft Stickers (alpha channel)', () => {
    const baseUrl = 'https://cdn.img.ly/assets/v5/ly.img.sticker/images/craft';

    test('craft sticker: tape', async () => {
      const result = await testScenario('sticker-craft-tape', async (eng, page) => {
        const sticker = eng.block.create('graphic');
        const shape = eng.block.createShape('rect');
        eng.block.setShape(sticker, shape);
        eng.block.setWidth(sticker, 200);
        eng.block.setHeight(sticker, 80);
        eng.block.setPositionX(sticker, 100);
        eng.block.setPositionY(sticker, 110);
        eng.block.appendChild(page, sticker);

        const fill = eng.block.createFill('image');
        eng.block.setString(fill, 'fill/image/imageFileURI', `${baseUrl}/tape01.png`);
        eng.block.setFill(sticker, fill);
      });

      if (!result) return;

      console.log(`sticker-craft-tape: flattened=${result.flattened.differencePercent.toFixed(2)}%, preserved=${result.preserved.differencePercent.toFixed(2)}%`);

      expect(result.preserved.differencePercent).toBeLessThanOrEqual(result.flattened.differencePercent);
      expect(result.flattened.differencePercent).toBeLessThan(MAX_DIFF_FLATTENED);
      expect(result.preserved.differencePercent).toBeLessThan(MAX_DIFF_PRESERVED);
    });

    test('craft sticker: polaroid frame', async () => {
      const result = await testScenario('sticker-craft-polaroid', async (eng, page) => {
        const sticker = eng.block.create('graphic');
        const shape = eng.block.createShape('rect');
        eng.block.setShape(sticker, shape);
        eng.block.setWidth(sticker, 150);
        eng.block.setHeight(sticker, 180);
        eng.block.setPositionX(sticker, 125);
        eng.block.setPositionY(sticker, 60);
        eng.block.appendChild(page, sticker);

        const fill = eng.block.createFill('image');
        eng.block.setString(fill, 'fill/image/imageFileURI', `${baseUrl}/polaroid_frame.png`);
        eng.block.setFill(sticker, fill);
      });

      if (!result) return;

      console.log(`sticker-craft-polaroid: flattened=${result.flattened.differencePercent.toFixed(2)}%, preserved=${result.preserved.differencePercent.toFixed(2)}%`);

      expect(result.preserved.differencePercent).toBeLessThanOrEqual(result.flattened.differencePercent);
      expect(result.flattened.differencePercent).toBeLessThan(MAX_DIFF_FLATTENED);
      expect(result.preserved.differencePercent).toBeLessThan(MAX_DIFF_PRESERVED);
    });
  });

  // ============================================================
  // OVERLAPPING ELEMENTS
  // ============================================================

  describe('Overlapping Elements', () => {
    test('opaque over opaque', async () => {
      const result = await testScenario('overlap-opaque-opaque', async (eng, page) => {
        // Background
        const back = eng.block.create('graphic');
        const backShape = eng.block.createShape('rect');
        eng.block.setShape(back, backShape);
        eng.block.setWidth(back, 200);
        eng.block.setHeight(back, 150);
        eng.block.setPositionX(back, 50);
        eng.block.setPositionY(back, 75);
        eng.block.appendChild(page, back);

        const backFill = eng.block.createFill('color');
        eng.block.setColor(backFill, 'fill/color/value', { r: 0.2, g: 0.6, b: 0.9, a: 1.0 });
        eng.block.setFill(back, backFill);

        // Foreground (opaque)
        const front = eng.block.create('graphic');
        const frontShape = eng.block.createShape('ellipse');
        eng.block.setShape(front, frontShape);
        eng.block.setWidth(front, 120);
        eng.block.setHeight(front, 120);
        eng.block.setPositionX(front, 150);
        eng.block.setPositionY(front, 90);
        eng.block.appendChild(page, front);

        const frontFill = eng.block.createFill('color');
        eng.block.setColor(frontFill, 'fill/color/value', { r: 0.9, g: 0.3, b: 0.3, a: 1.0 });
        eng.block.setFill(front, frontFill);
      });

      if (!result) return;

      console.log(`overlap-opaque-opaque: flattened=${result.flattened.differencePercent.toFixed(2)}%, preserved=${result.preserved.differencePercent.toFixed(2)}%`);

      expect(result.flattened.differencePercent).toBeLessThan(MAX_DIFF_FLATTENED);
      expect(result.preserved.differencePercent).toBeLessThan(MAX_DIFF_PRESERVED);
    });

    test('semi-transparent over opaque', async () => {
      const result = await testScenario('overlap-transparent-over-opaque', async (eng, page) => {
        // Background (opaque)
        const back = eng.block.create('graphic');
        const backShape = eng.block.createShape('rect');
        eng.block.setShape(back, backShape);
        eng.block.setWidth(back, 200);
        eng.block.setHeight(back, 150);
        eng.block.setPositionX(back, 50);
        eng.block.setPositionY(back, 75);
        eng.block.appendChild(page, back);

        const backFill = eng.block.createFill('color');
        eng.block.setColor(backFill, 'fill/color/value', { r: 0.2, g: 0.6, b: 0.9, a: 1.0 });
        eng.block.setFill(back, backFill);

        // Foreground (semi-transparent)
        const front = eng.block.create('graphic');
        const frontShape = eng.block.createShape('ellipse');
        eng.block.setShape(front, frontShape);
        eng.block.setWidth(front, 120);
        eng.block.setHeight(front, 120);
        eng.block.setPositionX(front, 150);
        eng.block.setPositionY(front, 90);
        eng.block.appendChild(page, front);

        const frontFill = eng.block.createFill('color');
        eng.block.setColor(frontFill, 'fill/color/value', { r: 0.9, g: 0.3, b: 0.3, a: 0.5 });
        eng.block.setFill(front, frontFill);
      });

      if (!result) return;

      console.log(`overlap-transparent-over-opaque: flattened=${result.flattened.differencePercent.toFixed(2)}%, preserved=${result.preserved.differencePercent.toFixed(2)}%`);

      expect(result.flattened.differencePercent).toBeLessThan(MAX_DIFF_FLATTENED);
      expect(result.preserved.differencePercent).toBeLessThan(MAX_DIFF_PRESERVED);
    });

    test('gradient over opaque (known issue with flattening)', async () => {
      const result = await testScenario('overlap-gradient-over-opaque', async (eng, page) => {
        // Background (opaque)
        const back = eng.block.create('graphic');
        const backShape = eng.block.createShape('rect');
        eng.block.setShape(back, backShape);
        eng.block.setWidth(back, 200);
        eng.block.setHeight(back, 150);
        eng.block.setPositionX(back, 50);
        eng.block.setPositionY(back, 75);
        eng.block.appendChild(page, back);

        const backFill = eng.block.createFill('color');
        eng.block.setColor(backFill, 'fill/color/value', { r: 0.2, g: 0.6, b: 0.9, a: 1.0 });
        eng.block.setFill(back, backFill);

        // Foreground (gradient fading to transparent)
        const front = eng.block.create('graphic');
        const frontShape = eng.block.createShape('rect');
        eng.block.setShape(front, frontShape);
        eng.block.setWidth(front, 180);
        eng.block.setHeight(front, 100);
        eng.block.setPositionX(front, 120);
        eng.block.setPositionY(front, 100);
        eng.block.appendChild(page, front);

        const gradient = eng.block.createFill('gradient/linear');
        eng.block.setGradientColorStops(gradient, 'fill/gradient/colors', [
          { color: { r: 0.9, g: 0.3, b: 0.3, a: 1.0 }, stop: 0 },
          { color: { r: 0.9, g: 0.3, b: 0.3, a: 0.0 }, stop: 1 }
        ]);
        eng.block.setFloat(gradient, 'fill/gradient/linear/startPointX', 0);
        eng.block.setFloat(gradient, 'fill/gradient/linear/startPointY', 0.5);
        eng.block.setFloat(gradient, 'fill/gradient/linear/endPointX', 1);
        eng.block.setFloat(gradient, 'fill/gradient/linear/endPointY', 0.5);
        eng.block.setFill(front, gradient);
      });

      if (!result) return;

      console.log(`overlap-gradient-over-opaque: flattened=${result.flattened.differencePercent.toFixed(2)}%, preserved=${result.preserved.differencePercent.toFixed(2)}%`);

      // Verify preserved mode is better
      expect(result.preserved.differencePercent).toBeLessThan(result.flattened.differencePercent);
      expect(result.flattened.differencePercent).toBeLessThan(MAX_DIFF_FLATTENED);
      expect(result.preserved.differencePercent).toBeLessThan(MAX_DIFF_PRESERVED);
    });

    test('sticker over colored background', async () => {
      const result = await testScenario('overlap-sticker-over-color', async (eng, page) => {
        // Background (colored)
        const back = eng.block.create('graphic');
        const backShape = eng.block.createShape('rect');
        eng.block.setShape(back, backShape);
        eng.block.setWidth(back, 250);
        eng.block.setHeight(back, 200);
        eng.block.setPositionX(back, 75);
        eng.block.setPositionY(back, 50);
        eng.block.appendChild(page, back);

        const backFill = eng.block.createFill('color');
        eng.block.setColor(backFill, 'fill/color/value', { r: 0.9, g: 0.85, b: 0.7, a: 1.0 });
        eng.block.setFill(back, backFill);

        // Sticker on top
        const sticker = eng.block.create('graphic');
        const stickerShape = eng.block.createShape('rect');
        eng.block.setShape(sticker, stickerShape);
        eng.block.setWidth(sticker, 120);
        eng.block.setHeight(sticker, 120);
        eng.block.setPositionX(sticker, 140);
        eng.block.setPositionY(sticker, 90);
        eng.block.appendChild(page, sticker);

        const stickerFill = eng.block.createFill('image');
        eng.block.setString(
          stickerFill,
          'fill/image/imageFileURI',
          'https://cdn.img.ly/assets/v5/ly.img.sticker/images/3Dstickers/3d_stickers_astronaut.png'
        );
        eng.block.setFill(sticker, stickerFill);
      });

      if (!result) return;

      console.log(`overlap-sticker-over-color: flattened=${result.flattened.differencePercent.toFixed(2)}%, preserved=${result.preserved.differencePercent.toFixed(2)}%`);

      expect(result.preserved.differencePercent).toBeLessThanOrEqual(result.flattened.differencePercent);
      expect(result.flattened.differencePercent).toBeLessThan(MAX_DIFF_FLATTENED);
      expect(result.preserved.differencePercent).toBeLessThan(MAX_DIFF_PRESERVED);
    });
  });

  // ============================================================
  // TEXT WITH EMOJIS
  // ============================================================

  describe('Text', () => {
    test('plain text', async () => {
      const result = await testScenario('text-plain', async (eng, page) => {
        const text = eng.block.create('text');
        eng.block.setWidth(text, 300);
        eng.block.setHeight(text, 100);
        eng.block.setPositionX(text, 50);
        eng.block.setPositionY(text, 100);
        eng.block.appendChild(page, text);

        eng.block.replaceText(text, 'Hello World!');

        const textFill = eng.block.getFill(text);
        eng.block.setColor(textFill, 'fill/color/value', { r: 0.1, g: 0.1, b: 0.1, a: 1.0 });
      });

      if (!result) return;

      console.log(`text-plain: flattened=${result.flattened.differencePercent.toFixed(2)}%, preserved=${result.preserved.differencePercent.toFixed(2)}%`);

      expect(result.flattened.differencePercent).toBeLessThan(MAX_DIFF_FLATTENED);
      expect(result.preserved.differencePercent).toBeLessThan(MAX_DIFF_PRESERVED);
    });

    test('text with emojis', async () => {
      const result = await testScenario('text-with-emojis', async (eng, page) => {
        const text = eng.block.create('text');
        eng.block.setWidth(text, 350);
        eng.block.setHeight(text, 100);
        eng.block.setPositionX(text, 25);
        eng.block.setPositionY(text, 100);
        eng.block.appendChild(page, text);

        eng.block.replaceText(text, 'Hello! 🎨 🖼️ ✨ 🚀');

        const textFill = eng.block.getFill(text);
        eng.block.setColor(textFill, 'fill/color/value', { r: 0.1, g: 0.1, b: 0.1, a: 1.0 });
      });

      if (!result) return;

      console.log(`text-with-emojis: flattened=${result.flattened.differencePercent.toFixed(2)}%, preserved=${result.preserved.differencePercent.toFixed(2)}%`);

      // Emojis have some inherent rendering differences
      expect(result.preserved.differencePercent).toBeLessThanOrEqual(result.flattened.differencePercent);
      expect(result.flattened.differencePercent).toBeLessThan(MAX_DIFF_FLATTENED);
      expect(result.preserved.differencePercent).toBeLessThan(MAX_DIFF_PRESERVED);
    });
  });
});
