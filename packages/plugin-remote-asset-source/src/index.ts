import { PLUGIN_ID } from './constants';
import {
  RemoteAssetSourcePlugin,
  type RemoteAssetSourcePluginConfiguration
} from './plugin';

const Plugin = (pluginConfiguration: RemoteAssetSourcePluginConfiguration) => ({
  name: PLUGIN_ID,
  version: PLUGIN_VERSION,
  ...RemoteAssetSourcePlugin(pluginConfiguration)
});

export default Plugin;
