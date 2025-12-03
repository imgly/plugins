import {
  type Provider,
  type VideoOutput,
  addIconSetOnce
} from '@imgly/plugin-ai-generation-web';
import { Icons } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
// @ts-ignore - JSON import
import Sora2ProSchema from './Sora2Pro.text2video.json';
import createVideoProvider from './createVideoProvider';
import { RunwareProviderConfiguration } from './types';

/**
 * Format to dimensions mapping for Sora 2 Pro
 * Supported: 1280x720, 720x1280, 1792x1024, 1024x1792
 */
const SORA2PRO_FORMAT_MAP: Record<string, { width: number; height: number }> = {
  '1280x720': { width: 1280, height: 720 },
  '720x1280': { width: 720, height: 1280 },
  '1792x1024': { width: 1792, height: 1024 },
  '1024x1792': { width: 1024, height: 1792 }
};

function getSora2ProDimensions(format: string): {
  width: number;
  height: number;
} {
  return SORA2PRO_FORMAT_MAP[format] ?? { width: 1280, height: 720 };
}

/**
 * Input interface for Sora 2 Pro Text-to-Video
 */
export type Sora2ProText2VideoInput = {
  prompt: string;
  format?: '1280x720' | '720x1280' | '1792x1024' | '1024x1792';
  duration?: '4' | '8' | '12';
};

/**
 * Sora 2 Pro - OpenAI's higher-quality video generation model
 *
 * AIR: openai:3@2
 *
 * Features:
 * - Text-to-video and image-to-video support
 * - Expanded resolution options
 * - Refined control for professional applications
 *
 * Specifications:
 * - Prompt: 1-4,000 characters
 * - Resolutions: 1280x720, 720x1280, 1792x1024, 1024x1792
 * - Duration: 4, 8, or 12 seconds
 */
export function Sora2ProText2Video(
  config: RunwareProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'video', Sora2ProText2VideoInput, VideoOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    // Add aspect ratio icons
    addIconSetOnce(cesdk, '@imgly/plugin/formats', Icons.Formats);

    return createVideoProvider<Sora2ProText2VideoInput>(
      {
        modelAIR: 'openai:3@2',
        providerId: 'runware/openai/sora-2-pro',
        name: 'Sora 2 Pro',
        // @ts-ignore - JSON schema types are compatible at runtime
        schema: Sora2ProSchema,
        inputReference: '#/components/schemas/Sora2ProText2VideoInput',
        cesdk,
        middleware: config.middlewares ?? [],
        getBlockInput: async (input) => {
          const dims = getSora2ProDimensions(input.format ?? '1280x720');
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
          const dims = getSora2ProDimensions(input.format ?? '1280x720');
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

export default Sora2ProText2Video;
