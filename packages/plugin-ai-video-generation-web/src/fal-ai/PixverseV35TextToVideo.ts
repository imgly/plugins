import {
  CommonProviderConfiguration,
  VideoOutput,
  type Provider
} from '@imgly/plugin-ai-generation-web';
import schema from './PixverseV35TextToVideo.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createVideoProvider from './createVideoProvider';

interface ProviderConfiguration
  extends CommonProviderConfiguration<
    PixverseV35TextToVideoInput,
    VideoOutput
  > {}

type PixverseV35TextToVideoInput = {
  prompt: string;
  aspect_ratio?: '16:9' | '4:3' | '1:1' | '3:4' | '9:16';
  resolution?: '1080p' | '720p' | '540p' | '360p';
  duration?: '5s' | '8s';
};

export function PixverseV35TextToVideo(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'video', PixverseV35TextToVideoInput, VideoOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<
  'video',
  PixverseV35TextToVideoInput,
  { kind: 'video'; url: string }
> {
  return createVideoProvider(
    {
      modelKey: 'fal-ai/pixverse/v3.5/text-to-video',
      // @ts-ignore
      schema,
      inputReference: '#/components/schemas/PixverseV35TextToVideoInput',
      cesdk,

      headers: config.headers,
      middleware: config.middleware,
      getBlockInput: (input) => {
        if (input.aspect_ratio != null && input.resolution != null) {
          const [widthRatio, heightRatio] = input.aspect_ratio
            .split(':')
            .map(Number);
          const resolutionHeight = parseInt(input.resolution, 10);
          const width = Math.round(
            (resolutionHeight * widthRatio) / heightRatio
          );

          if (input.duration != null) {
            const duration =
              typeof input.duration === 'string'
                ? parseInt(input.duration, 10)
                : input.duration;

            return Promise.resolve({
              video: {
                width,
                height: resolutionHeight,
                duration
              }
            });
          }

          throw new Error('Cannot determine video duration');
        } else {
          throw new Error(
            'Cannot determine video dimensions – aspect ratio and resolution must be set'
          );
        }
      }
    },
    config
  );
}

export default getProvider;
