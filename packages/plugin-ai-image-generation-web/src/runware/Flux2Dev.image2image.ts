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
import Flux2DevImage2ImageSchema from './Flux2Dev.image2image.json';
import createImageProvider from './createImageProvider';
import { RunwareProviderConfiguration } from './types';
import { adjustDimensions } from './utils';

/**
 * Input interface for FLUX.2 [dev] image-to-image
 */
export type Flux2DevImage2ImageInput = {
  prompt: string;
  image_url?: string;
  image_urls?: string[];
};

/**
 * FLUX.2 [dev] Image-to-Image - Transform images using FLUX.2 [dev]
 *
 * AIR: runware:400@1
 *
 * Features:
 * - Full architectural control for developers
 * - Flexible sampling behavior and guidance strategies
 * - Image transformation with text prompts
 * - Up to 4 reference images
 *
 * Specifications:
 * - Resolution: 512-2048 pixels (multiples of 16)
 * - CFG Scale: 1-20 (default: 4)
 * - Steps: 1-50
 * - Prompt: 1-10,000 characters
 */
export function Flux2DevImage2Image(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Flux2DevImage2ImageInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'runware/bfl/flux-2-dev/image2image';

    // Set translations for the panel
    setDefaultTranslations(cesdk, {
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]:
          'Select Image To Edit',
        [`libraries.${getPanelId(providerId)}.history.label`]:
          'Generated From Image'
      }
    });

    return createImageProvider<Flux2DevImage2ImageInput>(
      {
        modelId: 'runware:400@1',
        providerId,
        name: 'FLUX.2 [dev]',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Flux2DevImage2ImageSchema,
        inputReference: '#/components/schemas/Flux2DevImage2ImageInput',
        cesdk,
        middleware: config.middlewares ?? [],
        renderCustomProperty: CommonProperties.ImageUrl(providerId, {
          cesdk
        }),
        dimensionConstraints: {
          width: { min: 512, max: 2048 },
          height: { min: 512, max: 2048 },
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
          // Adjust dimensions to meet FLUX.2 [dev] constraints (512-2048, multiples of 16)
          const adjusted = adjustDimensions(width, height, {
            width: { min: 512, max: 2048 },
            height: { min: 512, max: 2048 },
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
          // FLUX.2 [dev] uses inputs.referenceImages for image-to-image
          // Supports up to 4 reference images
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

export default Flux2DevImage2Image;
