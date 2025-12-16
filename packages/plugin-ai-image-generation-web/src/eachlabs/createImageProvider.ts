import { type OpenAPIV3 } from 'openapi-types';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
import type { CreativeEngine } from '@cesdk/cesdk-js';
import {
  ImageOutput,
  RenderCustomProperty,
  GetBlockInput,
  CommonProperties,
  Provider,
  Middleware,
  mergeQuickActionsConfig
} from '@imgly/plugin-ai-generation-web';
import { createEachLabsClient, EachLabsClient } from './createEachLabsClient';
import {
  convertImageUrlForEachLabs,
  convertImageUrlArrayForEachLabs
} from './utils';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import { getImageDimensionsFromAspectRatio } from './types';
import { ImageQuickActionSupportMap } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MiddlewareType = Middleware<any, any>;

/**
 * Configuration for EachLabs image providers.
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
      | Partial<ImageQuickActionSupportMap<any>[string]>
      | false
      | null;
  };
}

/**
 * Options for creating an EachLabs image provider.
 */
interface CreateProviderOptions<I extends Record<string, any>> {
  /**
   * EachLabs model slug (e.g., 'nano-banana-pro').
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
  supportedQuickActions?: ImageQuickActionSupportMap<I>;
  /**
   * Get block dimensions from input parameters.
   */
  getBlockInput?: GetBlockInput<'image', I>;
  /**
   * Extract image dimensions from input parameters.
   */
  getImageSize?: (input: I) => { width: number; height: number };
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
 * Creates an EachLabs image provider from schema.
 */
function createImageProvider<
  I extends Record<string, any> & { image_url?: string; image_urls?: string[] }
>(
  options: CreateProviderOptions<I>,
  config: EachLabsProviderConfiguration
): Provider<'image', I, ImageOutput> {
  const middleware = options.middleware ?? config.middlewares ?? [];

  let eachLabsClient: EachLabsClient | null = null;

  const provider: Provider<'image', I, ImageOutput> = {
    id: options.providerId,
    kind: 'image',
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
        getBlockInput: (input) => {
          if (options.getBlockInput != null) {
            return options.getBlockInput(input);
          }
          if (options.getImageSize != null) {
            const { width, height } = options.getImageSize(input);
            return Promise.resolve({
              image: { width, height }
            });
          }
          // Try to extract from aspect_ratio
          if (input.aspect_ratio != null) {
            const dims = getImageDimensionsFromAspectRatio(input.aspect_ratio);
            return Promise.resolve({ image: dims });
          }
          // Default
          return Promise.resolve({ image: { width: 1024, height: 1024 } });
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
        if (!eachLabsClient) {
          throw new Error('Provider not initialized');
        }

        // Convert image URL if needed for image-to-image
        let processedInput = input;
        let imageDimensions: { width: number; height: number } | undefined;

        if (input.image_url != null) {
          const convertedUrl = await convertImageUrlForEachLabs(
            input.image_url,
            options.cesdk
          );
          processedInput = { ...input, image_url: convertedUrl };

          // Get dimensions from input image for image-to-image
          if (options.cesdk != null) {
            const { width, height } = await getImageDimensionsFromURL(
              input.image_url,
              options.cesdk.engine
            );
            imageDimensions = { width, height };
          }
        }

        // Convert image URLs array if needed for multi-image inputs
        if (input.image_urls != null && input.image_urls.length > 0) {
          const convertedUrls = await convertImageUrlArrayForEachLabs(
            input.image_urls,
            options.cesdk
          );
          processedInput = { ...processedInput, image_urls: convertedUrls };

          // For multi-image, get dimensions from the first image if not already set
          if (
            imageDimensions == null &&
            options.cesdk != null &&
            input.image_urls[0] != null
          ) {
            const { width, height } = await getImageDimensionsFromURL(
              input.image_urls[0],
              options.cesdk.engine
            );
            imageDimensions = { width, height };
          }
        }

        // Map input to EachLabs format
        const eachLabsInput = options.mapInput(processedInput);

        // Call EachLabs imageInference via HTTP REST API
        const images = await eachLabsClient.imageInference(
          {
            model: options.modelSlug,
            version: options.modelVersion,
            input: {
              ...eachLabsInput,
              // Always generate one image
              num_images: 1,
              // Use PNG output format
              output_format: 'png'
            }
          },
          abortSignal
        );

        if (images != null && Array.isArray(images) && images.length > 0) {
          const image = images[0];
          const url = image?.imageURL;
          if (url != null) {
            return { kind: 'image', url };
          }
        }

        // eslint-disable-next-line no-console
        console.error('Cannot extract generated image from response:', images);
        throw new Error('Cannot find generated image');
      }
    }
  };

  if (config.debug) {
    // eslint-disable-next-line no-console
    console.log('Created EachLabs Provider:', provider);
  }

  return provider;
}

export default createImageProvider;
