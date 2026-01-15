import {
  type Provider,
  type VideoOutput,
  getPanelId,
  setDefaultTranslations} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import KlingV26ProImageToVideoSchema from './KlingV26Pro.image2video.json';
import createVideoProvider from './createVideoProvider';
import { EachLabsProviderConfiguration } from './types';

/**
 * Input interface for Kling v2.6 Pro image-to-video
 */
export type KlingV26ProImageToVideoInput = {
  image_url: string;
  prompt: string;
  duration?: '5' | '10';
};

/**
 * Kling v2.6 Pro - High-quality image-to-video generation via EachLabs
 *
 * Features:
 * - 5 or 10 second video duration
 * - Native audio generation support (Chinese/English)
 * - High-quality video generation from Kuaishou
 */
export function KlingV26ProImageToVideo(
  config: EachLabsProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'video', KlingV26ProImageToVideoInput, VideoOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const providerId = 'eachlabs/kling-v2-6-pro-image-to-video';

    // Set translations for image selection UI
    setDefaultTranslations(cesdk, {
      en: {
        [`panel.${getPanelId(providerId)}.imageSelection`]:
          'Select Image To Animate',
        [`libraries.${getPanelId(providerId)}.history.label`]:
          'Generated From Image'
      }
    });

    return createVideoProvider<KlingV26ProImageToVideoInput>(
      {
        modelSlug: 'kling-v2-6-pro-image-to-video',
        modelVersion: '0.0.1',
        providerId,
        name: 'Kling v2.6 Pro',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: KlingV26ProImageToVideoSchema,
        inputReference: '#/components/schemas/KlingV26ProImageToVideoInput',
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
          image_url: input.image_url,
          prompt: input.prompt,
          duration: input.duration ?? '5',
          // Enable audio generation by default
          generate_audio: true,
          // Default negative prompt
          negative_prompt: 'blur, distort, and low quality'
        })
      },
      config
    );
  };
}

export default KlingV26ProImageToVideo;
