import {
  type Provider,
  type ImageOutput,
  CommonProperties,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import NanoBananaProImage2ImageSchema from './NanoBananaPro.image2image.json';
import createImageProvider from './createImageProvider';
import { EachLabsProviderConfiguration } from './types';

/**
 * Input interface for Nano Banana Pro image-to-image
 */
export type NanoBananaProImage2ImageInput = {
  prompt: string;
  image_url?: string;
  image_urls?: string[];
  resolution?: '1K' | '2K' | '4K';
};

/**
 * Nano Banana Pro Edit - Transform images using multi-style AI via EachLabs
 *
 * Features:
 * - Multi-style image transformation
 * - Multiple resolution options (1K, 2K, 4K)
 * - Supports up to 10 reference images
 */
export function NanoBananaProImage2Image(
  config: EachLabsProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', NanoBananaProImage2ImageInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'eachlabs/nano-banana-pro/edit';

    // Set translations for the panel
    cesdk.i18n.setTranslations({
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]:
          'Select Image To Edit',
        [`libraries.${getPanelId(providerId)}.history.label`]:
          'Generated From Image'
      }
    });

    return createImageProvider<NanoBananaProImage2ImageInput>(
      {
        modelSlug: 'nano-banana-pro-edit',
        modelVersion: '0.0.1',
        providerId,
        name: 'Nano Banana Pro Edit',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: NanoBananaProImage2ImageSchema,
        inputReference: '#/components/schemas/NanoBananaProImage2ImageInput',
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
          // nano-banana-pro-edit uses image_urls (array) for image input
          const imageUrls =
            input.image_urls ?? (input.image_url ? [input.image_url] : []);
          return {
            prompt: input.prompt,
            image_urls: imageUrls,
            resolution: input.resolution ?? '1K'
          };
        }
      },
      config
    );
  };
}

export default NanoBananaProImage2Image;
