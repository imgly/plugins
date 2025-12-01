import {
  type Provider,
  type ImageOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import Flux2DevSchema from './Flux2Dev.text2image.json';
import createImageProvider from './createImageProvider';
import {
  RunwareProviderConfiguration,
  getImageDimensionsFromAspectRatio
} from './types';

/**
 * Input interface for FLUX.2 [dev]
 *
 * Uses standard aspect ratios with icons available.
 */
export type Flux2DevInput = {
  prompt: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
};

/**
 * FLUX.2 [dev] - Open weights release from Black Forest Labs
 *
 * AIR: runware:400@1
 *
 * Features:
 * - Full architectural control for developers
 * - Flexible sampling behavior and guidance strategies
 * - Text-to-image and reference-to-image support
 * - Up to 4 reference images
 *
 * Specifications:
 * - Resolution: 512-2048 pixels (multiples of 16)
 * - CFG Scale: 1-20 (default: 4)
 * - Steps: 1-50
 * - Prompt: 1-10,000 characters
 */
export function Flux2Dev(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Flux2DevInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add aspect ratio icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider<Flux2DevInput>(
      {
        modelAIR: 'runware:400@1',
        providerId: 'runware/bfl/flux-2-dev',
        name: 'FLUX.2 [dev]',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Flux2DevSchema,
        inputReference: '#/components/schemas/Flux2DevInput',
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

export default Flux2Dev;
