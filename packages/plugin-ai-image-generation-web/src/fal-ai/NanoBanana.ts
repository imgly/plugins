import {
  ImageOutput,
  CommonProviderConfiguration,
  type Provider,
  getPanelId,
  setDefaultTranslations
} from '@imgly/plugin-ai-generation-web';
import NanoBananaSchema from './NanoBanana.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';

type NanoBananaInput = {
  prompt: string;
  num_images?: number;
  sync_mode?: boolean;
  output_format?: 'jpeg' | 'png';
};

export function NanoBanana(
  config: CommonProviderConfiguration<NanoBananaInput, ImageOutput>
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', NanoBananaInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: CommonProviderConfiguration<NanoBananaInput, ImageOutput>
): Provider<'image', NanoBananaInput, ImageOutput> {
  const modelKey = 'fal-ai/nano-banana';

  setDefaultTranslations(cesdk, {
    en: {
      [`libraries.${getPanelId(modelKey)}.history.label`]: 'Generated From Text'
    }
  });

  return createImageProvider(
    {
      modelKey,
      name: 'Nano Banana',
      // @ts-ignore
      schema: NanoBananaSchema,
      inputReference: '#/components/schemas/NanoBananaInput',
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
      getBlockInput: () => {
        // Default image size for Nano Banana (model doesn't specify size options)
        return Promise.resolve({
          image: {
            width: 1024,
            height: 1024
          }
        });
      }
    },
    config
  );
}

export default getProvider;
