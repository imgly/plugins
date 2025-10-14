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
    let profileComponents: number; // Number of color components (3 for RGB, 4 for CMYK)

    if (options.outputProfile === 'custom') {
      iccProfilePath = customProfilePath;
      // Use custom values or defaults
      outputConditionIdentifier =
        options.outputConditionIdentifier || 'Custom Profile';
      outputCondition = options.outputCondition || 'Custom ICC Profile';
      // Assume CMYK for custom profiles (can be extended later)
      profileComponents = 4;
    } else {
      const preset =
        PROFILE_PRESETS[options.outputProfile as keyof typeof PROFILE_PRESETS];
      iccProfilePath = `/tmp/${preset.file}`;
      // Allow overriding preset values
      outputConditionIdentifier =
        options.outputConditionIdentifier || preset.identifier;
      outputCondition = options.outputCondition || preset.info;
      profileComponents = preset.components;
    }

    // Read ICC profile data into memory for embedding
    const iccProfileData = vfs.readFile(iccProfilePath);

    // Generate PDF/X-3 definition with ICC profile data and metadata
    const pdfxDefinition = generatePDFXDef(
      options,
      iccProfileData,
      outputConditionIdentifier,
      outputCondition,
      profileComponents
    );
    vfs.writeText(pdfxDefPath, pdfxDefinition);

    // Determine color conversion strategy based on profile type
    const isRGBProfile = profileComponents === 3;
    const colorModel = isRGBProfile ? '/DeviceRGB' : '/DeviceCMYK';
    const conversionStrategy = isRGBProfile ? '/RGB' : '/CMYK';

    // Execute Ghostscript conversion
    const gsArgs = [
      '-dBATCH',
      '-dNOPAUSE',
      '-dNOOUTERSAVE',
      '-sDEVICE=pdfwrite',
      // PDF/X compatibility
      '-dCompatibilityLevel=1.4',
      '-dPDFX',
      // Font embedding (required for PDF/X)
      '-dEmbedAllFonts=true',
      '-dSubsetFonts=true',
      '-dCompressFonts=true',
      // Preserve content
      '-dPreserveCopyPage=false',
      '-dPreserveAnnots=false',
      // Color handling
      `-dColorConversionStrategy=${conversionStrategy}`,
      `-sDefaultRGBProfile=${iccProfilePath}`,
      `-sDefaultCMYKProfile=${iccProfilePath}`,
      `-sOutputICCProfile=${iccProfilePath}`,
      `-dProcessColorModel=${colorModel}`,
      '-dRenderIntent=1',
      // Preserve images
      '-dPassThroughJPEGImages=true',
      '-dDoThumbnails=false',
      // Preserve spot colors
      '-dPreserveDeviceN=true',
      '-dPreserveSeparation=true',
      '-dPreserveHalftoneInfo=true',
      '-dPreserveOPIComments=true',
      // PDF/X settings
      '-dPDFACompatibilityPolicy=1',
      '-sPDFXSetBleedBoxToMediaBox=true',
      `-sOutputFile=${outputPath}`,
      inputPath,
      pdfxDefPath,
    ];

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
    components: 4, // CMYK
  },
  fogra39: {
    file: 'ISOcoated_v2_eci.icc',
    identifier: 'FOGRA39',
    info: 'ISO Coated v2 (ECI)',
    components: 4, // CMYK
  },
  srgb: {
    file: 'sRGB_IEC61966-2-1.icc',
    identifier: 'sRGB IEC61966-2.1',
    info: 'sRGB IEC61966-2.1',
    components: 3, // RGB
  },
};

function generatePDFXDef(
  options: PDFX3Options,
  iccProfileData: Uint8Array,
  outputConditionIdentifier: string,
  outputCondition: string,
  profileComponents: number
): string {
  // Use provided title or default to "Untitled"
  const title = options.title || 'Untitled';

  // Convert ICC profile data to hex string for embedding
  const hexString = Array.from(iccProfileData)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  // Combine all DOCINFO entries into a single pdfmark to ensure they're processed together
  return `%!
% PDF/X-3 Definition File
% Set all document info in one pdfmark to prevent override
[ /Title (${title})
  /Trapped /False
  /GTS_PDFXVersion (PDF/X-3:2003)
  /DOCINFO pdfmark

% Embed ICC profile as inline hex data
[/_objdef {icc_PDFX} /type /stream /OBJ pdfmark
[{icc_PDFX} <</N ${profileComponents}>> /PUT pdfmark
[{icc_PDFX} <${hexString}> /PUT pdfmark

% Define OutputIntent with embedded ICC profile
[/_objdef {OutputIntent_PDFX} /type /dict /OBJ pdfmark
[{OutputIntent_PDFX} <<
  /Type /OutputIntent
  /S /GTS_PDFX
  /OutputCondition (${outputCondition})
  /OutputConditionIdentifier (${outputConditionIdentifier})
  /DestOutputProfile {icc_PDFX}
>> /PUT pdfmark

% Add OutputIntent to Catalog
[{Catalog} <</OutputIntents [{OutputIntent_PDFX}]>> /PUT pdfmark`;
}
