import type { ConversionOptions } from './types/pdfx';
import { GhostscriptLoader } from './core/ghostscript-loader';
import { VirtualFileSystem } from './core/virtual-filesystem';
import { BlobUtils } from './utils/blob-utils';

/**
 * PDF/X-3 conversion function
 * Converts a single RGB PDF to PDF/X-3 format using provided ICC profile
 */
export async function convertToPDFX3(
  inputPDF: Blob,
  options: ConversionOptions
): Promise<Blob> {
  // Validate inputs
  if (!(inputPDF instanceof Blob)) {
    throw new Error('Input must be a Blob');
  }

  if (inputPDF.size === 0) {
    throw new Error('Input PDF is empty');
  }

  if (inputPDF.size > 100 * 1024 * 1024) {
    throw new Error(`Input PDF too large (${inputPDF.size} bytes). Maximum: 100MB`);
  }

  if (!options.iccProfile || !(options.iccProfile instanceof Blob)) {
    throw new Error('ICC profile must be provided as a Blob');
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
    const profilePath = '/tmp/profile.icc';
    const pdfxDefPath = '/tmp/pdfx_def.ps';

    // Write files to virtual filesystem
    await vfs.writeBlob(inputPath, inputPDF);
    await vfs.writeBlob(profilePath, options.iccProfile);

    // Create PDF/X-3 definition
    const pdfxDefinition = createPDFXDefinition(profilePath);
    vfs.writeText(pdfxDefPath, pdfxDefinition);

    // Execute Ghostscript conversion
    const gsArgs = [
      '-dSAFER',
      '-dBATCH',
      '-dNOPAUSE',
      '-dNOCACHE',
      '-sDEVICE=pdfwrite',
      '-sColorConversionStrategy=CMYK',
      '-dProcessColorModel=/DeviceCMYK',
      '-dOverrideICC=true',
      '-dPDFSETTINGS=/prepress',
      '-dCompatibilityLevel=1.4',
      '-dPDFX',
      '-dEmbedAllFonts=true',
      '-dSubsetFonts=true',
      '-dAutoRotatePages=/None',
      '-dDownsampleColorImages=false',
      '-dDownsampleGrayImages=false',
      '-dDownsampleMonoImages=false',
      `-sOutputICCProfile=${profilePath}`,
      `-sOutputFile=${outputPath}`,
      pdfxDefPath,
      inputPath
    ];

    const exitCode = await module.callMain(gsArgs);
    if (exitCode !== 0) {
      throw new Error(`Ghostscript conversion failed with exit code ${exitCode}`);
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

function createPDFXDefinition(profilePath: string): string {
  return `%!
% PDF/X-3:2002 definition file
[ /GTS_PDFXVersion (PDF/X-3:2002)
  /Title (PDF/X Converted Document)
  /Trapped /False
  /DOCINFO pdfmark

/ICCProfile (${profilePath}) def

[/_objdef {icc_PDFX} /type /stream /OBJ pdfmark
[{icc_PDFX}
  <</N currentpagedevice /ProcessColorModel get /DeviceGray eq {1} {4} ifelse >> /PUT pdfmark
[{icc_PDFX} ICCProfile (r) file /PUT pdfmark

[/_objdef {OutputIntent_PDFX} /type /dict /OBJ pdfmark
[{OutputIntent_PDFX} <<
  /Type /OutputIntent
  /S /GTS_PDFX
  /OutputConditionIdentifier (Custom ICC Profile)
  /DestOutputProfile {icc_PDFX}
  /Info (Custom ICC Profile)
  /RegistryName (http://www.color.org)
>> /PUT pdfmark

[{Catalog} <</OutputIntents [{OutputIntent_PDFX}]>> /PUT pdfmark
`;
}

// Export for compatibility with CE.SDK
export async function convertToPDF(
  pdfBlobs: Blob[],
  options?: ConversionOptions
): Promise<Blob[]> {
  // If no ICC profile provided, return original blobs
  if (!options?.iccProfile) {
    return pdfBlobs;
  }

  // Convert all blobs concurrently
  const results = await Promise.all(
    pdfBlobs.map(blob => convertToPDFX3(blob, options))
  );
  
  return results;
}