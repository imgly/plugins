import { Output } from '@imgly/plugin-ai-generation-web';
import plugin, { PLUGIN_ID } from './plugin';
import { type PluginConfiguration } from './types';
import { DEFAULT_VIDEO_QUICK_ACTION_ORDER } from './constants';

const Plugin = <I, O extends Output>(
  pluginConfiguration: PluginConfiguration<I, O>
) => ({
  name: PLUGIN_ID,
  version: PLUGIN_VERSION,
  ...plugin(pluginConfiguration)
});

export default Plugin;
export { DEFAULT_VIDEO_QUICK_ACTION_ORDER };
