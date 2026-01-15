import {
  VideoOutput,
  type Provider,
  CommonProviderConfiguration,
  getPanelId,
  setDefaultTranslations
} from '@imgly/plugin-ai-generation-web';
import { getImageDimensionsFromURL, getImageUri } from '@imgly/plugin-utils';
import schema from './KlingVideoV21MasterImageToVideo.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createVideoProvider from './createVideoProvider';

type KlingVideoV21MasterImageToVideoInput = {
  prompt: string;
  image_url: string;
  duration?: '5' | '10';
  negative_prompt?: string;
  cfg_scale?: number;
};

interface ProviderConfiguration
  extends CommonProviderConfiguration<
    KlingVideoV21MasterImageToVideoInput,
    VideoOutput
  > {}

export function KlingVideoV21MasterImageToVideo(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<
  Provider<'video', KlingVideoV21MasterImageToVideoInput, VideoOutput>
> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    const modelKey = 'fal-ai/kling-video/v2.1/master/image-to-video';

    // Set translations
    setDefaultTranslations(cesdk, {
      en: {
        'ly.img.ai.quickAction.createVideoKling': 'Create Video (Kling)...',
        [`panel.${getPanelId(modelKey)}.imageSelection`]:
          'Select Image To Generate',
        [`panel.${modelKey}.imageSelection`]: 'Select Image To Generate',
        [`libraries.${getPanelId(modelKey)}.history.label`]:
          'Generated From Image'
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
  KlingVideoV21MasterImageToVideoInput,
  { kind: 'video'; url: string }
> {
  return createVideoProvider(
    {
      modelKey: 'fal-ai/kling-video/v2.1/master/image-to-video',
      name: 'Kling Video V2.1 Master',
      // @ts-ignore
      schema,
      inputReference:
        '#/components/schemas/KlingVideoV21MasterImageToVideoInput',
      cesdk,
      headers: config.headers,
      middlewares: config.middlewares,
      supportedQuickActions: {
        createVideoKling: {
          mapInput: async (input) => {
            const [blockId] = cesdk.engine.block.findAllSelected();
            const uri = await getImageUri(blockId, cesdk.engine, {
              throwErrorIfSvg: true
            });

            cesdk.ui.openPanel('ly.img.ai/video-generation');
            cesdk.ui.experimental.setGlobalStateValue(
              'ly.img.ai.video-generation.fromType',
              'fromImage'
            );
            cesdk.ui.experimental.setGlobalStateValue(
              'fal-ai/kling-video/v2.1/master/image-to-video.image_url',
              uri
            );

            return {
              prompt: input.prompt,
              image_url: uri,
              duration: input.duration,
              negative_prompt: input.negative_prompt,
              cfg_scale: input.cfg_scale
            };
          }
        }
      },
      getBlockInput: async (input) => {
        const imageDimension = await getImageDimensionsFromURL(
          input.image_url as string,
          cesdk.engine
        );

        return Promise.resolve({
          video: {
            width: imageDimension.width ?? 1280,
            height: imageDimension.height ?? 720,
            duration: parseInt(input.duration ?? '5', 10)
          }
        });
      }
    },
    config
  );
}

export default getProvider;
