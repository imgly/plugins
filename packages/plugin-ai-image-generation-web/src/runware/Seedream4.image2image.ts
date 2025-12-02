import {
  type Provider,
  type ImageOutput,
  CommonProperties,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import Seedream4Image2ImageSchema from './Seedream4.image2image.json';
import createImageProvider from './createImageProvider';
import { RunwareProviderConfiguration } from './types';
import { adjustDimensions } from './utils';

/**
 * Input interface for Seedream 4.0 image-to-image
 */
export type Seedream4Image2ImageInput = {
  prompt: string;
  image_url: string;
};

/**
 * Seedream 4.0 dimension constraints
 * Based on Runware API documentation:
 * - Supports 1K, 2K, and 4K resolutions
 * - Values must be divisible by 64
 */
const SEEDREAM4_DIMENSION_CONSTRAINTS = {
  width: { min: 128, max: 2048 },
  height: { min: 128, max: 2048 },
  multiple: 64
};

/**
 * Seedream 4.0 Image-to-Image - Transform images using ByteDance's Seedream 4.0
 *
 * AIR: bytedance:5@0
 *
 * Features:
 * - Character consistency across outputs
 * - Text-guided image editing
 * - Up to 14 reference images
 *
 * Specifications:
 * - Resolution: 1K, 2K, and 4K options
 * - Prompt: 1-2,000 characters
 * - Dimensions must be divisible by 64
 */
export function Seedream4Image2Image(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Seedream4Image2ImageInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'runware/bytedance/seedream-4/image2image';

    // Set translations for the panel
    cesdk.i18n.setTranslations({
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]:
          'Select Image To Edit',
        [`libraries.${getPanelId(providerId)}.history.label`]:
          'Generated From Image'
      }
    });

    return createImageProvider<Seedream4Image2ImageInput>(
      {
        modelAIR: 'bytedance:5@0',
        providerId,
        name: 'Seedream 4.0',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Seedream4Image2ImageSchema,
        inputReference: '#/components/schemas/Seedream4Image2ImageInput',
        cesdk,
        middleware: config.middlewares ?? [],
        renderCustomProperty: CommonProperties.ImageUrl(providerId, {
          cesdk
        }),
        dimensionConstraints: SEEDREAM4_DIMENSION_CONSTRAINTS,
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
          }
        },
        getBlockInput: async (input) => {
          if (input.image_url == null) {
            throw new Error('No image URL provided');
          }

          const { width, height } = await getImageDimensionsFromURL(
            input.image_url,
            cesdk.engine
          );
          // Adjust dimensions to meet Seedream 4.0 constraints (128-2048, multiples of 64)
          const adjusted = adjustDimensions(
            width,
            height,
            SEEDREAM4_DIMENSION_CONSTRAINTS
          );
          return Promise.resolve({
            image: {
              width: adjusted.width,
              height: adjusted.height
            }
          });
        },
        mapInput: (input) => {
          // Map to Runware API format
          // Seedream 4.0 uses inputs.referenceImages for image-to-image
          return {
            positivePrompt: input.prompt,
            inputs: {
              referenceImages: [input.image_url]
            }
          };
        }
      },
      config
    );
  };
}

export default Seedream4Image2Image;
