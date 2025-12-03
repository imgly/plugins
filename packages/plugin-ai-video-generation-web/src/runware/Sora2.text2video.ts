import {
  type Provider,
  type VideoOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import Sora2Schema from './Sora2.text2video.json';
import createVideoProvider from './createVideoProvider';
import { RunwareProviderConfiguration } from './types';

/**
 * Format to dimensions mapping for Sora 2
 * Supported: 1280x720, 720x1280
 */
const SORA2_FORMAT_MAP: Record<string, { width: number; height: number }> = {
  '1280x720': { width: 1280, height: 720 },
  '720x1280': { width: 720, height: 1280 }
};

function getSora2Dimensions(format: string): { width: number; height: number } {
  return SORA2_FORMAT_MAP[format] ?? { width: 1280, height: 720 };
}

/**
 * Input interface for Sora 2 Text-to-Video
 */
export type Sora2Text2VideoInput = {
  prompt: string;
  format?: '1280x720' | '720x1280';
  duration?: '4' | '8' | '12';
};

/**
 * Sora 2 - OpenAI's video generation model
 *
 * AIR: openai:3@1
 *
 * Features:
 * - Text-to-video and image-to-video support
 * - Accurate physics simulation
 * - Synchronized dialogue and high-fidelity visuals
 *
 * Specifications:
 * - Prompt: 1-4,000 characters
 * - Resolutions: 1280x720, 720x1280
 * - Duration: 4, 8, or 12 seconds
 */
export function Sora2Text2Video(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'video', Sora2Text2VideoInput, VideoOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add aspect ratio icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createVideoProvider<Sora2Text2VideoInput>(
      {
        modelId: 'openai:3@1',
        providerId: 'runware/openai/sora-2',
        name: 'Sora 2',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Sora2Schema,
        inputReference: '#/components/schemas/Sora2Text2VideoInput',
        cesdk,
        middleware: config.middlewares ?? [],
        getBlockInput: async (input) => {
          const dims = getSora2Dimensions(input.format ?? '1280x720');
          const duration = parseInt(input.duration ?? '8', 10);
          return {
            video: {
              width: dims.width,
              height: dims.height,
              duration
            }
          };
        },
        mapInput: (input) => {
          const dims = getSora2Dimensions(input.format ?? '1280x720');
          const duration = parseInt(input.duration ?? '8', 10);
          return {
            positivePrompt: input.prompt,
            width: dims.width,
            height: dims.height,
            duration
          };
        }
      },
      config
    );
  };
}

export default Sora2Text2Video;
