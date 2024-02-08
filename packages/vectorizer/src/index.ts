import plugin, { type PluginConfiguration } from './plugin';

import { PLUGIN_ID } from './manifest';

const Plugin = (pluginConfiguration?: PluginConfiguration) => ({
  name: PLUGIN_ID,
  version: PLUGIN_VERSION,
  ...plugin(pluginConfiguration)
});

export default Plugin;
