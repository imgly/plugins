import {
  type Provider,
  type ImageOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import GptImage1Schema from './GptImage1.text2image.json';
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
 * Input interface for GPT Image 1 text-to-image
 */
export type GptImage1Input = {
  prompt: string;
  format?: '1024x1024' | '1536x1024' | '1024x1536';
};

/**
 * GPT Image 1 - OpenAI's advanced AI image generation model
 *
 * AIR: openai:1@1
 *
 * Features:
 * - High-fidelity image generation with GPT-4o architecture
 * - Enhanced prompt following and superior text rendering
 * - Advanced multimodal capabilities
 *
 * Specifications:
 * - Prompt: up to 32,000 characters
 * - Dimensions: 1024×1024, 1536×1024, 1024×1536
 */
export function GptImage1(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', GptImage1Input, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add format icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider<GptImage1Input>(
      {
        modelId: 'openai:1@1',
        providerId: 'runware/openai/gpt-image-1',
        name: 'GPT Image 1',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: GptImage1Schema,
        inputReference: '#/components/schemas/GptImage1Input',
        cesdk,
        middleware: config.middlewares ?? [],
        getImageSize: (input) =>
          GPT_IMAGE_1_DIMENSIONS[input.format ?? '1024x1024'],
        mapInput: (input) => {
          const dims = GPT_IMAGE_1_DIMENSIONS[input.format ?? '1024x1024'];
          return {
            positivePrompt: input.prompt,
            width: dims.width,
            height: dims.height
          };
        }
      },
      config
    );
  };
}

export default GptImage1;
