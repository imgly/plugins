import type { GhostscriptModuleFactory } from './ghostscript';

/**
 * Interface for loading plugin assets (gs.js, gs.wasm, ICC profiles).
 * Implement this interface to customize how assets are loaded in your environment.
 *
 * Built-in implementations:
 * - `BrowserAssetLoader`: For browser environments, loads assets via HTTP
 * - `NodeAssetLoader`: For Node.js environments, loads assets from the filesystem
 *
 * @example Custom loader for CDN
 * ```typescript
 * class CDNAssetLoader implements AssetLoader {
 *   private cdnBase = 'https://cdn.example.com/pdf-plugin/v1.1.2/';
 *
 *   async loadGhostscriptModule() {
 *     const module = await import(this.cdnBase + 'gs.js');
 *     return module.default;
 *   }
 *
 *   getWasmPath() {
 *     return this.cdnBase + 'gs.wasm';
 *   }
 *
 *   async loadICCProfile(name: string) {
 *     const response = await fetch(this.cdnBase + name);
 *     return response.blob();
 *   }
 * }
 * ```
 */
export interface AssetLoader {
  /**
   * Load the Ghostscript JavaScript module.
   * @returns The Ghostscript module factory function
   */
  loadGhostscriptModule(): Promise<GhostscriptModuleFactory>;

  /**
   * Get the URL/path to the WASM file for Emscripten's locateFile callback.
   * @returns URL or path to gs.wasm
   */
  getWasmPath(): string;

  /**
   * Load an ICC profile by name.
   * @param profileName - e.g., 'GRACoL2013_CRPC6.icc'
   * @returns The ICC profile as a Blob
   */
  loadICCProfile(profileName: string): Promise<Blob>;
}
