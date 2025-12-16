import {
  type Provider,
  type ImageOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import NanoBananaProSchema from './NanoBananaPro.text2image.json';
import createImageProvider from './createImageProvider';
import {
  EachLabsProviderConfiguration,
  getImageDimensionsFromAspectRatio
} from './types';

/**
 * Input interface for Nano Banana Pro text-to-image
 */
export type NanoBananaProInput = {
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
    | '9:21'
    | '2.4:1';
  resolution?: '1K' | '2K' | '4K';
};

/**
 * Nano Banana Pro - Multi-style AI image generation model via EachLabs
 *
 * Features:
 * - 10 aspect ratio options
 * - Multiple resolution options (1K, 2K, 4K)
 * - High-quality multi-style generation
 */
export function NanoBananaPro(
  config: EachLabsProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', NanoBananaProInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add aspect ratio icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider<NanoBananaProInput>(
      {
        modelSlug: 'nano-banana-pro',
        modelVersion: '0.0.1',
        providerId: 'eachlabs/nano-banana-pro',
        name: 'Nano Banana Pro',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: NanoBananaProSchema,
        inputReference: '#/components/schemas/NanoBananaProInput',
        cesdk,
        getImageSize: (input) =>
          getImageDimensionsFromAspectRatio(input.aspect_ratio ?? '1:1'),
        mapInput: (input) => ({
          prompt: input.prompt,
          aspect_ratio: input.aspect_ratio ?? '1:1',
          resolution: input.resolution ?? '1K'
        })
      },
      config
    );
  };
}

export default NanoBananaPro;
