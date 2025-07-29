import type { PDFX3Options, RenderingIntent, PDFXVersion } from '../types/pdfx';
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
    options: PDFX3Options
  ): GhostscriptCommand {
    const args: string[] = [
      // Basic Ghostscript options
      '-dBATCH',
      '-dNOPAUSE',
      '-dSAFER',
      '-dQUIET',
      '-dNOOUTERSAVE',
      
      // PDF/X specific options
      '-dPDFX',
      '-dPDFXSetBleedBoxToMediaBox',
      
      // Output device
      '-sDEVICE=pdfwrite',
      `-sOutputFile=${outputPath}`,
      
      // Color management
      ...this.buildColorManagementArgs(options),
      
      // PDF/X version specific args
      ...this.buildPDFXVersionArgs(options.version || 'PDF/X-3'),
      
      // Quality settings
      '-dDetectDuplicateImages=true',
      '-dCompressFonts=true',
      '-dOptimize=true',
      
      // Input files (order matters!)
      pdfxDefPath,  // PDFX definition must come first
      inputPath
    ];

    const description = `Converting to ${options.version || 'PDF/X-3'} with ${options.colorSpace || 'CMYK'} color space`;
    
    this.logger.debug('Built conversion command', { args, description });
    
    return { args, description };
  }

  private buildColorManagementArgs(options: PDFX3Options): string[] {
    const args: string[] = [];
    
    // Color space conversion
    if (options.colorSpace === 'CMYK' || !options.colorSpace) {
      args.push('-sProcessColorModel=DeviceCMYK');
      args.push('-sColorConversionStrategy=CMYK');
      args.push('-dOverrideICC=true');
    } else if (options.colorSpace === 'RGB') {
      args.push('-sProcessColorModel=DeviceRGB');
      args.push('-sColorConversionStrategy=RGB');
    }

    // ICC Profile
    if (options.iccProfilePath) {
      args.push(`-sOutputICCProfile=${options.iccProfilePath}`);
    }

    // Rendering intent
    const intent = this.mapRenderingIntent(options.renderingIntent);
    args.push(`-dRenderIntent=${intent}`);

    // Black preservation (CMYK only)
    if (options.colorSpace === 'CMYK' || !options.colorSpace) {
      const preserveBlack = options.preserveBlack ? 1 : 0;
      args.push(`-dKPreserve=${preserveBlack}`);
    }

    // Overprint control
    if (options.preserveOverprint !== false) {
      args.push('-dPreserveOverprintSettings=true');
    }

    return args;
  }

  private buildPDFXVersionArgs(version: PDFXVersion): string[] {
    const args: string[] = [];
    
    switch (version) {
      case 'PDF/X-1a':
        args.push('-dPDFX1a');
        break;
      case 'PDF/X-3':
        // Default behavior, no special flags needed
        break;
      case 'PDF/X-4':
        args.push('-dPDFX4');
        args.push('-dPreserveTransparency=true');
        break;
      default:
        this.logger.warn('Unknown PDF/X version', { version });
    }
    
    return args;
  }

  private mapRenderingIntent(intent?: RenderingIntent): number {
    const intentMap: Record<RenderingIntent, number> = {
      'perceptual': 0,
      'relative-colorimetric': 1,
      'saturation': 2,
      'absolute-colorimetric': 3
    };
    
    return intentMap[intent || 'perceptual'];
  }

  buildInfoCommand(): GhostscriptCommand {
    return {
      args: ['-dBATCH', '-dNOPAUSE', '-dQUIET', '--version'],
      description: 'Getting Ghostscript version info'
    };
  }
}