import {
  type Provider,
  type ImageOutput,
  CommonProperties,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import Flux2ProImage2ImageSchema from './Flux2Pro.image2image.json';
import createImageProvider from './createImageProvider';
import { RunwareProviderConfiguration } from './types';
import { adjustDimensions } from './utils';

/**
 * Input interface for FLUX.2 [pro] image-to-image
 */
export type Flux2ProImage2ImageInput = {
  prompt: string;
  image_url?: string;
  image_urls?: string[];
};

/**
 * FLUX.2 [pro] Image-to-Image - Transform images using FLUX.2 [pro]
 *
 * AIR: bfl:5@1
 *
 * Features:
 * - Professional model from Black Forest Labs
 * - Image transformation with text prompts
 * - Up to 9 reference images
 * - Prompt upsampling support
 *
 * Specifications:
 * - Resolution: 256-1920 pixels (multiples of 16)
 * - Max output: 4 megapixels
 * - Prompt: 1-3,000 characters
 */
export function Flux2ProImage2Image(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Flux2ProImage2ImageInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'runware/bfl/flux-2-pro/image2image';

    // Set translations for the panel
    cesdk.i18n.setTranslations({
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]:
          'Select Image To Edit',
        [`libraries.${getPanelId(providerId)}.history.label`]:
          'Generated From Image'
      }
    });

    return createImageProvider<Flux2ProImage2ImageInput>(
      {
        modelId: 'bfl:5@1',
        providerId,
        name: 'FLUX.2 [pro]',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Flux2ProImage2ImageSchema,
        inputReference: '#/components/schemas/Flux2ProImage2ImageInput',
        cesdk,
        middleware: config.middlewares ?? [],
        renderCustomProperty: CommonProperties.ImageUrl(providerId, {
          cesdk
        }),
        dimensionConstraints: {
          width: { min: 256, max: 1920 },
          height: { min: 256, max: 1920 },
          multiple: 16
        },
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

          const { width, height } = await getImageDimensionsFromURL(
            firstImageUrl,
            cesdk.engine
          );
          // Adjust dimensions to meet FLUX.2 [pro] constraints (256-1920, multiples of 16)
          const adjusted = adjustDimensions(width, height, {
            width: { min: 256, max: 1920 },
            height: { min: 256, max: 1920 },
            multiple: 16
          });
          return Promise.resolve({
            image: {
              width: adjusted.width,
              height: adjusted.height
            }
          });
        },
        mapInput: (input) => {
          // Map to Runware API format
          // FLUX.2 [pro] uses inputs.referenceImages for image-to-image
          // Supports up to 9 reference images
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

export default Flux2ProImage2Image;
