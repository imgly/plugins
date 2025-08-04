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
  options: ConversionOptions & { profileName?: string }
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

  // ICC profile is now optional
  if (options.iccProfile && !(options.iccProfile instanceof Blob)) {
    throw new Error('If provided, ICC profile must be a Blob');
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
    
    // Only write ICC profile if provided
    if (options.iccProfile) {
      await vfs.writeBlob(profilePath, options.iccProfile);
    }

    // Create PDF/X-3 definition
    const useICCProfile = options.iccProfile && options.iccProfile.size > 1000; // Only use real ICC profiles
    const pdfxDefinition = createPDFXDefinition(
      useICCProfile ? profilePath : null,
      options.profileName
    );
    vfs.writeText(pdfxDefPath, pdfxDefinition);

    // Execute Ghostscript conversion
    const gsArgs = [
      '-dSAFER',
    ];
    
    // Only add ICC profile options if provided
    if (options.iccProfile) {
      gsArgs.push(
        `--permit-file-read=${profilePath}`,
        `-sOutputICCProfile=${profilePath}`
      );
    }
    
    // Add override ICC option if specified
    if (options.overrideICC !== false) {
      gsArgs.push('-dOverrideICC');
    }
    
    // Color conversion strategy
    const colorStrategy = options.colorConversionStrategy || 'CMYK';
    gsArgs.push(`-sColorConversionStrategy=${colorStrategy}`);
    
    // Process color model
    if (colorStrategy === 'CMYK') {
      gsArgs.push('-dProcessColorModel=/DeviceCMYK');
    }
    
    // Rendering intent
    if (options.renderingIntent && options.renderingIntent !== 'Default') {
      const intentMap: Record<string, number> = {
        'Perceptual': 0,
        'RelativeColorimetric': 1,
        'Saturation': 2,
        'AbsoluteColorimetric': 3
      };
      if (intentMap[options.renderingIntent] !== undefined) {
        gsArgs.push(`-dRenderIntent=${intentMap[options.renderingIntent]}`);
      }
    }
    
    // Black generation
    if (options.blackGeneration && options.blackGeneration !== 'Default') {
      gsArgs.push(`-sBlackGeneration=${options.blackGeneration}`);
    }
    
    // Under color removal
    if (options.underColorRemoval && options.underColorRemoval !== 'Default') {
      gsArgs.push(`-sUnderColorRemoval=${options.underColorRemoval}`);
    }
    
    // Transfer function
    if (options.transferFunction && options.transferFunction !== 'Default') {
      gsArgs.push(`-sTransferFunctionInfo=/${options.transferFunction}`);
    }
    
    // Preserve black
    if (options.preserveBlack) {
      gsArgs.push('-dPreserveBlack=true');
    }
    
    // Preserve overprint
    if (options.preserveOverprint !== false) {
      gsArgs.push('-dPreserveOverprint=true');
    }
    
    gsArgs.push(
      '-dBATCH',
      '-dNOPAUSE',
      '-dNOCACHE',
      '-sDEVICE=pdfwrite',
      '-dPreserveSpotColors=true',
      '-dConvertCMYKImagesToRGB=false',
      '-dPDFSETTINGS=/prepress',
      '-dCompatibilityLevel=1.4',
      '-dPDFX',
      '-dEmbedAllFonts=true',
      '-dSubsetFonts=true',
      '-dAutoRotatePages=/None',
      '-dDownsampleColorImages=false',
      '-dDownsampleGrayImages=false',
      '-dDownsampleMonoImages=false',
      `-sOutputFile=${outputPath}`,
      pdfxDefPath,
      inputPath
    );

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

// Map ICC profile names to their standard output condition identifiers
const ICC_PROFILE_MAPPINGS: Record<string, { identifier: string; info: string }> = {
  'PSOcoated_v3.icc': {
    identifier: 'Coated FOGRA39',
    info: 'Coated FOGRA39 (ISO 12647-2:2004)'
  },
  'PSOuncoated_v3_FOGRA52.icc': {
    identifier: 'Uncoated FOGRA52',
    info: 'Uncoated FOGRA52 (ISO 12647-2:2013)'
  },
  'SWOP2006_Coated3v2.icc': {
    identifier: 'SWOP2006_Coated3v2',
    info: 'SWOP2006 Coated #3 v2'
  },
  'USWebCoatedSWOP.icc': {
    identifier: 'US Web Coated (SWOP) v2',
    info: 'US Web Coated (SWOP) v2'
  },
  'ISOcoated_v2_300_eci.icc': {
    identifier: 'ISO Coated v2 300% (ECI)',
    info: 'ISO Coated v2 300% (ECI)'
  },
  'JapanColor2001Coated.icc': {
    identifier: 'Japan Color 2001 Coated',
    info: 'Japan Color 2001 Coated'
  }
};

function createPDFXDefinition(profilePath: string | null, profileName?: string): string {
  if (profilePath) {
    // Determine output condition based on ICC profile name
    let outputCondition = {
      identifier: 'Custom ICC Profile',
      info: 'Custom ICC Profile'
    };
    
    if (profileName) {
      const mapping = ICC_PROFILE_MAPPINGS[profileName];
      if (mapping) {
        outputCondition = mapping;
      }
    }
    
    // With ICC profile
    return `%!
% PDF/X-3:2002 definition file
[ /GTS_PDFXVersion (PDF/X-3:2002)
  /Title (RGB to CMYK Converted Document)
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
  /OutputConditionIdentifier (${outputCondition.identifier})
  /DestOutputProfile {icc_PDFX}
  /Info (${outputCondition.info})
  /RegistryName (http://www.color.org)
>> /PUT pdfmark

[{Catalog} <</OutputIntents [{OutputIntent_PDFX}]>> /PUT pdfmark
`;
  } else {
    // Without ICC profile - basic PDF/X-3 compliance
    return `%!
% PDF/X-3:2002 definition file (basic CMYK conversion)
[ /GTS_PDFXVersion (PDF/X-3:2002)
  /Title (RGB to CMYK Converted Document)
  /Trapped /False
  /DOCINFO pdfmark

[/_objdef {OutputIntent_PDFX} /type /dict /OBJ pdfmark
[{OutputIntent_PDFX} <<
  /Type /OutputIntent
  /S /GTS_PDFX
  /OutputConditionIdentifier (Default CMYK)
  /Info (Default CMYK Conversion)
>> /PUT pdfmark

[{Catalog} <</OutputIntents [{OutputIntent_PDFX}]>> /PUT pdfmark
`;
  }
}

// Export for compatibility with CE.SDK
export async function convertToPDF(
  pdfBlobs: Blob[],
  options?: ConversionOptions
): Promise<Blob[]> {
  // If no options provided, return original blobs
  if (!options) {
    return pdfBlobs;
  }

  // Convert all blobs concurrently
  const results = await Promise.all(
    pdfBlobs.map((blob) => convertToPDFX3(blob, options))
  );

  return results;
}
