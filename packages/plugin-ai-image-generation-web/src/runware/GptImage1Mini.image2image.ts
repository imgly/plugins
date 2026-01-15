import {
  type Provider,
  type ImageOutput,
  CommonProperties,
  getPanelId,
  addIconSetOnce,
  setDefaultTranslations
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import GptImage1MiniImage2ImageSchema from './GptImage1Mini.image2image.json';
import createImageProvider from './createImageProvider';
import { RunwareProviderConfiguration } from './types';

// GPT Image 1 Mini supported dimensions (same as GPT Image 1)
const GPT_IMAGE_1_MINI_DIMENSIONS: Record<
  string,
  { width: number; height: number }
> = {
  '1024x1024': { width: 1024, height: 1024 },
  '1536x1024': { width: 1536, height: 1024 },
  '1024x1536': { width: 1024, height: 1536 }
};

/**
 * Input interface for GPT Image 1 Mini image-to-image
 */
export type GptImage1MiniImage2ImageInput = {
  prompt: string;
  image_url?: string;
  image_urls?: string[];
  format?: '1024x1024' | '1536x1024' | '1024x1536';
};

/**
 * GPT Image 1 Mini Image-to-Image - Transform images using OpenAI's GPT Image 1 Mini
 *
 * AIR: openai:1@2
 *
 * Features:
 * - ~80% cost savings compared to GPT Image 1
 * - Fast generation times
 * - Instruction-based image transformation
 * - Up to 16 reference images supported
 *
 * Specifications:
 * - Prompt: up to 32,000 characters
 * - Output dimensions: 1024×1024, 1536×1024, 1024×1536
 */
export function GptImage1MiniImage2Image(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', GptImage1MiniImage2ImageInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'runware/openai/gpt-image-1-mini/image2image';

    // Add format icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    // Set translations for the panel
    setDefaultTranslations(cesdk, {
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]:
          'Select Image To Edit',
        [`libraries.${getPanelId(providerId)}.history.label`]:
          'Generated From Image'
      }
    });

    return createImageProvider<GptImage1MiniImage2ImageInput>(
      {
        modelId: 'openai:1@2',
        providerId,
        name: 'GPT Image 1 Mini',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: GptImage1MiniImage2ImageSchema,
        inputReference: '#/components/schemas/GptImage1MiniImage2ImageInput',
        cesdk,
        middleware: config.middlewares ?? [],
        renderCustomProperty: CommonProperties.ImageUrl(providerId, {
          cesdk
        }),
        getImageSize: (input) =>
          GPT_IMAGE_1_MINI_DIMENSIONS[input.format ?? '1024x1024'],
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
          },
          'ly.img.combineImages': {
            mapInput: (input) => ({
              prompt: input.prompt,
              image_urls: input.uris,
              format: '1024x1024'
            })
          }
        },
        getBlockInput: async (input) => {
          // Get first image URL from either single or array input
          const firstImageUrl = input.image_url ?? input.image_urls?.[0];
          if (firstImageUrl == null) {
            throw new Error('No image URL provided');
          }

          // Use the selected format dimensions for the output
          const dims = GPT_IMAGE_1_MINI_DIMENSIONS[input.format ?? '1024x1024'];
          return Promise.resolve({
            image: {
              width: dims.width,
              height: dims.height
            }
          });
        },
        mapInput: (input) => {
          const dims = GPT_IMAGE_1_MINI_DIMENSIONS[input.format ?? '1024x1024'];
          // GPT Image 1 Mini uses root-level referenceImages (not nested under inputs)
          // Supports up to 16 reference images
          const referenceImages =
            input.image_urls ?? (input.image_url ? [input.image_url] : []);
          return {
            positivePrompt: input.prompt,
            referenceImages,
            width: dims.width,
            height: dims.height
          };
        }
      },
      config
    );
  };
}

export default GptImage1MiniImage2Image;
