import {
  ImageOutput,
  type Provider,
  type CommonProviderConfiguration,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import schema from './GeminiFlash25.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';

type GeminiFlash25Input = {
  prompt: string;
  aspect_ratio?:
    | '1:1'
    | '3:4'
    | '4:3'
    | '9:16'
    | '16:9'
    | { width: number; height: number };
  output_format?: 'jpeg' | 'png' | 'webp';
  num_images?: number;
  safety_settings?: Array<{
    category: string;
    threshold: string;
  }>;
  seed?: number;
};

const ASPECT_RATIO_MAP: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '3:4': { width: 768, height: 1024 },
  '4:3': { width: 1024, height: 768 },
  '9:16': { width: 576, height: 1024 },
  '16:9': { width: 1024, height: 576 }
};

function getImageDimensions(
  aspectRatio: string | { width: number; height: number }
): { width: number; height: number } {
  if (typeof aspectRatio === 'object') {
    return aspectRatio;
  }
  return ASPECT_RATIO_MAP[aspectRatio] ?? ASPECT_RATIO_MAP['1:1'];
}

export function GeminiFlash25(
  config: CommonProviderConfiguration<GeminiFlash25Input, ImageOutput>
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', GeminiFlash25Input, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const modelKey = 'fal-ai/gemini-25-flash-image';

    // Set translations
    cesdk.i18n.setTranslations({
      en: {
        [`libraries.${getPanelId(modelKey)}.history.label`]:
          'Generated From Text'
      }
    });

    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: CommonProviderConfiguration<GeminiFlash25Input, ImageOutput>
): Provider<'image', GeminiFlash25Input, ImageOutput> {
  const modelKey = 'fal-ai/gemini-25-flash-image';

  return createImageProvider(
    {
      modelKey,
      name: 'Gemini Flash 2.5',
      // @ts-ignore
      schema,
      inputReference: '#/components/schemas/GeminiFlash25Input',
      cesdk,
      supportedQuickActions: {
        'ly.img.generateImage': {
          mapInput: (input) => ({
            prompt: input.prompt
          })
        }
      },
      middleware: config.middlewares ?? config.middleware ?? [],
      headers: config.headers,
      getBlockInput: async (input) => {
        const dimensions = getImageDimensions(input.aspect_ratio ?? '1:1');
        return Promise.resolve({
          image: dimensions
        });
      }
    },
    config
  );
}

export default getProvider;
