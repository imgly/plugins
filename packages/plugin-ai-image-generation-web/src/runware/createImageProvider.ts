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
import { createRunwareClient, RunwareClient } from './createRunwareClient';
import {
  convertImageUrlForRunware,
  isCustomImageSize,
  adjustDimensions,
  DimensionConstraints
} from './utils';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import {
  getImageDimensionsFromAspectRatio,
  getImageDimensionsFromSize
} from './types';
import { ImageQuickActionSupportMap } from '../types';

/**
 * Configuration for Runware image providers.
 */
type ImageProviderConfiguration = {
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
};

/**
 * Options for creating a Runware image provider.
 */
interface CreateProviderOptions<I extends Record<string, any>> {
  /**
   * Runware model identifier (AIR format, e.g., 'bfl:5@1').
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
   * Transform input parameters to Runware API format.
   */
  mapInput: (input: I) => Record<string, any>;
  /**
   * Provider-specific middleware functions.
   */
  middleware?: Middleware<I, ImageOutput>[];
  /**
   * Custom headers to include in API requests.
   */
  headers?: Record<string, string>;
  /**
   * CE.SDK instance for image URL conversion.
   */
  cesdk?: CreativeEditorSDK;
  /**
   * Model-specific dimension constraints for image-to-image.
   * Required for I2I providers to properly constrain output dimensions.
   */
  dimensionConstraints?: DimensionConstraints;
  /**
   * Skip automatic dimension injection for image-to-image.
   * When true, the API will auto-detect dimensions from the reference image.
   */
  skipAutoDimensions?: boolean;
}

/**
 * Creates a Runware image provider from schema. This should work out of the box
 * but may be rough around the edges and should/can be further customized.
 */
function createImageProvider<
  I extends Record<string, any> & { image_url?: string }
>(
  options: CreateProviderOptions<I>,
  config: ImageProviderConfiguration
): Provider<'image', I, ImageOutput> {
  const middleware = options.middleware ?? config.middlewares ?? [];

  let runwareClient: RunwareClient | null = null;

  const provider: Provider<'image', I, ImageOutput> = {
    id: options.providerId,
    kind: 'image',
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
          // Try to extract from image_size
          if (input.image_size != null) {
            if (isCustomImageSize(input.image_size)) {
              return Promise.resolve({
                image: {
                  width: input.image_size.width ?? 1024,
                  height: input.image_size.height ?? 1024
                }
              });
            }
            const dims = getImageDimensionsFromSize(input.image_size);
            return Promise.resolve({ image: dims });
          }
          // Try to extract from size (OpenAI format)
          if (input.size != null && typeof input.size === 'string') {
            const [w, h] = input.size.split('x').map(Number);
            if (!Number.isNaN(w) && !Number.isNaN(h)) {
              return Promise.resolve({ image: { width: w, height: h } });
            }
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
        if (!runwareClient) {
          throw new Error('Provider not initialized');
        }

        // Convert image URL if needed for image-to-image
        let processedInput = input;
        let imageDimensions: { width: number; height: number } | undefined;

        if (input.image_url != null) {
          const convertedUrl = await convertImageUrlForRunware(
            input.image_url,
            options.cesdk
          );
          processedInput = { ...input, image_url: convertedUrl };

          // Get and adjust dimensions from input image for image-to-image
          // Skip dimension computation entirely if skipAutoDimensions is set
          if (options.cesdk != null && !options.skipAutoDimensions) {
            const { width, height } = await getImageDimensionsFromURL(
              input.image_url,
              options.cesdk.engine
            );
            // Apply dimension constraints if provided
            if (options.dimensionConstraints != null) {
              imageDimensions = adjustDimensions(
                width,
                height,
                options.dimensionConstraints
              );
            } else {
              imageDimensions = { width, height };
            }
          }
        }

        // Map input to Runware format
        const runwareInput = options.mapInput(processedInput);

        // Call Runware imageInference via HTTP REST API
        const images = await runwareClient.imageInference(
          {
            model: options.modelId,
            outputType: 'URL',
            outputFormat: 'PNG',
            numberResults: 1,
            ...runwareInput,
            // Add adjusted dimensions for image-to-image (if not already provided by mapInput)
            // Skip if skipAutoDimensions is set - API will auto-detect from reference image
            ...(imageDimensions != null &&
              runwareInput.width == null &&
              !options.skipAutoDimensions && {
                width: imageDimensions.width,
                height: imageDimensions.height
              })
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
    console.log('Created Provider:', provider);
  }

  return provider;
}

export default createImageProvider;
export type { ImageProviderConfiguration as RunwareProviderConfiguration };
