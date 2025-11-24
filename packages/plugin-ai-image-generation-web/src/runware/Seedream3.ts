import {
  type Provider,
  type ImageOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import schema from './Seedream3.json';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';
import {
  RunwareProviderConfiguration,
  getImageDimensionsFromSize
} from './types';

type Seedream3Input = {
  prompt: string;
  image_size?:
    | 'square'
    | 'square_hd'
    | 'portrait_4_3'
    | 'portrait_16_9'
    | 'landscape_4_3'
    | 'landscape_16_9';
};

export function Seedream3(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Seedream3Input, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider(
      {
        modelAIR: 'bytedance:3@1',
        providerId: 'runware/bytedance/seedream-3',
        name: 'Seedream 3.0',
        // @ts-ignore
        schema,
        inputReference: '#/components/schemas/Seedream3Input',
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

export default Seedream3;
