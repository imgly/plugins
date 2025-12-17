import {
  type Provider,
  type VideoOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import KlingV26ProTextToVideoSchema from './KlingV26Pro.text2video.json';
import createVideoProvider from './createVideoProvider';
import {
  EachLabsProviderConfiguration,
  getVideoDimensionsFromAspectRatio
} from './types';

/**
 * Input interface for Kling v2.6 Pro text-to-video
 */
export type KlingV26ProTextToVideoInput = {
  prompt: string;
  duration?: '5' | '10';
  aspect_ratio?: '16:9' | '9:16' | '1:1';
};

/**
 * Kling v2.6 Pro - High-quality text-to-video generation via EachLabs
 *
 * Features:
 * - 5 or 10 second video duration
 * - 3 aspect ratio options
 * - Native audio generation support (Chinese/English)
 * - High-quality video generation from Kuaishou
 */
export function KlingV26ProTextToVideo(
  config: EachLabsProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'video', KlingV26ProTextToVideoInput, VideoOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add aspect ratio icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createVideoProvider<KlingV26ProTextToVideoInput>(
      {
        modelSlug: 'kling-v2-6-pro-text-to-video',
        modelVersion: '0.0.1',
        providerId: 'eachlabs/kling-v2-6-pro-text-to-video',
        name: 'Kling v2.6 Pro',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: KlingV26ProTextToVideoSchema,
        inputReference: '#/components/schemas/KlingV26ProTextToVideoInput',
        cesdk,
        getBlockInput: (input) => {
          const aspectRatio = input.aspect_ratio ?? '16:9';
          const { width, height } =
            getVideoDimensionsFromAspectRatio(aspectRatio);
          const duration =
            input.duration != null ? parseInt(input.duration, 10) : 10;

          return Promise.resolve({
            video: {
              width,
              height,
              duration
            }
          });
        },
        mapInput: (input) => ({
          prompt: input.prompt,
          duration: input.duration ?? '10',
          aspect_ratio: input.aspect_ratio ?? '16:9',
          // Enable audio generation by default
          generate_audio: true,
          // Default negative prompt
          negative_prompt: 'blur, distort, and low quality',
          cfg_scale: 0.5
        })
      },
      config
    );
  };
}

export default KlingV26ProTextToVideo;
