import { type Provider } from '@imgly/plugin-utils-ai-generation';
import { PluginConfiguration } from '../type';
import schema from './schemas/pixverse-v3.5-text-to-video.json';
import createVideoProvider from '../createVideoProvider';
import CreativeEditorSDK from '@cesdk/cesdk-js';

type Input = {
  prompt: string;
  aspect_ratio?: '16:9' | '4:3' | '1:1' | '3:4' | '9:16';
  resolution?: '1080p' | '720p' | '540p' | '360p';
  duration?: '5s' | '8s';
};

function getProvider(
  cesdk: CreativeEditorSDK,
  config: PluginConfiguration
): Provider<'video', Input, { kind: 'video'; url: string }> {
  return createVideoProvider(
    {
      modelKey: 'fal-ai/pixverse/v3.5/text-to-video',
      // @ts-ignore
      schema,
      inputReference: '#/components/schemas/PixverseV35TextToVideoInput',
      cesdk,

      createInputByKind: (input) => {
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

            return {
              video: {
                width,
                height: resolutionHeight,
                duration
              }
            };
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
