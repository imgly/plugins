import plugin, { type PluginConfiguration } from './plugin';

import { BG_REMOVAL_ID } from './constants';

const Plugin = (pluginConfiguration?: PluginConfiguration) => ({
  name: BG_REMOVAL_ID,
  version: PLUGIN_VERSION,
  ...plugin(pluginConfiguration)
});

export default Plugin;
