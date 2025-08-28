import {
  ImageOutput,
  type Provider,
  type CommonProviderConfiguration,
  getPanelId,
  CommonProperties
} from '@imgly/plugin-ai-generation-web';
import schema from './NanoBananaEdit.json';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import CreativeEditorSDK, { MimeType } from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';

type NanoBananaEditInput = {
  prompt: string;
  image_url?: string; // For UI compatibility
  image_urls?: string[]; // For API compatibility (up to 10 images)
  exportFromBlockIds?: number[]; // For combineImages quick action
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
        },
        'ly.img.combineImages': {
          mapInput: (input) => ({
            prompt: input.prompt,
            image_urls: input.uris,
            exportFromBlockIds: input.exportFromBlockIds
          })
        }
      },
      renderCustomProperty: CommonProperties.ImageUrl(modelKey, {
        cesdk
      }),
      middleware: [
        // Convert image_url to image_urls array and handle exportFromBlockIds for this model
        async (input, options, next) => {
          let processedInput = input;

          // Handle exportFromBlockIds for combineImages quick action
          if (input.exportFromBlockIds && input.exportFromBlockIds.length > 0) {
            // Export blocks to image URLs
            const imageUrls = await Promise.all(
              input.exportFromBlockIds.map(async (blockId) => {
                const exportedBlob = await cesdk.engine.block.export(
                  blockId,
                  MimeType.Jpeg,
                  {
                    targetHeight: 1024,
                    targetWidth: 1024
                  }
                );
                return URL.createObjectURL(exportedBlob);
              })
            );

            processedInput = {
              ...input,
              image_urls: imageUrls
            };
            // Remove exportFromBlockIds since the API doesn't need it
            delete processedInput.exportFromBlockIds;
          }
          // Convert single image_url to image_urls array if needed
          else if (input.image_url && !input.image_urls) {
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

        // For multiple images, use dimensions from the first image
        // The model will generate output based on the combined/edited result
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
