import { type OpenAPIV3 } from 'openapi-types';
import {
  type Provider,
  type VideoOutput
} from '@imgly/plugin-utils-ai-generation';
import { fal } from '@fal-ai/client';
import { PluginConfiguration } from '../type';
import CreativeEditorSDK, { AssetResult } from '@cesdk/cesdk-js';

type InputBase = {
  aspect_ratio?: '16:9' | '4:3' | '1:1' | '3:4' | '9:16';
  resolution?: '1080p' | '720p' | '540p' | '360p';
  duration?: number | string;
};

function createVideoGenerationProvider<I extends InputBase>(
  config: PluginConfiguration,
  options: {
    id: string;
    document: OpenAPIV3.Document;
    inputReference: string;
    dimension?: {
      width: number;
      height: number;
    };
    duration?: number;
  }
): Provider<'video', I, VideoOutput> {
  let cesdk: CreativeEditorSDK | undefined;
  const provider: Provider<'video', I, VideoOutput> = {
    id: options.id,
    kind: 'video',

    initialize: async ({ cesdk: instance }) => {
      cesdk = instance;
      fal.config({
        proxyUrl: config.proxyUrl
      });

      if (cesdk != null) {
        cesdk.ui.registerPanel<{
          onSelect: (assetResult: AssetResult) => void;
        }>(`${options.id}.imageSelection`, ({ builder, payload }) => {
          builder.Library(`${options.id}.library.image`, {
            entries: ['ly.img.image'],
            onSelect: async (asset) => {
              payload?.onSelect(asset);
              cesdk?.ui.closePanel(`${options.id}.imageSelection`);
            }
          });
        });
      }
    },

    input: {
      panel: {
        type: 'schema',
        document: options.document,
        inputReference: options.inputReference,
        orderExtensionKeyword: 'x-fal-order-properties',
        renderCustomProperty: {
          image_url: (context, property) => {
            const {
              builder,
              experimental: { global },
              payload
            } = context;
            const defaultUrl =
              payload?.url ??
              'https://fal.media/files/elephant/8kkhB12hEZI2kkbU8pZPA_test.jpeg';

            const stateValue = global<string>(
              `${options.id}.${property.id}`,
              defaultUrl
            );

            builder.Text('foo', {
              content: "Image Input"
            });
            builder.MediaPreview(property.id, {
              preview: {
                type: 'image',
                uri: stateValue.value
              },
              action: {
                label: 'Select Image',
                onClick: () => {
                  cesdk?.ui.openPanel(`${options.id}.imageSelection`, {
                    payload: {
                      onSelect: (assetResult: AssetResult) => {
                        if (assetResult.meta?.uri != null) {
                          stateValue.setValue(assetResult.meta?.uri);
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
        createInputByKind: (input) => {
          if (options.dimension != null && options.duration != null) {
            return {
              video: {
                width: options.dimension.width,
                height: options.dimension.height,
                duration: options.duration
              }
            };
          }
          if (input.aspect_ratio != null && input.resolution != null) {
            const [widthRatio, heightRatio] = input.aspect_ratio
              .split(':')
              .map(Number);
            const resolutionHeight = parseInt(input.resolution, 10);
            const width = Math.round(
              (resolutionHeight * widthRatio) / heightRatio
            );

            if (input.duration != null) {
              const duration =
                typeof input.duration === 'string'
                  ? parseInt(input.duration, 10)
                  : input.duration;

              return {
                video: {
                  width,
                  height: resolutionHeight,
                  duration
                }
              };
            }

            throw new Error('Cannot determine video duration');
          } else {
            throw new Error(
              'Cannot determine video dimensions – aspect ratio and resolution must be set'
            );
          }
        }
      }
    },

    output: {
      abortable: true,
      history: '@imgly/indexedDB',
      generate: async (input, { abortSignal }) => {
        const response = await fal.subscribe(options.id, {
          abortSignal,
          input,
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

        throw new Error('No image generated');
      }
    }
  };

  return provider;
}

export default createVideoGenerationProvider;
