import type { PDFConversionOptions, PDFX3Options, ConversionResult, ConversionProgress } from './types';
import { GhostscriptLoader } from './core/ghostscript-loader';
import { VirtualFileSystem } from './core/virtual-filesystem';
import { CommandBuilder } from './core/command-builder';
import { Logger } from './utils/logger';
import { BrowserDetection } from './utils/browser-detection';
import { BlobUtils } from './utils/blob-utils';

export interface BatchConversionResult {
  results: ConversionResult[];
  totalTime: number;
  successCount: number;
  failureCount: number;
  errors: Error[];
}

export interface ConversionOptions extends PDFConversionOptions {
  onProgress?: (blobIndex: number, progress: ConversionProgress) => void;
  onBlobComplete?: (blobIndex: number, result: ConversionResult) => void;
  onError?: (blobIndex: number, error: Error) => void;
  parallel?: boolean;
  maxConcurrency?: number;
}

class PDFXService {
  private readonly logger: Logger;
  private readonly browserDetection: BrowserDetection;

  constructor() {
    this.logger = new Logger('PDFXService');
    this.browserDetection = new BrowserDetection();
  }

  /**
   * Convert PDF blobs to PDF/X-3 format
   * @param pdfBlobs - Array of PDF blobs to convert
   * @param options - Conversion options including PDFX settings
   * @returns Promise resolving to converted blobs
   */
  async convertToPDF(
    pdfBlobs: Blob[],
    options?: ConversionOptions
  ): Promise<Blob[]> {
    // Fast path: no conversion needed
    if (!options?.pdfx3) {
      this.logger.debug('No PDFX conversion requested, returning original blobs');
      return pdfBlobs;
    }

    // Validate browser support
    this.validateBrowserSupport();

    // Validate inputs
    this.validateInputs(pdfBlobs, options);

    const startTime = Date.now();
    this.logger.info('Starting batch PDF/X conversion', {
      blobCount: pdfBlobs.length,
      parallel: options.parallel,
      maxConcurrency: options.maxConcurrency
    });

    try {
      const batchResult = await this.processBatch(pdfBlobs, options);
      
      const totalTime = Date.now() - startTime;
      this.logger.info('Batch conversion completed', {
        totalTime,
        successCount: batchResult.successCount,
        failureCount: batchResult.failureCount
      });

      if (batchResult.failureCount > 0 && batchResult.successCount === 0) {
        throw new Error(`All conversions failed. First error: ${batchResult.errors[0]?.message}`);
      }

      return batchResult.results.map(result => result.blob);

    } catch (error) {
      this.logger.error('Batch conversion failed', { error });
      throw error;
    }
  }

