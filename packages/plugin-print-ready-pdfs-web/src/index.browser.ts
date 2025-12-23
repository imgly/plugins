/**
 * @imgly/plugin-pdfx-web - Print-Ready PDF conversion for CE.SDK
 * Browser-specific entry point
 *
 * This entry point is optimized for browser environments:
 * - No Node.js-specific code included
 * - CSP-safe (no new Function() or eval())
 * - Uses standard dynamic import() for loading gs.js
 *
 * IMPORTANT: This package includes Ghostscript WASM binaries licensed under AGPL-3.0.
 * Commercial users must ensure license compliance. See README.md for details.
 */

// Export the main conversion function
export { convertToPDFX3 } from './pdfx';

// Export BrowserAssetLoader for browser environments
export { BrowserAssetLoader } from './loaders/browser-loader';

// Export Logger for controlling log verbosity
export { Logger } from './utils/logger';

// Export types for TypeScript users
export type { PDFX3Options, AssetLoader } from './types';
export type { LogLevel } from './utils/logger';
