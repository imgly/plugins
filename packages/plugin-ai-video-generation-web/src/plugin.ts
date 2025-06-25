import { NotificationDuration, type EditorPlugin } from '@cesdk/cesdk-js';
import {
  initProvider,
  isGeneratingStateKey,
  Output,
  registerDockComponent
} from '@imgly/plugin-ai-generation-web';
import { PluginConfiguration } from './types';

export { PLUGIN_ID } from './constants';

const VIDEO_GENERATION_PANEL_ID = 'ly.img.ai/video-generation';

const VIDEO_GENERATION_INPUT_TYPE_STATE_KEY =
  'ly.img.ai.video-generation.fromType';

export function VideoGeneration<I, O extends Output>(
  config: PluginConfiguration<I, O>
): Omit<EditorPlugin, 'name' | 'version'> {
  return {
    async initialize({ cesdk }) {
      if (cesdk == null) return;

      cesdk.setTranslations({
        en: {
          [`panel.${VIDEO_GENERATION_PANEL_ID}`]: 'Video Generation',
          'ly.img.ai.video-generation.success': 'Video Generation Successful',
          'ly.img.ai.video-generation.success.action': 'Show'
        }
      });

      const text2videoProvider = config?.text2video;
      const image2videoProvider = config?.image2video;

      const text2video = await text2videoProvider?.({ cesdk });
      const image2video = await image2videoProvider?.({ cesdk });

      function createNotificationConfiguration(type: 'fromText' | 'fromImage') {
        if (cesdk == null) return;
        return {
          success: {
            show: () => {
              // Check if panel open – we only show the notification
              // if the panel is not visible
              const panelOpen = cesdk?.ui.isPanelOpen(
                VIDEO_GENERATION_PANEL_ID
              );
              const fromTypeOpen =
                cesdk.ui.experimental.getGlobalStateValue(
                  VIDEO_GENERATION_INPUT_TYPE_STATE_KEY
                ) === type;

              return !panelOpen || !fromTypeOpen;
            },
            message: 'ly.img.ai.video-generation.success',
            action: {
              label: 'ly.img.ai.video-generation.success.action',
              onClick: () => {
                cesdk.ui.experimental.setGlobalStateValue(
                  VIDEO_GENERATION_INPUT_TYPE_STATE_KEY,
                  type
                );
                cesdk.ui.openPanel(VIDEO_GENERATION_PANEL_ID);
              }
            },
            duration: 'long' as NotificationDuration
          }
        };
      }

      if (text2video != null) {
        text2video.output.notification =
          createNotificationConfiguration('fromText');
      }
      if (image2video != null) {
        image2video.output.notification =
          createNotificationConfiguration('fromImage');
      }

      const text2videoInitialized =
        text2video != null
          ? await initProvider(
              text2video,
              { cesdk, engine: cesdk.engine },
              config
            )
          : undefined;

      const image2videoInitialized =
        image2video != null
          ? await initProvider(
              image2video,
              { cesdk, engine: cesdk.engine },
              config
            )
          : undefined;

      if (
        text2videoInitialized?.renderBuilderFunctions?.panel == null &&
        image2videoInitialized?.renderBuilderFunctions?.panel == null
      ) {
        if (config.debug)
          // eslint-disable-next-line no-console
          console.log('No providers are initialized – doing nothing');
        return;
      }

      const combinedPanelMode =
        text2videoInitialized?.renderBuilderFunctions?.panel != null &&
        image2videoInitialized?.renderBuilderFunctions?.panel != null;

      if (combinedPanelMode) {
        cesdk.ui.registerPanel(VIDEO_GENERATION_PANEL_ID, (context) => {
          const { builder, experimental } = context;
          const inputTypeState = experimental.global(
            VIDEO_GENERATION_INPUT_TYPE_STATE_KEY,
            'fromText'
          );

          builder.Section(`${VIDEO_GENERATION_PANEL_ID}.fromType.section`, {
            children: () => {
              builder.ButtonGroup(
                `${VIDEO_GENERATION_PANEL_ID}.fromType.buttonGroup`,
                {
                  inputLabel: 'Input',
                  children: () => {
                    builder.Button(
                      `${VIDEO_GENERATION_PANEL_ID}.fromType.buttonGroup.fromText`,
                      {
                        label: 'Text',
                        icon:
                          inputTypeState.value !== 'fromText' &&
                          text2video != null &&
                          experimental.global(
                            isGeneratingStateKey(text2video.id),
                            false
                          ).value
                            ? '@imgly/LoadingSpinner'
                            : undefined,
                        isActive: inputTypeState.value === 'fromText',
                        onClick: () => {
                          inputTypeState.setValue('fromText');
                        }
                      }
                    );
                    builder.Button(
                      `${VIDEO_GENERATION_PANEL_ID}.fromType.buttonGroup.fromImage`,
                      {
                        label: 'Image',
                        icon:
                          inputTypeState.value !== 'fromImage' &&
                          image2video != null &&
                          experimental.global(
                            isGeneratingStateKey(image2video.id),
                            false
                          ).value
                            ? '@imgly/LoadingSpinner'
                            : undefined,
                        isActive: inputTypeState.value === 'fromImage',
                        onClick: () => {
                          inputTypeState.setValue('fromImage');
                        }
                      }
                    );
                  }
                }
              );
            }
          });

          switch (inputTypeState.value) {
            case 'fromText': {
              text2videoInitialized?.renderBuilderFunctions?.panel?.(context);
              break;
            }
            case 'fromImage': {
              image2videoInitialized?.renderBuilderFunctions?.panel?.(context);
              break;
            }
            default: {
              // noop
            }
          }
        });
      } else {
        // one of the provider is null
        const renderBuilderFunction =
          text2videoInitialized?.renderBuilderFunctions?.panel ??
          image2videoInitialized?.renderBuilderFunctions?.panel;

        if (renderBuilderFunction == null) {
          return;
        }

        cesdk.ui.registerPanel(
          VIDEO_GENERATION_PANEL_ID,
          renderBuilderFunction
        );

        cesdk.i18n.setTranslations({
          en: {
            [`${VIDEO_GENERATION_PANEL_ID}.dock.label`]: 'AI Video'
          }
        });
        registerDockComponent({
          cesdk,
          panelId: VIDEO_GENERATION_PANEL_ID
        });
      }
    }
  };
}

export default VideoGeneration;
