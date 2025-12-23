import type { PDFX3Options, AssetLoader } from './types';
import { GhostscriptLoader } from './core/ghostscript-loader';
import { VirtualFileSystem } from './core/virtual-filesystem';
import { BlobUtils } from './utils/blob-utils';

/**
 * Try to get a usable base URL from import.meta.url.
 * Returns null if the URL is not usable (e.g., file:// protocol in browser).
 */
function tryGetBaseUrlFromImportMeta(): string | null {
  try {
    // import.meta.url points to the bundled JS file location
    // In Vite: "http://localhost:5173/node_modules/.vite/deps/..."
    // In Webpack 5: "file:///path/to/dist/index.mjs" (not usable in browser)
    const url = import.meta.url;
    if (!url) return null;

    // file:// URLs don't work for dynamic imports in browsers
    if (url.startsWith('file://')) return null;

    // Extract the directory from the URL
    const lastSlash = url.lastIndexOf('/');
    if (lastSlash === -1) return null;

    return url.substring(0, lastSlash + 1);
  } catch {
    return null;
  }
}

/**
 * Get the appropriate AssetLoader based on options and environment.
 */
async function getAssetLoader(options: PDFX3Options): Promise<AssetLoader> {
  // 1. Explicit loader takes precedence
  if (options.assetLoader) {
    return options.assetLoader;
  }

  // 2. assetPath creates a BrowserAssetLoader
  if (options.assetPath) {
    const { BrowserAssetLoader } = await import('./loaders/browser-loader');
    return new BrowserAssetLoader(options.assetPath);
  }

  // 3. Auto-detect environment
  const isBrowser =
    typeof window !== 'undefined' || typeof document !== 'undefined';

  if (isBrowser) {
    // Try to auto-detect base URL from import.meta.url (works in Vite)
    const autoBaseUrl = tryGetBaseUrlFromImportMeta();
    if (autoBaseUrl) {
      const { BrowserAssetLoader } = await import('./loaders/browser-loader');
      return new BrowserAssetLoader(autoBaseUrl);
    }

    // Can't auto-detect - require explicit configuration (Webpack 5, Angular, etc.)
    throw new Error(
      'In browser environments with Webpack 5 or Angular, you must provide the `assetPath` option.\n\n' +
        'Example:\n' +
        '  convertToPDFX3(blob, {\n' +
        "    outputProfile: 'fogra39',\n" +
        "    assetPath: '/assets/print-ready-pdfs/'\n" +
        '  });\n\n' +
        'See: https://github.com/imgly/plugins/tree/main/packages/plugin-print-ready-pdfs-web#bundler-setup-webpack-5--angular'
    );
  }

  // Node.js - use NodeAssetLoader
  const { NodeAssetLoader } = await import('./loaders/node-loader');
  return new NodeAssetLoader();
}

/**
 * PDF/X-3 conversion function
 * Converts RGB PDF(s) to PDF/X-3 format using specified output profile
 *
 * @overload
 * @param inputPDF Single PDF blob to convert
 * @param options Conversion configuration
 * @returns Promise resolving to converted PDF blob
 *
 * @overload
 * @param inputPDFs Array of PDF blobs to convert
 * @param options Conversion configuration
 * @returns Promise resolving to array of converted PDF blobs
 */
