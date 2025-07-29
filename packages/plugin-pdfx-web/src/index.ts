/**
 * @imgly/plugin-pdfx-web - PDF/X conversion plugin for CE.SDK
 *
 * IMPORTANT: This package includes Ghostscript WASM binaries licensed under AGPL-3.0.
 * Commercial users must ensure license compliance. See README.md for details.
 */

import plugin, { PLUGIN_ID, type PluginConfiguration } from './plugin';
import { PLUGIN_VERSION } from './constants';

const Plugin = (pluginConfiguration?: PluginConfiguration) => ({
  name: PLUGIN_ID,
  version: PLUGIN_VERSION,
  ...plugin(pluginConfiguration),
});

export default Plugin;

// Export the helper functions directly for use in applications
export { convertToPDF, convertToPDFX3 } from './pdfx';
export type {
  PluginConfiguration,
  ConversionOptions as PDFXOptions,
  PDFConversionResult,
} from './types';

// Export core classes for advanced usage
export { GhostscriptLoader } from './core/ghostscript-loader';
export { VirtualFileSystem } from './core/virtual-filesystem';
export { CommandBuilder } from './core/command-builder';
export { Logger } from './utils/logger';
export { BrowserDetection } from './utils/browser-detection';
export { BlobUtils } from './utils/blob-utils';
