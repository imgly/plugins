import CreativeEditorSDK from '@cesdk/cesdk-js';
import { NotificationDuration, type EditorPlugin } from '@cesdk/cesdk-js';
import {
  initProvider,
  getQuickActionMenu,
  Output
} from '@imgly/plugin-ai-generation-web';
import { PluginConfiguration } from './types';

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
          [`panel.${SOUND_GENERATION_PANEL_ID}`]: 'Sound Generation',
          'ly.img.ai.audio-generation.speech.success': 'Generation Successful',
          'ly.img.ai.audio-generation.speech.success.action': 'Show',
          'ly.img.ai.audio-generation.sound.success':
            'Sound Generation Successful',
          'ly.img.ai.audio-generation.sound.success.action': 'Show'
        }
      });

      const text2speechProvider = config?.text2speech;
      const text2soundProvider = config?.text2sound;

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
        addQuickActionEntryForText2Speech(cesdk, (text) => {
          cesdk.ui.openPanel(SPEECH_GENERATION_PANEL_ID);
          cesdk.ui.experimental.setGlobalStateValue(
            `${text2speech?.id}.prompt`,
            text
          );
        });
        cesdk.ui.registerPanel(
          SPEECH_GENERATION_PANEL_ID,
          text2speechInitialized.renderBuilderFunctions.panel
        );
      }
    }
  };
}

function addQuickActionEntryForText2Speech(
  cesdk: CreativeEditorSDK,
  onClick: (text: string) => void
) {
  const quickActionMenu = getQuickActionMenu(cesdk, 'text');
  const generateSpeechId = 'generateSpeech';
  quickActionMenu.registerQuickAction({
    id: generateSpeechId,
    version: '1',
    confirmation: false,
    enable: ({ engine }) => {
      const blockIds = engine.block.findAllSelected();
      if (blockIds.length !== 1) {
        return false;
      }

      const [blockId] = blockIds;
      if (engine.block.getType(blockId) !== '//ly.img.ubq/text') {
        return false;
      }

      return true;
    },
    render: ({ builder }, context) => {
      builder.Button(generateSpeechId, {
        icon: '@imgly/Audio',
        variant: 'plain',
        labelAlignment: 'left',
        label: 'AI Voice...',
        onClick: () => {
          const [blockId] = cesdk.engine.block.findAllSelected();
          const text = cesdk.engine.block.getString(blockId, 'text/text');
          onClick(text);
          context.closeMenu();
        }
      });
    }
  });

  quickActionMenu.setQuickActionMenuOrder([
    ...quickActionMenu.getQuickActionMenuOrder(),
    'ly.img.separator',
    generateSpeechId
  ]);
}

export default AudioGeneration;
