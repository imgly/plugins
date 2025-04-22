import plugin, { PLUGIN_ID } from './plugin';
import { type PluginConfiguration } from './types';

const Plugin = (pluginConfiguration: PluginConfiguration) => ({
  name: PLUGIN_ID,

  version: PLUGIN_VERSION,
  ...plugin(pluginConfiguration)
});

export default Plugin;
