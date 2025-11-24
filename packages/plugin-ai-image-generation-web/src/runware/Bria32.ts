import { Provider, addIconSetOnce } from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import schema from './Bria32.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';
import { RunwareProviderConfiguration, ASPECT_RATIO_MAP } from './types';

type Bria32Input = {
  prompt: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:5' | '3:2';
};

type Bria32Output = {
  kind: 'image';
  url: string;
};

// Bria 3.2 specific aspect ratio map (includes 4:5)
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

export function Bria32(config: RunwareProviderConfiguration) {
  return async ({
    cesdk
  }: {
    cesdk: CreativeEditorSDK;
  }): Promise<Provider<'image', Bria32Input, Bria32Output>> => {
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider(
      {
        modelAIR: 'bria:10@1',
        providerId: 'runware/bria/bria-32',
        name: 'Bria 3.2',
        // @ts-ignore
        schema,
        inputReference: '#/components/schemas/Bria32Input',
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

export default Bria32;
