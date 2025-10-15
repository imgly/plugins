import type { PDFX3Options } from './types/pdfx';
import { GhostscriptLoader } from './core/ghostscript-loader';
import { VirtualFileSystem } from './core/virtual-filesystem';
import { BlobUtils } from './utils/blob-utils';

/**
 * PDF/X-3 conversion function
 * Converts a single RGB PDF to PDF/X-3 format using specified output profile
 */
export async function convertToPDFX3(
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

  // Load Ghostscript
  const module = await GhostscriptLoader.load();
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
      const isNode =
        typeof process !== 'undefined' && process.versions?.node != null;

      let profileBlob: Blob;

      if (isNode) {
        // Node.js: Load from filesystem using readFileSync
        const { readFileSync } = await import('fs');
        const { fileURLToPath } = await import('url');
        const { dirname, join } = await import('path');

        // Get the directory of the built module
        const moduleDir = dirname(fileURLToPath(import.meta.url));
        const profileFilePath = join(moduleDir, profileInfo.file);

        const profileData = readFileSync(profileFilePath);
        profileBlob = new Blob([profileData], {
          type: 'application/vnd.iccprofile',
        });
      } else {
        // Browser: Use fetch
        const profileUrl = new URL(profileInfo.file, import.meta.url).href;
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
