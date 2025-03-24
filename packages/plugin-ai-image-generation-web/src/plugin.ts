import { NotificationDuration, type EditorPlugin } from '@cesdk/cesdk-js';
import {
  initProvider,
  isGeneratingStateKey
} from '@imgly/plugin-utils-ai-generation';
import { PluginConfiguration } from './types';

export { PLUGIN_ID } from './constants';

const IMAGE_GENERATION_PANEL_ID = 'ly.img.ai/image-generation';

const IMAGE_GENERATION_INPUT_TYPE_STATE_KEY =
  'ly.img.ai.image-generation.fromType';

export function ImageGeneration(
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
          [`panel.${IMAGE_GENERATION_PANEL_ID}`]: 'Image Generation',
          'ly.img.ai.image-generation.success': 'Image Generation Successful',
          'ly.img.ai.image-generation.success.action': 'Show'
        }
      });

      const text2imageProvider = options?.text2image;
      const image2imageProvider = options?.image2image;

      const text2image = await text2imageProvider?.({ cesdk });
      const image2image = await image2imageProvider?.({ cesdk });

      function createNotificationConfiguration(type: 'fromText' | 'fromImage') {
        if (cesdk == null) return;
        return {
          success: {
            show: () => {
              // Check if panel open – we only show the notification
              // if the panel is not visible
              const panelOpen = cesdk?.ui.isPanelOpen(
                IMAGE_GENERATION_PANEL_ID
              );
              const fromTypeOpen =
                cesdk.ui.experimental.getGlobalStateValue(
                  IMAGE_GENERATION_INPUT_TYPE_STATE_KEY,
                  'fromText'
                ) === type;

              return !panelOpen || !fromTypeOpen;
            },
            message: 'ly.img.ai.image-generation.success',
            action: {
              label: 'ly.img.ai.image-generation.success.action',
              onClick: () => {
                cesdk.ui.experimental.setGlobalStateValue(
                  IMAGE_GENERATION_INPUT_TYPE_STATE_KEY,
                  type
                );
                cesdk.ui.openPanel(IMAGE_GENERATION_PANEL_ID);
              }
            },
            duration: 'long' as NotificationDuration
          }
        };
      }

      if (text2image != null) {
        text2image.output.notification =
          createNotificationConfiguration('fromText');
      }
      if (image2image != null) {
        image2image.output.notification =
          createNotificationConfiguration('fromImage');
      }

      const text2imageInitialized =
        text2image != null
          ? await initProvider(
              text2image,
              { cesdk, engine: cesdk.engine },
              config
            )
          : undefined;

      const image2imageInitialized =
        image2image != null
          ? await initProvider(
              image2image,
              { cesdk, engine: cesdk.engine },
              config
            )
          : undefined;

      if (
        text2imageInitialized?.renderBuilderFunctions?.panel == null &&
        image2imageInitialized?.renderBuilderFunctions?.panel == null
      ) {
        if (config.debug)
          // eslint-disable-next-line no-console
          console.log('No providers are initialized – doing nothing');
        return;
      }

      const combinedPanelMode =
        text2imageInitialized?.renderBuilderFunctions?.panel != null &&
        image2imageInitialized?.renderBuilderFunctions?.panel != null;

      if (combinedPanelMode) {
        cesdk.ui.registerPanel(IMAGE_GENERATION_PANEL_ID, (context) => {
          const { builder, experimental } = context;
          const inputTypeState = experimental.global(
            IMAGE_GENERATION_INPUT_TYPE_STATE_KEY,
            'fromText'
          );

          builder.Section(`${IMAGE_GENERATION_PANEL_ID}.fromType.section`, {
            children: () => {
              builder.ButtonGroup(
                `${IMAGE_GENERATION_PANEL_ID}.fromType.buttonGroup`,
                {
                  inputLabel: 'Input',
                  children: () => {
                    builder.Button(
                      `${IMAGE_GENERATION_PANEL_ID}.fromType.buttonGroup.fromText`,
                      {
                        label: 'Text',
                        icon:
                          inputTypeState.value !== 'fromText' &&
                          text2image != null &&
                          experimental.global(
                            isGeneratingStateKey(text2image.id),
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
                      `${IMAGE_GENERATION_PANEL_ID}.fromType.buttonGroup.fromImage`,
                      {
                        label: 'Image',
                        icon:
                          inputTypeState.value !== 'fromImage' &&
                          image2image != null &&
                          experimental.global(
                            isGeneratingStateKey(image2image.id),
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
              text2imageInitialized?.renderBuilderFunctions?.panel?.(context);
              break;
            }
            case 'fromImage': {
              image2imageInitialized?.renderBuilderFunctions?.panel?.(context);
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
          text2imageInitialized?.renderBuilderFunctions?.panel ??
          image2imageInitialized?.renderBuilderFunctions?.panel;

        if (renderBuilderFunction == null) {
          return;
        }

        cesdk.ui.registerPanel(
          IMAGE_GENERATION_PANEL_ID,
          renderBuilderFunction
        );
      }
    }
  };
}

export default ImageGeneration;
