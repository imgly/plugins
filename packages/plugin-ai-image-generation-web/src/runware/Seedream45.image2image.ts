import {
  type Provider,
  type ImageOutput,
  CommonProperties,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import Seedream45Image2ImageSchema from './Seedream45.image2image.json';
import createImageProvider from './createImageProvider';
import { RunwareProviderConfiguration } from './types';

/**
 * Input interface for Seedream 4.5 image-to-image
 */
export type Seedream45Image2ImageInput = {
  prompt: string;
  image_url?: string;
  image_urls?: string[];
};

/**
 * Seedream 4.5 Image-to-Image - Transform images using ByteDance's Seedream 4.5
 *
 * AIR: bytedance:seedream@4.5
 *
 * Features:
 * - Improved facial detail rendering
 * - Enhanced text generation quality
 * - Multi-image fusion capabilities
 * - Up to 14 reference images
 *
 * Specifications:
 * - Resolution: 2K and 4K options (uses 2K by default)
 * - Prompt: 1-2,000 characters
 * - Min 3,686,400 pixels, max 16,777,216 pixels
 * - Uses resolution parameter to auto-match input image aspect ratio
 */
export function Seedream45Image2Image(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Seedream45Image2ImageInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'runware/bytedance/seedream-4-5/image2image';

    // Set translations for the panel
    cesdk.i18n.setTranslations({
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]:
          'Select Image To Edit',
        [`libraries.${getPanelId(providerId)}.history.label`]:
          'Generated From Image'
      }
    });

    return createImageProvider<Seedream45Image2ImageInput>(
      {
        modelId: 'bytedance:seedream@4.5',
        providerId,
        name: 'Seedream 4.5',
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

          // Get input image dimensions for output block sizing
          // The actual output dimensions will be determined by the resolution parameter
          const { width, height } = await getImageDimensionsFromURL(
            firstImageUrl,
            cesdk.engine
          );

          // Scale up to 2K resolution while preserving aspect ratio
          // Minimum required: 3,686,400 pixels (e.g., 2560×1440)
          const minPixels = 3686400;
          const currentPixels = width * height;
          const scale =
            currentPixels < minPixels
              ? Math.sqrt(minPixels / currentPixels)
              : 1;

          return Promise.resolve({
            image: {
              width: Math.round(width * scale),
              height: Math.round(height * scale)
            }
          });
        },
        mapInput: (input) => {
          // Map to Runware API format
          // Seedream 4.5 uses inputs.referenceImages for image-to-image
          // Use resolution: '2k' to auto-match aspect ratio from first reference image
          // Supports up to 14 reference images
          const referenceImages =
            input.image_urls ?? (input.image_url ? [input.image_url] : []);
          return {
            positivePrompt: input.prompt,
            resolution: '2k',
            inputs: {
              referenceImages
            }
          };
        }
      },
      config
    );
  };
}

export default Seedream45Image2Image;
