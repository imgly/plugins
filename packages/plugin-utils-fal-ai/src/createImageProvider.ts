import { type OpenAPIV3 } from 'openapi-types';
import { PluginConfiguration } from './type';
import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';
import {
  Provider,
  ImageOutput,
  PanelInputSchema,
  RenderCustomProperty
} from '@imgly/plugin-utils-ai-generation';
import { fal } from '@fal-ai/client';
import renderCustomProperties from './renderCustomProperties';

/**
 * Creates a base provider from schema. This should work out of the box
 * but may be rough around the edges and should/can be further customized.
 */
function createImageProvider<I extends Record<string, any>>(
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

    createInputByKind: PanelInputSchema<'image', I>['createInputByKind'];

    cesdk?: CreativeEditorSDK;
  },
  config: PluginConfiguration
): Provider<'image', I, { kind: 'image'; url: string }> {
  const provider: Provider<'image', I, ImageOutput> = {
    id: options.modelKey,
    kind: 'image',
    initialize: async (context) => {
      fal.config({
        proxyUrl: config.proxyUrl
      });

      options.initialize?.(context);
    },
    input: {
      panel: {
        type: 'schema',
        document: options.schema,
        inputReference: options.inputReference,
        includeHistoryLibrary: true,
        orderExtensionKeyword: 'x-fal-order-properties',
        renderCustomProperty: {
          ...(options.cesdk != null
            ? renderCustomProperties(options.modelKey, options.cesdk)
            : {}),
          ...options.renderCustomProperty
        },
        createInputByKind: options.createInputByKind,
        userFlow: options.useFlow ?? 'placeholder'
      }
    },
    output: {
      abortable: true,
      history: '@imgly/indexedDB',
      generate: async (
        input: I,
        { abortSignal }: { abortSignal?: AbortSignal }
      ) => {
        const response = await fal.subscribe(options.modelKey, {
          abortSignal,
          input,
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
