import { type OpenAPIV3 } from 'openapi-types';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
import type { CreativeEngine } from '@cesdk/cesdk-js';
import {
  VideoOutput,
  RenderCustomProperty,
  GetBlockInput,
  CommonProperties,
  Provider,
  Middleware,
  mergeQuickActionsConfig
} from '@imgly/plugin-ai-generation-web';
import { createRunwareClient, RunwareClient } from './createRunwareClient';
import { convertImageUrlForRunware } from './utils';
import { VideoQuickActionSupportMap } from '../types';

/**
 * Configuration for Runware video providers.
 */
type VideoProviderConfiguration = {
  /**
   * HTTP endpoint URL for the Runware proxy. The proxy handles API key injection.
   */
  proxyUrl: string;
  /**
   * Enable debug logging for provider creation and API calls.
   */
  debug?: boolean;
  /**
   * Middleware functions to process inputs/outputs.
   */
  middlewares?: Middleware<any, any>[];
  /**
   * @deprecated Use `middlewares` instead.
   */
  middleware?: Middleware<any, any>[];
  /**
   * Override provider's default history asset source.
   */
  history?: false | '@imgly/local' | '@imgly/indexedDB' | (string & {});
  /**
   * Configure supported quick actions.
   */
  supportedQuickActions?: {
    [quickActionId: string]:
      | Partial<VideoQuickActionSupportMap<any>[string]>
      | false
      | null;
  };
};

/**
 * Options for creating a Runware video provider.
 */
interface CreateProviderOptions<I extends Record<string, any>> {
  /**
   * Runware model identifier (AIR format, e.g., 'openai:sora-2@1').
   */
  modelId: string;
  /**
   * Unique provider identifier for registration.
   */
  providerId: string;
  /**
   * Human-readable provider name displayed in the UI.
   */
  name: string;
  /**
   * OpenAPI schema document describing the input parameters.
   */
  schema: OpenAPIV3.Document;
  /**
   * JSON reference to the input schema (e.g., '#/components/schemas/Input').
   */
  inputReference: string;
  /**
   * User flow mode for the provider panel.
   */
  useFlow?: 'placeholder' | 'generation-only';
  /**
   * Initialization callback when the provider is registered.
   */
  initialize?: (context: {
    cesdk?: CreativeEditorSDK;
    engine: CreativeEngine;
  }) => void;
  /**
   * Custom property renderers for the input panel.
   */
  renderCustomProperty?: RenderCustomProperty;
  /**
   * Quick actions this provider supports.
   */
  supportedQuickActions?: VideoQuickActionSupportMap<I>;
  /**
   * Get block dimensions from input parameters.
   */
  getBlockInput: GetBlockInput<'video', I>;
  /**
   * Transform input parameters to Runware API format.
   */
  mapInput: (input: I) => Record<string, any>;
  /**
   * Provider-specific middleware functions.
   */
  middleware?: Middleware<I, VideoOutput>[];
  /**
   * Custom headers to include in API requests.
   */
  headers?: Record<string, string>;
  /**
   * CE.SDK instance for image URL conversion.
   */
  cesdk?: CreativeEditorSDK;
}

/**
 * Creates a Runware video provider from schema. This should work out of the box
 * but may be rough around the edges and should/can be further customized.
 */
function createVideoProvider<
  I extends Record<string, any> & { image_url?: string }
>(
  options: CreateProviderOptions<I>,
  config: VideoProviderConfiguration
): Provider<'video', I, VideoOutput> {
  const middleware =
    options.middleware ?? config.middlewares ?? config.middleware ?? [];

  let runwareClient: RunwareClient | null = null;

  const provider: Provider<'video', I, VideoOutput> = {
    id: options.providerId,
    kind: 'video',
    name: options.name,
    configuration: config,
    initialize: async (context) => {
      runwareClient = createRunwareClient(config.proxyUrl, options.headers);
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
            ? CommonProperties.ImageUrl(options.providerId, {
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
        if (!runwareClient) {
          throw new Error('Provider not initialized');
        }

        // Convert image URL if needed for image-to-video
        let processedInput = input;
        if (input.image_url != null) {
          const convertedUrl = await convertImageUrlForRunware(
            input.image_url,
            options.cesdk
          );
          processedInput = { ...input, image_url: convertedUrl };
        }

        // Map input to Runware format
        const runwareInput = options.mapInput(processedInput);

        // Call Runware videoInference via HTTP REST API
        const videos = await runwareClient.videoInference(
          {
            model: options.modelId,
            outputType: 'URL',
            outputFormat: 'MP4',
            numberResults: 1,
            ...runwareInput
          },
          abortSignal
        );

        if (videos != null && Array.isArray(videos) && videos.length > 0) {
          const video = videos[0];
          const url = video?.videoURL;
          if (url != null) {
            return { kind: 'video', url };
          }
        }

        // eslint-disable-next-line no-console
        console.error('Cannot extract generated video from response:', videos);
        throw new Error('Cannot find generated video');
      },
      generationHintText: 'ly.img.ai.video.generation.hint'
    }
  };

  if (config.debug) {
    // eslint-disable-next-line no-console
    console.log('Created Provider:', provider);
  }

  return provider;
}

export default createVideoProvider;
export type { VideoProviderConfiguration as RunwareProviderConfiguration };
