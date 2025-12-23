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
   * Base URL path where plugin assets (gs.js, gs.wasm, *.icc) are served from.
   *
   * Required for bundled environments (Webpack 5, Angular) where import.meta.url
   * is transformed to a file:// URL that doesn't work in browsers.
   *
   * For Vite and native ESM, this is optional as import.meta.url works correctly.
   *
   * @example '/assets/print-ready-pdfs/'
   * @example 'https://cdn.example.com/libs/print-ready-pdfs/'
   */
  assetPath?: string;
}
