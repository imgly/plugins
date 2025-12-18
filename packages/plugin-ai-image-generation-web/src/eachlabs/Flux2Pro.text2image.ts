import {
  type Provider,
  type ImageOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import Flux2ProSchema from './Flux2Pro.text2image.json';
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
 * Input interface for Flux 2 Pro text-to-image
 */
export type Flux2ProInput = {
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
 * Flux 2 Pro - High-quality text-to-image generation via EachLabs
 *
 * Features:
 * - 6 image size options
 * - High-quality generation from Black Forest Labs
 */
export function Flux2Pro(
  config: EachLabsProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Flux2ProInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add aspect ratio icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider<Flux2ProInput>(
      {
        modelSlug: 'flux-2-pro',
        modelVersion: '0.0.1',
        providerId: 'eachlabs/flux-2-pro',
        name: 'Flux 2 Pro',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Flux2ProSchema,
        inputReference: '#/components/schemas/Flux2ProInput',
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

export default Flux2Pro;
