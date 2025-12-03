import {
  type Provider,
  type ImageOutput,
  CommonProperties,
  getPanelId,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import GptImage1Image2ImageSchema from './GptImage1.image2image.json';
import createImageProvider from './createImageProvider';
import { RunwareProviderConfiguration } from './types';

// GPT Image 1 supported dimensions
const GPT_IMAGE_1_DIMENSIONS: Record<
  string,
  { width: number; height: number }
> = {
  '1024x1024': { width: 1024, height: 1024 },
  '1536x1024': { width: 1536, height: 1024 },
  '1024x1536': { width: 1024, height: 1536 }
};

/**
 * Input interface for GPT Image 1 image-to-image
 */
export type GptImage1Image2ImageInput = {
  prompt: string;
  image_url: string;
  format?: '1024x1024' | '1536x1024' | '1024x1536';
};

/**
 * GPT Image 1 Image-to-Image - Transform images using OpenAI's GPT Image 1
 *
 * AIR: openai:1@1
 *
 * Features:
 * - High-fidelity image editing with GPT-4o architecture
 * - Instruction-based image transformation
 * - Superior text rendering and prompt following
 * - Up to 16 reference images supported
 *
 * Specifications:
 * - Prompt: up to 32,000 characters
 * - Output dimensions: 1024×1024, 1536×1024, 1024×1536
 */
export function GptImage1Image2Image(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', GptImage1Image2ImageInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'runware/openai/gpt-image-1/image2image';

    // Add format icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    // Set translations for the panel
    cesdk.i18n.setTranslations({
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]:
          'Select Image To Edit',
        [`libraries.${getPanelId(providerId)}.history.label`]:
          'Generated From Image'
      }
    });

    return createImageProvider<GptImage1Image2ImageInput>(
      {
        modelAIR: 'openai:1@1',
        providerId,
        name: 'GPT Image 1',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: GptImage1Image2ImageSchema,
        inputReference: '#/components/schemas/GptImage1Image2ImageInput',
        cesdk,
        middleware: config.middlewares ?? [],
        renderCustomProperty: CommonProperties.ImageUrl(providerId, {
          cesdk
        }),
        getImageSize: (input) =>
          GPT_IMAGE_1_DIMENSIONS[input.format ?? '1024x1024'],
        supportedQuickActions: {
          'ly.img.editImage': {
            mapInput: (input) => ({
              prompt: input.prompt,
              image_url: input.uri,
              format: '1024x1024'
            })
          },
          'ly.img.swapBackground': {
            mapInput: (input) => ({
              prompt: input.prompt,
              image_url: input.uri,
              format: '1024x1024'
            })
          },
          'ly.img.styleTransfer': {
            mapInput: (input) => ({
              prompt: input.style,
              image_url: input.uri,
              format: '1024x1024'
            })
          },
          'ly.img.artistTransfer': {
            mapInput: (input) => ({
              prompt: input.artist,
              image_url: input.uri,
              format: '1024x1024'
            })
          },
          'ly.img.createVariant': {
            mapInput: (input) => ({
              prompt: input.prompt,
              image_url: input.uri,
              format: '1024x1024'
            })
          },
          'ly.img.remixPage': {
            mapInput: (input) => ({
              prompt: input.prompt,
              image_url: input.uri,
              format: '1024x1024'
            })
          },
          'ly.img.remixPageWithPrompt': {
            mapInput: (input) => ({
              prompt: input.prompt,
              image_url: input.uri,
              format: '1024x1024'
            })
          }
        },
        getBlockInput: async (input) => {
          if (input.image_url == null) {
            throw new Error('No image URL provided');
          }

          // Use the selected format dimensions for the output
          const dims = GPT_IMAGE_1_DIMENSIONS[input.format ?? '1024x1024'];
          return Promise.resolve({
            image: {
              width: dims.width,
              height: dims.height
            }
          });
        },
        mapInput: (input) => {
          const dims = GPT_IMAGE_1_DIMENSIONS[input.format ?? '1024x1024'];
          // GPT Image 1 uses root-level referenceImages (not nested under inputs)
          return {
            positivePrompt: input.prompt,
            referenceImages: [input.image_url],
            width: dims.width,
            height: dims.height
          };
        }
      },
      config
    );
  };
}

export default GptImage1Image2Image;
