import { type OpenAPIV3 } from 'openapi-types';
import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';
import {
  ImageOutput,
  RenderCustomProperty,
  GetBlockInput,
  CommonProperties,
  Provider,
  Middleware,
  mergeQuickActionsConfig
} from '@imgly/plugin-ai-generation-web';
import { fal } from '@fal-ai/client';
import {
  isCustomImageSize,
  uploadImageInputToFalIfNeeded,
  uploadImageArrayToFalIfNeeded
} from './utils';
import { getImageDimensions } from './RecraftV3.constants';
import { ImageQuickActionSupportMap } from '../types';

type ImageProviderConfiguration = {
  proxyUrl: string;
  debug?: boolean;
  middlewares?: Middleware<any, any>[];
  /**
   * @deprecated Use `middlewares` instead.
   */
  middleware?: Middleware<any, any>[];
  /**
   * Override provider's default history asset source
   */
  history?: false | '@imgly/local' | '@imgly/indexedDB' | (string & {});
  /**
   * Configure supported quick actions
   */
  supportedQuickActions?: {
    [quickActionId: string]:
      | Partial<ImageQuickActionSupportMap<any>[string]>
      | false
      | null;
  };
};

/**
 * Creates a base provider from schema. This should work out of the box
 * but may be rough around the edges and should/can be further customized.
 */
function createImageProvider<
  I extends Record<string, any> & { image_url?: string; image_urls?: string[] }
>(
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

    supportedQuickActions?: ImageQuickActionSupportMap<I>;
    getBlockInput?: GetBlockInput<'image', I>;
    getImageSize?: (input: I) => { width: number; height: number };

    middleware?: Middleware<I, ImageOutput>[];
    headers?: Record<string, string>;

    cesdk?: CreativeEditorSDK;
  },
  config: ImageProviderConfiguration
): Provider<'image', I, { kind: 'image'; url: string }> {
  const middleware =
    options.middleware ?? config.middlewares ?? config.middleware ?? [];
  const provider: Provider<'image', I, ImageOutput> = {
    id: options.modelKey,
    kind: 'image',
    name: options.name,
    initialize: async (context) => {
      fal.config({
        proxyUrl: config.proxyUrl,
        requestMiddleware: async (request) => {
          return {
            ...request,
            headers: {
              ...request.headers,
              ...(options.headers ?? {})
            }
          };
        }
      });

      options.initialize?.(context);
    },
    input: {
      quickActions: {
        supported: mergeQuickActionsConfig(
          options.supportedQuickActions ?? {},
          config.supportedQuickActions
        )
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
      middleware,
      history: config.history ?? '@imgly/indexedDB',
      generate: async (
        input: I,
        { abortSignal }: { abortSignal?: AbortSignal }
      ) => {
        // Handle both image_url and image_urls
        const image_url = await uploadImageInputToFalIfNeeded(
          input.image_url,
          options.cesdk
        );

        const image_urls = await uploadImageArrayToFalIfNeeded(
          input.image_urls,
          options.cesdk
        );

        // Prepare the input with uploaded images
        let processedInput = input;
        if (image_url != null) {
          processedInput = { ...input, image_url };
        }
        if (image_urls != null) {
          processedInput = { ...processedInput, image_urls };
        }

        const response = await fal.subscribe(options.modelKey, {
          abortSignal,
          input: processedInput,
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
