import {
  type Provider,
  type ImageOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import GptImage1MiniSchema from './GptImage1Mini.text2image.json';
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
 * Input interface for GPT Image 1 Mini text-to-image
 */
export type GptImage1MiniInput = {
  prompt: string;
  format?: '1024x1024' | '1536x1024' | '1024x1536';
};

/**
 * GPT Image 1 Mini - OpenAI's cost-efficient AI image generation model
 *
 * AIR: openai:1@2
 *
 * Features:
 * - ~80% cost savings compared to GPT Image 1
 * - Fast generation times
 * - Same multimodal capabilities as GPT Image 1
 *
 * Specifications:
 * - Prompt: up to 32,000 characters
 * - Dimensions: 1024×1024, 1536×1024, 1024×1536
 */
export function GptImage1Mini(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', GptImage1MiniInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add format icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider<GptImage1MiniInput>(
      {
        modelId: 'openai:1@2',
        providerId: 'runware/openai/gpt-image-1-mini',
        name: 'GPT Image 1 Mini',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: GptImage1MiniSchema,
        inputReference: '#/components/schemas/GptImage1MiniInput',
        cesdk,
        middleware: config.middlewares ?? [],
        getImageSize: (input) =>
          GPT_IMAGE_1_MINI_DIMENSIONS[input.format ?? '1024x1024'],
        mapInput: (input) => {
          const dims = GPT_IMAGE_1_MINI_DIMENSIONS[input.format ?? '1024x1024'];
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

export default GptImage1Mini;
