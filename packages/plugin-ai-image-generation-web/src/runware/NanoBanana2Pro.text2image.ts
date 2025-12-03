import {
  type Provider,
  type ImageOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import NanoBanana2ProSchema from './NanoBanana2Pro.text2image.json';
import createImageProvider from './createImageProvider';
import {
  RunwareProviderConfiguration,
  getImageDimensionsFromAspectRatio
} from './types';

/**
 * Input interface for Nano Banana 2 Pro text-to-image
 */
export type NanoBanana2ProInput = {
  prompt: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
};

/**
 * Nano Banana 2 Pro (Gemini 3 Pro) - Google's advanced AI image generation model
 *
 * AIR: google:4@2
 *
 * Features:
 * - Professional-grade controls
 * - Enhanced reasoning capabilities
 * - Supports 1K, 2K, and 4K resolutions
 * - Invisible SynthID digital watermark
 *
 * Specifications:
 * - Prompt: 3-45,000 characters
 * - Up to 14 reference images (I2I mode)
 */
export function NanoBanana2Pro(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', NanoBanana2ProInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add aspect ratio icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider<NanoBanana2ProInput>(
      {
        modelId: 'google:4@2',
        providerId: 'runware/google/nano-banana-2-pro',
        name: 'Nano Banana 2 Pro',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: NanoBanana2ProSchema,
        inputReference: '#/components/schemas/NanoBanana2ProInput',
        cesdk,
        middleware: config.middlewares ?? [],
        getImageSize: (input) =>
          getImageDimensionsFromAspectRatio(input.aspect_ratio ?? '1:1'),
        mapInput: (input) => {
          const dims = getImageDimensionsFromAspectRatio(
            input.aspect_ratio ?? '1:1'
          );
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

export default NanoBanana2Pro;
