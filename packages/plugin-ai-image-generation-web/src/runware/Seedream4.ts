import {
  type Provider,
  type ImageOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import schema from './Seedream4.json';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';
import {
  RunwareProviderConfiguration,
  getImageDimensionsFromSize
} from './types';

type Seedream4Input = {
  prompt: string;
  image_size?:
    | 'square'
    | 'square_hd'
    | 'portrait_4_3'
    | 'portrait_3_2'
    | 'portrait_16_9'
    | 'landscape_4_3'
    | 'landscape_3_2'
    | 'landscape_16_9'
    | 'landscape_21_9';
  image_resolution?: '1k' | '2k' | '4k';
};

export function Seedream4(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Seedream4Input, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider(
      {
        modelAIR: 'bytedance:5@0',
        providerId: 'runware/bytedance/seedream-4',
        name: 'Seedream 4.0',
        // @ts-ignore
        schema,
        inputReference: '#/components/schemas/Seedream4Input',
        cesdk,
        middleware: config.middlewares ?? [],
        getImageSize: (input) => {
          return getImageDimensionsFromSize(input.image_size ?? 'square_hd');
        },
        mapInput: (input) => {
          const { width, height } = getImageDimensionsFromSize(
            input.image_size ?? 'square_hd'
          );
          return {
            positivePrompt: input.prompt,
            width,
            height
          };
        }
      },
      config
    );
  };
}

export default Seedream4;
