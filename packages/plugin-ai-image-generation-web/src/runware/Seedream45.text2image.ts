import {
  type Provider,
  type ImageOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import Seedream45Schema from './Seedream45.text2image.json';
import createImageProvider from './createImageProvider';
import { RunwareProviderConfiguration } from './types';

/**
 * Seedream 4.5 recommended 2K dimensions
 * Requirements: Min 3,686,400 pixels, max 16,777,216 pixels
 * All values from official Runware documentation
 */
const SEEDREAM45_DIMENSIONS: Record<string, { width: number; height: number }> =
  {
    '1:1': { width: 2048, height: 2048 }, // 4,194,304 pixels
    '16:9': { width: 2560, height: 1440 }, // 3,686,400 pixels
    '9:16': { width: 1440, height: 2560 }, // 3,686,400 pixels
    '4:3': { width: 2304, height: 1728 }, // 3,981,312 pixels
    '3:4': { width: 1728, height: 2304 } // 3,981,312 pixels
  };

/**
 * Input interface for Seedream 4.5 text-to-image
 */
export type Seedream45Input = {
  prompt: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
};

/**
 * Seedream 4.5 - ByteDance's production-focused AI image generation model
 *
 * AIR: bytedance:seedream@4.5
 *
 * Features:
 * - Improved facial detail rendering
 * - Enhanced text generation quality
 * - Multi-image fusion capabilities
 * - 2K/4K resolution support
 *
 * Specifications:
 * - Resolution: 2K and 4K options
 * - Prompt: 1-2,000 characters
 * - Up to 14 reference images (I2I mode)
 */
export function Seedream45(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Seedream45Input, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add aspect ratio icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider<Seedream45Input>(
      {
        modelId: 'bytedance:seedream@4.5',
        providerId: 'runware/bytedance/seedream-4-5',
        name: 'Seedream 4.5',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Seedream45Schema,
        inputReference: '#/components/schemas/Seedream45Input',
        cesdk,
        middleware: config.middlewares ?? [],
        getImageSize: (input) =>
          SEEDREAM45_DIMENSIONS[input.aspect_ratio ?? '1:1'],
        mapInput: (input) => {
          const dims = SEEDREAM45_DIMENSIONS[input.aspect_ratio ?? '1:1'];
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

export default Seedream45;
