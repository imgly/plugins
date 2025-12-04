import {
  type Provider,
  type ImageOutput,
  CommonProperties,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import NanoBanana2ProImage2ImageSchema from './NanoBanana2Pro.image2image.json';
import createImageProvider from './createImageProvider';
import { RunwareProviderConfiguration } from './types';

/**
 * Input interface for Nano Banana 2 Pro image-to-image
 */
export type NanoBanana2ProImage2ImageInput = {
  prompt: string;
  image_url?: string;
  image_urls?: string[];
};

/**
 * Nano Banana 2 Pro Image-to-Image - Transform images using Google's Gemini 3 Pro
 *
 * AIR: google:4@2
 *
 * Features:
 * - Professional-grade controls
 * - Enhanced reasoning capabilities
 * - Style and lighting transfer
 * - Up to 14 reference images
 *
 * Specifications:
 * - Resolution: 1K, 2K, and 4K options
 * - Prompt: 3-45,000 characters
 * - Input image: 300-2048 pixels, max 20MB
 */
export function NanoBanana2ProImage2Image(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', NanoBanana2ProImage2ImageInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'runware/google/nano-banana-2-pro/image2image';

    // Set translations for the panel
    cesdk.i18n.setTranslations({
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]:
          'Select Image To Edit',
        [`libraries.${getPanelId(providerId)}.history.label`]:
          'Generated From Image'
      }
    });

    return createImageProvider<NanoBanana2ProImage2ImageInput>(
      {
        modelId: 'google:4@2',
        providerId,
        name: 'Nano Banana 2 Pro',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: NanoBanana2ProImage2ImageSchema,
        inputReference: '#/components/schemas/NanoBanana2ProImage2ImageInput',
        cesdk,
        middleware: config.middlewares ?? [],
        renderCustomProperty: CommonProperties.ImageUrl(providerId, {
          cesdk
        }),
        // API auto-detects dimensions from reference image - don't send width/height
        skipAutoDimensions: true,
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
          // API will auto-detect dimensions from the reference image
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
          // Map to Runware API format
          // Nano Banana 2 Pro uses inputs.referenceImages for image-to-image
          // Supports up to 14 reference images
          const referenceImages =
            input.image_urls ?? (input.image_url ? [input.image_url] : []);
          return {
            positivePrompt: input.prompt,
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

export default NanoBanana2ProImage2Image;
