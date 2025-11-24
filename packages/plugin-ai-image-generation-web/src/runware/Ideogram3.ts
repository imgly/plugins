import { Provider, addIconSetOnce } from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import schema from './Ideogram3.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';
import {
  RunwareProviderConfiguration,
  getImageDimensionsFromSize
} from './types';
import { isCustomImageSize } from './utils';

type Ideogram3Input = {
  prompt: string;
  style?: 'AUTO' | 'GENERAL' | 'REALISTIC' | 'DESIGN' | 'RENDER_3D' | 'ANIME';
  image_size?: string | { width: number; height: number };
};

type Ideogram3Output = {
  kind: 'image';
  url: string;
};

export function Ideogram3(config: RunwareProviderConfiguration) {
  return async ({
    cesdk
  }: {
    cesdk: CreativeEditorSDK;
  }): Promise<Provider<'image', Ideogram3Input, Ideogram3Output>> => {
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider(
      {
        modelAIR: 'ideogram:4@1',
        providerId: 'runware/ideogram/v3',
        name: 'Ideogram 3.0',
        // @ts-ignore
        schema,
        inputReference: '#/components/schemas/Ideogram3Input',
        cesdk,
        middleware: config.middlewares ?? [],
        getImageSize: (input) => {
          if (isCustomImageSize(input.image_size)) {
            return {
              width: input.image_size.width ?? 1024,
              height: input.image_size.height ?? 1024
            };
          }
          return getImageDimensionsFromSize(input.image_size ?? 'square_hd');
        },
        mapInput: (input) => {
          let width: number;
          let height: number;
          if (isCustomImageSize(input.image_size)) {
            width = input.image_size.width ?? 1024;
            height = input.image_size.height ?? 1024;
          } else {
            const dims = getImageDimensionsFromSize(
              input.image_size ?? 'square_hd'
            );
            width = dims.width;
            height = dims.height;
          }
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

export default Ideogram3;
