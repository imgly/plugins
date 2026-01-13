import type { AssetLoader } from '../types/asset-loader';
import type { GhostscriptModuleFactory } from '../types/ghostscript';
import { normalizeAssetPath } from '../utils/asset-path';

/**
 * Browser-specific asset loader implementation.
 * Loads assets via HTTP fetch and dynamic import.
 *
 * @example
 * ```typescript
 * const loader = new BrowserAssetLoader('/assets/print-ready-pdfs/');
 * const result = await convertToPDFX3(pdfBlob, {
 *   outputProfile: 'fogra39',
 *   assetLoader: loader
 * });
 * ```
 */
export class BrowserAssetLoader implements AssetLoader {
  private baseUrl: string;

  /**
   * Create a new BrowserAssetLoader.
   * @param assetPath - Base URL path where plugin assets are served from.
   *                    Must be an absolute path (e.g., '/assets/') or full URL.
   */
  constructor(assetPath: string) {
    this.baseUrl = normalizeAssetPath(assetPath);
  }

  async loadGhostscriptModule(): Promise<GhostscriptModuleFactory> {
    const moduleUrl = new URL('gs.js', this.baseUrl).href;
    // webpackIgnore comment prevents Webpack from trying to bundle this dynamic import
    // The URL is determined at runtime based on assetPath configuration
    const module = await import(/* webpackIgnore: true */ moduleUrl);
    return module.default || module;
  }

  getWasmPath(): string {
    return new URL('gs.wasm', this.baseUrl).href;
  }

  async loadICCProfile(profileName: string): Promise<Blob> {
    const profileUrl = new URL(profileName, this.baseUrl).href;
    const response = await fetch(profileUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to load ICC profile ${profileName}: ${response.status} ${response.statusText}`
      );
    }
    return response.blob();
  }
}
