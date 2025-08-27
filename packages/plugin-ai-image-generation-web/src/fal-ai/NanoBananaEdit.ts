import {
  ImageOutput,
  type Provider,
  type CommonProviderConfiguration,
  getPanelId,
  CommonProperties
} from '@imgly/plugin-ai-generation-web';
import schema from './NanoBananaEdit.json';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';

type NanoBananaEditInput = {
  prompt: string;
  image_url?: string; // For UI compatibility
  image_urls?: string[]; // For API compatibility
};

export function NanoBananaEdit(
  config: CommonProviderConfiguration<NanoBananaEditInput, ImageOutput>
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', NanoBananaEditInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const modelKey = 'fal-ai/nano-banana/edit';

    // Set translations
    cesdk.i18n.setTranslations({
      en: {
        [`panel.${getPanelId(modelKey)}.imageSelection`]:
          'Select Image To Edit',
        [`panel.${modelKey}.imageSelection`]: 'Select Image To Edit',
        [`libraries.${getPanelId(modelKey)}.history.label`]:
          'Generated From Image'
      }
    });

    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: CommonProviderConfiguration<NanoBananaEditInput, ImageOutput>
): Provider<'image', NanoBananaEditInput, ImageOutput> {
  const modelKey = 'fal-ai/nano-banana/edit';

  return createImageProvider(
    {
      modelKey,
      name: 'Nano Banana Edit',
      // @ts-ignore
      schema,
      inputReference: '#/components/schemas/NanoBananaEditInput',
      cesdk,
      supportedQuickActions: {
        'ly.img.editImage': {
          mapInput: (input) => ({
            prompt: input.prompt,
            image_url: input.uri
          })
        },
        'ly.img.swapBackground': {
          mapInput: (input) => ({
            prompt: input.prompt,
            image_url: input.uri
          })
        },
        'ly.img.styleTransfer': {
          mapInput: (input) => ({
            prompt: input.style,
            image_url: input.uri
          })
        },
        'ly.img.artistTransfer': {
          mapInput: (input) => ({
            prompt: input.artist,
            image_url: input.uri
          })
        },
        'ly.img.createVariant': {
          mapInput: (input) => ({
            prompt: input.prompt,
            image_url: input.uri
          })
        }
      },
      renderCustomProperty: CommonProperties.ImageUrl(modelKey, {
        cesdk
      }),
      middleware: [
        // Convert image_url to image_urls array for this model
        async (input, options, next) => {
          let processedInput = input;

          // Convert single image_url to image_urls array if needed
          if (input.image_url && !input.image_urls) {
            processedInput = {
              ...input,
              image_urls: [input.image_url]
            };
            // Remove the image_url since the API expects image_urls
            delete processedInput.image_url;
          }

          return next(processedInput, options);
        },
        ...(config.middlewares ?? config.middleware ?? [])
      ],
      headers: config.headers,
      getBlockInput: async (input) => {
        // Handle both image_url and image_urls - prefer image_url for UI, fallback to image_urls
        let imageUrl = input.image_url;
        if (!imageUrl && input.image_urls && input.image_urls.length > 0) {
          imageUrl = input.image_urls[0];
        }

        if (!imageUrl) {
          throw new Error('No image URL provided');
        }

        const { width, height } = await getImageDimensionsFromURL(
          imageUrl,
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
