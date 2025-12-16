import {
  type Provider,
  type ImageOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import OpenAIImageSchema from './OpenAIImage.text2image.json';
import createImageProvider from './createImageProvider';
import { EachLabsProviderConfiguration } from './types';

// Map EachLabs image_size enum to dimensions
const IMAGE_SIZE_MAP: Record<string, { width: number; height: number }> = {
  '1024x1024': { width: 1024, height: 1024 },
  '1536x1024': { width: 1536, height: 1024 },
  '1024x1536': { width: 1024, height: 1536 }
};

/**
 * Input interface for OpenAI GPT Image text-to-image
 */
export type OpenAIImageText2ImageInput = {
  prompt: string;
  image_size?: '1024x1024' | '1536x1024' | '1024x1536';
};

/**
 * OpenAI GPT Image - High-quality text-to-image generation via EachLabs
 *
 * Features:
 * - 3 image size options (Square, Landscape, Portrait)
 * - High-quality generation from OpenAI
 */
export function OpenAIImageText2Image(
  config: EachLabsProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', OpenAIImageText2ImageInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add aspect ratio icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider<OpenAIImageText2ImageInput>(
      {
        modelSlug: 'openai-image-generation',
        modelVersion: '0.0.1',
        providerId: 'eachlabs/openai-gpt-image',
        name: 'OpenAI GPT Image',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: OpenAIImageSchema,
        inputReference: '#/components/schemas/OpenAIImageText2ImageInput',
        cesdk,
        getImageSize: (input) =>
          IMAGE_SIZE_MAP[input.image_size ?? '1024x1024'] ?? {
            width: 1024,
            height: 1024
          },
        mapInput: (input) => ({
          prompt: input.prompt,
          image_size: input.image_size ?? '1024x1024'
        })
      },
      config
    );
  };
}

export default OpenAIImageText2Image;
