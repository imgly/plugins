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
import { RunwareProviderConfiguration } from './types';
import { VideoQuickActionSupportMap } from '../types';

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
  supportedQuickActions?: VideoQuickActionSupportMap<I>;
  getBlockInput: GetBlockInput<'video', I>;
  mapInput: (input: I) => Record<string, any>;
  middleware?: Middleware<I, VideoOutput>[];
  cesdk?: CreativeEditorSDK;
}

/**
 * Creates a Runware video provider from schema
 */
function createVideoProvider<
  I extends Record<string, any> & { image_url?: string }
>(
  options: CreateProviderOptions<I>,
  config: RunwareProviderConfiguration
): Provider<'video', I, VideoOutput> {
  const middleware = options.middleware ?? config.middlewares ?? [];

  let runwareClient: RunwareClient | null = null;

  const provider: Provider<'video', I, VideoOutput> = {
    id: options.providerId,
    kind: 'video',
    name: options.name,
    configuration: config,
    initialize: async (context) => {
      runwareClient = createRunwareClient(config.proxyUrl);
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
      generationHintText: 'ly.img.ai.video.generation.hint',
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
            model: options.modelAIR,
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
      }
    }
  };

  if (config.debug) {
    // eslint-disable-next-line no-console
    console.log('Created Runware Video Provider:', provider);
  }

  return provider;
}

export default createVideoProvider;
