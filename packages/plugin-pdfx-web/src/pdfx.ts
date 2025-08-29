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

  // Validate output profile
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

    // Write custom profile if provided
    if (options.outputProfile === 'custom' && options.customProfile) {
      await vfs.writeBlob(customProfilePath, options.customProfile);
    }

    // Generate PDF/X-3 definition based on output profile
    const pdfxDefinition = generatePDFXDef(options, customProfilePath);
    vfs.writeText(pdfxDefPath, pdfxDefinition);

    // Execute Ghostscript conversion with minimal configuration
    const gsArgs = [
      '-dPDFX',
      '-dBATCH', 
      '-dNOPAUSE',
      '-dNOOUTERSAVE',
      '-sDEVICE=pdfwrite',
      '-sColorConversionStrategy=UseDeviceIndependentColor',
      '-dProcessColorModel=/DeviceCMYK',
      '-sPDFXSetBleedBoxToMediaBox=true',
      '-dUseCIEColor',
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
    const outputPDF = new Blob([outputData], { type: 'application/pdf' });

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

function generatePDFXDef(options: PDFX3Options, customProfilePath?: string): string {
  const profile = options.outputProfile === 'custom' 
    ? { 
        file: customProfilePath!,
        identifier: 'Custom Profile',
        info: 'Custom ICC Profile'
      }
    : PROFILE_PRESETS[options.outputProfile];

  return `%!
/ICCProfile (${profile.file}) def
[
  /Title (${options.title || 'Untitled'})
  /DOCINFO pdfmark
[
  /GTS_PDFXVersion (PDF/X-3:2003)
  /GTS_PDFXConformance (PDF/X-3:2003)
  /DOCINFO pdfmark
[
  /OutputIntents <<
    /Type /OutputIntent
    /S /GTS_PDFX
    /DestOutputProfile ICCProfile
    /OutputConditionIdentifier (${profile.identifier})
    /Info (${profile.info})
    /RegistryName (http://www.color.org)
  >>
  /PUT pdfmark`;
}

