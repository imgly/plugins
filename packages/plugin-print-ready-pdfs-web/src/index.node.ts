/**
 * @imgly/plugin-pdfx-web - Print-Ready PDF conversion for CE.SDK
 * Node.js-specific entry point
 *
 * This entry point is optimized for Node.js environments:
 * - Uses filesystem APIs to load assets
 * - No browser-specific code included
 * - Assets are resolved relative to the module location
 *
 * IMPORTANT: This package includes Ghostscript WASM binaries licensed under AGPL-3.0.
 * Commercial users must ensure license compliance. See README.md for details.
 */

// Export the main conversion function
export { convertToPDFX3 } from './pdfx';

// Export NodeAssetLoader for Node.js environments
export { NodeAssetLoader } from './loaders/node-loader';

// Export Logger for controlling log verbosity
export { Logger } from './utils/logger';

// Export types for TypeScript users
export type { PDFX3Options, AssetLoader } from './types';
export type { LogLevel } from './utils/logger';
