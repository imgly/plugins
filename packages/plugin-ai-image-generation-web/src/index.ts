import { Output } from '@imgly/plugin-ai-generation-web';
import plugin, { PLUGIN_ID, DEFAULT_IMAGE_QUICK_ACTION_ORDER } from './plugin';
import { type PluginConfiguration } from './types';

const Plugin = <I, O extends Output>(
  pluginConfiguration: PluginConfiguration<I, O>
) => ({
  name: PLUGIN_ID,
  version: PLUGIN_VERSION,
  ...plugin(pluginConfiguration)
});

export default Plugin;
export { DEFAULT_IMAGE_QUICK_ACTION_ORDER };

// PerfectlyClear provider
export { PerfectlyClearProvider } from './perfectlyclear';
export type {
  PerfectlyClearConfiguration,
  PerfectlyClearInput
} from './perfectlyclear';
