import type { AssetLoader } from './asset-loader';

export interface PDFX3Options {
  // Required
  outputProfile: 'gracol' | 'fogra39' | 'srgb' | 'custom';
  customProfile?: Blob; // Only if outputProfile is 'custom'

  // Optional (with sensible defaults)
  title?: string; // Document title (default: use existing)
  outputConditionIdentifier?: string; // OutputIntent identifier (e.g., "FOGRA39")
  outputCondition?: string; // Human-readable condition description
  flattenTransparency?: boolean; // Force transparency flattening (default: true for PDF/X-3 compliance)

  /**
   * Asset loader instance for loading plugin assets.
   *
   * If not provided:
   * - Browser: Must provide `assetPath` instead
   * - Node.js: Uses NodeAssetLoader automatically
   *
   * Provide a custom AssetLoader implementation for advanced scenarios
   * like loading assets from a CDN, custom storage, or service worker cache.
   *
   * @example
   * ```typescript
   * const loader = new BrowserAssetLoader('/assets/');
   * const result = await convertToPDFX3(blob, {
   *   outputProfile: 'fogra39',
   *   assetLoader: loader
   * });
   * ```
   */
  assetLoader?: AssetLoader;

  /**
   * Base URL path where plugin assets (gs.js, gs.wasm, *.icc) are served from.
   * Shorthand for creating a BrowserAssetLoader.
   *
   * Required in browser environments unless `assetLoader` is provided.
   * Ignored in Node.js environments.
   *
   * @example '/assets/print-ready-pdfs/'
   * @example 'https://cdn.example.com/libs/print-ready-pdfs/'
   */
  assetPath?: string;
}
