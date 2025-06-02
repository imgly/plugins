import { NotificationDuration, type EditorPlugin } from '@cesdk/cesdk-js';
import { initProvider } from '@imgly/plugin-ai-generation-web';
import { PluginConfiguration } from './types';

export { PLUGIN_ID } from './constants';

const SPEECH_GENERATION_PANEL_ID = 'ly.img.ai/audio-generation/speech';
const SOUND_GENERATION_PANEL_ID = 'ly.img.ai/audio-generation/sound';

export function AudioGeneration(
  options: PluginConfiguration
): Omit<EditorPlugin, 'name' | 'version'> {
  return {
    async initialize({ cesdk }) {
      if (cesdk == null) return;

      const config = {
        debug: options.debug ?? false,
        dryRun: options.dryRun ?? false,
        middleware: options.middleware
      };
      cesdk.setTranslations({
        en: {
          [`panel.${SPEECH_GENERATION_PANEL_ID}`]: 'AI Voice',
          [`panel.${SOUND_GENERATION_PANEL_ID}`]: 'Sound Generation',
          'ly.img.ai.audio-generation.speech.success': 'Generation Successful',
          'ly.img.ai.audio-generation.speech.success.action': 'Show',
          'ly.img.ai.audio-generation.sound.success':
            'Sound Generation Successful',
          'ly.img.ai.audio-generation.sound.success.action': 'Show'
        }
      });

      const text2speechProvider = options?.text2speech;
      const text2soundProvider = options?.text2sound;

      const text2speech = await text2speechProvider?.({ cesdk });
      const text2sound = await text2soundProvider?.({ cesdk });

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
            },
            duration: 'long' as NotificationDuration
          }
        };
      }
      if (text2sound != null) {
        text2sound.output.notification = {
          success: {
            show: () => {
              // Check if panel open – we only show the notification
              // if the panel is not visible
              const panelOpen = cesdk?.ui.isPanelOpen(
                SOUND_GENERATION_PANEL_ID
              );
              return !panelOpen;
            },
            message: 'ly.img.ai.audio-generation.sound.success',
            action: {
              label: 'ly.img.ai.audio-generation.sound.success.action',
              onClick: () => {
                cesdk.ui.openPanel(SOUND_GENERATION_PANEL_ID);
              }
            }
          }
        };
      }

      const text2speechInitialized =
        text2speech != null
          ? await initProvider(
              text2speech,
              { cesdk, engine: cesdk.engine },
              config
            )
          : undefined;

      const text2soundInitialized =
        text2sound != null
          ? await initProvider(
              text2sound,
              { cesdk, engine: cesdk.engine },
              config
            )
          : undefined;

      if (text2soundInitialized?.renderBuilderFunctions?.panel != null) {
        cesdk.ui.registerPanel(
          SOUND_GENERATION_PANEL_ID,
          text2soundInitialized.renderBuilderFunctions.panel
        );
      }

      if (text2speechInitialized?.renderBuilderFunctions?.panel != null) {
        cesdk.ui.registerPanel(
          SPEECH_GENERATION_PANEL_ID,
          text2speechInitialized.renderBuilderFunctions.panel
        );
      }
    }
  };
}

export default AudioGeneration;
