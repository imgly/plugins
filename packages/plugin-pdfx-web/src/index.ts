import plugin, { PLUGIN_ID, type PluginConfiguration } from './plugin';
import { PLUGIN_VERSION } from './constants';

const Plugin = (pluginConfiguration?: PluginConfiguration) => ({
  name: PLUGIN_ID,
  version: PLUGIN_VERSION,
  ...plugin(pluginConfiguration)
});

export default Plugin;

// Export the helper functions directly for use in applications
export { convertToPDF, convertSingle, isSupported, getCapabilities, PDFXService } from './pdfx';
export type { 
  PluginConfiguration, 
  PDFConversionOptions, 
  PDFX3Options, 
  ConversionResult, 
  ConversionProgress,
  ConversionMetadata 
} from './types';

// Export core classes for advanced usage
export { GhostscriptLoader } from './core/ghostscript-loader';
export { VirtualFileSystem } from './core/virtual-filesystem';
export { CommandBuilder } from './core/command-builder';
export { Logger } from './utils/logger';
export { BrowserDetection } from './utils/browser-detection';
export { BlobUtils } from './utils/blob-utils';