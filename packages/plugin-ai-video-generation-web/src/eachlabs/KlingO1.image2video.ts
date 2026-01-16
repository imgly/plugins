import {
  type Provider,
  type VideoOutput,
  getPanelId,
  setDefaultTranslations
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import KlingO1ImageToVideoSchema from './KlingO1.image2video.json';
import createVideoProvider from './createVideoProvider';
import { EachLabsProviderConfiguration } from './types';

/**
 * Input interface for Kling O1 image-to-video
 */
export type KlingO1ImageToVideoInput = {
  image_url: string;
  prompt: string;
  duration?: '5' | '10';
};

/**
 * Kling O1 - Image-to-video generation via EachLabs
 *
 * Features:
 * - 5 or 10 second video duration
 * - Uses start_image_url as input for video generation
 * - High-quality video generation from Kuaishou
 */
export function KlingO1ImageToVideo(
  config: EachLabsProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'video', KlingO1ImageToVideoInput, VideoOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'eachlabs/kling-o1-image-to-video';

    // Set translations for image selection UI
    setDefaultTranslations(cesdk, {
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]:
          'Select Image To Animate',
        [`libraries.${getPanelId(providerId)}.history.label`]:
          'Generated From Image'
      }
    });

    return createVideoProvider<KlingO1ImageToVideoInput>(
      {
        modelSlug: 'kling-o1-image-to-video',
        modelVersion: '0.0.1',
        providerId,
        name: 'Kling O1',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: KlingO1ImageToVideoSchema,
        inputReference: '#/components/schemas/KlingO1ImageToVideoInput',
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
          const duration =
            input.duration != null ? parseInt(input.duration, 10) : 5;

          return {
            video: {
              width,
              height,
              duration
            }
          };
        },
        mapInput: (input) => ({
          // Map image_url to start_image_url for EachLabs API
          start_image_url: input.image_url,
          prompt: input.prompt,
          duration: input.duration ?? '5'
        })
      },
      config
    );
  };
}

export default KlingO1ImageToVideo;
