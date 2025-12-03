/**
 * @imgly/plugin-pdfx-web - Print-Ready PDF conversion for CE.SDK
 *
 * IMPORTANT: This package includes Ghostscript WASM binaries licensed under AGPL-3.0.
 * Commercial users must ensure license compliance. See README.md for details.
 */

// Export the main conversion function (supports both single blob and array of blobs)
export { convertToPDFX3 } from './pdfx';

// Export Logger for controlling log verbosity
export { Logger } from './utils/logger';

// Export types for TypeScript users
export type { PDFX3Options } from './types/pdfx';
export type { LogLevel } from './utils/logger';
