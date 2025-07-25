import plugin, { PLUGIN_ID, type PluginConfiguration } from './plugin';

const Plugin = (pluginConfiguration?: PluginConfiguration) => ({
  name: PLUGIN_ID,
  version: PLUGIN_VERSION,
  ...plugin(pluginConfiguration)
});

export default Plugin;

// Export the helper functions directly for use in applications
export { convertToPDF, createPDFExportHandler, isPDFXCompliant } from './pdfx';
export type { PluginConfiguration, PDFConversionOptions, PDFX3Options } from './types';