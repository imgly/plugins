import {
  type Provider,
  type ImageOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import Flux2FlexSchema from './Flux2Flex.text2image.json';
import createImageProvider from './createImageProvider';
import {
  RunwareProviderConfiguration,
  getImageDimensionsFromAspectRatio
} from './types';

/**
 * Input interface for FLUX.2 [flex]
 *
 * Uses standard aspect ratios with icons available.
 */
export type Flux2FlexInput = {
  prompt: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
};

/**
 * FLUX.2 [flex] - Flexible model from Black Forest Labs
 *
 * AIR: bfl:6@1
 *
 * Features:
 * - Text-to-image and reference-to-image support
 * - Up to 10 reference images
 * - Strongest text rendering accuracy in the FLUX family
 * - Excellent typography and branded design support
 *
 * Specifications:
 * - Resolution: 256-1920 pixels (multiples of 16)
 * - Max output: 4 megapixels
 * - Prompt: 1-3,000 characters
 * - CFG Scale: 1-20 (default: 2.5)
 * - Steps: 1-50
 */
export function Flux2Flex(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'image', Flux2FlexInput, ImageOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add aspect ratio icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createImageProvider<Flux2FlexInput>(
      {
        modelAIR: 'bfl:6@1',
        providerId: 'runware/bfl/flux-2-flex',
        name: 'FLUX.2 [flex]',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Flux2FlexSchema,
        inputReference: '#/components/schemas/Flux2FlexInput',
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

export default Flux2Flex;
