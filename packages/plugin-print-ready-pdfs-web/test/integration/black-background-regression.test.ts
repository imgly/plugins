/**
 * Black Background Regression Test
 *
 * This test reproduces GitHub issue #11242:
 * "[Export Print-Ready PDFs] Elements are rendered on black background when export"
 *
 * Issue: When exporting PDFs with certain elements (gradient shapes, text with emojis,
 * stickers from Craft/3D Grain groups), the transparency flattening process in
 * Ghostscript can cause these elements to appear on a black background instead of
 * their intended transparent/white background.
 *
 * This test uses @cesdk/node to programmatically create scenes with problematic elements,
 * exports them as both PNG (reference) and PDF, converts the PDF to PDF/X-3, and then
 * compares the reference PNG with the PDF/X-3 output to detect black background issues.
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';

import CreativeEngine from '@cesdk/node';

import { convertToPDFX3 } from '../../dist/index.mjs';
import {
  convertPdfToPng,
  analyzeBlackPixels,
  checkImageToolsAvailable,
  compareImages,
  resizePng,
  type PixelAnalysisResult,
  type ImageComparisonResult
} from '../utils/image-analysis.js';
import { ExternalValidators } from '../utils/external-validators.js';

const testFile = fileURLToPath(import.meta.url);
const testDir = dirname(testFile);

// CE.SDK license - uses trial/demo mode if not set
const CESDK_LICENSE = process.env.CESDK_LICENSE || '';

describe('Black Background Regression (#11242)', () => {
  let imageToolsAvailable: Record<string, boolean>;
  let pdfToolsAvailable: Record<string, boolean>;
  let engine: InstanceType<typeof CreativeEngine> | null = null;

  beforeAll(async () => {
    imageToolsAvailable = await checkImageToolsAvailable();
    pdfToolsAvailable = await ExternalValidators.checkToolsAvailable();

    if (!imageToolsAvailable.pdftoppm || !imageToolsAvailable.convert) {
      console.warn(
        '⚠️  Image analysis tools missing (pdftoppm, convert). ' +
          'Install poppler-utils and imagemagick: brew install poppler imagemagick'
      );
    }

    // Initialize CE.SDK engine for creating test PDFs
    try {
      engine = await CreativeEngine.init({
        license: CESDK_LICENSE,
        baseURL: 'https://cdn.img.ly/packages/imgly/cesdk-node/1.61.0/assets'
      });
      console.log('CE.SDK engine initialized for test PDF generation');
    } catch (error) {
      console.warn(
        '⚠️  Failed to initialize CE.SDK engine:',
        error instanceof Error ? error.message : error
      );
      console.warn('   Tests will use fixture files if available');
    }
  });

  afterAll(() => {
    if (engine) {
      engine.dispose();
      engine = null;
    }
  });

  /**
   * Create a scene with elements known to trigger the black background bug,
   * and export both as PDF and PNG (reference image).
   *
   * Elements included:
   * - Gradient shapes (linear and radial gradients)
   * - Text with emojis
   * - Semi-transparent elements
   * - Stickers from "craft" group (tape, polaroid frame - PNG with alpha)
   * - Stickers from "3Dstickers" group (astronaut, brain, cube - PNG with alpha)
   *
   * @returns Object containing both PDF blob and reference PNG buffer, or null if failed
   */
  const createProblematicScene = async (): Promise<{
    pdf: Blob;
    referencePng: Buffer;
  } | null> => {
    if (!engine) {
      console.warn('CE.SDK engine not available, cannot create test scene');
      return null;
    }

    try {
      // Create a new scene
      const scene = engine.scene.create();

      // Create a page
      const page = engine.block.create('page');
      engine.block.setWidth(page, 800);
      engine.block.setHeight(page, 600);
      engine.block.appendChild(scene, page);

      // Set page background to white
      const pageFill = engine.block.getFill(page);
      engine.block.setColor(pageFill, 'fill/color/value', {
        r: 1,
        g: 1,
        b: 1,
        a: 1
      });

      // 1. Create a shape with LINEAR GRADIENT fill (known to cause issues)
      const gradientRect = engine.block.create('graphic');
      const rectShape = engine.block.createShape('rect');
      engine.block.setShape(gradientRect, rectShape);
      engine.block.setWidth(gradientRect, 200);
      engine.block.setHeight(gradientRect, 150);
      engine.block.setPositionX(gradientRect, 50);
      engine.block.setPositionY(gradientRect, 50);
      engine.block.appendChild(page, gradientRect);

      // Create linear gradient fill
      const linearGradient = engine.block.createFill('gradient/linear');
      engine.block.setGradientColorStops(
        linearGradient,
        'fill/gradient/colors',
        [
          { color: { r: 1.0, g: 0.2, b: 0.2, a: 1.0 }, stop: 0 },
          { color: { r: 0.2, g: 0.2, b: 1.0, a: 1.0 }, stop: 1 }
        ]
      );
      engine.block.setFloat(
        linearGradient,
        'fill/gradient/linear/startPointX',
        0
      );
      engine.block.setFloat(
        linearGradient,
        'fill/gradient/linear/startPointY',
        0
      );
      engine.block.setFloat(linearGradient, 'fill/gradient/linear/endPointX', 1);
      engine.block.setFloat(linearGradient, 'fill/gradient/linear/endPointY', 1);
      engine.block.setFill(gradientRect, linearGradient);

      // 2. Create a shape with RADIAL GRADIENT fill
      const radialRect = engine.block.create('graphic');
      const circleShape = engine.block.createShape('ellipse');
      engine.block.setShape(radialRect, circleShape);
      engine.block.setWidth(radialRect, 150);
      engine.block.setHeight(radialRect, 150);
      engine.block.setPositionX(radialRect, 300);
      engine.block.setPositionY(radialRect, 50);
      engine.block.appendChild(page, radialRect);

      const radialGradient = engine.block.createFill('gradient/radial');
      engine.block.setGradientColorStops(
        radialGradient,
        'fill/gradient/colors',
        [
          { color: { r: 1.0, g: 1.0, b: 0.0, a: 1.0 }, stop: 0 },
          { color: { r: 0.0, g: 0.8, b: 0.0, a: 1.0 }, stop: 1 }
        ]
      );
      engine.block.setFloat(
        radialGradient,
        'fill/gradient/radial/centerPointX',
        0.5
      );
      engine.block.setFloat(
        radialGradient,
        'fill/gradient/radial/centerPointY',
        0.5
      );
      engine.block.setFloat(radialGradient, 'fill/gradient/radial/radius', 0.7);
      engine.block.setFill(radialRect, radialGradient);

      // 3. Create a SEMI-TRANSPARENT shape (transparency is key to triggering the bug)
      const transparentRect = engine.block.create('graphic');
      const transparentShape = engine.block.createShape('rect');
      engine.block.setShape(transparentRect, transparentShape);
      engine.block.setWidth(transparentRect, 180);
      engine.block.setHeight(transparentRect, 100);
      engine.block.setPositionX(transparentRect, 500);
      engine.block.setPositionY(transparentRect, 80);
      engine.block.appendChild(page, transparentRect);

      const transparentFill = engine.block.createFill('color');
      engine.block.setColor(transparentFill, 'fill/color/value', {
        r: 0.5,
        g: 0.0,
        b: 0.8,
        a: 0.5 // 50% transparent - this is crucial for triggering the bug
      });
      engine.block.setFill(transparentRect, transparentFill);

      // 4. Create TEXT with EMOJIS (known to cause issues per #11242)
      const textBlock = engine.block.create('text');
      engine.block.setWidth(textBlock, 300);
      engine.block.setHeight(textBlock, 80);
      engine.block.setPositionX(textBlock, 50);
      engine.block.setPositionY(textBlock, 250);
      engine.block.appendChild(page, textBlock);

      // Set text content with emojis
      engine.block.replaceText(textBlock, 'Hello World! 🎨 🖼️ ✨');

      // Set text color
      const textFill = engine.block.getFill(textBlock);
      engine.block.setColor(textFill, 'fill/color/value', {
        r: 0.1,
        g: 0.1,
        b: 0.1,
        a: 1.0
      });

      // 5. Create another gradient with TRANSPARENCY in the gradient stops
      const gradientWithAlpha = engine.block.create('graphic');
      const alphaShape = engine.block.createShape('rect');
      engine.block.setShape(gradientWithAlpha, alphaShape);
      engine.block.setWidth(gradientWithAlpha, 200);
      engine.block.setHeight(gradientWithAlpha, 100);
      engine.block.setPositionX(gradientWithAlpha, 50);
      engine.block.setPositionY(gradientWithAlpha, 380);
      engine.block.appendChild(page, gradientWithAlpha);

      const alphaGradient = engine.block.createFill('gradient/linear');
      engine.block.setGradientColorStops(alphaGradient, 'fill/gradient/colors', [
        { color: { r: 1.0, g: 0.5, b: 0.0, a: 1.0 }, stop: 0 },
        { color: { r: 1.0, g: 0.5, b: 0.0, a: 0.0 }, stop: 1 } // Fades to transparent
      ]);
      engine.block.setFloat(alphaGradient, 'fill/gradient/linear/startPointX', 0);
      engine.block.setFloat(
        alphaGradient,
        'fill/gradient/linear/startPointY',
        0.5
      );
      engine.block.setFloat(alphaGradient, 'fill/gradient/linear/endPointX', 1);
      engine.block.setFloat(
        alphaGradient,
        'fill/gradient/linear/endPointY',
        0.5
      );
      engine.block.setFill(gradientWithAlpha, alphaGradient);

      // 6. Create overlapping elements (common source of transparency issues)
      const backRect = engine.block.create('graphic');
      const backShape = engine.block.createShape('rect');
      engine.block.setShape(backRect, backShape);
      engine.block.setWidth(backRect, 150);
      engine.block.setHeight(backRect, 150);
      engine.block.setPositionX(backRect, 350);
      engine.block.setPositionY(backRect, 350);
      engine.block.appendChild(page, backRect);

      const backFill = engine.block.createFill('color');
      engine.block.setColor(backFill, 'fill/color/value', {
        r: 0.0,
        g: 0.7,
        b: 0.9,
        a: 1.0
      });
      engine.block.setFill(backRect, backFill);

      // Overlapping semi-transparent element
      const frontRect = engine.block.create('graphic');
      const frontShape = engine.block.createShape('ellipse');
      engine.block.setShape(frontRect, frontShape);
      engine.block.setWidth(frontRect, 120);
      engine.block.setHeight(frontRect, 120);
      engine.block.setPositionX(frontRect, 400);
      engine.block.setPositionY(frontRect, 380);
      engine.block.appendChild(page, frontRect);

      const frontFill = engine.block.createFill('color');
      engine.block.setColor(frontFill, 'fill/color/value', {
        r: 1.0,
        g: 0.3,
        b: 0.3,
        a: 0.6 // Semi-transparent overlay
      });
      engine.block.setFill(frontRect, frontFill);

      // 7. Add STICKERS from "craft" group (PNG with transparency - known to cause issues per #11242)
      // These stickers have alpha channels that can trigger the black background bug
      const stickerBaseUrl = 'https://cdn.img.ly/assets/v5';

      // Craft sticker: tape (PNG with transparency)
      const tapeSticker = engine.block.create('graphic');
      const tapeShape = engine.block.createShape('rect');
      engine.block.setShape(tapeSticker, tapeShape);
      engine.block.setWidth(tapeSticker, 100);
      engine.block.setHeight(tapeSticker, 40);
      engine.block.setPositionX(tapeSticker, 550);
      engine.block.setPositionY(tapeSticker, 250);
      engine.block.appendChild(page, tapeSticker);

      const tapeFill = engine.block.createFill('image');
      engine.block.setString(
        tapeFill,
        'fill/image/imageFileURI',
        `${stickerBaseUrl}/ly.img.sticker/images/craft/tape01.png`
      );
      engine.block.setFill(tapeSticker, tapeFill);

      // Craft sticker: polaroid frame (PNG with transparency)
      const polaroidSticker = engine.block.create('graphic');
      const polaroidShape = engine.block.createShape('rect');
      engine.block.setShape(polaroidSticker, polaroidShape);
      engine.block.setWidth(polaroidSticker, 80);
      engine.block.setHeight(polaroidSticker, 100);
      engine.block.setPositionX(polaroidSticker, 660);
      engine.block.setPositionY(polaroidSticker, 220);
      engine.block.appendChild(page, polaroidSticker);

      const polaroidFill = engine.block.createFill('image');
      engine.block.setString(
        polaroidFill,
        'fill/image/imageFileURI',
        `${stickerBaseUrl}/ly.img.sticker/images/craft/polaroid_frame.png`
      );
      engine.block.setFill(polaroidSticker, polaroidFill);

      // 8. Add STICKERS from "3Dstickers" group (PNG with transparency - known to cause issues per #11242)
      // 3D sticker: astronaut
      const astronautSticker = engine.block.create('graphic');
      const astronautShape = engine.block.createShape('rect');
      engine.block.setShape(astronautSticker, astronautShape);
      engine.block.setWidth(astronautSticker, 100);
      engine.block.setHeight(astronautSticker, 100);
      engine.block.setPositionX(astronautSticker, 550);
      engine.block.setPositionY(astronautSticker, 350);
      engine.block.appendChild(page, astronautSticker);

      const astronautFill = engine.block.createFill('image');
      engine.block.setString(
        astronautFill,
        'fill/image/imageFileURI',
        `${stickerBaseUrl}/ly.img.sticker/images/3Dstickers/3d_stickers_astronaut.png`
      );
      engine.block.setFill(astronautSticker, astronautFill);

      // 3D sticker: brain
      const brainSticker = engine.block.create('graphic');
      const brainShape = engine.block.createShape('rect');
      engine.block.setShape(brainSticker, brainShape);
      engine.block.setWidth(brainSticker, 80);
      engine.block.setHeight(brainSticker, 80);
      engine.block.setPositionX(brainSticker, 660);
      engine.block.setPositionY(brainSticker, 370);
      engine.block.appendChild(page, brainSticker);

      const brainFill = engine.block.createFill('image');
      engine.block.setString(
        brainFill,
        'fill/image/imageFileURI',
        `${stickerBaseUrl}/ly.img.sticker/images/3Dstickers/3d_stickers_brain.png`
      );
      engine.block.setFill(brainSticker, brainFill);

      // 3D sticker: cube
      const cubeSticker = engine.block.create('graphic');
      const cubeShape = engine.block.createShape('rect');
      engine.block.setShape(cubeSticker, cubeShape);
      engine.block.setWidth(cubeSticker, 70);
      engine.block.setHeight(cubeSticker, 70);
      engine.block.setPositionX(cubeSticker, 280);
      engine.block.setPositionY(cubeSticker, 380);
      engine.block.appendChild(page, cubeSticker);

      const cubeFill = engine.block.createFill('image');
      engine.block.setString(
        cubeFill,
        'fill/image/imageFileURI',
        `${stickerBaseUrl}/ly.img.sticker/images/3Dstickers/3d_stickers_cube.png`
      );
      engine.block.setFill(cubeSticker, cubeFill);

      // Export as PNG (reference image) and PDF
      // The PNG serves as the ground truth for comparison
      const pngBlob = await engine.block.export(page, 'image/png');
      const pdfBlob = await engine.block.export(page, 'application/pdf');

      const referencePng = Buffer.from(await pngBlob.arrayBuffer());

      console.log('Created test scene with problematic elements (PDF + PNG reference)');
      return { pdf: pdfBlob, referencePng };
    } catch (error) {
      console.error('Failed to create test PDF:', error);
      return null;
    }
  };

  /**
   * Helper to get a test PDF by name (fallback to fixtures)
   */
  const getTestPDF = (name: string): Blob | null => {
    const path = join(testDir, '../fixtures/pdfs', name);
    if (!existsSync(path)) {
      return null;
    }
    return new Blob([readFileSync(path)], { type: 'application/pdf' });
  };

  /**
   * Helper to save debug output for manual inspection
   */
  const saveDebugOutput = async (
    pdfBlob: Blob,
    name: string
  ): Promise<void> => {
    const outputDir = join(testDir, '../output');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const buffer = Buffer.from(await pdfBlob.arrayBuffer());
    writeFileSync(join(outputDir, name), buffer);
  };

  /**
   * Core test logic: convert PDF to PDF/X-3 and check for black backgrounds.
   * Can optionally compare against a reference PNG to detect visual differences.
   */
  const testForBlackBackground = async (
    inputPDF: Blob,
    options: {
      flattenTransparency?: boolean;
      outputProfile?: 'srgb' | 'fogra39' | 'gracol';
      maxBlackPercentage?: number;
      debugName?: string;
      referencePng?: Buffer;
    } = {}
  ): Promise<{
    analysis: PixelAnalysisResult;
    comparison?: ImageComparisonResult;
    outputPDF: Blob;
    convertedPng?: Buffer;
  }> => {
    const {
      flattenTransparency = true,
      outputProfile = 'srgb',
      debugName,
      referencePng
    } = options;

    // Convert to PDF/X-3
    const outputPDF = await convertToPDFX3(inputPDF, {
      outputProfile,
      title: 'Black Background Test',
      flattenTransparency
    });

    // Save debug output if requested
    if (debugName) {
      await saveDebugOutput(
        outputPDF,
        `${debugName}-${flattenTransparency ? 'flattened' : 'preserved'}.pdf`
      );
    }

    // Skip image analysis if tools not available
    if (!imageToolsAvailable.pdftoppm || !imageToolsAvailable.convert) {
      console.warn('Skipping pixel analysis - image tools not available');
      return {
        analysis: {
          totalPixels: 0,
          blackPixels: 0,
          blackPixelPercentage: 0,
          hasSignificantBlackArea: false
        },
        outputPDF
      };
    }

    // Convert PDF to PNG for pixel analysis
    const pngBuffer = await convertPdfToPng(outputPDF, { dpi: 72 });

    // Save PNG for debugging
    const outputDir = join(testDir, '../output');
    if (debugName) {
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }
      writeFileSync(
        join(
          outputDir,
          `${debugName}-${flattenTransparency ? 'flattened' : 'preserved'}.png`
        ),
        pngBuffer
      );
    }

    // Analyze for black pixels
    const analysis = await analyzeBlackPixels(pngBuffer, {
      blackTolerance: 15,
      significantThreshold: 10
    });

    // Compare with reference PNG if provided
    let comparison: ImageComparisonResult | undefined;
    if (referencePng) {
      // Resize reference PNG to match the converted PNG dimensions for fair comparison
      // The PDF might render at a slightly different size
      const { extractPixelData } = await import('../utils/image-analysis.js');
      const { width, height } = await extractPixelData(pngBuffer);
      const resizedReference = await resizePng(referencePng, width, height);

      // Save reference PNG for debugging
      if (debugName) {
        writeFileSync(
          join(outputDir, `${debugName}-reference.png`),
          referencePng
        );
        writeFileSync(
          join(outputDir, `${debugName}-reference-resized.png`),
          resizedReference
        );
      }

      comparison = await compareImages(resizedReference, pngBuffer, {
        tolerance: 30, // Allow some tolerance for color conversion differences
        matchThreshold: 10 // Consider a match if <10% different
      });
    }

    return { analysis, comparison, outputPDF, convertedPng: pngBuffer };
  };

  describe('CE.SDK generated PDF with transparency elements', () => {
    test('PDF/X-3 output should match reference PNG (flattenTransparency: true)', async () => {
      const scene = await createProblematicScene();
      if (!scene) {
        console.warn('Skipping test - could not create test scene with CE.SDK');
        return;
      }

      const { pdf: inputPDF, referencePng } = scene;

      // Save the input PDF for debugging
      await saveDebugOutput(inputPDF, 'cesdk-generated-input.pdf');

      const { analysis, comparison } = await testForBlackBackground(inputPDF, {
        flattenTransparency: true,
        debugName: 'cesdk-transparency-elements',
        referencePng
      });

      console.log(
        'Analysis for CE.SDK generated PDF (flattenTransparency: true):'
      );
      console.log(`  Total pixels: ${analysis.totalPixels}`);
      console.log(`  Black pixels: ${analysis.blackPixels}`);
      console.log(
        `  Black percentage: ${analysis.blackPixelPercentage.toFixed(2)}%`
      );

      if (comparison) {
        console.log('  Image comparison with reference:');
        console.log(`    Different pixels: ${comparison.differentPixels}`);
        console.log(
          `    Difference percentage: ${comparison.differencePercentage.toFixed(2)}%`
        );
        console.log(
          `    Max color difference: ${comparison.maxColorDifference}`
        );
        console.log(
          `    Avg color difference: ${comparison.avgColorDifference.toFixed(2)}`
        );
        console.log(`    Is match: ${comparison.isMatch}`);

        // The converted PDF should closely match the reference PNG
        // A high difference indicates the black background bug
        expect(
          comparison.differencePercentage,
          'PDF/X-3 output differs significantly from reference - likely black background bug (#11242)'
        ).toBeLessThan(25);
      }

      // Also check black pixel percentage as a secondary measure
      expect(
        analysis.blackPixelPercentage,
        'Too many black pixels - possible black background bug (#11242)'
      ).toBeLessThan(15);
    });

    test('PDF/X-3 output should match reference PNG (flattenTransparency: false)', async () => {
      const scene = await createProblematicScene();
      if (!scene) {
        console.warn('Skipping test - could not create test scene with CE.SDK');
        return;
      }

      const { pdf: inputPDF, referencePng } = scene;

      const { analysis, comparison } = await testForBlackBackground(inputPDF, {
        flattenTransparency: false,
        debugName: 'cesdk-transparency-elements',
        referencePng
      });

      console.log(
        'Analysis for CE.SDK generated PDF (flattenTransparency: false):'
      );
      console.log(`  Total pixels: ${analysis.totalPixels}`);
      console.log(`  Black pixels: ${analysis.blackPixels}`);
      console.log(
        `  Black percentage: ${analysis.blackPixelPercentage.toFixed(2)}%`
      );

      if (comparison) {
        console.log('  Image comparison with reference:');
        console.log(`    Different pixels: ${comparison.differentPixels}`);
        console.log(
          `    Difference percentage: ${comparison.differencePercentage.toFixed(2)}%`
        );
        console.log(`    Is match: ${comparison.isMatch}`);

        // Without flattening, output should closely match reference
        expect(
          comparison.differencePercentage,
          'PDF/X-3 output (no flattening) differs significantly from reference'
        ).toBeLessThan(20);
      }

      // Without flattening, there should be minimal black pixels
      expect(
        analysis.blackPixelPercentage,
        'Too many black pixels even without flattening'
      ).toBeLessThan(10);
    });

    test('compare flattened vs non-flattened to detect the bug', async () => {
      const scene = await createProblematicScene();
      if (!scene) {
        console.warn('Skipping test - could not create test scene with CE.SDK');
        return;
      }

      const { pdf: inputPDF, referencePng } = scene;

      // Test with flattening (this might trigger the bug)
      const { analysis: withFlattening, comparison: comparisonFlattened } =
        await testForBlackBackground(inputPDF, {
          flattenTransparency: true,
          debugName: 'cesdk-compare',
          referencePng
        });

      // Test without flattening (should work correctly)
      const { analysis: withoutFlattening, comparison: comparisonPreserved } =
        await testForBlackBackground(inputPDF, {
          flattenTransparency: false,
          debugName: 'cesdk-compare',
          referencePng
        });

      console.log('Comparison of CE.SDK generated PDF:');
      console.log('  Black pixel analysis:');
      console.log(
        `    With flattening: ${withFlattening.blackPixelPercentage.toFixed(2)}%`
      );
      console.log(
        `    Without flattening: ${withoutFlattening.blackPixelPercentage.toFixed(2)}%`
      );

      const blackDifference =
        withFlattening.blackPixelPercentage -
        withoutFlattening.blackPixelPercentage;
      console.log(`    Black pixel difference: ${blackDifference.toFixed(2)}%`);

      if (comparisonFlattened && comparisonPreserved) {
        console.log('  Reference comparison:');
        console.log(
          `    Flattened vs reference: ${comparisonFlattened.differencePercentage.toFixed(2)}%`
        );
        console.log(
          `    Preserved vs reference: ${comparisonPreserved.differencePercentage.toFixed(2)}%`
        );

        const visualDifference =
          comparisonFlattened.differencePercentage -
          comparisonPreserved.differencePercentage;
        console.log(
          `    Visual difference caused by flattening: ${visualDifference.toFixed(2)}%`
        );

        // If flattening causes significantly more visual difference vs reference, that's the bug!
        if (visualDifference > 5) {
          console.warn(
            `⚠️  POTENTIAL BUG DETECTED: Transparency flattening increases visual difference by ${visualDifference.toFixed(2)}%`
          );
          console.warn('    This confirms the issue from GitHub #11242.');
          console.warn(
            '    Workaround: Use flattenTransparency: false (but note this may affect PDF/X-3 compliance)'
          );
        }

        // The test is informational - we want to detect if the bug exists
        expect(
          visualDifference,
          'Transparency flattening causes significant visual degradation vs reference'
        ).toBeLessThan(30);
      }

      // Also check black pixel difference
      expect(
        blackDifference,
        'Transparency flattening causes significant increase in black pixels'
      ).toBeLessThan(20);
    });
  });

  describe('with existing fixture files (fallback)', () => {
    test('test-complex.pdf should not have excessive black pixels', async () => {
      const inputPDF = getTestPDF('test-complex.pdf');
      if (!inputPDF) {
        console.warn('Skipping test - test-complex.pdf not found');
        return;
      }

      const { analysis } = await testForBlackBackground(inputPDF, {
        flattenTransparency: true,
        debugName: 'fixture-test-complex'
      });

      console.log('Black pixel analysis for test-complex.pdf:');
      console.log(
        `  Black percentage: ${analysis.blackPixelPercentage.toFixed(2)}%`
      );

      expect(analysis.blackPixelPercentage).toBeLessThan(20);
    });

    test('test-vectors.pdf should not have excessive black pixels', async () => {
      const inputPDF = getTestPDF('test-vectors.pdf');
      if (!inputPDF) {
        console.warn('Skipping test - test-vectors.pdf not found');
        return;
      }

      const { analysis } = await testForBlackBackground(inputPDF, {
        flattenTransparency: true,
        debugName: 'fixture-test-vectors'
      });

      console.log('Black pixel analysis for test-vectors.pdf:');
      console.log(
        `  Black percentage: ${analysis.blackPixelPercentage.toFixed(2)}%`
      );

      expect(analysis.blackPixelPercentage).toBeLessThan(20);
    });
  });

  describe('CMYK profile conversion', () => {
    test('CE.SDK generated PDF should match reference with FOGRA39 profile', async () => {
      const scene = await createProblematicScene();
      if (!scene) {
        console.warn('Skipping test - could not create test scene with CE.SDK');
        return;
      }

      const { pdf: inputPDF, referencePng } = scene;

      const { analysis, comparison } = await testForBlackBackground(inputPDF, {
        flattenTransparency: true,
        outputProfile: 'fogra39',
        debugName: 'cesdk-fogra39',
        referencePng
      });

      console.log('Analysis with FOGRA39 profile:');
      console.log(`  Black pixel percentage: ${analysis.blackPixelPercentage.toFixed(2)}%`);

      if (comparison) {
        console.log(`  Difference vs reference: ${comparison.differencePercentage.toFixed(2)}%`);
        // CMYK conversion will have some color differences, but shouldn't introduce black backgrounds
        expect(
          comparison.differencePercentage,
          'CMYK conversion should not introduce black backgrounds'
        ).toBeLessThan(40); // Higher tolerance for color space conversion
      }

      expect(
        analysis.blackPixelPercentage,
        'Too many black pixels with FOGRA39 profile'
      ).toBeLessThan(25);
    });
  });
});
