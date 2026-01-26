import {
  type Provider,
  type ImageOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import Seedream4Schema from './Seedream4.text2image.json';
import createImageProvider from './createImageProvider';
import { RunwareProviderConfiguration } from './types';

/**
 * Seedream 4.0 (bytedance:5@0) dimension constraints - 2K resolution
 * At 1K resolution, only 1024×1024 (1:1) is supported.
 * For other aspect ratios, we use 2K dimensions.
 * Source: https://runware.ai/docs/providers/bytedance.md
 */
const SEEDREAM4_DIMENSIONS: Record<string, { width: number; height: number }> =
  {
    '1:1': { width: 2048, height: 2048 },
    '16:9': { width: 2560, height: 1440 },
    '9:16': { width: 1440, height: 2560 },
    '4:3': { width: 2304, height: 1728 },
    '3:4': { width: 1728, height: 2304 }
  };

/**
 * Input interface for Seedream 4.0 text-to-image
 */
export type Seedream4Input = {
  prompt: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
};

/**
 * Seedream 4.0 - ByteDance's multimodal AI image generation model
 *
 * AIR: bytedance:5@0
 *
 * Features:
 * - Ultra-fast 2K/4K rendering
 * - Character consistency across outputs
 * - Sequential image generation for storyboards
 *
 * Specifications:
 * - Resolution: 1K, 2K, and 4K options
 * - Prompt: 1-2,000 characters
 * - Up to 14 reference images (I2I mode)
 */
export function Seedream4(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Seedream4Input, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add aspect ratio icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider<Seedream4Input>(
      {
        modelId: 'bytedance:5@0',
        providerId: 'runware/bytedance/seedream-4',
        name: 'Seedream 4.0',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Seedream4Schema,
        inputReference: '#/components/schemas/Seedream4Input',
        cesdk,
        middleware: config.middlewares ?? [],
        getImageSize: (input) =>
          SEEDREAM4_DIMENSIONS[input.aspect_ratio ?? '1:1'],
        mapInput: (input) => {
          const dims = SEEDREAM4_DIMENSIONS[input.aspect_ratio ?? '1:1'];
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

export default Seedream4;
