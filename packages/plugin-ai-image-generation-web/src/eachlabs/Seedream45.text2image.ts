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
import { EachLabsProviderConfiguration } from './types';

// Map EachLabs image_size enum to dimensions
const IMAGE_SIZE_MAP: Record<string, { width: number; height: number }> = {
  square_hd: { width: 1024, height: 1024 },
  square: { width: 512, height: 512 },
  portrait_4_3: { width: 896, height: 1152 },
  portrait_16_9: { width: 768, height: 1344 },
  landscape_4_3: { width: 1152, height: 896 },
  landscape_16_9: { width: 1344, height: 768 }
};

/**
 * Input interface for Seedream v4.5 text-to-image
 */
export type Seedream45Input = {
  prompt: string;
  image_size?:
    | 'square_hd'
    | 'square'
    | 'portrait_4_3'
    | 'portrait_16_9'
    | 'landscape_4_3'
    | 'landscape_16_9';
};

/**
 * Seedream v4.5 - High-quality text-to-image generation via EachLabs
 *
 * Features:
 * - 6 image size options
 * - High-quality generation from ByteDance
 * - Improved facial details and text generation over v4.0
 */
export function Seedream45(
  config: EachLabsProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Seedream45Input, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add aspect ratio icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider<Seedream45Input>(
      {
        modelSlug: 'bytedance-seedream-v4-5-text-to-image',
        modelVersion: '0.0.1',
        providerId: 'eachlabs/seedream-v4.5',
        name: 'Seedream v4.5',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Seedream45Schema,
        inputReference: '#/components/schemas/Seedream45Input',
        cesdk,
        getImageSize: (input) =>
          IMAGE_SIZE_MAP[input.image_size ?? 'landscape_4_3'] ?? {
            width: 1152,
            height: 896
          },
        mapInput: (input) => ({
          prompt: input.prompt,
          image_size: input.image_size ?? 'landscape_4_3'
        })
      },
      config
    );
  };
}

export default Seedream45;
