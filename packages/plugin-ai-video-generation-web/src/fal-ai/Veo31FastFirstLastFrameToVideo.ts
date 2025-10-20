import {
  VideoOutput,
  type Provider,
  CommonProviderConfiguration,
  getPanelId,
  mergeQuickActionsConfig
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import schema from './Veo31FastFirstLastFrameToVideo.json';
import CreativeEditorSDK, { AssetResult } from '@cesdk/cesdk-js';
import { createFalClient, FalClient } from './createFalClient';
import { uploadImageInputToFalIfNeeded } from './utils';

interface Veo31FastFirstLastFrameToVideoInput {
  prompt: string;
  first_frame_url: string;
  last_frame_url: string;
  aspect_ratio?: 'auto' | '9:16' | '16:9' | '1:1';
  resolution?: '720p' | '1080p';
  duration?: '8s';
  generate_audio?: boolean;
}

interface ProviderConfiguration
  extends CommonProviderConfiguration<Veo31FastFirstLastFrameToVideoInput, VideoOutput> {}

export function Veo31FastFirstLastFrameToVideo(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'video', Veo31FastFirstLastFrameToVideoInput, VideoOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const modelKey = 'fal-ai/veo3.1/fast/first-last-frame-to-video';

    // Set translations
    cesdk.i18n.setTranslations({
      en: {
        [`panel.${getPanelId(modelKey)}.imageSelection`]:
          'Select Images To Generate',
        [`panel.${modelKey}.imageSelection`]: 'Select Images To Generate',
        [`libraries.${getPanelId(modelKey)}.history.label`]:
          'Generated From Images',
        'ly.img.ai.veo31.firstFrame.label': 'First Frame',
        'ly.img.ai.veo31.lastFrame.label': 'Last Frame',
        'ly.img.ai.veo31.swapFrames.label': 'Swap First and Last Frame',
        'ly.img.ai.imageSelection.selectImage.label': 'Select Image'
      }
    });

    // Register custom panels for dual image selection
    createDualImageSelectionPanels(modelKey, cesdk);

    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<'video', Veo31FastFirstLastFrameToVideoInput, { kind: 'video'; url: string }> {
  const modelKey = 'fal-ai/veo3.1/fast/first-last-frame-to-video';
  const middleware = config.middlewares ?? config.middleware ?? [];

  let falClient: FalClient | null = null;

  const provider: Provider<'video', Veo31FastFirstLastFrameToVideoInput, VideoOutput> = {
    id: modelKey,
    name: 'Veo 3.1 Fast (First/Last Frame)',
    kind: 'video',
    initialize: async () => {
      falClient = createFalClient(config.proxyUrl, config.headers);
    },
    input: {
      quickActions: {
        supported: mergeQuickActionsConfig(
          {
            'ly.img.createVideo': {
              mapInput: () => {
                throw new Error(
                  'This generation should not be triggered by this quick action'
                );
              }
            },
            'ly.img.animateBetweenImages': {
              mapInput: (input: {
                firstFrameUri: string;
                lastFrameUri: string;
              }) => ({
                prompt: '',
                first_frame_url: input.firstFrameUri,
                last_frame_url: input.lastFrameUri
              })
            }
          },
          config.supportedQuickActions
        )
      },
      panel: {
        type: 'schema',
        // @ts-ignore
        document: schema,
        inputReference: '#/components/schemas/Veo31FastFirstLastFrameToVideoInput',
        includeHistoryLibrary: true,
        orderExtensionKeyword: 'x-fal-order-properties',
        // Custom property renderers for dual image inputs
        renderCustomProperty: {
          first_frame_url: (context, property) => {
            const {
              builder,
              experimental: { global }
            } = context;

            const stateValue = global<string>(
              `${modelKey}.first_frame_url`,
              ''
            );

            // Also get access to last frame state for swapping
            const lastFrameState = global<string>(
              `${modelKey}.last_frame_url`,
              ''
            );

            builder.MediaPreview(property.id, {
              preview: {
                type: 'image',
                uri: stateValue.value
              },
              action: {
                label: 'ly.img.ai.imageSelection.selectImage.label',
                onClick: () => {
                  cesdk.ui.openPanel(getFirstFrameSelectionPanelId(modelKey), {
                    payload: {
                      onSelect: (assetResult: AssetResult) => {
                        const uri = assetResult.meta?.uri;
                        if (uri != null) {
                          stateValue.setValue(uri);
                        }
                      }
                    }
                  });
                }
              }
            });

            // Add swap button below the first frame preview
            builder.Button(`${property.id}.swap`, {
              label: 'ly.img.ai.veo31.swapFrames.label',
              icon: '@imgly/Replace',
              labelAlignment: 'center',
              variant: 'regular',
              onClick: () => {
                // Swap the frame values
                const temp = stateValue.value;
                stateValue.setValue(lastFrameState.value);
                lastFrameState.setValue(temp);
              }
            });

            return () => {
              return {
                id: property.id,
                type: 'string',
                value: stateValue.value
              };
            };
          },
          last_frame_url: (context, property) => {
            const {
              builder,
              experimental: { global }
            } = context;

            const stateValue = global<string>(`${modelKey}.last_frame_url`, '');

            builder.MediaPreview(property.id, {
              preview: {
                type: 'image',
                uri: stateValue.value
              },
              action: {
                label: 'ly.img.ai.imageSelection.selectImage.label',
                onClick: () => {
                  cesdk.ui.openPanel(getLastFrameSelectionPanelId(modelKey), {
                    payload: {
                      onSelect: (assetResult: AssetResult) => {
                        const uri = assetResult.meta?.uri;
                        if (uri != null) {
                          stateValue.setValue(uri);
                        }
                      }
                    }
                  });
                }
              }
            });

            return () => {
              return {
                id: property.id,
                type: 'string',
                value: stateValue.value
              };
            };
          }
        },
        getBlockInput: async (input) => {
          let width: number;
          let height: number;

          // Determine base resolution from input.resolution or default to 720p
          const resolutionMap = {
            '720p': { height: 720 },
            '1080p': { height: 1080 }
          };
          const targetResolution = input.resolution ?? '720p';
          const baseHeight = resolutionMap[targetResolution].height;

          // Handle aspect ratio selection
          if (input.aspect_ratio && input.aspect_ratio !== 'auto') {
            // User selected a specific aspect ratio
            const [widthRatio, heightRatio] = input.aspect_ratio
              .split(':')
              .map(Number);

            // Calculate width based on the aspect ratio and target height
            height = baseHeight;
            width = Math.round((height * widthRatio) / heightRatio);
          } else {
            // Use first frame image dimensions as fallback
            try {
              const imageDimension = await getImageDimensionsFromURL(
                input.first_frame_url as string,
                cesdk.engine
              );

              // Use image dimensions as base
              const imageWidth = imageDimension.width ?? 1920;
              const imageHeight = imageDimension.height ?? 1080;

              // Scale to target resolution while maintaining image aspect ratio
              const imageAspectRatio = imageWidth / imageHeight;
              height = baseHeight;
              width = Math.round(height * imageAspectRatio);
            } catch {
              // Fallback to 16:9 if image dimensions cannot be determined
              height = baseHeight;
              width = Math.round((height * 16) / 9);
            }
          }

          // Parse duration from '8s' format to number
          const durationInSeconds = input.duration
            ? parseInt(input.duration.replace('s', ''), 10)
            : 8;

          return Promise.resolve({
            video: {
              width,
              height,
              duration: durationInSeconds
            }
          });
        },
        userFlow: 'placeholder'
      }
    },
    output: {
      abortable: true,
      history: config.history ?? '@imgly/indexedDB',
      middleware,
      generate: async (
        input: Veo31FastFirstLastFrameToVideoInput,
        { abortSignal }: { abortSignal?: AbortSignal }
      ) => {
        if (!falClient) {
          throw new Error('Provider not initialized');
        }

        // Upload both image URLs if needed (blob: or buffer: URLs)
        const first_frame_url = await uploadImageInputToFalIfNeeded(
          falClient,
          input.first_frame_url,
          cesdk
        );

        const last_frame_url = await uploadImageInputToFalIfNeeded(
          falClient,
          input.last_frame_url,
          cesdk
        );

        // Make the API call with uploaded URLs
        const response = await falClient.subscribe(modelKey, {
          abortSignal,
          input: {
            ...input,
            first_frame_url: first_frame_url ?? input.first_frame_url,
            last_frame_url: last_frame_url ?? input.last_frame_url
          },
          logs: true
        });

        const video = response?.data?.video;
        if (video != null) {
          const url = video?.url;
          if (url != null)
            return {
              kind: 'video',
              url
            };
        }

        // eslint-disable-next-line no-console
        console.error(
          'Cannot extract generated video from response:',
          response
        );
        throw new Error('Cannot find generated video');
      },
      generationHintText: 'ly.img.ai.video.generation.hint'
    }
  };

  return provider;
}

function createDualImageSelectionPanels(
  modelKey: string,
  cesdk: CreativeEditorSDK
) {
  // Panel for first frame selection
  cesdk.ui.registerPanel<{
    onSelect: (assetResult: AssetResult) => void;
  }>(getFirstFrameSelectionPanelId(modelKey), ({ builder, payload }) => {
    builder.Section('first_frame_section', {
      children: () => {
        builder.Text('first_frame_title', {
          content: 'ly.img.ai.veo31.firstFrame.label'
        });
        builder.Library(`${modelKey}.library.first_frame`, {
          entries: ['ly.img.image'],
          onSelect: async (asset) => {
            const uri = asset?.meta?.uri;
            if (uri == null) return;

            const mimeType = await cesdk.engine.editor.getMimeType(uri);
            if (mimeType === 'image/svg+xml') {
              cesdk.ui.showNotification({
                type: 'warning',
                message: 'ly.img.ai.imageSelection.error.svg'
              });
            } else if (mimeType.startsWith('image/')) {
              payload?.onSelect(asset);
              cesdk?.ui.closePanel(getFirstFrameSelectionPanelId(modelKey));
            } else {
              cesdk.ui.showNotification({
                type: 'warning',
                message: 'ly.img.ai.imageSelection.error.invalidType'
              });
            }
          }
        });
      }
    });
  });

  // Panel for last frame selection
  cesdk.ui.registerPanel<{
    onSelect: (assetResult: AssetResult) => void;
  }>(getLastFrameSelectionPanelId(modelKey), ({ builder, payload }) => {
    builder.Section('last_frame_section', {
      children: () => {
        builder.Text('last_frame_title', {
          content: 'ly.img.ai.veo31.lastFrame.label'
        });
        builder.Library(`${modelKey}.library.last_frame`, {
          entries: ['ly.img.image'],
          onSelect: async (asset) => {
            const uri = asset?.meta?.uri;
            if (uri == null) return;

            const mimeType = await cesdk.engine.editor.getMimeType(uri);
            if (mimeType === 'image/svg+xml') {
              cesdk.ui.showNotification({
                type: 'warning',
                message: 'ly.img.ai.imageSelection.error.svg'
              });
            } else if (mimeType.startsWith('image/')) {
              payload?.onSelect(asset);
              cesdk?.ui.closePanel(getLastFrameSelectionPanelId(modelKey));
            } else {
              cesdk.ui.showNotification({
                type: 'warning',
                message: 'ly.img.ai.imageSelection.error.invalidType'
              });
            }
          }
        });
      }
    });
  });
}

function getFirstFrameSelectionPanelId(modelKey: string) {
  return `ly.img.ai.${modelKey}.firstFrameSelection`;
}

function getLastFrameSelectionPanelId(modelKey: string) {
  return `ly.img.ai.${modelKey}.lastFrameSelection`;
}

export default getProvider;
