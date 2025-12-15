import {
  type Provider,
  type VideoOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import Veo31Schema from './Veo31.text2video.json';
import createVideoProvider from './createVideoProvider';
import { RunwareProviderConfiguration } from './types';

/**
 * Format to dimensions mapping for Veo 3.1
 * Supported: 1280x720, 720x1280, 1920x1080, 1080x1920
 */
const VEO31_FORMAT_MAP: Record<string, { width: number; height: number }> = {
  '1280x720': { width: 1280, height: 720 },
  '720x1280': { width: 720, height: 1280 },
  '1920x1080': { width: 1920, height: 1080 },
  '1080x1920': { width: 1080, height: 1920 }
};

function getVeo31Dimensions(format: string): { width: number; height: number } {
  return VEO31_FORMAT_MAP[format] ?? { width: 1280, height: 720 };
}

/**
 * Input interface for Veo 3.1 Text-to-Video
 */
export type Veo31Text2VideoInput = {
  prompt: string;
  format?: '1280x720' | '720x1280' | '1920x1080' | '1080x1920';
  generate_audio?: boolean;
};

/**
 * Veo 3.1 - Google's cinematic video generation model
 *
 * AIR: google:3@2
 *
 * Features:
 * - Text-to-video and image-to-video support
 * - Native audio generation
 * - Cinematic quality with natural sound and smooth motion
 *
 * Specifications:
 * - Prompt: 2-3,000 characters
 * - Resolutions: 1280x720, 720x1280, 1920x1080, 1080x1920
 * - Frame rate: 24 FPS
 * - Duration: 8 seconds (fixed)
 */
export function Veo31Text2Video(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'video', Veo31Text2VideoInput, VideoOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add aspect ratio icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createVideoProvider<Veo31Text2VideoInput>(
      {
        modelId: 'google:3@2',
        providerId: 'runware/google/veo-3.1',
        name: 'Veo 3.1',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Veo31Schema,
        inputReference: '#/components/schemas/Veo31Text2VideoInput',
        cesdk,
        middleware: config.middlewares ?? [],
        getBlockInput: async (input) => {
          const dims = getVeo31Dimensions(input.format ?? '1280x720');
          return {
            video: {
              width: dims.width,
              height: dims.height,
              duration: 8 // Fixed 8 second duration
            }
          };
        },
        mapInput: (input) => {
          const dims = getVeo31Dimensions(input.format ?? '1280x720');
          return {
            positivePrompt: input.prompt,
            width: dims.width,
            height: dims.height,
            duration: 8,
            fps: 24,
            providerSettings: {
              google: {
                generateAudio: input.generate_audio ?? true
              }
            }
          };
        }
      },
      config
    );
  };
}

export default Veo31Text2Video;
