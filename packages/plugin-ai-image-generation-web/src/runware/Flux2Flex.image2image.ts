import {
  type Provider,
  type ImageOutput,
  CommonProperties,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import Flux2FlexImage2ImageSchema from './Flux2Flex.image2image.json';
import createImageProvider from './createImageProvider';
import { RunwareProviderConfiguration } from './types';
import { adjustDimensions } from './utils';

/**
 * Input interface for FLUX.2 [flex] image-to-image
 */
export type Flux2FlexImage2ImageInput = {
  prompt: string;
  image_url?: string;
  image_urls?: string[];
};

/**
 * FLUX.2 [flex] Image-to-Image - Transform images using FLUX.2 [flex]
 *
 * AIR: bfl:6@1
 *
 * Features:
 * - Flexible model from Black Forest Labs
 * - Image transformation with text prompts
 * - Up to 10 reference images
 * - Strongest text rendering accuracy in the FLUX family
 * - Excellent typography and branded design support
 *
 * Specifications:
 * - Resolution: 256-1920 pixels (multiples of 16)
 * - Max output: 4 megapixels
 * - Prompt: 1-3,000 characters
 * - CFG Scale: 1-20 (default: 2.5)
 * - Steps: 1-50
 */
export function Flux2FlexImage2Image(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Flux2FlexImage2ImageInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'runware/bfl/flux-2-flex/image2image';

    // Set translations for the panel
    cesdk.i18n.setTranslations({
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]:
          'Select Image To Edit',
        [`libraries.${getPanelId(providerId)}.history.label`]:
          'Generated From Image'
      }
    });

    return createImageProvider<Flux2FlexImage2ImageInput>(
      {
        modelId: 'bfl:6@1',
        providerId,
        name: 'FLUX.2 [flex]',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Flux2FlexImage2ImageSchema,
        inputReference: '#/components/schemas/Flux2FlexImage2ImageInput',
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
          // Adjust dimensions to meet FLUX.2 [flex] constraints (256-1920, multiples of 16)
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
          // FLUX.2 [flex] uses inputs.referenceImages for image-to-image
          // Supports up to 10 reference images
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

export default Flux2FlexImage2Image;
