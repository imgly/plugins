import {
  CommonProviderConfiguration,
  VideoOutput,
  type Provider
} from '@imgly/plugin-ai-generation-web';
import schema from './KlingVideoV21MasterTextToVideo.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createVideoProvider from './createVideoProvider';

interface ProviderConfiguration
  extends CommonProviderConfiguration<
    KlingVideoV21MasterTextToVideoInput,
    VideoOutput
  > {}

type KlingVideoV21MasterTextToVideoInput = {
  prompt: string;
  duration?: '5' | '10';
  aspect_ratio?: '16:9' | '9:16' | '1:1';
  negative_prompt?: string;
  cfg_scale?: number;
};

export function KlingVideoV21MasterTextToVideo(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<
  Provider<'video', KlingVideoV21MasterTextToVideoInput, VideoOutput>
> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const modelKey = 'fal-ai/kling-video/v2.1/master/text-to-video';

    cesdk.i18n.setTranslations({
      en: {
        [`${modelKey}.prompt`]: 'Prompt',
        [`${modelKey}.duration`]: 'Duration',
        [`${modelKey}.duration.5`]: '5 seconds',
        [`${modelKey}.duration.10`]: '10 seconds',
        [`${modelKey}.aspect_ratio`]: 'Aspect Ratio',
        [`${modelKey}.aspect_ratio.16:9`]: '16:9',
        [`${modelKey}.aspect_ratio.9:16`]: '9:16',
        [`${modelKey}.aspect_ratio.1:1`]: '1:1'
      }
    });

    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<
  'video',
  KlingVideoV21MasterTextToVideoInput,
  { kind: 'video'; url: string }
> {
  return createVideoProvider(
    {
      modelKey: 'fal-ai/kling-video/v2.1/master/text-to-video',
      name: 'Kling Video V2.1 Master',
      // @ts-ignore
      schema,
      inputReference:
        '#/components/schemas/KlingVideoV21MasterTextToVideoInput',
      cesdk,
      headers: config.headers,
      middleware: config.middleware,
      getBlockInput: (input) => {
        const aspectRatio = input.aspect_ratio ?? '16:9';
        const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
        const height = 720;
        const width = Math.round((height * widthRatio) / heightRatio);
        const duration =
          input.duration != null ? parseInt(input.duration, 10) : 5;

        return Promise.resolve({
          video: {
            width,
            height,
            duration
          }
        });
      }
    },
    config
  );
}

export default getProvider;