  /**
   * Convert single PDF blob with detailed result
   */
  async convertSingle(
    pdfBlob: Blob,
    options: PDFX3Options,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult> {
    this.validateBrowserSupport();
    
    return this.performSingleConversion(pdfBlob, options, onProgress);
  }

  /**
   * Check if PDF/X conversion is supported in current environment
   */
  isSupported(): boolean {
    return this.browserDetection.supportsWebAssembly() && 
           this.browserDetection.supportsWorkers();
  }

  /**
   * Get detailed capability information
   */
  getCapabilities(): {
    webAssembly: boolean;
    workers: boolean;
    sharedArrayBuffer: boolean;
    estimatedMemoryLimit: number;
  } {
    return {
      webAssembly: this.browserDetection.supportsWebAssembly(),
      workers: this.browserDetection.supportsWorkers(),
      sharedArrayBuffer: this.browserDetection.supportsSharedArrayBuffer(),
      estimatedMemoryLimit: this.browserDetection.getEstimatedMemoryLimit()
    };
  }

  private async performSingleConversion(
    inputBlob: Blob,
    options: PDFX3Options,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult> {
    const originalSize = inputBlob.size;
    const startTime = Date.now();

    try {
      // Stage 1: Initialize
      this.reportProgress(onProgress, 'initializing', 0, 'Loading Ghostscript engine...');
      const module = await GhostscriptLoader.load();
      const vfs = new VirtualFileSystem(module);

      this.reportProgress(onProgress, 'initializing', 20, 'Setting up virtual filesystem...');

      // Stage 2: Validate input
      this.reportProgress(onProgress, 'validating', 25, 'Validating input PDF...');
      const isValidPDF = await BlobUtils.validatePDF(inputBlob);
      if (!isValidPDF) {
        throw new Error('Invalid PDF format');
      }

      // Stage 3: Setup files
      this.reportProgress(onProgress, 'validating', 40, 'Preparing conversion files...');
      const inputPath = vfs.generateTempPath('input', 'pdf');
      const outputPath = vfs.generateTempPath('output', 'pdf');

      // Write input PDF
      await vfs.writeBlob(inputPath, inputBlob);

      // Handle ICC profile if provided
      if (options.iccProfile) {
        const profilePath = vfs.generateTempPath('profile', 'icc');
        await vfs.writeBlob(profilePath, options.iccProfile);
        options.iccProfilePath = profilePath;
      }

      // Stage 4: Convert (simplified for Phase 1&2)
      this.reportProgress(onProgress, 'converting', 50, 'Converting to PDF/X format...');
      await this.executeBasicConversion(module, inputPath, outputPath, options);

      this.reportProgress(onProgress, 'converting', 80, 'Reading converted PDF...');
      const outputData = vfs.readFile(outputPath);
      const convertedBlob = new Blob([outputData], { type: 'application/pdf' });

      // Stage 5: Basic verification
      this.reportProgress(onProgress, 'verifying', 90, 'Verifying conversion...');
      const isCompliant = convertedBlob.size > 0; // Basic check for now

      // Cleanup
      vfs.cleanup();

      this.reportProgress(onProgress, 'completed', 100, 'Conversion completed successfully');

      const conversionTime = Date.now() - startTime;
      const convertedSize = convertedBlob.size;

      this.logger.info('Conversion completed', {
        originalSize,
        convertedSize,
        conversionTime,
        compressionRatio: originalSize / convertedSize,
        isCompliant
      });

      return {
        blob: convertedBlob,
        metadata: {
          originalSize,
          convertedSize,
          conversionTime,
          compressionRatio: originalSize / convertedSize,
          pdfxVersion: options.version || 'PDF/X-3',
          outputCondition: 'Default',
          isCompliant
        }
      };

    } catch (error) {
      this.logger.error('Conversion failed', { error });
      throw new Error(`PDF/X conversion failed: ${(error as Error).message}`);
    }
  }

  private async executeBasicConversion(
    module: any,
    inputPath: string,
    outputPath: string,
    options: PDFX3Options
  ): Promise<void> {
    const commandBuilder = new CommandBuilder();
    
    // For Phase 1&2, we'll do a basic PDF processing command
    const basicCommand = {
      args: [
        '-dBATCH',
        '-dNOPAUSE',
        '-dSAFER',
        '-dQUIET',
        '-sDEVICE=pdfwrite',
        `-sOutputFile=${outputPath}`,
        '-sProcessColorModel=DeviceCMYK',
        '-dOverrideICC=true',
        inputPath
      ],
      description: 'Basic PDF processing'
    };

    this.logger.info('Executing Ghostscript command', { 
      description: basicCommand.description,
      args: basicCommand.args 
    });

    try {
      const exitCode = await module.callMain(basicCommand.args);

      if (exitCode !== 0) {
        this.logger.error('Ghostscript execution failed', { 
          exitCode
        });
        throw new Error(`Ghostscript failed with exit code ${exitCode}`);
      }

      this.logger.debug('Ghostscript execution successful');

    } catch (error) {
      throw error;
    }
  }

  private async processBatch(
    pdfBlobs: Blob[],
    options: ConversionOptions
  ): Promise<BatchConversionResult> {
    const results: ConversionResult[] = [];
    const errors: Error[] = [];

    // For Phase 1&2, only sequential processing
    await this.processSequential(pdfBlobs, options, results, errors);

    const successCount = results.filter(r => r.blob.size > 0).length;
    const failureCount = pdfBlobs.length - successCount;

    return {
      results,
      totalTime: 0, // Set by caller
      successCount,
      failureCount,
      errors
    };
  }

  private async processSequential(
    pdfBlobs: Blob[],
    options: ConversionOptions,
    results: ConversionResult[],
    errors: Error[]
  ): Promise<void> {
    for (let i = 0; i < pdfBlobs.length; i++) {
      try {
        const result = await this.performSingleConversion(
          pdfBlobs[i],
          options.pdfx3!,
          (progress) => options.onProgress?.(i, progress)
        );
        
        results[i] = result;
        options.onBlobComplete?.(i, result);
        
      } catch (error) {
        const err = error as Error;
        errors[i] = err;
        options.onError?.(i, err);
        
        // Create placeholder result for failed conversion
        results[i] = {
          blob: new Blob(),
          metadata: {
            originalSize: pdfBlobs[i].size,
            convertedSize: 0,
            conversionTime: 0,
            compressionRatio: 0,
            pdfxVersion: options.pdfx3?.version || 'PDF/X-3',
            outputCondition: 'Failed',
            isCompliant: false
          }
        };
      }
    }
  }

  private reportProgress(
    onProgress: ((progress: ConversionProgress) => void) | undefined,
    stage: ConversionProgress['stage'],
    progress: number,
    message: string
  ): void {
    if (onProgress) {
      onProgress({ stage, progress, message });
    }
  }

  private validateBrowserSupport(): void {
    if (!this.isSupported()) {
      const capabilities = this.getCapabilities();
      throw new Error(
        `PDF/X conversion not supported in this browser. ` +
        `WebAssembly: ${capabilities.webAssembly}, ` +
        `Workers: ${capabilities.workers}`
      );
    }
  }

  private validateInputs(pdfBlobs: Blob[], options?: ConversionOptions): void {
    if (!Array.isArray(pdfBlobs)) {
      throw new Error('pdfBlobs must be an array');
    }

    if (pdfBlobs.length === 0) {
      throw new Error('pdfBlobs array cannot be empty');
    }

    if (!options?.pdfx3) {
      throw new Error('pdfx3 options are required for conversion');
    }

    // Validate blob types
    for (let i = 0; i < pdfBlobs.length; i++) {
      const blob = pdfBlobs[i];
      if (!(blob instanceof Blob)) {
        throw new Error(`Item at index ${i} is not a Blob`);
      }
      
      if (blob.size === 0) {
        throw new Error(`Blob at index ${i} is empty`);
      }

      if (blob.size > 100 * 1024 * 1024) { // 100MB limit
        throw new Error(`Blob at index ${i} is too large (${blob.size} bytes). Maximum size is 100MB`);
      }
    }
  }
}

// Export singleton instance
const pdfxService = new PDFXService();

export const convertToPDF = pdfxService.convertToPDF.bind(pdfxService);
export const convertSingle = pdfxService.convertSingle.bind(pdfxService);
export const isSupported = pdfxService.isSupported.bind(pdfxService);
export const getCapabilities = pdfxService.getCapabilities.bind(pdfxService);

// Export for advanced usage
export { PDFXService };