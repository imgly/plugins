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
    throw new Error('outputProfile is required. Must be one of: "gracol", "fogra39", "srgb", "custom"');
  }

  // Validate output profile value
  const validProfiles = ['gracol', 'fogra39', 'srgb', 'custom'];
  if (!validProfiles.includes(options.outputProfile)) {
    throw new Error(`Invalid outputProfile "${options.outputProfile}". Must be one of: ${validProfiles.join(', ')}`);
  }

  // Validate custom profile requirement
  if (options.outputProfile === 'custom' && !options.customProfile) {
    throw new Error('customProfile Blob is required when outputProfile is "custom"');
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
      const profileInfo = PROFILE_PRESETS[options.outputProfile as keyof typeof PROFILE_PRESETS];
      const profilePath = `/tmp/${profileInfo.file}`;

      // Import and load the actual ICC profile from assets
      const profileModule = await import(`../assets/icc-profiles/${profileInfo.file}?url`);
      const profileResponse = await fetch(profileModule.default);
      const profileBlob = await profileResponse.blob();

      await vfs.writeBlob(profilePath, profileBlob);
    }

    // Generate PDF/X-3 definition based on output profile
    const pdfxDefinition = generatePDFXDef(options);
    vfs.writeText(pdfxDefPath, pdfxDefinition);

    // Determine ICC profile path for Ghostscript
    const profileInfo = options.outputProfile === 'custom'
      ? null
      : PROFILE_PRESETS[options.outputProfile as keyof typeof PROFILE_PRESETS];
    const iccProfilePath = options.outputProfile === 'custom'
      ? customProfilePath
      : `/tmp/${profileInfo!.file}`;

    // Execute Ghostscript conversion
    const gsArgs = [
      '-dPDFX',
      '-dBATCH',
      '-dNOPAUSE',
      '-dNOOUTERSAVE',
      '-sDEVICE=pdfwrite',
      '-dPrinted=false',
      '-dPreserveDeviceN=true',
      '-dCompatibilityLevel=1.4',
      '-sColorConversionStrategy=CMYK',
      '-dProcessColorModel=/DeviceCMYK',
      '-dConvertCMYKImagesToRGB=false',
      `-sOutputICCProfile=${iccProfilePath}`,
      '-sPDFXSetBleedBoxToMediaBox=true',
      `-sOutputFile=${outputPath}`,
      pdfxDefPath,
      inputPath
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
  'gracol': {
    file: 'GRACoL2013_CRPC6.icc',
    identifier: 'CGATS 21.2',
    info: 'GRACoL 2013 CRPC6'
  },
  'fogra39': {
    file: 'ISOcoated_v2_eci.icc',
    identifier: 'FOGRA39',
    info: 'ISO Coated v2 (ECI)'
  },
  'srgb': {
    file: 'sRGB_IEC61966-2-1.icc',
    identifier: 'sRGB IEC61966-2.1',
    info: 'sRGB IEC61966-2.1'
  }
};

function generatePDFXDef(options: PDFX3Options): string {
  // Generate PDF/X-3 definition with proper output intent for spot colors
  const profileInfo = options.outputProfile === 'custom'
    ? { identifier: 'Custom Profile', info: 'Custom ICC Profile' }
    : PROFILE_PRESETS[options.outputProfile as keyof typeof PROFILE_PRESETS];

  return `%!
% PDF/X-3 Definition File
[ /Title (${options.title || 'Untitled'}) /DOCINFO pdfmark
[ /Trapped /Unknown /DOCINFO pdfmark

% Set PDF/X-3 conformance
[ /GTS_PDFXVersion (PDF/X-3:2003) /GTS_PDFXConformance (PDF/X-3:2003) /DOCINFO pdfmark

% Define output intent for proper color management
% This is crucial for spot color preservation
[ /OutputIntent <<
  /Type /OutputIntent
  /S /GTS_PDFX
  /OutputCondition (${profileInfo.info})
  /OutputConditionIdentifier (${profileInfo.identifier})
  /RegistryName (http://www.color.org)
>> /PUT pdfmark`;
}

