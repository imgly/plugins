import plugin, { PLUGIN_ID } from './plugin';
import { type PluginConfiguration } from './types';

export { default as getMagicMenu } from './magic/getMagicMenu';
export { default as registerMagicMenu } from './magic/registerMagicMenu';

const Plugin = (pluginConfiguration: PluginConfiguration) => ({
  name: PLUGIN_ID,
  version: PLUGIN_VERSION,
  ...plugin(pluginConfiguration)
});

export default Plugin;
