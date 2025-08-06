import { type OpenAPIV3 } from 'openapi-types';
import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';
import {
  RenderCustomProperty,
  CommonProperties,
  Middleware
} from '@imgly/plugin-ai-generation-web';
import { fal } from '@fal-ai/client';
import { isCustomImageSize, uploadImageInputToFalIfNeeded } from './utils';
import { getImageDimensions } from './Recraft20b.constants';
import { StickerQuickActionSupportMap } from '../types';

type StickerProviderConfiguration = {
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
      | Partial<StickerQuickActionSupportMap<any>[string]>
      | false
      | null;
  };
};

/**
 * Process quick actions configuration by merging provider defaults with user configuration
 */
function processQuickActions<I>(
  providerDefaults: StickerQuickActionSupportMap<I>,
  userConfig?: StickerProviderConfiguration['supportedQuickActions']
): StickerQuickActionSupportMap<I> {
  if (!userConfig) return providerDefaults;

  const result = { ...providerDefaults };

  for (const [actionId, config] of Object.entries(userConfig)) {
    if (config === false || config === null || config === undefined) {
      // Remove the quick action
      delete result[actionId];
    } else if (config === true) {
      // Keep provider's default (no-op)
    } else {
      // Override with user configuration
      result[actionId] = config as StickerQuickActionSupportMap<I>[string];
    }
  }

  return result;
}

/**
 * Creates a base provider from schema. This should work out of the box
 * but may be rough around the edges and should/can be further customized.
 */
function createStickerProvider<I extends Record<string, any>>(
  options: {
    falKey: string;
    modelKey: string;
    name?: string;
    schema: OpenAPIV3.Document;
    inputReference: string;
    userFlow?: 'placeholder' | 'generation-only';
    initialize?: (context: {
      cesdk?: CreativeEditorSDK;
      engine: CreativeEngine;
    }) => void;

    renderCustomProperty?: RenderCustomProperty;

    supportedQuickActions?: StickerQuickActionSupportMap<I>;
    getBlockInput?: any;
    getStickerSize?: (input: I) => { width: number; height: number };

    middleware?: any[];
    headers?: Record<string, string>;

    cesdk?: CreativeEditorSDK;
  },
  config: StickerProviderConfiguration
): any {
  const middleware =
    options.middleware ?? config.middlewares ?? config.middleware ?? [];
  const provider: any = {
    id: options.modelKey,
    kind: 'sticker',
    name: options.name,
    initialize: async (context: any) => {
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
        supported: processQuickActions(
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
        getBlockInput: (input: any) => {
          if (options.getBlockInput != null)
            return options.getBlockInput(input);
          if (options.getStickerSize != null) {
            const { width, height } = options.getStickerSize(input);
            return Promise.resolve({
              sticker: {
                width,
                height
              }
            });
          }
          if (input.image_size != null && isCustomImageSize(input.image_size)) {
            return Promise.resolve({
              sticker: {
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
              sticker: imageDimension
            });
          }

          throw new Error('getBlockInput or getStickerSize must be provided');
        },
        userFlow: options.userFlow ?? 'placeholder'
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
        const image_url = await uploadImageInputToFalIfNeeded(
          input.image_url,
          options.cesdk
        );

        const response = await fal.subscribe(
          options.falKey ?? options.modelKey,
          {
            abortSignal,
            input: image_url != null ? { ...input, image_url } : input,
            logs: true
          }
        );

        const images = response?.data?.images;
        if (images != null && Array.isArray(images)) {
          const image = images[0];
          const url: string = image?.url;
          if (url != null)
            return {
              kind: 'sticker',
              url
            };
        } else {
          const image = response?.data?.image;
          if (image != null) {
            const url = image?.url;
            if (url != null)
              return {
                kind: 'sticker',
                url
              };
          }
        }

        // eslint-disable-next-line no-console
        console.error(
          'Cannot extract generated sticker from response:',
          response
        );
        throw new Error('Cannot find generated sticker');
      }
    }
  };

  if (config.debug)
    // eslint-disable-next-line no-console
    console.log('Created Provider:', provider);

  return provider;
}

export default createStickerProvider;
