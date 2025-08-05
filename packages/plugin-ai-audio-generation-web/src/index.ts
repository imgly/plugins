import { Output } from '@imgly/plugin-ai-generation-web';
import plugin, { PLUGIN_ID } from './plugin';
import { type PluginConfiguration } from './types';

// Plugin version - this should be imported from package.json ideally
const PLUGIN_VERSION = '0.0.0';

const Plugin = <I, O extends Output>(
  pluginConfiguration: PluginConfiguration<I, O>
) => ({
  name: PLUGIN_ID,
  version: PLUGIN_VERSION,
  ...plugin(pluginConfiguration)
});

export default Plugin;
