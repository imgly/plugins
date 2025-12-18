import {
  type Provider,
  type VideoOutput,
  getPanelId
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import Veo31ImageToVideoSchema from './Veo31.image2video.json';
import createVideoProvider from './createVideoProvider';
import { EachLabsProviderConfiguration } from './types';

/**
 * Input interface for Veo 3.1 image-to-video
 */
export type Veo31ImageToVideoInput = {
  image_url: string;
  prompt: string;
  resolution?: '720p' | '1080p';
  generate_audio?: boolean;
};

/**
 * Veo 3.1 - Google's image-to-video generation via EachLabs
 *
 * Features:
 * - 8 second video duration
 * - 720p or 1080p resolution
 * - Optional audio generation
 * - Animates input image based on prompt
 */
export function Veo31ImageToVideo(
  config: EachLabsProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'video', Veo31ImageToVideoInput, VideoOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'eachlabs/veo3-1-image-to-video';

    // Set translations for image selection UI
    cesdk.i18n.setTranslations({
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]:
          'Select Image To Animate',
        [`libraries.${getPanelId(providerId)}.history.label`]:
          'Generated From Image'
      }
    });

    return createVideoProvider<Veo31ImageToVideoInput>(
      {
        modelSlug: 'veo3-1-image-to-video',
        modelVersion: '0.0.1',
        providerId,
        name: 'Veo 3.1',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Veo31ImageToVideoSchema,
        inputReference: '#/components/schemas/Veo31ImageToVideoInput',
        cesdk,
        supportedQuickActions: {
          'ly.img.createVideo': {
            mapInput: (input) => ({
              image_url: input.uri,
              prompt: ''
            })
          }
        },
        getBlockInput: async (input) => {
          const { width, height } = await getImageDimensionsFromURL(
            input.image_url,
            cesdk.engine
          );
          const duration = 8; // Veo 3.1 generates 8 second videos

          return {
            video: {
              width,
              height,
              duration
            }
          };
        },
        mapInput: (input) => ({
          image_url: input.image_url,
          prompt: input.prompt,
          resolution: input.resolution ?? '720p',
          generate_audio: input.generate_audio ?? true,
          duration: 8,
          // Enable auto-fix by default for better results
          auto_fix: true,
          // Use 16:9 by default (image will be cropped if needed)
          aspect_ratio: '16:9'
        })
      },
      config
    );
  };
}

export default Veo31ImageToVideo;
