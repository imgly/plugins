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
import { convertImageUrlForRunware, isCustomImageSize } from './utils';
import {
  RunwareProviderConfiguration,
  getImageDimensionsFromAspectRatio,
  getImageDimensionsFromSize
} from './types';
import { ImageQuickActionSupportMap } from '../types';

interface CreateProviderOptions<I extends Record<string, any>> {
  modelAIR: string;
  providerId: string;
  name: string;
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
  mapInput: (input: I) => Record<string, any>;
  middleware?: Middleware<I, ImageOutput>[];
  cesdk?: CreativeEditorSDK;
}

/**
 * Creates a Runware image provider from schema
 */
function createImageProvider<
  I extends Record<string, any> & { image_url?: string }
>(
  options: CreateProviderOptions<I>,
  config: RunwareProviderConfiguration
): Provider<'image', I, ImageOutput> {
  const middleware = options.middleware ?? config.middlewares ?? [];

  let runwareClient: RunwareClient | null = null;

  const provider: Provider<'image', I, ImageOutput> = {
    id: options.providerId,
    kind: 'image',
    name: options.name,
    configuration: config,
    initialize: async (context) => {
      console.log('Initializing Runware client:', options.providerId, config);
      runwareClient = createRunwareClient(config.proxyUrl);
      console.log('Runware client initialized:', options.providerId);
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
        if (input.image_url != null) {
          const convertedUrl = await convertImageUrlForRunware(
            input.image_url,
            options.cesdk
          );
          processedInput = { ...input, image_url: convertedUrl };
        }

        // Map input to Runware format
        const runwareInput = options.mapInput(processedInput);

        // Call Runware imageInference via HTTP REST API
        const images = await runwareClient.imageInference(
          {
            model: options.modelAIR,
            outputType: 'URL',
            outputFormat: 'PNG',
            numberResults: 1,
            ...runwareInput
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
    console.log('Created Runware Provider:', provider);
  }

  return provider;
}

export default createImageProvider;
