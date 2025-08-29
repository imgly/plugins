/**
 * @imgly/plugin-pdfx-web - Print-Ready PDF conversion for CE.SDK
 *
 * IMPORTANT: This package includes Ghostscript WASM binaries licensed under AGPL-3.0.
 * Commercial users must ensure license compliance. See README.md for details.
 */

// Export the main conversion function
export { convertToPDFX3 } from './pdfx';

// Export types for TypeScript users
export type { PDFX3Options } from './types/pdfx';
