import type { EmscriptenModule } from '../types/ghostscript';
import { Logger } from '../utils/logger';
import { BrowserDetection } from '../utils/browser-detection';
import createGhostscriptModule from '../wasm/ghostscript-module';

export interface LoaderOptions {
  timeout?: number;
  /**
   * Base URL path where plugin assets (gs.js, gs.wasm) are served from.
   * Required for bundled environments (Webpack 5, Angular).
   * For Vite and native ESM, this is optional.
   */
  assetPath?: string;
}

export class GhostscriptLoader {
  private static instance: Promise<EmscriptenModule> | null = null;
  private static loadedAssetPath: string | undefined = undefined;

  private static readonly TIMEOUT_MS = 30000;

  static async load(options: LoaderOptions = {}): Promise<EmscriptenModule> {
    // If already loaded with a different assetPath, we can't change it
    // (the WASM module is already initialized)
    // This is fine because within an app, assetPath should be consistent
    if (this.instance) {
      return this.instance;
    }

    this.loadedAssetPath = options.assetPath;
    this.instance = this.loadInternal(options);
    return this.instance;
  }

  private static async loadInternal(
    options: LoaderOptions
  ): Promise<EmscriptenModule> {
    const logger = new Logger('GhostscriptLoader');
    const browser = new BrowserDetection();

    // Check browser compatibility
    if (!browser.supportsWebAssembly()) {
      throw new Error('WebAssembly not supported in this browser');
    }

    const timeout = options.timeout || this.TIMEOUT_MS;

    try {
      logger.info('Loading bundled Ghostscript (AGPL-3.0 licensed)');
      logger.info('Source available at: https://github.com/imgly/plugins');
      return await this.loadWithTimeout(
        () => this.loadFromBundle(options.assetPath),
        timeout
      );
    } catch (error) {
      logger.error('Ghostscript loading failed', {
        error: (error as Error).message,
      });
      throw new Error(
        `Failed to load Ghostscript: ${(error as Error).message}`
      );
    }
  }

  private static async loadFromBundle(
    assetPath?: string
  ): Promise<EmscriptenModule> {
    // Use the bundled WASM module with proper configuration
    const logger = new Logger('GhostscriptInit');

    try {
      logger.info('Initializing Ghostscript module');

      const module = await createGhostscriptModule({ assetPath });

      logger.info('Ghostscript module initialized successfully', {
        version: module.version || 'unknown',
        hasFS: !!module.FS,
        hasCallMain: !!module.callMain,
      });

      return module;
    } catch (error) {
      logger.error('Ghostscript initialization failed', { error });
      throw new Error(
        `Ghostscript initialization failed: ${(error as Error).message}`
      );
    }
  }

  private static async loadWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Loading timeout after ${timeoutMs}ms`)),
          timeoutMs
        );
      }),
    ]);
  }

  static reset(): void {
    this.instance = null;
    this.loadedAssetPath = undefined;
  }
}
