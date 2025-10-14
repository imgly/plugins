import { Logger } from '../utils/logger';

export interface GhostscriptCommand {
  args: string[];
  description: string;
}

export class CommandBuilder {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger('CommandBuilder');
  }

  buildPDFXConversionCommand(
    inputPath: string,
    outputPath: string,
    pdfxDefPath: string,
    iccProfilePath?: string
  ): GhostscriptCommand {
    const args: string[] = [
      // Basic Ghostscript options
      '-dBATCH',
      '-dNOPAUSE',
      '-dSAFER',
      '-dNOCACHE',

      // Output device
      '-sDEVICE=pdfwrite',
      `-sOutputFile=${outputPath}`,

      // Color management - simplified for CMYK
      '-sColorConversionStrategy=CMYK',
      '-dProcessColorModel=/DeviceCMYK',
      '-dOverrideICC=true',
      '-dPDFSETTINGS=/prepress',
      '-dCompatibilityLevel=1.4',

      // PDF/X compliance
      '-dPDFX',
      '-dEmbedAllFonts=true',
      '-dSubsetFonts=true',
      '-dAutoRotatePages=/None',
      '-dDownsampleColorImages=false',
      '-dDownsampleGrayImages=false',
      '-dDownsampleMonoImages=false',
    ];

    // Add ICC profile if provided
    if (iccProfilePath) {
      args.push(`-sOutputICCProfile=${iccProfilePath}`);
    }

    // Input files (order matters!)
    args.push(pdfxDefPath, inputPath);

    const description = 'Converting to PDF/X-3 with CMYK color space';

    this.logger.debug('Built conversion command', { args, description });

    return { args, description };
  }

  buildInfoCommand(): GhostscriptCommand {
    return {
      args: ['--version'],
      description: 'Get Ghostscript version information',
    };
  }
}
