import { type EditorPlugin } from '@cesdk/cesdk-js';
import { PluginConfiguration } from './types';
import registerSpeechComponents from './registerSpeechComponents';

export const PLUGIN_ID = 'imgly/plugin/ai-text2speech';

export default (
  config: PluginConfiguration = {}
): Omit<EditorPlugin, 'name' | 'version'> => {
  return {
    async initialize({ cesdk }) {
      if (cesdk == null) return;

      registerSpeechComponents(cesdk);
      // Initialize plugin
      cesdk.setTranslations({
        en: {
          [`panel.${PLUGIN_ID}`]: 'AI Text-to-Speech',
          [`panel.${PLUGIN_ID}.text`]: 'Text',
          [`panel.${PLUGIN_ID}.voice`]: 'Voice',
          [`panel.${PLUGIN_ID}.generate`]: 'Generate'
        }
      });
    }
  };
};
