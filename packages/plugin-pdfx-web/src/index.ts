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
export { convertToPDFX3 } from './pdfx';
export { getDefaultCMYKProfile } from './assets/default-cmyk-profile';
export type {
  PluginConfiguration,
  PDFX3Options,
} from './types';
