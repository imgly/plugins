import {
  ImageOutput,
  type Provider,
  type CommonProviderConfiguration,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import schema from './FluxProKontextMaxEdit.json';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';

// Input type limited to prompt & image_url
export type FluxProKontextMaxEditInput = {
  prompt: string;
  image_url: string;
};

export function FluxProKontextMaxEdit(
  config: CommonProviderConfiguration<FluxProKontextMaxEditInput, ImageOutput>
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', FluxProKontextMaxEditInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const modelKey = 'fal-ai/flux-pro/kontext/max';

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
  config: CommonProviderConfiguration<FluxProKontextMaxEditInput, ImageOutput>
): Provider<'image', FluxProKontextMaxEditInput, ImageOutput> {
  const modelKey = 'fal-ai/flux-pro/kontext/max';

  return createImageProvider(
    {
      modelKey,
      name: 'Flux Pro Kontext (Max)',
      // @ts-ignore
      schema,
      inputReference: '#/components/schemas/FluxProKontextMaxEditInput',
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
          mapInput: (input: any) => ({ ...input, image_url: input.uri }),
        },
        'ly.img.styleTransfer': {
          mapInput: (input: any) => ({
            prompt: input.style || input.item?.prompt,
            image_url: input.uri
          }),
          items: [
            {
              id: 'water',
              label: 'Watercolor Painting',
              prompt: 'Convert to watercolor painting.'
            },
            {
              id: 'oil',
              label: 'Oil Painting',
              prompt: 'Render in oil painting style.'
            },
            {
              id: 'charcoal',
              label: 'Charcoal Sketch',
              prompt: 'Transform into a charcoal sketch.'
            },
            {
              id: 'pencil',
              label: 'Pencil Drawing',
              prompt: 'Apply pencil drawing effect.'
            }
          ]
        },
        'ly.img.artistTransfer': {
          mapInput: (input: any) => ({
            prompt: input.artist || input.item?.prompt,
            image_url: input.uri
          }),
          items: [
            {
              id: 'van-gogh',
              label: 'Van Gogh',
              prompt: 'Render this image in the style of Vincent van Gogh.'
            },
            {
              id: 'monet',
              label: 'Monet',
              prompt:
                'Transform this image into the soft, impressionistic style of Claude Monet.'
            }
          ]
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
