import { type OpenAPIV3 } from 'openapi-types';
import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';
import {
  ImageOutput,
  RenderCustomProperty,
  GetBlockInput,
  CommonProperties,
  Provider,
  QuickAction,
  Output
} from '@imgly/plugin-utils-ai-generation';
import { fal } from '@fal-ai/client';
import { isCustomImageSize, uploadImageInputToFalIfNeeded } from './utils';
import { getImageDimensions } from './RecraftV3.constants';

type ImageProviderConfiguration = {
  proxyUrl: string;
  debug?: boolean;
};

/**
 * Creates a base provider from schema. This should work out of the box
 * but may be rough around the edges and should/can be further customized.
 */
function createImageProvider<I extends Record<string, any>>(
  options: {
    modelKey: string;
    name?: string;
    schema: OpenAPIV3.Document;
    inputReference: string;
    useFlow?: 'placeholder' | 'generation-only';
    initialize?: (context: {
      cesdk?: CreativeEditorSDK;
      engine: CreativeEngine;
    }) => void;

    renderCustomProperty?: RenderCustomProperty;

    quickActions?: QuickAction<I, ImageOutput>[];
    getBlockInput?: GetBlockInput<'image', I>;
    getImageSize?: (input: I) => { width: number; height: number };

    cesdk?: CreativeEditorSDK;
  },
  config: ImageProviderConfiguration
): Provider<'image', I, { kind: 'image'; url: string }> {
  const provider: Provider<'image', I, ImageOutput> = {
    id: options.modelKey,
    kind: 'image',
    name: options.name,
    initialize: async (context) => {
      fal.config({
        proxyUrl: config.proxyUrl
      });

      options.initialize?.(context);
    },
    input: {
      quickActions: {
        actions: options.quickActions ?? []
      },
      panel: {
        type: 'schema',
        document: options.schema,
        inputReference: options.inputReference,
        includeHistoryLibrary: true,
        orderExtensionKeyword: 'x-fal-order-properties',
        renderCustomProperty: {
          ...(options.cesdk != null
            ? CommonProperties.ImageUrl(options.modelKey, {
                cesdk: options.cesdk
              })
            : {}),
          ...options.renderCustomProperty
        },
        getBlockInput: (input) => {
          if (options.getBlockInput != null)
            return options.getBlockInput(input);
          if (options.getImageSize != null) {
            const { width, height } = options.getImageSize(input);
            return Promise.resolve({
              image: {
                width,
                height
              }
            });
          }
          if (input.image_size != null && isCustomImageSize(input.image_size)) {
            return Promise.resolve({
              image: {
                width: input.image_size.width ?? 512,
                height: input.image_size.height ?? 512
              }
            });
          }

          if (
            input.image_size != null &&
            typeof input.image_size === 'string'
          ) {
            const imageDimension = getImageDimensions(input.image_size);
            return Promise.resolve({
              image: imageDimension
            });
          }

          throw new Error('getBlockInput or getImageSize must be provided');
        },
        userFlow: options.useFlow ?? 'placeholder'
      }
    },
    output: {
      abortable: true,
      history: '@imgly/indexedDB',
      generate: async (
        input: I,
        { abortSignal }: { abortSignal?: AbortSignal }
      ) => {
        const image_url = await uploadImageInputToFalIfNeeded(
          input.image_url,
          options.cesdk
        );

        const response = await fal.subscribe(options.modelKey, {
          abortSignal,
          input: image_url != null ? { ...input, image_url } : input,
          logs: true
        });

        const images = response?.data?.images;
        if (images != null && Array.isArray(images)) {
          const image = images[0];
          const url: string = image?.url;
          if (url != null)
            return {
              kind: 'image',
              url
            };
        } else {
          const image = response?.data?.image;
          if (image != null) {
            const url = image?.url;
            if (url != null)
              return {
                kind: 'image',
                url
              };
          }
        }

        // eslint-disable-next-line no-console
        console.error(
          'Cannot extract generated image from response:',
          response
        );
        throw new Error('Cannot find generated image');
      }
    }
  };

  if (config.debug)
    // eslint-disable-next-line no-console
    console.log('Created Provider:', provider);

  return provider;
}

export default createImageProvider;
