import {
  type Provider,
  type ImageOutput,
  CommonProperties,
  getPanelId,
  setDefaultTranslations
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import Seedream45Image2ImageSchema from './Seedream45.image2image.json';
import createImageProvider from './createImageProvider';
import { EachLabsProviderConfiguration } from './types';

/**
 * Input interface for Seedream v4.5 image-to-image
 */
export type Seedream45Image2ImageInput = {
  prompt: string;
  image_url?: string;
  image_urls?: string[];
};

/**
 * Seedream v4.5 Edit - Transform images using AI via EachLabs
 *
 * Features:
 * - High-quality image transformation
 * - Supports up to 10 reference images
 * - Improved facial details and text generation over v4.0
 */
export function Seedream45Image2Image(
  config: EachLabsProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Seedream45Image2ImageInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'eachlabs/seedream-v4.5/edit';

    // Set translations for the panel
    setDefaultTranslations(cesdk, {
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]:
          'Select Image To Edit',
        [`libraries.${getPanelId(providerId)}.history.label`]:
          'Generated From Image'
      }
    });

    return createImageProvider<Seedream45Image2ImageInput>(
      {
        modelSlug: 'bytedance-seedream-v4-5-edit',
        modelVersion: '0.0.1',
        providerId,
        name: 'Seedream v4.5 Edit',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Seedream45Image2ImageSchema,
        inputReference: '#/components/schemas/Seedream45Image2ImageInput',
        cesdk,
        middleware: config.middlewares ?? [],
        renderCustomProperty: CommonProperties.ImageUrl(providerId, {
          cesdk
        }),
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
          },
          'ly.img.combineImages': {
            mapInput: (input) => ({
              prompt: input.prompt,
              image_urls: input.uris
            })
          }
        },
        getBlockInput: async (input) => {
          // Get first image URL from either single or array input
          const firstImageUrl = input.image_url ?? input.image_urls?.[0];
          if (firstImageUrl == null) {
            throw new Error('No image URL provided');
          }

          // Get dimensions from input image for UI placeholder
          const { width, height } = await getImageDimensionsFromURL(
            firstImageUrl,
            cesdk.engine
          );
          return Promise.resolve({
            image: {
              width,
              height
            }
          });
        },
        mapInput: (input) => {
          // Map to EachLabs API format
          // bytedance-seedream-v4-5-edit uses image_urls (array) for image input
          const imageUrls =
            input.image_urls ?? (input.image_url ? [input.image_url] : []);
          return {
            prompt: input.prompt,
            image_urls: imageUrls
          };
        }
      },
      config
    );
  };
}

export default Seedream45Image2Image;
