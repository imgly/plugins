import {
  VideoOutput,
  type Provider,
  CommonProviderConfiguration
} from '@imgly/plugin-ai-generation-web';
import schema from './ByteDanceSeedanceV1ProTextToVideo.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createVideoProvider from './createVideoProvider';

interface ByteDanceSeedanceV1ProTextToVideoInput {
  prompt: string;
  aspect_ratio?: '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16';
  resolution?: '480p' | '720p' | '1080p';
  duration?: number;
  camera_fixed?: boolean;
  seed?: number;
  enable_safety_checker?: boolean;
}

interface ByteDanceSeedanceV1ProTextToVideoOutput {
  video: {
    url: string;
    content_type?: string;
    file_name?: string;
    file_size?: number;
  };
  seed: number;
}

interface ProviderConfiguration
  extends CommonProviderConfiguration<
    ByteDanceSeedanceV1ProTextToVideoInput,
    VideoOutput
  > {}

export function ByteDanceSeedanceV1ProTextToVideo(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<
  Provider<'video', ByteDanceSeedanceV1ProTextToVideoInput, VideoOutput>
> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<
  'video',
  ByteDanceSeedanceV1ProTextToVideoInput,
  { kind: 'video'; url: string }
> {
  return createVideoProvider(
    {
      modelKey: 'fal-ai/bytedance/seedance/v1/pro/text-to-video',
      name: 'ByteDance Seedance v1 Pro',
      // @ts-ignore
      schema,
      inputReference:
        '#/components/schemas/ByteDanceSeedanceV1ProTextToVideoInput',
      cesdk,
      headers: config.headers,
      middleware: config.middlewares ?? config.middleware ?? [],
      getBlockInput: async (input) => {
        let width: number;
        let height: number;

        // Determine base resolution from input.resolution or default to 1080p
        const resolutionMap = {
          '480p': { height: 480 },
          '720p': { height: 720 },
          '1080p': { height: 1080 }
        };
        const targetResolution = input.resolution ?? '1080p';
        const baseHeight = resolutionMap[targetResolution].height;

        // Handle aspect ratio selection
        if (input.aspect_ratio) {
          // User selected a specific aspect ratio
          const [widthRatio, heightRatio] = input.aspect_ratio
            .split(':')
            .map(Number);

          // Calculate width based on the aspect ratio and target height
          height = baseHeight;
          width = Math.round((height * widthRatio) / heightRatio);
        } else {
          // Default to 16:9 aspect ratio
          height = baseHeight;
          width = Math.round((height * 16) / 9);
        }

        return Promise.resolve({
          video: {
            width,
            height,
            duration: input.duration ?? 5
          }
        });
      }
    },
    config
  );
}

export default getProvider;