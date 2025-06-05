import { type OpenAPIV3 } from 'openapi-types';
import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';
import { uploadImageInputToFalIfNeeded } from './utils';
import {
  Provider,
  RenderCustomProperty,
  VideoOutput,
  GetBlockInput,
  CommonProperties,
  Middleware,
  loggingMiddleware,
  QuickAction
} from '@imgly/plugin-ai-generation-web';
import { fal } from '@fal-ai/client';

type VideoProviderConfiguration = {
  proxyUrl: string;
  debug?: boolean;
};

/**
 * Creates a base provider from schema. This should work out of the box
 * but may be rough around the edges and should/can be further customized.
 */
function createVideoProvider<I extends Record<string, any>>(
  options: {
    modelKey: string;
    schema: OpenAPIV3.Document;
    inputReference: string;

    useFlow?: 'placeholder' | 'generation-only';

    initialize?: (context: {
      cesdk?: CreativeEditorSDK;
      engine: CreativeEngine;
    }) => void;

    renderCustomProperty?: RenderCustomProperty;

    getBlockInput: GetBlockInput<'video', I>;

    quickActions?: QuickAction<I, VideoOutput>[];
    middleware?: Middleware<I, VideoOutput>[];
    headers?: Record<string, string>;

    cesdk?: CreativeEditorSDK;
  },
  config: VideoProviderConfiguration
): Provider<'video', I, { kind: 'video'; url: string }> {
  const middleware = options.middleware ?? [];
  if (config.debug) {
    middleware.unshift(loggingMiddleware<I, VideoOutput>());
  }

  const provider: Provider<'video', I, VideoOutput> = {
    id: options.modelKey,
    kind: 'video',
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
        getBlockInput: options.getBlockInput,
        userFlow: options.useFlow ?? 'placeholder'
      }
    },
    output: {
      abortable: true,
      history: '@imgly/indexedDB',
      middleware,
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
      generationHintText:
        "Video generation may take up to a few minutes. This panel can be closed and you'll be notified when it's ready."
    }
  };

  if (config.debug)
    // eslint-disable-next-line no-console
    console.log('Created Provider:', provider);

  return provider;
}

export default createVideoProvider;
