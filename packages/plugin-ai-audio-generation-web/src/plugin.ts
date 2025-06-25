import { type EditorPlugin } from '@cesdk/cesdk-js';
import {
  Output,
  initializeProviders,
  registerDockComponent
} from '@imgly/plugin-ai-generation-web';
import { PluginConfiguration } from './types';
import { toArray } from '@imgly/plugin-utils';

export { PLUGIN_ID } from './constants';

const SPEECH_GENERATION_PANEL_ID = 'ly.img.ai/audio-generation/speech';
const SOUND_GENERATION_PANEL_ID = 'ly.img.ai/audio-generation/sound';

export function AudioGeneration<I, O extends Output>(
  config: PluginConfiguration<I, O>
): Omit<EditorPlugin, 'name' | 'version'> {
  return {
    async initialize({ cesdk }) {
      if (cesdk == null) return;

      cesdk.setTranslations({
        en: {
          [`panel.${SPEECH_GENERATION_PANEL_ID}`]: 'AI Voice',
          [`panel.${SOUND_GENERATION_PANEL_ID}`]: 'Sound Generation'
        }
      });

      const text2speechProviders = await Promise.all(
        toArray(config.text2speech).map((getProvider) => getProvider({ cesdk }))
      );
      const text2soundProviders = await Promise.all(
        toArray(config.text2sound).map((getProvider) => getProvider({ cesdk }))
      );

      const text2SpeechInitializedResult = await initializeProviders(
        'audio',
        text2speechProviders,
        { cesdk },
        config
      );
      const text2SoundInitializedResult = await initializeProviders(
        'audio',
        text2soundProviders,
        { cesdk },
        config
      );

      if (text2SpeechInitializedResult.panel.builderRenderFunction != null) {
        cesdk.ui.registerPanel(
          SPEECH_GENERATION_PANEL_ID,
          text2SpeechInitializedResult.panel.builderRenderFunction
        );

        registerDockComponent({
          cesdk,
          panelId: SPEECH_GENERATION_PANEL_ID
        });
      }

      if (text2SoundInitializedResult.panel.builderRenderFunction != null) {
        cesdk.ui.registerPanel(
          SOUND_GENERATION_PANEL_ID,
          text2SoundInitializedResult.panel.builderRenderFunction
        );

        registerDockComponent({
          cesdk,
          panelId: SOUND_GENERATION_PANEL_ID
        });
      }
    }
  };
}

export default AudioGeneration;
