import { CreativeEngine, type EditorPlugin } from '@cesdk/cesdk-js';
import createSoundstripeSource from './soundstripe-asset-source';
import { refreshSoundstripeAudioURIs } from './refresh-audio-uris';

export const SoundstripePlugin = (
  pluginConfiguration: SoundstripePluginConfiguration
): Omit<EditorPlugin, 'name' | 'version'> => {
  const { apiKey, baseUrl } = pluginConfiguration;

  // Validate configuration: either apiKey (for direct API) or baseUrl (for proxy) must be provided
  if (!apiKey && !baseUrl) {
    throw new Error(
      'Soundstripe Plugin: Either apiKey or baseUrl must be provided'
    );
  }

  return {
    async initialize({ engine, cesdk }) {
      const soundstripeSource = createSoundstripeSource(
        engine as CreativeEngine,
        { apiKey, baseUrl }
      );
      engine.asset.addSource(soundstripeSource);

      // Refresh all soundstripe urls when a scene is loaded
      engine.scene.onActiveChanged(() => {
        refreshSoundstripeAudioURIs(engine as CreativeEngine, {
          apiKey,
          baseUrl
        });
      });
      if (cesdk) {
        cesdk.setTranslations({
          en: {
            [`libraries.${soundstripeSource.id}.label`]: 'Soundstripe'
          }
        });
      }
    }
  };
};

export interface SoundstripePluginConfiguration {
  apiKey?: string; // Optional API key (required when using direct API access)
  baseUrl?: string; // Optional base URL for proxy server (required when using proxy)
}
