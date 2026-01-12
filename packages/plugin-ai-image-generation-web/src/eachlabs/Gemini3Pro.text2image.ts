import {
  type Provider,
  type ImageOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import Gemini3ProSchema from './Gemini3Pro.text2image.json';
import createImageProvider from './createImageProvider';
import { EachLabsProviderConfiguration } from './types';

// Map aspect ratio and resolution to approximate dimensions
// Gemini accepts aspect_ratio string directly, but we need dimensions for UI
const ASPECT_RATIO_DIMENSIONS: Record<
  string,
  Record<string, { width: number; height: number }>
> = {
  '1:1': {
    '1K': { width: 1024, height: 1024 },
    '2K': { width: 2048, height: 2048 },
    '4K': { width: 4096, height: 4096 }
  },
  '16:9': {
    '1K': { width: 1344, height: 768 },
    '2K': { width: 2688, height: 1536 },
    '4K': { width: 5376, height: 3072 }
  },
  '9:16': {
    '1K': { width: 768, height: 1344 },
    '2K': { width: 1536, height: 2688 },
    '4K': { width: 3072, height: 5376 }
  },
  '4:3': {
    '1K': { width: 1152, height: 896 },
    '2K': { width: 2304, height: 1792 },
    '4K': { width: 4608, height: 3584 }
  },
  '3:4': {
    '1K': { width: 896, height: 1152 },
    '2K': { width: 1792, height: 2304 },
    '4K': { width: 3584, height: 4608 }
  },
  '3:2': {
    '1K': { width: 1152, height: 768 },
    '2K': { width: 2304, height: 1536 },
    '4K': { width: 4608, height: 3072 }
  },
  '2:3': {
    '1K': { width: 768, height: 1152 },
    '2K': { width: 1536, height: 2304 },
    '4K': { width: 3072, height: 4608 }
  },
  '21:9': {
    '1K': { width: 1536, height: 640 },
    '2K': { width: 3072, height: 1280 },
    '4K': { width: 6144, height: 2560 }
  },
  '5:4': {
    '1K': { width: 1152, height: 896 },
    '2K': { width: 2304, height: 1792 },
    '4K': { width: 4608, height: 3584 }
  },
  '4:5': {
    '1K': { width: 896, height: 1152 },
    '2K': { width: 1792, height: 2304 },
    '4K': { width: 3584, height: 4608 }
  }
};

/**
 * Input interface for Gemini 3 Pro text-to-image
 */
export type Gemini3ProText2ImageInput = {
  prompt: string;
  aspect_ratio?:
    | '1:1'
    | '16:9'
    | '9:16'
    | '4:3'
    | '3:4'
    | '3:2'
    | '2:3'
    | '21:9'
    | '5:4'
    | '4:5';
  resolution?: '1K' | '2K' | '4K';
};

/**
 * Gemini 3 Pro Image - Google's advanced text-to-image generation via EachLabs
 *
 * Features:
 * - 8 aspect ratio options
 * - 3 resolution options (1K, 2K, 4K)
 * - High-quality generation from Google Gemini
 */
export function Gemini3ProText2Image(
  config: EachLabsProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Gemini3ProText2ImageInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add aspect ratio icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider<Gemini3ProText2ImageInput>(
      {
        modelSlug: 'gemini-3-pro-image-preview',
        modelVersion: '0.0.1',
        providerId: 'eachlabs/gemini-3-pro-image',
        name: 'Gemini 3 Pro Image',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Gemini3ProSchema,
        inputReference: '#/components/schemas/Gemini3ProText2ImageInput',
        cesdk,
        getImageSize: (input) => {
          const aspectRatio = input.aspect_ratio ?? '1:1';
          const resolution = input.resolution ?? '1K';
          return (
            ASPECT_RATIO_DIMENSIONS[aspectRatio]?.[resolution] ?? {
              width: 1024,
              height: 1024
            }
          );
        },
        mapInput: (input) => ({
          prompt: input.prompt,
          aspect_ratio: input.aspect_ratio ?? '1:1',
          resolution: input.resolution ?? '1K',
          num_images: 1,
          output_format: 'png'
        })
      },
      config
    );
  };
}

export default Gemini3ProText2Image;
