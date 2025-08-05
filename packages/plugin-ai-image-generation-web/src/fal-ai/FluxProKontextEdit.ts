import {
  ImageOutput,
  type Provider,
  type CommonProviderConfiguration,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import schema from './FluxProKontextEdit.json';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';

type FluxProKontextEditInput = {
  prompt: string;
  image_url: string;
};

export function FluxProKontextEdit(
  config: CommonProviderConfiguration<FluxProKontextEditInput, ImageOutput>
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', FluxProKontextEditInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const modelKey = 'fal-ai/flux-pro/kontext';

    // Set translations
    cesdk.i18n.setTranslations({
      en: {
        'ly.img.ai.quickAction.styleTransfer': 'Change Art Style',
        'ly.img.ai.quickAction.artists': 'Painted By',
        [`panel.${getPanelId(modelKey)}.imageSelection`]:
          'Select Image To Change',
        [`panel.${modelKey}.imageSelection`]: 'Select Image To Change',
        [`libraries.${getPanelId(modelKey)}.history.label`]:
          'Generated From Image'
      }
    });

    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: CommonProviderConfiguration<FluxProKontextEditInput, ImageOutput>
): Provider<'image', FluxProKontextEditInput, ImageOutput> {
  const modelKey = 'fal-ai/flux-pro/kontext';

  return createImageProvider(
    {
      modelKey,
      name: 'Flux Pro Kontext',
      // @ts-ignore
      schema,
      inputReference: '#/components/schemas/FluxProKontextInput',
      cesdk,
      middlewares: config.middlewares,
      headers: config.headers,
      supportedQuickActions: {
        'ly.img.swapBackground': {
          mapInput: (input: any) => ({ ...input, image_url: input.uri })
        },
        'ly.img.editImage': {
          mapInput: (input: any) => ({ ...input, image_url: input.uri })
        },
        'ly.img.createVariant': {
          mapInput: (input: any) => ({ ...input, image_url: input.uri })
        },
        'ly.img.styleTransfer': {
          mapInput: (input: any) => ({
            prompt: input.style,
            image_url: input.uri
          })
        },
        'ly.img.artistTransfer': {
          mapInput: (input: any) => ({
            prompt: input.artist,
            image_url: input.uri
          })
        }
      },
      getBlockInput: async (input) => {
        const { width, height } = await getImageDimensionsFromURL(
          input.image_url,
          cesdk.engine
        );
        return Promise.resolve({
          image: {
            width,
            height
          }
        });
      }
    },
    config
  );
}

export default getProvider;
