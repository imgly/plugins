import { type OpenAPIV3 } from 'openapi-types';
import {
  type Provider,
  type ImageOutput
} from '@imgly/plugin-utils-ai-generation';
import { fal } from '@fal-ai/client';
import { type ImageSize } from '@fal-ai/client/endpoints';
import { PluginConfiguration } from '../type';

import { getImageDimensions, isCustomImageSize } from '../utils';

type InputBase = {
  image_size?:
    | ImageSize
    | 'square_hd'
    | 'square'
    | 'portrait_4_3'
    | 'portrait_16_9'
    | 'landscape_4_3'
    | 'landscape_16_9';
};

function createImageGenerationProvider<I extends InputBase>(
  config: PluginConfiguration,
  options: {
    id: string;
    document: OpenAPIV3.Document;
    inputReference: string;
  }
): Provider<'image', I, ImageOutput> {
  const provider: Provider<'image', I, ImageOutput> = {
    id: options.id,
    kind: 'image',

    initialize: async () => {
      fal.config({
        proxyUrl: config.proxyUrl
      });
    },

    input: {
      panel: {
        type: 'schema',
        document: options.document,
        inputReference: options.inputReference,
        createInputByKind: (input) => {
          if (isCustomImageSize(input.image_size)) {
            return {
              image: {
                width: input.image_size.width ?? 512,
                height: input.image_size.height ?? 512
              }
            };
          }

          const imageDimension = getImageDimensions(
            input.image_size ?? 'square_hd'
          );

          return {
            image: imageDimension
          };
        }
      }
    },

    output: {
      abortable: true,
      generate: async (input, { abortSignal }) => {
        const response = await fal.subscribe(options.id, {
          abortSignal,
          input,
          logs: true
        });

        const images = response?.data?.images;
        if (images != null && Array.isArray(images)) {
          const image = images[0];
          const url = image?.url;
          if (url != null)
            return {
              kind: 'image',
              url
            };
        }

        throw new Error('No image generated');
      }
    }
  };

  return provider;
}

export default createImageGenerationProvider;
