import { type OpenAPIV3 } from 'openapi-types';
import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';
import {
  Provider,
  RenderCustomProperty,
  VideoOutput,
  GetBlockInput,
  CommonProperties,
  Middleware,
  mergeQuickActionsConfig
} from '@imgly/plugin-ai-generation-web';
import { createEachLabsClient, EachLabsClient } from './createEachLabsClient';
import { uploadImageInputToEachLabsIfNeeded } from './utils';
import { VideoQuickActionSupportMap } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MiddlewareType = Middleware<any, any>;

/**
 * Configuration for EachLabs video providers.
 */
export interface EachLabsProviderConfiguration {
  /**
   * HTTP endpoint URL for the EachLabs proxy. The proxy handles API key injection.
   */
  proxyUrl: string;
  /**
   * Enable debug logging for provider creation and API calls.
   */
  debug?: boolean;
  /**
   * Middleware functions to process inputs/outputs.
   */
  middlewares?: MiddlewareType[];
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
}

/**
 * Options for creating an EachLabs video provider.
 */
interface CreateProviderOptions<I extends Record<string, any>> {
  /**
   * EachLabs model slug (e.g., 'kling-v2-6-pro-text-to-video').
   */
  modelSlug: string;
  /**
   * EachLabs model version (e.g., '0.0.1').
   */
  modelVersion: string;
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
   * Transform input parameters to EachLabs API format.
   */
  mapInput: (input: I) => Record<string, any>;
  /**
   * Provider-specific middleware functions.
   */
  middleware?: MiddlewareType[];
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
 * Creates an EachLabs video provider from schema.
 */
function createVideoProvider<
  I extends Record<string, any> & { image_url?: string }
>(
  options: CreateProviderOptions<I>,
  config: EachLabsProviderConfiguration
): Provider<'video', I, VideoOutput> {
  const middleware = options.middleware ?? config.middlewares ?? [];

  let eachLabsClient: EachLabsClient | null = null;

  const provider: Provider<'video', I, VideoOutput> = {
    id: options.providerId,
    kind: 'video',
    name: options.name,
    configuration: config,
    initialize: async (context) => {
      eachLabsClient = createEachLabsClient(config.proxyUrl, options.headers);
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
      middleware,
      history: config.history ?? '@imgly/indexedDB',
      generate: async (
        input: I,
        { abortSignal }: { abortSignal?: AbortSignal }
      ) => {
        if (!eachLabsClient) {
          throw new Error('Provider not initialized');
        }

        // Upload image URL if needed for image-to-video
        let processedInput = input;

        if (input.image_url != null) {
          const uploadedUrl = await uploadImageInputToEachLabsIfNeeded(
            eachLabsClient,
            input.image_url,
            options.cesdk
          );
          processedInput = { ...input, image_url: uploadedUrl };
        }

        // Map input to EachLabs format
        const eachLabsInput = options.mapInput(processedInput);

        // Call EachLabs videoInference via HTTP REST API
        const videos = await eachLabsClient.videoInference(
          {
            model: options.modelSlug,
            version: options.modelVersion,
            input: eachLabsInput
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
    console.log('Created EachLabs Video Provider:', provider);
  }

  return provider;
}

export default createVideoProvider;
