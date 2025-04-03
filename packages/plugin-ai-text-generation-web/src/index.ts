import plugin, { PLUGIN_ID } from './plugin';
import { type PluginConfiguration } from './types';

// Re-export magic menu functions from plugin-utils-ai-generation
export {
  getMagicMenu,
  registerMagicMenu
} from '@imgly/plugin-utils-ai-generation';

const Plugin = (pluginConfiguration: PluginConfiguration) => ({
  name: PLUGIN_ID,
  version: PLUGIN_VERSION,
  ...plugin(pluginConfiguration)
});

export default Plugin;
