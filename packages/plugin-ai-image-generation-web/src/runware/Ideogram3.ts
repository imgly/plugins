import { Provider, addIconSetOnce } from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import schema from './Ideogram3.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';
import { RunwareProviderConfiguration } from './types';

// Ideogram 3.0 dimensions: 128-2048px, divisible by 64
// Use preset aspect ratios that map to valid dimensions
const IDEOGRAM3_SIZE_MAP: Record<string, { width: number; height: number }> = {
  square: { width: 1024, height: 1024 },
  square_hd: { width: 1024, height: 1024 }, // Max supported square
  portrait_4_3: { width: 896, height: 1152 }, // 3:4 ratio, divisible by 64
  portrait_16_9: { width: 768, height: 1344 }, // 9:16 ratio, divisible by 64
  landscape_4_3: { width: 1152, height: 896 }, // 4:3 ratio, divisible by 64
  landscape_16_9: { width: 1344, height: 768 } // 16:9 ratio, divisible by 64
};

function getIdeogram3Dimensions(imageSize: string): {
  width: number;
  height: number;
} {
  return IDEOGRAM3_SIZE_MAP[imageSize] ?? { width: 1024, height: 1024 };
}

type Ideogram3Input = {
  prompt: string;
  style?: 'AUTO' | 'GENERAL' | 'REALISTIC' | 'DESIGN' | 'RENDER_3D' | 'ANIME';
  image_size?: string;
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
          return getIdeogram3Dimensions(input.image_size ?? 'square');
        },
        mapInput: (input) => {
          const dims = getIdeogram3Dimensions(input.image_size ?? 'square');
          return {
            positivePrompt: input.prompt,
            width: dims.width,
            height: dims.height
          };
        }
      },
      config
    );
  };
}

export default Ideogram3;
