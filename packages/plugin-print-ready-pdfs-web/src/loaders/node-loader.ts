import type { AssetLoader } from '../types/asset-loader';
import type { GhostscriptModuleFactory } from '../types/ghostscript';

/**
 * Node.js-specific asset loader implementation.
 * Loads assets from the filesystem relative to the module's location.
 *
 * This loader automatically finds assets relative to the built module,
 * so no configuration is needed in Node.js environments.
 *
 * @example
 * ```typescript
 * // In Node.js, the loader is used automatically when no assetPath is provided
 * const result = await convertToPDFX3(pdfBlob, {
 *   outputProfile: 'fogra39'
 * });
 *
 * // Or explicitly:
 * const loader = new NodeAssetLoader();
 * const result = await convertToPDFX3(pdfBlob, {
 *   outputProfile: 'fogra39',
 *   assetLoader: loader
 * });
 * ```
 */
export class NodeAssetLoader implements AssetLoader {
  private moduleDir: string | null = null;
  private gsPath: string | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Initialization is deferred to first use because we need async imports
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    // Dynamic imports for Node.js built-in modules
    // These use /* webpackIgnore: true */ comments to prevent bundlers from processing them
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const moduleLib: any = await import(/* webpackIgnore: true */ 'module');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pathLib: any = await import(/* webpackIgnore: true */ 'path');

    const createRequire = moduleLib.createRequire || moduleLib.default?.createRequire;
    const requireForESM = createRequire(import.meta.url);
    // gs.js is copied to dist/ alongside the bundle
    this.gsPath = requireForESM.resolve('./gs.js');

    const dirname = pathLib.dirname || pathLib.default?.dirname;
    this.moduleDir = dirname(this.gsPath);
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
      this.initPromise = null;
    }
  }

  async loadGhostscriptModule(): Promise<GhostscriptModuleFactory> {
    await this.ensureInitialized();
    // Dynamic import for ESM compatibility
    const module = await import(this.gsPath!);
    return module.default || module;
  }

  getWasmPath(): string {
    // This method is synchronous but we need moduleDir to be initialized
    // The design ensures this is only called after loadGhostscriptModule
    if (!this.moduleDir) {
      throw new Error('NodeAssetLoader not initialized. Call loadGhostscriptModule first.');
    }
    // Use dynamic import result cached in moduleDir
    return `${this.moduleDir}/gs.wasm`;
  }

  async loadICCProfile(profileName: string): Promise<Blob> {
    await this.ensureInitialized();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fsLib: any = await import(/* webpackIgnore: true */ 'fs');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pathLib: any = await import(/* webpackIgnore: true */ 'path');

    const join = pathLib.join || pathLib.default?.join;
    const readFileSync = fsLib.readFileSync || fsLib.default?.readFileSync;

    const profilePath = join(this.moduleDir!, profileName);
    const data = readFileSync(profilePath);
    return new Blob([data], { type: 'application/vnd.iccprofile' });
  }
}
