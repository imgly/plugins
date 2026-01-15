import {
  ImageOutput,
  CommonProviderConfiguration,
  type Provider,
  getPanelId,
  setDefaultTranslations
} from '@imgly/plugin-ai-generation-web';
import NanoBananaProSchema from './NanoBananaPro.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';

type NanoBananaProInput = {
  prompt: string;
  aspect_ratio?:
    | '1:1'
    | '3:2'
    | '2:3'
    | '4:3'
    | '3:4'
    | '16:9'
    | '9:16'
    | '21:9'
    | '9:21'
    | '2.4:1';
  resolution?: '1K' | '2K' | '4K';
  num_images?: number;
  sync_mode?: boolean;
  output_format?: 'jpeg' | 'png';
};

const ASPECT_RATIO_MAP: Record<
  string,
  { width: number; height: number; icon?: string }
> = {
  '1:1': { width: 1024, height: 1024, icon: 'ratio1by1' },
  '3:2': { width: 1536, height: 1024, icon: 'ratio4by3' }, // landscape
  '2:3': { width: 1024, height: 1536, icon: 'ratio3by4' }, // portrait
  '4:3': { width: 1536, height: 1152, icon: 'ratio4by3' },
  '3:4': { width: 1152, height: 1536, icon: 'ratio3by4' },
  '16:9': { width: 1920, height: 1080, icon: 'ratio16by9' },
  '9:16': { width: 1080, height: 1920, icon: 'ratio9by16' },
  '21:9': { width: 2560, height: 1080, icon: 'ratio16by9' }, // ultra-wide, use 16:9 icon
  '9:21': { width: 1080, height: 2520, icon: 'ratio9by16' }, // ultra-tall, use 9:16 icon
  '2.4:1': { width: 2400, height: 1000, icon: 'ratio16by9' } // cinematic, use 16:9 icon
};

function getImageDimensions(input: NanoBananaProInput): {
  width: number;
  height: number;
} {
  const aspectRatio = input.aspect_ratio ?? '1:1';
  const baseDimensions = ASPECT_RATIO_MAP[aspectRatio];

  if (!baseDimensions) {
    return { width: 1024, height: 1024 };
  }

  const resolution = input.resolution ?? '1K';
  let scale = 1;

  switch (resolution) {
    case '1K':
      scale = 1;
      break;
    case '2K':
      scale = 2;
      break;
    case '4K':
      scale = 4;
      break;
    default:
      scale = 1;
      break;
  }

  return {
    width: baseDimensions.width * scale,
    height: baseDimensions.height * scale
  };
}

export function NanoBananaPro(
  config: CommonProviderConfiguration<NanoBananaProInput, ImageOutput>
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', NanoBananaProInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: CommonProviderConfiguration<NanoBananaProInput, ImageOutput>
): Provider<'image', NanoBananaProInput, ImageOutput> {
  const modelKey = 'fal-ai/nano-banana-pro';

  setDefaultTranslations(cesdk, {
    en: {
      [`libraries.${getPanelId(modelKey)}.history.label`]: 'Generated From Text'
    }
  });

  return createImageProvider(
    {
      modelKey,
      name: 'Nano Banana Pro',
      // @ts-ignore
      schema: NanoBananaProSchema,
      inputReference: '#/components/schemas/NanoBananaProInput',
      middleware: config.middlewares ?? config.middleware ?? [],
      headers: config.headers,
      userFlow: 'placeholder',
      supportedQuickActions: {
        'ly.img.remixPageWithPrompt': {
          mapInput: (input) => ({
            prompt: input.prompt
          })
        }
      },
      getBlockInput: (input) => {
        const dimensions = getImageDimensions(input);
        return Promise.resolve({
          image: {
            width: dimensions.width,
            height: dimensions.height
          }
        });
      }
    },
    config
  );
}

export default getProvider;