export function convertToPDFX3(
  inputPDF: Blob,
  options: PDFX3Options
): Promise<Blob>;
export function convertToPDFX3(
  inputPDFs: Blob[],
  options: PDFX3Options
): Promise<Blob[]>;
export async function convertToPDFX3(
  input: Blob | Blob[],
  options: PDFX3Options
): Promise<Blob | Blob[]> {
  // Handle array input (batch processing)
  if (Array.isArray(input)) {
    if (input.length === 0) {
      return [];
    }

    // Process each blob sequentially to avoid overwhelming the WASM module
    const results: Blob[] = [];
    for (let i = 0; i < input.length; i++) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const converted = await convertToPDFX3Single(input[i], options);
        results.push(converted);
      } catch (error) {
        throw new Error(
          `Failed to convert PDF ${i + 1} of ${input.length}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
    return results;
  }

  // Handle single blob input
  return convertToPDFX3Single(input, options);
}

/**
 * Internal function to convert a single PDF
 */
async function convertToPDFX3Single(
  inputPDF: Blob,
  options: PDFX3Options
): Promise<Blob> {
  // Validate inputs
  if (!(inputPDF instanceof Blob)) {
    throw new Error('Input must be a Blob');
  }

  if (inputPDF.size === 0) {
    throw new Error('Input PDF is empty');
  }

  if (inputPDF.size > 100 * 1024 * 1024) {
    throw new Error(
      `Input PDF too large (${inputPDF.size} bytes). Maximum: 100MB`
    );
  }

  // Validate output profile is provided
  if (!options.outputProfile) {
    throw new Error(
      'outputProfile is required. Must be one of: "gracol", "fogra39", "srgb", "custom"'
    );
  }

  // Validate output profile value
  const validProfiles = ['gracol', 'fogra39', 'srgb', 'custom'];
  if (!validProfiles.includes(options.outputProfile)) {
    throw new Error(
      `Invalid outputProfile "${
        options.outputProfile
      }". Must be one of: ${validProfiles.join(', ')}`
    );
  }

  // Validate custom profile requirement
  if (options.outputProfile === 'custom' && !options.customProfile) {
    throw new Error(
      'customProfile Blob is required when outputProfile is "custom"'
    );
  }

  // Validate custom profile if provided
  if (options.customProfile && !(options.customProfile instanceof Blob)) {
    throw new Error('customProfile must be a Blob');
  }

  // Validate PDF format
  const isValidPDF = await BlobUtils.validatePDF(inputPDF);
  if (!isValidPDF) {
    throw new Error('Invalid PDF format');
  }

  // Get the asset loader for this conversion
  const assetLoader = await getAssetLoader(options);

  // Load Ghostscript with the asset loader
  const module = await GhostscriptLoader.load({ assetLoader });
  const vfs = new VirtualFileSystem(module);

  try {
    // Setup file paths
    const inputPath = '/tmp/input.pdf';
    const outputPath = '/tmp/output.pdf';
    const pdfxDefPath = '/tmp/pdfx_def.ps';
    const customProfilePath = '/tmp/custom.icc';

    // Write input PDF to virtual filesystem
    await vfs.writeBlob(inputPath, inputPDF);

    // Write ICC profiles to virtual filesystem
    if (options.outputProfile === 'custom' && options.customProfile) {
      await vfs.writeBlob(customProfilePath, options.customProfile);
    } else if (options.outputProfile !== 'custom') {
      // Load the bundled ICC profile using the asset loader
      const profileInfo =
        PROFILE_PRESETS[options.outputProfile as keyof typeof PROFILE_PRESETS];
      const profilePath = `/tmp/${profileInfo.file}`;

      const profileBlob = await assetLoader.loadICCProfile(profileInfo.file);
      await vfs.writeBlob(profilePath, profileBlob);
    }

    // Determine ICC profile path and metadata for Ghostscript
    let iccProfilePath: string;
    let outputConditionIdentifier: string;
    let outputCondition: string;

    if (options.outputProfile === 'custom') {
      iccProfilePath = customProfilePath;
      // Use custom values or defaults
      outputConditionIdentifier =
        options.outputConditionIdentifier || 'Custom Profile';
      outputCondition = options.outputCondition || 'Custom ICC Profile';
    } else {
      const preset =
        PROFILE_PRESETS[options.outputProfile as keyof typeof PROFILE_PRESETS];
      iccProfilePath = `/tmp/${preset.file}`;
      // Allow overriding preset values
      outputConditionIdentifier =
        options.outputConditionIdentifier || preset.identifier;
      outputCondition = options.outputCondition || preset.info;
    }

    // Read ICC profile data and convert to hex for embedding
    // WASM doesn't support (file) (r) file syntax, so we embed directly
    const iccData = vfs.readFile(iccProfilePath);
    const iccHex = Array.from(iccData)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Determine color conversion strategy based on profile type
    // ICC profile color space is at bytes 16-19
    // 'RGB ' = 0x52474220, 'CMYK' = 0x434D594B
    const colorSpaceBytes = iccData.slice(16, 20);
    const colorSpaceStr = String.fromCharCode(...colorSpaceBytes);
    const isCMYKProfile = colorSpaceStr.trim() === 'CMYK';

    // Generate PDF/X-3 definition with ICC profile hex data
    const pdfxDefinition = generatePDFXDef(
      options,
      iccHex,
      outputConditionIdentifier,
      outputCondition
    );
    vfs.writeText(pdfxDefPath, pdfxDefinition);

    // Execute Ghostscript conversion
    // For CMYK profiles, convert all colors to CMYK using the ICC profile
    // Note: Transparency flattening will rasterize transparent content
    const gsArgs = [
      '-dBATCH',
      '-dNOPAUSE',
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      // Disable PDF 1.5+ features to avoid warnings with PDF 1.4 compatibility
      '-dWriteObjStms=false',
      '-dWriteXRefStm=false',
      // PDF/X-3 settings
      '-dPDFSETTINGS=/prepress',
      '-dSetPageSize=false',
      '-dAutoRotatePages=/None',
    ];

    // Flatten transparency for PDF/X-3 compliance (default: true)
    // HaveTransparency=false tells Ghostscript the target viewer cannot handle
    // PDF 1.4 transparency, so pages with transparency are converted to bitmaps
    const shouldFlattenTransparency = options.flattenTransparency !== false;
    if (shouldFlattenTransparency) {
      gsArgs.push('-dHaveTransparency=false');
    }

    // Add color conversion for CMYK profiles
    if (isCMYKProfile) {
      gsArgs.push(
        '-sColorConversionStrategy=CMYK',
        '-dProcessColorModel=/DeviceCMYK',
        '-dConvertCMYKImagesToRGB=false'
      );
    } else {
      // For RGB profiles, we still need a color conversion strategy
      gsArgs.push('-sColorConversionStrategy=RGB');
    }

    // Add output file and input files
    gsArgs.push(`-sOutputFile=${outputPath}`, pdfxDefPath, inputPath);

    const exitCode = await module.callMain(gsArgs);
    if (exitCode !== 0) {
      throw new Error(
        `Ghostscript conversion failed with exit code ${exitCode}`
      );
    }

    // Read output
    const outputData = vfs.readFile(outputPath);
    // Create a copy of the data to ensure it's an ArrayBuffer, not SharedArrayBuffer
    const outputBuffer = new Uint8Array(outputData);
    const outputPDF = new Blob([outputBuffer], { type: 'application/pdf' });

    // Cleanup
    vfs.cleanup();

    return outputPDF;
  } catch (error) {
    vfs.cleanup();
    throw error;
  }
}

