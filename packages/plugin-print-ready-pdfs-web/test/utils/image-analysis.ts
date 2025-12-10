import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

/**
 * Safely remove a temporary file, ignoring errors if it doesn't exist
 */
function safeUnlink(filePath: string): void {
  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  } catch {
    // Ignore cleanup errors
  }
}

export interface PixelAnalysisResult {
  totalPixels: number;
  blackPixels: number;
  blackPixelPercentage: number;
  hasSignificantBlackArea: boolean;
}

export interface RGBPixel {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert a PDF to PNG using pdftoppm (from poppler-utils)
 * Returns the PNG data as a Buffer
 */
export async function convertPdfToPng(
  pdfBlob: Blob,
  options: { dpi?: number; page?: number } = {}
): Promise<Buffer> {
  const { dpi = 150, page = 1 } = options;

  const buffer = Buffer.from(await pdfBlob.arrayBuffer());
  const tempPdfPath = join(tmpdir(), `pdfx-test-${Date.now()}-input.pdf`);
  const tempPngPrefix = join(tmpdir(), `pdfx-test-${Date.now()}-output`);

  try {
    writeFileSync(tempPdfPath, buffer);

    // Convert PDF to PNG using pdftoppm
    // -png: output PNG format
    // -r: resolution in DPI
    // -f/-l: first/last page (1-indexed)
    // -singlefile: don't add page number suffix
    await execAsync(
      `pdftoppm -png -r ${dpi} -f ${page} -l ${page} -singlefile "${tempPdfPath}" "${tempPngPrefix}"`
    );

    const pngPath = `${tempPngPrefix}.png`;
    if (!existsSync(pngPath)) {
      throw new Error(`PNG output not found at ${pngPath}`);
    }

    return readFileSync(pngPath);
  } finally {
    safeUnlink(tempPdfPath);
    safeUnlink(`${tempPngPrefix}.png`);
  }
}

/**
 * Parse PNG file and extract raw pixel data
 * This is a simple PNG parser for RGB/RGBA images
 */
export async function extractPixelData(
  pngBuffer: Buffer
): Promise<{ width: number; height: number; pixels: RGBPixel[] }> {
  // Use ImageMagick's convert to get raw RGB data
  const tempPngPath = join(tmpdir(), `pdfx-test-${Date.now()}-analyze.png`);
  const tempRgbPath = join(tmpdir(), `pdfx-test-${Date.now()}-analyze.rgb`);

  try {
    writeFileSync(tempPngPath, pngBuffer);

    // Get image dimensions
    const { stdout: dimensions } = await execAsync(
      `identify -format "%w %h" "${tempPngPath}"`
    );
    const [widthStr, heightStr] = dimensions.trim().split(' ');
    const width = parseInt(widthStr, 10);
    const height = parseInt(heightStr, 10);

    // Convert to raw RGB
    await execAsync(
      `convert "${tempPngPath}" -depth 8 rgb:"${tempRgbPath}"`
    );

    const rgbData = readFileSync(tempRgbPath);
    const pixels: RGBPixel[] = [];

    for (let i = 0; i < rgbData.length; i += 3) {
      pixels.push({
        r: rgbData[i],
        g: rgbData[i + 1],
        b: rgbData[i + 2]
      });
    }

    return { width, height, pixels };
  } finally {
    safeUnlink(tempPngPath);
    safeUnlink(tempRgbPath);
  }
}

/**
 * Check if a pixel is considered "black" within a tolerance
 * Pure black is (0, 0, 0), but we allow a small tolerance
 */
export function isBlackPixel(
  pixel: RGBPixel,
  tolerance: number = 10
): boolean {
  return pixel.r <= tolerance && pixel.g <= tolerance && pixel.b <= tolerance;
}

/**
 * Analyze an image for black pixels
 * Returns statistics about black pixel presence
 */
export async function analyzeBlackPixels(
  pngBuffer: Buffer,
  options: { blackTolerance?: number; significantThreshold?: number } = {}
): Promise<PixelAnalysisResult> {
  const { blackTolerance = 10, significantThreshold = 5 } = options;

  const { pixels } = await extractPixelData(pngBuffer);

  let blackPixels = 0;
  for (const pixel of pixels) {
    if (isBlackPixel(pixel, blackTolerance)) {
      blackPixels++;
    }
  }

  const totalPixels = pixels.length;
  const blackPixelPercentage = (blackPixels / totalPixels) * 100;

  return {
    totalPixels,
    blackPixels,
    blackPixelPercentage,
    hasSignificantBlackArea: blackPixelPercentage > significantThreshold
  };
}

/**
 * Analyze specific regions of an image for black pixels
 * Useful for checking if content areas have unexpected black backgrounds
 */
export async function analyzeRegionForBlackPixels(
  pngBuffer: Buffer,
  region: { x: number; y: number; width: number; height: number },
  options: { blackTolerance?: number } = {}
): Promise<PixelAnalysisResult> {
  const { blackTolerance = 10 } = options;

  const { width: imgWidth, pixels } = await extractPixelData(pngBuffer);

  let blackPixels = 0;
  let totalPixels = 0;

  for (let y = region.y; y < region.y + region.height; y++) {
    for (let x = region.x; x < region.x + region.width; x++) {
      const idx = y * imgWidth + x;
      if (idx < pixels.length) {
        totalPixels++;
        if (isBlackPixel(pixels[idx], blackTolerance)) {
          blackPixels++;
        }
      }
    }
  }

  const blackPixelPercentage =
    totalPixels > 0 ? (blackPixels / totalPixels) * 100 : 0;

  return {
    totalPixels,
    blackPixels,
    blackPixelPercentage,
    hasSignificantBlackArea: blackPixelPercentage > 5
  };
}

/**
 * Check if required image analysis tools are available
 */
export async function checkImageToolsAvailable(): Promise<
  Record<string, boolean>
> {
  const tools: Record<string, string> = {
    pdftoppm: 'pdftoppm -v',
    convert: 'convert --version',
    identify: 'identify --version'
  };

  const available: Record<string, boolean> = {};

  for (const [name, cmd] of Object.entries(tools)) {
    try {
      await execAsync(cmd + ' 2>&1');
      available[name] = true;
    } catch {
      available[name] = false;
    }
  }

  return available;
}

export interface ImageComparisonResult {
  totalPixels: number;
  differentPixels: number;
  differencePercentage: number;
  maxColorDifference: number;
  avgColorDifference: number;
  isMatch: boolean;
}

/**
 * Compare two PNG images pixel by pixel
 * Returns statistics about how different the images are
 */
export async function compareImages(
  pngBuffer1: Buffer,
  pngBuffer2: Buffer,
  options: { tolerance?: number; matchThreshold?: number } = {}
): Promise<ImageComparisonResult> {
  const { tolerance = 10, matchThreshold = 5 } = options;

  const img1 = await extractPixelData(pngBuffer1);
  const img2 = await extractPixelData(pngBuffer2);

  // If dimensions don't match, resize the larger one to match the smaller
  // For simplicity, we'll compare pixel by pixel up to the smaller dimension
  const minPixels = Math.min(img1.pixels.length, img2.pixels.length);

  let differentPixels = 0;
  let totalColorDifference = 0;
  let maxColorDifference = 0;

  for (let i = 0; i < minPixels; i++) {
    const p1 = img1.pixels[i];
    const p2 = img2.pixels[i];

    const rDiff = Math.abs(p1.r - p2.r);
    const gDiff = Math.abs(p1.g - p2.g);
    const bDiff = Math.abs(p1.b - p2.b);

    const colorDiff = Math.max(rDiff, gDiff, bDiff);
    totalColorDifference += colorDiff;

    if (colorDiff > maxColorDifference) {
      maxColorDifference = colorDiff;
    }

    // Consider pixels different if any channel exceeds tolerance
    if (rDiff > tolerance || gDiff > tolerance || bDiff > tolerance) {
      differentPixels++;
    }
  }

  const differencePercentage = (differentPixels / minPixels) * 100;
  const avgColorDifference = totalColorDifference / minPixels;

  return {
    totalPixels: minPixels,
    differentPixels,
    differencePercentage,
    maxColorDifference,
    avgColorDifference,
    isMatch: differencePercentage <= matchThreshold
  };
}

/**
 * Resize a PNG to specific dimensions using ImageMagick
 */
export async function resizePng(
  pngBuffer: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  const tempInputPath = join(tmpdir(), `pdfx-test-${Date.now()}-resize-in.png`);
  const tempOutputPath = join(
    tmpdir(),
    `pdfx-test-${Date.now()}-resize-out.png`
  );

  try {
    writeFileSync(tempInputPath, pngBuffer);

    await execAsync(
      `convert "${tempInputPath}" -resize ${width}x${height}! "${tempOutputPath}"`
    );

    return readFileSync(tempOutputPath);
  } finally {
    safeUnlink(tempInputPath);
    safeUnlink(tempOutputPath);
  }
}
