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
import {
  RunwareProviderConfiguration,
  getImageDimensionsFromAspectRatio
} from './types';

/**
 * Input interface for FLUX.2 [pro]
 *
 * Uses standard aspect ratios with icons available.
 */
export type Flux2ProInput = {
  prompt: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
};

/**
 * FLUX.2 [pro] - Professional model from Black Forest Labs
 *
 * AIR: bfl:5@1
 *
 * Features:
 * - Text-to-image and reference-to-image support
 * - Up to 9 reference images
 * - Prompt upsampling support
 *
 * Specifications:
 * - Resolution: 256-1920 pixels (multiples of 16)
 * - Max output: 4 megapixels
 * - Prompt: 1-3,000 characters
 */
export function Flux2Pro(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Flux2ProInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add aspect ratio icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider<Flux2ProInput>(
      {
        modelId: 'bfl:5@1',
        providerId: 'runware/bfl/flux-2-pro',
        name: 'FLUX.2 [pro]',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Flux2ProSchema,
        inputReference: '#/components/schemas/Flux2ProInput',
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

export default Flux2Pro;