// Profile presets from the spec
const PROFILE_PRESETS = {
  gracol: {
    file: 'GRACoL2013_CRPC6.icc',
    identifier: 'CGATS 21.2',
    info: 'GRACoL 2013 CRPC6',
  },
  fogra39: {
    file: 'ISOcoated_v2_eci.icc',
    identifier: 'FOGRA39',
    info: 'ISO Coated v2 (ECI)',
  },
  srgb: {
    file: 'sRGB_IEC61966-2-1.icc',
    identifier: 'sRGB IEC61966-2.1',
    info: 'sRGB IEC61966-2.1',
  },
};

function generatePDFXDef(
  options: PDFX3Options,
  iccProfileHex: string,
  outputConditionIdentifier: string,
  outputCondition: string
): string {
  return `%!
% PDF/X-3 Definition File
[ /Title (${options.title || 'Untitled'}) /DOCINFO pdfmark
[ /Trapped /False /DOCINFO pdfmark

% Set PDF/X-3 conformance
[ /GTS_PDFXVersion (PDF/X-3:2003) /GTS_PDFXConformance (PDF/X-3:2003) /DOCINFO pdfmark

% Set TrimBox to match MediaBox for all pages (required for PDF/X)
[/TrimBox [0 0 0 0] /PAGE pdfmark

% Embed ICC profile as hex stream
[/_objdef {icc_PDFX} /type /stream /OBJ pdfmark
[{icc_PDFX} <</N 4>> /PUT pdfmark
[{icc_PDFX} <${iccProfileHex}> /PUT pdfmark

% Define OutputIntent with embedded ICC profile
[/_objdef {OutputIntent_PDFX} /type /dict /OBJ pdfmark
[{OutputIntent_PDFX} <<
  /Type /OutputIntent
  /S /GTS_PDFX
  /OutputCondition (${outputCondition})
  /OutputConditionIdentifier (${outputConditionIdentifier})
  /RegistryName (http://www.color.org)
  /DestOutputProfile {icc_PDFX}
>> /PUT pdfmark

% Add OutputIntent to Catalog
[{Catalog} <</OutputIntents [{OutputIntent_PDFX}]>> /PUT pdfmark`;
}
