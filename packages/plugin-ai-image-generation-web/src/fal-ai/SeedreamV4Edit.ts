import {
  ImageOutput,
  type Provider,
  type CommonProviderConfiguration,
  getPanelId,
  CommonProperties
} from '@imgly/plugin-ai-generation-web';
import schema from './SeedreamV4Edit.json';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import CreativeEditorSDK, { MimeType } from '@cesdk/cesdk-js';
import createImageProvider from './createImageProvider';

type SeedreamV4EditInput = {
  prompt: string;
  image_url?: string; // For UI compatibility (single image)
  image_urls?: string[]; // For API compatibility (up to 10 images)
  exportFromBlockIds?: number[]; // For combineImages quick action
  num_images?: number;
  image_size?: string | { width: number; height: number };
  max_images?: number;
  seed?: number;
  sync_mode?: boolean;
  enable_safety_checker?: boolean;
};

export function SeedreamV4Edit(
  config: CommonProviderConfiguration<SeedreamV4EditInput, ImageOutput>
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', SeedreamV4EditInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const modelKey = 'fal-ai/bytedance/seedream/v4/edit';

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
  config: CommonProviderConfiguration<SeedreamV4EditInput, ImageOutput>
): Provider<'image', SeedreamV4EditInput, ImageOutput> {
  const modelKey = 'fal-ai/bytedance/seedream/v4/edit';

  return createImageProvider(
    {
      modelKey,
      name: 'Seedream V4 Edit',
      // @ts-ignore
      schema,
      inputReference: '#/components/schemas/SeedreamV4EditInput',
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
        },
        'ly.img.remixPage': {
          mapInput: (input) => ({
            prompt: input.prompt,
            image_url: input.uri
          })
        },
        'ly.img.remixPageWithPrompt': {
          mapInput: (input) => ({
            prompt: input.prompt,
            image_url: input.uri
          })
        }
      },
      renderCustomProperty: CommonProperties.ImageUrl(modelKey, {
        cesdk,
        propertyKey: 'image_url'
      }),
      middleware: [
        // Convert image_url to image_urls array and handle exportFromBlockIds
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
                    targetHeight: 2048,
                    targetWidth: 2048
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
