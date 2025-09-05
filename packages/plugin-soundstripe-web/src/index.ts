import { PLUGIN_ID } from './constants';
import {
  SoundstripePlugin,
  type SoundstripePluginConfiguration
} from './plugin';

const Plugin = (pluginConfiguration: SoundstripePluginConfiguration) => ({
  name: PLUGIN_ID,
  version: PLUGIN_VERSION,
  ...SoundstripePlugin(pluginConfiguration)
});

export default Plugin;
export type { SoundstripePluginConfiguration };
export { refreshSoundstripeAudioURIs } from './refresh-audio-uris';
