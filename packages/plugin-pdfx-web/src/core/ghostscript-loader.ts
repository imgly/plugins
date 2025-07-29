import type { EmscriptenModule, GhostscriptModuleFactory } from '../types/ghostscript';
import { Logger } from '../utils/logger';
import { BrowserDetection } from '../utils/browser-detection';

export interface LoaderOptions {
  cdnUrl?: string;
  allowCdnFallback?: boolean;
  timeout?: number;
}

export class GhostscriptLoader {
  private static instance: Promise<EmscriptenModule> | null = null;
  private static readonly DEFAULT_CDN = 'https://cdn.jsdelivr.net/npm/@privyid/ghostscript@0.1.0-alpha.1';
  private static readonly TIMEOUT_MS = 30000;

  static async load(options: LoaderOptions = {}): Promise<EmscriptenModule> {
    if (this.instance) {
      return this.instance;
    }

    this.instance = this.loadInternal(options);
    return this.instance;
  }

  private static async loadInternal(options: LoaderOptions): Promise<EmscriptenModule> {
    const logger = new Logger('GhostscriptLoader');
    const browser = new BrowserDetection();

    // Check browser compatibility
    if (!browser.supportsWebAssembly()) {
      throw new Error('WebAssembly not supported in this browser');
    }

    const timeout = options.timeout || this.TIMEOUT_MS;

    // Strategy 1: Try bundled version first (preferred for production)
    try {
      logger.info('Attempting to load bundled Ghostscript (AGPL-3.0 licensed)');
      return await this.loadWithTimeout(
        () => this.loadFromBundle(),
        timeout
      );
    } catch (bundleError) {
      logger.warn('Bundled Ghostscript loading failed', { error: (bundleError as Error).message });

      // Strategy 2: Fallback to CDN for development/testing
      if (options.allowCdnFallback !== false) {
        const cdnUrl = options.cdnUrl || this.DEFAULT_CDN;
        try {
          logger.info('Falling back to CDN Ghostscript for development', { cdnUrl });
          return await this.loadWithTimeout(
            () => this.loadFromCDN(cdnUrl),
            timeout
          );
        } catch (cdnError) {
          logger.error('CDN loading failed', { error: (cdnError as Error).message });
          throw new Error(`Failed to load Ghostscript: Bundle (${(bundleError as Error).message}), CDN (${(cdnError as Error).message})`);
        }
      } else {
        throw bundleError;
      }
    }
  }

  private static async loadFromCDN(cdnUrl: string): Promise<EmscriptenModule> {
    // Import from CDN with dynamic import - use correct file name
    const ModuleFactory = await import(/* webpackIgnore: true */ `${cdnUrl}/dist/gs.js`);
    return this.initializeModule(ModuleFactory.default);
  }

  private static async loadFromBundle(): Promise<EmscriptenModule> {
    // Import bundled version
    const ModuleFactory = await import('@privyid/ghostscript');
    return this.initializeModule(ModuleFactory.default);
  }

  private static async initializeModule(ModuleFactory: GhostscriptModuleFactory): Promise<EmscriptenModule> {
    const logger = new Logger('GhostscriptInit');
    
    try {
      logger.info('Initializing Ghostscript module');
      
      // Based on @privyid/ghostscript README, call with no parameters
      const module = await ModuleFactory();
      
      logger.info('Ghostscript module initialized successfully', {
        version: module.version || 'unknown',
        hasFS: !!module.FS,
        hasCallMain: !!module.callMain
      });
      
      return module;
    } catch (error) {
      logger.error('Ghostscript initialization failed', { error });
      throw new Error(`Ghostscript initialization failed: ${(error as Error).message}`);
    }
  }

  private static async loadWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Loading timeout after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  static reset(): void {
    this.instance = null;
  }
}