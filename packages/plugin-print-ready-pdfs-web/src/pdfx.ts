import type { PDFX3Options } from './types/pdfx';
import { GhostscriptLoader } from './core/ghostscript-loader';
import { VirtualFileSystem } from './core/virtual-filesystem';
import { BlobUtils } from './utils/blob-utils';

/**
 * Normalizes an asset path to ensure it has a trailing slash and is a valid URL.
 * Converts relative paths (e.g., '/assets/wasm/') to absolute URLs using the current origin.
 */
function normalizeAssetPath(path: string): string {
  const normalizedPath = path.endsWith('/') ? path : path + '/';

  // If it's already an absolute URL, return as-is
  if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
    return normalizedPath;
  }

  // Convert relative path to absolute URL using document.location.origin
  const origin =
    typeof document !== 'undefined' ? document.location?.origin || '' : '';

  return origin + normalizedPath;
}

/**
 * Resolves the base URL for loading ICC profiles in browser environments.
 * Throws a helpful error if assetPath is required but not provided.
 */
function resolveBrowserIccPath(assetPath: string | undefined): string {
  // 1. Explicit assetPath always wins
  if (assetPath) {
    return normalizeAssetPath(assetPath);
  }

  // 2. Try import.meta.url (works in Vite, native ESM)
  const baseUrl = import.meta.url;

  if (!baseUrl.startsWith('file://')) {
    // Valid browser URL - use it directly
    return new URL('./', baseUrl).href;
  }

  // 3. Bundled environment (Webpack 5 transforms to file://)
  //    assetPath is required - throw helpful error
  throw new Error(
    `Could not locate plugin assets. The assetPath option is required.\n\n` +
      `This typically happens when using a bundler (like Webpack 5 or Angular CLI) ` +
      `that transforms import.meta.url to a file:// URL.\n\n` +
      `To fix this, copy the plugin assets to your public folder and provide the assetPath option:\n\n` +
      `Option A: Configure your bundler to copy assets automatically\n\n` +
      `  Angular CLI - add to angular.json "assets" array:\n` +
      `    { "glob": "{gs.js,gs.wasm,*.icc}", "input": "node_modules/@imgly/plugin-print-ready-pdfs-web/dist", "output": "/assets/" }\n\n` +
      `  Webpack - use copy-webpack-plugin:\n` +
      `    new CopyPlugin({ patterns: [{ from: "node_modules/@imgly/plugin-print-ready-pdfs-web/dist/*.{js,wasm,icc}", to: "assets/[name][ext]" }] })\n\n` +
      `Option B: Copy manually\n\n` +
      `  cp node_modules/@imgly/plugin-print-ready-pdfs-web/dist/{gs.js,gs.wasm,*.icc} public/assets/\n\n` +
      `Then pass the assetPath option:\n\n` +
      `  convertToPDFX3(blob, {\n` +
      `    outputProfile: 'fogra39',\n` +
      `    assetPath: '/assets/'  // adjust to match your output path\n` +
      `  });\n\n` +
      `See: https://img.ly/docs/cesdk/print-ready-pdfs/bundler-setup`
  );
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

  // Load Ghostscript with assetPath option
  const module = await GhostscriptLoader.load({ assetPath: options.assetPath });
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
      // Load the bundled ICC profile
      const profileInfo =
        PROFILE_PRESETS[options.outputProfile as keyof typeof PROFILE_PRESETS];
      const profilePath = `/tmp/${profileInfo.file}`;

      // Load ICC profile - different approach for Node.js vs browser
      // Check if we're in a browser environment first (more reliable than checking for Node.js)
      const isBrowser =
        typeof window !== 'undefined' || typeof document !== 'undefined';
      const isNode =
        !isBrowser &&
        typeof process !== 'undefined' &&
        process.versions?.node != null;

      let profileBlob: Blob;

      if (isNode) {
        // Node.js: Load from filesystem using readFileSync
        // Use indirect dynamic import to prevent Webpack 5 from statically analyzing these imports
        // But use direct imports in test environments (vitest) where indirect imports bypass mocking
        // See: https://github.com/imgly/ubq/issues/11471
        const isTestEnv =
          process.env.VITEST === 'true' || process.env.NODE_ENV === 'test';

        // Note: new Function() could fail in CSP-restricted environments, but CSP is a browser
        // security mechanism and doesn't apply to Node.js. This code only runs in Node.js (isNode check above).
        // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
        const indirectImport = new Function('s', 'return import(s)') as (
          s: string
        ) => Promise<any>;
        const dynamicImport = isTestEnv
          ? (s: string) => import(s)
          : indirectImport;

        const { readFileSync } = await dynamicImport('fs');
        const { fileURLToPath } = await dynamicImport('url');
        const { dirname, join } = await dynamicImport('path');

        // Get the directory of the built module
        const moduleDir = dirname(fileURLToPath(import.meta.url));
        const profileFilePath = join(moduleDir, profileInfo.file);

        const profileData = readFileSync(profileFilePath);
        profileBlob = new Blob([profileData], {
          type: 'application/vnd.iccprofile',
        });
      } else {
        // Browser: Resolve asset path with explicit option or import.meta.url
        const baseUrl = resolveBrowserIccPath(options.assetPath);

        const profileUrl = new URL(profileInfo.file, baseUrl).href;
        const profileResponse = await fetch(profileUrl);
        if (!profileResponse.ok) {
          throw new Error(
            `Failed to load ICC profile ${profileInfo.file}: ${profileResponse.statusText}`
          );
        }
        profileBlob = await profileResponse.blob();
      }

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
