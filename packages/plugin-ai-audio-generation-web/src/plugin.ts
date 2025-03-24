import { type EditorPlugin } from '@cesdk/cesdk-js';
import { initProvider } from '@imgly/plugin-utils-ai-generation';
import { PluginConfiguration } from './types';

export { PLUGIN_ID } from './constants';

const SPEECH_GENERATION_PANEL_ID = 'ly.img.ai/audio-generation/speech';

export function AudioGeneration(
  options: PluginConfiguration
): Omit<EditorPlugin, 'name' | 'version'> {
  return {
    async initialize({ cesdk }) {
      if (cesdk == null) return;

      const config = {
        debug: options.debug ?? false,
        dryRun: options.dryRun ?? false
      };
      cesdk.setTranslations({
        en: {
          [`panel.${SPEECH_GENERATION_PANEL_ID}`]: 'Speech Generation',
          'ly.img.ai.audio-generation.speech.success': 'Speech Generation Successful',
          'ly.img.ai.audio-generation.speech.success.action': 'Show'
        }
      });

      const text2speechProvider = options?.text2speech;

      const text2speech = await text2speechProvider?.({ cesdk });

      if (text2speech != null) {
        text2speech.output.notification = {
          success: {
            show: () => {
              // Check if panel open – we only show the notification
              // if the panel is not visible
              const panelOpen = cesdk?.ui.isPanelOpen(
                SPEECH_GENERATION_PANEL_ID
              );
              return !panelOpen;
            },
            message: 'ly.img.ai.audio-generation.speech.success',
            action: {
              label: 'ly.img.ai.audio-generation.speech.success.action',
              onClick: () => {
                cesdk.ui.openPanel(SPEECH_GENERATION_PANEL_ID);
              }
            }
          }
        }
      }

      const text2speechInitialized =
        text2speech != null
          ? await initProvider(
              text2speech,
              { cesdk, engine: cesdk.engine },
              config
            )
          : undefined;

      if (text2speechInitialized?.renderBuilderFunctions?.panel == null) {
        if (config.debug)
          // eslint-disable-next-line no-console
          console.log('No providers are initialized – doing nothing');
        return;
      }

        cesdk.ui.registerPanel(
          SPEECH_GENERATION_PANEL_ID,
          text2speechInitialized.renderBuilderFunctions.panel
        );
    }
  };
}

export default AudioGeneration;
