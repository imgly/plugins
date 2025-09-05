import { CreativeEngine, type EditorPlugin } from '@cesdk/cesdk-js';
import createSoundstripeSource from './soundstripe-asset-source';
import { refreshSoundstripeAudioURIs } from './refresh-audio-uris';

export const SoundstripePlugin = (
  pluginConfiguration: SoundstripePluginConfiguration
): Omit<EditorPlugin, 'name' | 'version'> => {
  const { apiKey } = pluginConfiguration;

  return {
    async initialize({ engine, cesdk }) {
      try {
        const soundstripeSource = createSoundstripeSource(
          apiKey,
          engine as CreativeEngine
        );
        engine.asset.addSource(soundstripeSource);

        // Refresh all soundstripe urls when a scene is loaded
        engine.scene.onActiveChanged(() => {
          refreshSoundstripeAudioURIs(apiKey, engine as CreativeEngine);
        });
        if (cesdk) {
          cesdk.setTranslations({
            en: {
              [`libraries.${soundstripeSource.id}.label`]: 'Soundstripe'
            }
          });
        }
      } catch (error) {
        console.error('🎵 Soundstripe Plugin: Initialization failed:', error);
        throw error;
      }
    }
  };
};

export interface SoundstripePluginConfiguration {
  apiKey: string;
}
