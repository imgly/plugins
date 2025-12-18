import {
  type Provider,
  type VideoOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import Veo31TextToVideoSchema from './Veo31.text2video.json';
import createVideoProvider from './createVideoProvider';
import {
  EachLabsProviderConfiguration,
  getVideoDimensionsFromAspectRatio
} from './types';

/**
 * Input interface for Veo 3.1 text-to-video
 */
export type Veo31TextToVideoInput = {
  prompt: string;
  aspect_ratio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
  generate_audio?: boolean;
};

/**
 * Veo 3.1 - Google's text-to-video generation via EachLabs
 *
 * Features:
 * - 8 second video duration
 * - 2 aspect ratio options (16:9, 9:16)
 * - 720p or 1080p resolution
 * - Optional audio generation
 */
export function Veo31TextToVideo(
  config: EachLabsProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'video', Veo31TextToVideoInput, VideoOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add aspect ratio icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createVideoProvider<Veo31TextToVideoInput>(
      {
        modelSlug: 'veo3-1-text-to-video',
        modelVersion: '0.0.1',
        providerId: 'eachlabs/veo3-1-text-to-video',
        name: 'Veo 3.1',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Veo31TextToVideoSchema,
        inputReference: '#/components/schemas/Veo31TextToVideoInput',
        cesdk,
        getBlockInput: (input) => {
          const aspectRatio = input.aspect_ratio ?? '16:9';
          const { width, height } =
            getVideoDimensionsFromAspectRatio(aspectRatio);
          const duration = 8; // Veo 3.1 generates 8 second videos

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
          aspect_ratio: input.aspect_ratio ?? '16:9',
          resolution: input.resolution ?? '720p',
          generate_audio: input.generate_audio ?? true,
          duration: 8,
          // Enable auto-fix by default for better results
          auto_fix: true,
          // Enable prompt enhancement
          enhance_prompt: true
        })
      },
      config
    );
  };
}

export default Veo31TextToVideo;
