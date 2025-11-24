import { Provider, addIconSetOnce } from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import schema from './BriaFibo.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';
import { RunwareProviderConfiguration, ASPECT_RATIO_MAP } from './types';

type BriaFiboInput = {
  prompt: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:5' | '3:2';
};

type BriaFiboOutput = {
  kind: 'image';
  url: string;
};

// Bria FIBO specific aspect ratio map (includes 4:5)
const BRIA_ASPECT_RATIO_MAP: Record<string, { width: number; height: number }> =
  {
    ...ASPECT_RATIO_MAP,
    '4:5': { width: 896, height: 1120 }
  };

function getBriaImageDimensions(aspectRatio: string): {
  width: number;
  height: number;
} {
  return BRIA_ASPECT_RATIO_MAP[aspectRatio] ?? { width: 1024, height: 1024 };
}

export function BriaFibo(config: RunwareProviderConfiguration) {
  return async ({
    cesdk
  }: {
    cesdk: CreativeEditorSDK;
  }): Promise<Provider<'image', BriaFiboInput, BriaFiboOutput>> => {
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider(
      {
        modelAIR: 'bria:20@1',
        providerId: 'runware/bria/fibo',
        name: 'Bria FIBO',
        // @ts-ignore
        schema,
        inputReference: '#/components/schemas/BriaFiboInput',
        cesdk,
        middleware: config.middlewares ?? [],
        getImageSize: (input) => {
          return getBriaImageDimensions(input.aspect_ratio ?? '1:1');
        },
        mapInput: (input) => {
          const dims = getBriaImageDimensions(input.aspect_ratio ?? '1:1');
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

export default BriaFibo;
