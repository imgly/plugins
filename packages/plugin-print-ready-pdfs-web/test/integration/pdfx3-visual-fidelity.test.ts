/**
 * PDF/X-3 Visual Fidelity Test
 *
 * This test verifies that PDF/X-3 conversion preserves visual fidelity.
 * It compares the original CE.SDK PNG export with the PDF→PDF/X-3→PNG output.
 *
 * If the images don't match, it indicates a visual regression bug like GitHub #11242
 * (black backgrounds appearing due to transparency flattening).
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';

import CreativeEngine from '@cesdk/node';

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
const outputDir = join(testDir, '../output');

// CE.SDK license
const CESDK_LICENSE = process.env.CESDK_LICENSE || '';

// Maximum allowed difference percentage for tests to pass
const MAX_DIFFERENCE_PERCENT = 5;

describe('PDF/X-3 Visual Fidelity', () => {
  let engine: InstanceType<typeof CreativeEngine> | null = null;
  let imageToolsAvailable: Record<string, boolean>;

  beforeAll(async () => {
    imageToolsAvailable = await checkImageToolsAvailable();

    if (!imageToolsAvailable.pdftoppm || !imageToolsAvailable.convert) {
      console.warn(
        '⚠️  Image analysis tools missing. Install: brew install poppler imagemagick'
      );
    }

    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Initialize CE.SDK engine
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
   * Create a test scene and export both PNG reference and PDF
   */
  async function createTestScene(
    name: string,
    setupScene: (engine: InstanceType<typeof CreativeEngine>, page: number) => Promise<void>
  ): Promise<{ referencePng: Buffer; pdf: Blob } | null> {
    if (!engine) {
      return null;
    }

    const scene = engine.scene.create();
    const page = engine.block.create('page');
    engine.block.setWidth(page, 800);
    engine.block.setHeight(page, 600);
    engine.block.appendChild(scene, page);

    // Set white background
    const pageFill = engine.block.getFill(page);
    engine.block.setColor(pageFill, 'fill/color/value', { r: 1, g: 1, b: 1, a: 1 });

    // Run scene setup
    await setupScene(engine, page);

    // Export both formats
    const pngBlob = await engine.block.export(page, 'image/png');
    const pdfBlob = await engine.block.export(page, 'application/pdf');

    const referencePng = Buffer.from(await pngBlob.arrayBuffer());

    // Save reference for debugging
    writeFileSync(join(outputDir, `${name}-reference.png`), referencePng);

    return { referencePng, pdf: pdfBlob };
  }

  /**
   * Convert PDF to PDF/X-3 and then to PNG, compare with reference
   */
  async function compareWithReference(
    referencePng: Buffer,
    pdf: Blob,
    options: {
      name: string;
      flattenTransparency?: boolean;
      outputProfile?: 'srgb' | 'fogra39' | 'gracol';
    }
  ): Promise<{
    differencePercentage: number;
    maxColorDifference: number;
    isMatch: boolean;
  }> {
    const { name, flattenTransparency = true, outputProfile = 'srgb' } = options;

    // Convert to PDF/X-3
    const pdfx3 = await convertToPDFX3(pdf, {
      outputProfile,
      title: `Test: ${name}`,
      flattenTransparency
    });

    // Convert PDF/X-3 to PNG
    const convertedPng = await convertPdfToPng(pdfx3, { dpi: 72 });

    // Get dimensions to resize reference for fair comparison
    const { width, height } = await extractPixelData(convertedPng);
    const resizedReference = await resizePng(referencePng, width, height);

    // Save outputs for debugging
    const suffix = flattenTransparency ? 'flattened' : 'preserved';
    writeFileSync(join(outputDir, `${name}-${suffix}.png`), convertedPng);
    writeFileSync(join(outputDir, `${name}-reference-resized.png`), resizedReference);

    // Compare images
    const comparison = await compareImages(resizedReference, convertedPng, {
      tolerance: 25,
      matchThreshold: MAX_DIFFERENCE_PERCENT
    });

    return {
      differencePercentage: comparison.differencePercentage,
      maxColorDifference: comparison.maxColorDifference,
      isMatch: comparison.isMatch
    };
  }

  test('simple colored rectangle should match after PDF/X-3 conversion', async () => {
    if (!engine || !imageToolsAvailable.pdftoppm) {
      console.warn('Skipping - CE.SDK or image tools not available');
      return;
    }

    const scene = await createTestScene('simple-rect', async (eng, page) => {
      const rect = eng.block.create('graphic');
      const shape = eng.block.createShape('rect');
      eng.block.setShape(rect, shape);
      eng.block.setWidth(rect, 200);
      eng.block.setHeight(rect, 150);
      eng.block.setPositionX(rect, 100);
      eng.block.setPositionY(rect, 100);
      eng.block.appendChild(page, rect);

      const fill = eng.block.createFill('color');
      eng.block.setColor(fill, 'fill/color/value', { r: 0.2, g: 0.6, b: 0.9, a: 1 });
      eng.block.setFill(rect, fill);
    });

    if (!scene) return;

    const result = await compareWithReference(scene.referencePng, scene.pdf, {
      name: 'simple-rect',
      flattenTransparency: true
    });

    console.log(`Simple rect - Difference: ${result.differencePercentage.toFixed(2)}%`);

    expect(
      result.differencePercentage,
      `Simple rectangle should match reference (got ${result.differencePercentage.toFixed(2)}% difference)`
    ).toBeLessThan(MAX_DIFFERENCE_PERCENT);
  });

  test('linear gradient should match after PDF/X-3 conversion', async () => {
    if (!engine || !imageToolsAvailable.pdftoppm) {
      console.warn('Skipping - CE.SDK or image tools not available');
      return;
    }

    const scene = await createTestScene('linear-gradient', async (eng, page) => {
      const rect = eng.block.create('graphic');
      const shape = eng.block.createShape('rect');
      eng.block.setShape(rect, shape);
      eng.block.setWidth(rect, 300);
      eng.block.setHeight(rect, 200);
      eng.block.setPositionX(rect, 100);
      eng.block.setPositionY(rect, 100);
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

    if (!scene) return;

    const result = await compareWithReference(scene.referencePng, scene.pdf, {
      name: 'linear-gradient',
      flattenTransparency: true
    });

    console.log(`Linear gradient - Difference: ${result.differencePercentage.toFixed(2)}%`);

    expect(
      result.differencePercentage,
      `Linear gradient should match reference (got ${result.differencePercentage.toFixed(2)}% difference)`
    ).toBeLessThan(MAX_DIFFERENCE_PERCENT);
  });

  test('semi-transparent element should match after PDF/X-3 conversion', async () => {
    if (!engine || !imageToolsAvailable.pdftoppm) {
      console.warn('Skipping - CE.SDK or image tools not available');
      return;
    }

    const scene = await createTestScene('semi-transparent', async (eng, page) => {
      const rect = eng.block.create('graphic');
      const shape = eng.block.createShape('rect');
      eng.block.setShape(rect, shape);
      eng.block.setWidth(rect, 200);
      eng.block.setHeight(rect, 150);
      eng.block.setPositionX(rect, 100);
      eng.block.setPositionY(rect, 100);
      eng.block.appendChild(page, rect);

      const fill = eng.block.createFill('color');
      eng.block.setColor(fill, 'fill/color/value', { r: 0.8, g: 0.2, b: 0.5, a: 0.5 });
      eng.block.setFill(rect, fill);
    });

    if (!scene) return;

    const result = await compareWithReference(scene.referencePng, scene.pdf, {
      name: 'semi-transparent',
      flattenTransparency: true
    });

    console.log(`Semi-transparent - Difference: ${result.differencePercentage.toFixed(2)}%`);

    expect(
      result.differencePercentage,
      `Semi-transparent element should match reference (got ${result.differencePercentage.toFixed(2)}% difference)`
    ).toBeLessThan(MAX_DIFFERENCE_PERCENT);
  });

  test('gradient with alpha transparency should match after PDF/X-3 conversion', async () => {
    if (!engine || !imageToolsAvailable.pdftoppm) {
      console.warn('Skipping - CE.SDK or image tools not available');
      return;
    }

    const scene = await createTestScene('gradient-alpha', async (eng, page) => {
      const rect = eng.block.create('graphic');
      const shape = eng.block.createShape('rect');
      eng.block.setShape(rect, shape);
      eng.block.setWidth(rect, 300);
      eng.block.setHeight(rect, 150);
      eng.block.setPositionX(rect, 100);
      eng.block.setPositionY(rect, 100);
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

    if (!scene) return;

    const result = await compareWithReference(scene.referencePng, scene.pdf, {
      name: 'gradient-alpha',
      flattenTransparency: true
    });

    console.log(`Gradient with alpha - Difference: ${result.differencePercentage.toFixed(2)}%`);

    expect(
      result.differencePercentage,
      `Gradient with alpha should match reference (got ${result.differencePercentage.toFixed(2)}% difference)`
    ).toBeLessThan(MAX_DIFFERENCE_PERCENT);
  });

  test('overlapping transparent elements should match after PDF/X-3 conversion', async () => {
    if (!engine || !imageToolsAvailable.pdftoppm) {
      console.warn('Skipping - CE.SDK or image tools not available');
      return;
    }

    const scene = await createTestScene('overlapping', async (eng, page) => {
      // Background rectangle
      const back = eng.block.create('graphic');
      const backShape = eng.block.createShape('rect');
      eng.block.setShape(back, backShape);
      eng.block.setWidth(back, 200);
      eng.block.setHeight(back, 200);
      eng.block.setPositionX(back, 100);
      eng.block.setPositionY(back, 100);
      eng.block.appendChild(page, back);

      const backFill = eng.block.createFill('color');
      eng.block.setColor(backFill, 'fill/color/value', { r: 0.0, g: 0.7, b: 0.9, a: 1.0 });
      eng.block.setFill(back, backFill);

      // Overlapping semi-transparent circle
      const front = eng.block.create('graphic');
      const frontShape = eng.block.createShape('ellipse');
      eng.block.setShape(front, frontShape);
      eng.block.setWidth(front, 150);
      eng.block.setHeight(front, 150);
      eng.block.setPositionX(front, 175);
      eng.block.setPositionY(front, 150);
      eng.block.appendChild(page, front);

      const frontFill = eng.block.createFill('color');
      eng.block.setColor(frontFill, 'fill/color/value', { r: 1.0, g: 0.3, b: 0.3, a: 0.6 });
      eng.block.setFill(front, frontFill);
    });

    if (!scene) return;

    const result = await compareWithReference(scene.referencePng, scene.pdf, {
      name: 'overlapping',
      flattenTransparency: true
    });

    console.log(`Overlapping elements - Difference: ${result.differencePercentage.toFixed(2)}%`);

    expect(
      result.differencePercentage,
      `Overlapping transparent elements should match reference (got ${result.differencePercentage.toFixed(2)}% difference)`
    ).toBeLessThan(MAX_DIFFERENCE_PERCENT);
  });

  test('sticker with alpha channel should match after PDF/X-3 conversion', async () => {
    if (!engine || !imageToolsAvailable.pdftoppm) {
      console.warn('Skipping - CE.SDK or image tools not available');
      return;
    }

    const stickerUrl = 'https://cdn.img.ly/assets/v5/ly.img.sticker/images/craft/tape01.png';

    const scene = await createTestScene('sticker-alpha', async (eng, page) => {
      const sticker = eng.block.create('graphic');
      const shape = eng.block.createShape('rect');
      eng.block.setShape(sticker, shape);
      eng.block.setWidth(sticker, 200);
      eng.block.setHeight(sticker, 80);
      eng.block.setPositionX(sticker, 100);
      eng.block.setPositionY(sticker, 100);
      eng.block.appendChild(page, sticker);

      const fill = eng.block.createFill('image');
      eng.block.setString(fill, 'fill/image/imageFileURI', stickerUrl);
      eng.block.setFill(sticker, fill);
    });

    if (!scene) return;

    const result = await compareWithReference(scene.referencePng, scene.pdf, {
      name: 'sticker-alpha',
      flattenTransparency: true
    });

    console.log(`Sticker with alpha - Difference: ${result.differencePercentage.toFixed(2)}%`);

    expect(
      result.differencePercentage,
      `Sticker with alpha channel should match reference (got ${result.differencePercentage.toFixed(2)}% difference)`
    ).toBeLessThan(MAX_DIFFERENCE_PERCENT);
  });

  test('complex scene with multiple transparency elements should match', async () => {
    if (!engine || !imageToolsAvailable.pdftoppm) {
      console.warn('Skipping - CE.SDK or image tools not available');
      return;
    }

    const scene = await createTestScene('complex-transparency', async (eng, page) => {
      // Linear gradient
      const gradientRect = eng.block.create('graphic');
      const gradientShape = eng.block.createShape('rect');
      eng.block.setShape(gradientRect, gradientShape);
      eng.block.setWidth(gradientRect, 200);
      eng.block.setHeight(gradientRect, 150);
      eng.block.setPositionX(gradientRect, 50);
      eng.block.setPositionY(gradientRect, 50);
      eng.block.appendChild(page, gradientRect);

      const linearGradient = eng.block.createFill('gradient/linear');
      eng.block.setGradientColorStops(linearGradient, 'fill/gradient/colors', [
        { color: { r: 1.0, g: 0.2, b: 0.2, a: 1.0 }, stop: 0 },
        { color: { r: 0.2, g: 0.2, b: 1.0, a: 1.0 }, stop: 1 }
      ]);
      eng.block.setFloat(linearGradient, 'fill/gradient/linear/startPointX', 0);
      eng.block.setFloat(linearGradient, 'fill/gradient/linear/startPointY', 0);
      eng.block.setFloat(linearGradient, 'fill/gradient/linear/endPointX', 1);
      eng.block.setFloat(linearGradient, 'fill/gradient/linear/endPointY', 1);
      eng.block.setFill(gradientRect, linearGradient);

      // Radial gradient
      const radialRect = eng.block.create('graphic');
      const radialShape = eng.block.createShape('ellipse');
      eng.block.setShape(radialRect, radialShape);
      eng.block.setWidth(radialRect, 150);
      eng.block.setHeight(radialRect, 150);
      eng.block.setPositionX(radialRect, 300);
      eng.block.setPositionY(radialRect, 50);
      eng.block.appendChild(page, radialRect);

      const radialGradient = eng.block.createFill('gradient/radial');
      eng.block.setGradientColorStops(radialGradient, 'fill/gradient/colors', [
        { color: { r: 1.0, g: 1.0, b: 0.0, a: 1.0 }, stop: 0 },
        { color: { r: 0.0, g: 0.8, b: 0.0, a: 1.0 }, stop: 1 }
      ]);
      eng.block.setFloat(radialGradient, 'fill/gradient/radial/centerPointX', 0.5);
      eng.block.setFloat(radialGradient, 'fill/gradient/radial/centerPointY', 0.5);
      eng.block.setFloat(radialGradient, 'fill/gradient/radial/radius', 0.7);
      eng.block.setFill(radialRect, radialGradient);

      // Semi-transparent overlay
      const overlay = eng.block.create('graphic');
      const overlayShape = eng.block.createShape('rect');
      eng.block.setShape(overlay, overlayShape);
      eng.block.setWidth(overlay, 180);
      eng.block.setHeight(overlay, 100);
      eng.block.setPositionX(overlay, 500);
      eng.block.setPositionY(overlay, 80);
      eng.block.appendChild(page, overlay);

      const overlayFill = eng.block.createFill('color');
      eng.block.setColor(overlayFill, 'fill/color/value', { r: 0.5, g: 0.0, b: 0.8, a: 0.5 });
      eng.block.setFill(overlay, overlayFill);

      // Gradient with alpha fade
      const alphaGradient = eng.block.create('graphic');
      const alphaShape = eng.block.createShape('rect');
      eng.block.setShape(alphaGradient, alphaShape);
      eng.block.setWidth(alphaGradient, 200);
      eng.block.setHeight(alphaGradient, 100);
      eng.block.setPositionX(alphaGradient, 50);
      eng.block.setPositionY(alphaGradient, 250);
      eng.block.appendChild(page, alphaGradient);

      const fadeGradient = eng.block.createFill('gradient/linear');
      eng.block.setGradientColorStops(fadeGradient, 'fill/gradient/colors', [
        { color: { r: 1.0, g: 0.5, b: 0.0, a: 1.0 }, stop: 0 },
        { color: { r: 1.0, g: 0.5, b: 0.0, a: 0.0 }, stop: 1 }
      ]);
      eng.block.setFloat(fadeGradient, 'fill/gradient/linear/startPointX', 0);
      eng.block.setFloat(fadeGradient, 'fill/gradient/linear/startPointY', 0.5);
      eng.block.setFloat(fadeGradient, 'fill/gradient/linear/endPointX', 1);
      eng.block.setFloat(fadeGradient, 'fill/gradient/linear/endPointY', 0.5);
      eng.block.setFill(alphaGradient, fadeGradient);

      // Overlapping elements
      const backRect = eng.block.create('graphic');
      const backRectShape = eng.block.createShape('rect');
      eng.block.setShape(backRect, backRectShape);
      eng.block.setWidth(backRect, 150);
      eng.block.setHeight(backRect, 150);
      eng.block.setPositionX(backRect, 350);
      eng.block.setPositionY(backRect, 250);
      eng.block.appendChild(page, backRect);

      const backRectFill = eng.block.createFill('color');
      eng.block.setColor(backRectFill, 'fill/color/value', { r: 0.0, g: 0.7, b: 0.9, a: 1.0 });
      eng.block.setFill(backRect, backRectFill);

      const frontCircle = eng.block.create('graphic');
      const frontCircleShape = eng.block.createShape('ellipse');
      eng.block.setShape(frontCircle, frontCircleShape);
      eng.block.setWidth(frontCircle, 120);
      eng.block.setHeight(frontCircle, 120);
      eng.block.setPositionX(frontCircle, 400);
      eng.block.setPositionY(frontCircle, 280);
      eng.block.appendChild(page, frontCircle);

      const frontCircleFill = eng.block.createFill('color');
      eng.block.setColor(frontCircleFill, 'fill/color/value', { r: 1.0, g: 0.3, b: 0.3, a: 0.6 });
      eng.block.setFill(frontCircle, frontCircleFill);

      // Sticker with alpha
      const sticker = eng.block.create('graphic');
      const stickerShape = eng.block.createShape('rect');
      eng.block.setShape(sticker, stickerShape);
      eng.block.setWidth(sticker, 100);
      eng.block.setHeight(sticker, 100);
      eng.block.setPositionX(sticker, 550);
      eng.block.setPositionY(sticker, 250);
      eng.block.appendChild(page, sticker);

      const stickerFill = eng.block.createFill('image');
      eng.block.setString(
        stickerFill,
        'fill/image/imageFileURI',
        'https://cdn.img.ly/assets/v5/ly.img.sticker/images/3Dstickers/3d_stickers_astronaut.png'
      );
      eng.block.setFill(sticker, stickerFill);
    });

    if (!scene) return;

    const result = await compareWithReference(scene.referencePng, scene.pdf, {
      name: 'complex-transparency',
      flattenTransparency: true
    });

    console.log(`Complex scene - Difference: ${result.differencePercentage.toFixed(2)}%`);
    console.log(`  Max color difference: ${result.maxColorDifference}`);

    expect(
      result.differencePercentage,
      `Complex scene with transparency should match reference (got ${result.differencePercentage.toFixed(2)}% difference)`
    ).toBeLessThan(MAX_DIFFERENCE_PERCENT);
  });
});
