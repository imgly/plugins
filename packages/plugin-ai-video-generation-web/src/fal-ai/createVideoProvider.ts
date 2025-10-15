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
  mergeQuickActionsConfig
} from '@imgly/plugin-ai-generation-web';
import { createFalClient, FalClient } from './createFalClient';
import { VideoQuickActionSupportMap } from '../types';

type VideoProviderConfiguration = {
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
      | Partial<VideoQuickActionSupportMap<any>[string]>
      | false
      | null;
  };
};

/**
 * Creates a base provider from schema. This should work out of the box
 * but may be rough around the edges and should/can be further customized.
 */
function createVideoProvider<I extends Record<string, any>>(
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

    getBlockInput: GetBlockInput<'video', I>;

    supportedQuickActions?: VideoQuickActionSupportMap<I>;

    middleware?: Middleware<I, VideoOutput>[];
    headers?: Record<string, string>;

    cesdk?: CreativeEditorSDK;
  },
  config: VideoProviderConfiguration
): Provider<'video', I, { kind: 'video'; url: string }> {
  const middleware =
    options.middleware ?? config.middlewares ?? config.middleware ?? [];

  let falClient: FalClient | null = null;

  const provider: Provider<'video', I, VideoOutput> = {
    id: options.modelKey,
    name: options.name ?? options.modelKey,
    kind: 'video',
    initialize: async (context) => {
      falClient = createFalClient(config.proxyUrl, options.headers);
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
        getBlockInput: options.getBlockInput,
        userFlow: options.useFlow ?? 'placeholder'
      }
    },
    output: {
      abortable: true,
      history: config.history ?? '@imgly/indexedDB',
      middleware,
      generate: async (
        input: I,
        { abortSignal }: { abortSignal?: AbortSignal }
      ) => {
        if (!falClient) {
          throw new Error('Provider not initialized');
        }

        const image_url = await uploadImageInputToFalIfNeeded(
          falClient,
          input.image_url,
          options.cesdk
        );

        const response = await falClient.subscribe(options.modelKey, {
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
