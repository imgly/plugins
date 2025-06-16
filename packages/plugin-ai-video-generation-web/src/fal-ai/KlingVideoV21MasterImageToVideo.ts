import {
  VideoOutput,
  QuickAction,
  type Provider,
  QuickActionBaseButton,
  enableQuickActionForImageFill,
  getQuickActionMenu,
  CommonProviderConfiguration
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
  const quickActions = getQuickActions(cesdk);
  const quickActionMenu = getQuickActionMenu(cesdk, 'image');

  quickActionMenu.setQuickActionMenuOrder([
    ...quickActionMenu.getQuickActionMenuOrder(),
    'ly.img.separator',
    'createVideoKling'
  ]);

  return createVideoProvider(
    {
      modelKey: 'fal-ai/kling-video/v2.1/master/image-to-video',
      // @ts-ignore
      schema,
      inputReference:
        '#/components/schemas/KlingVideoV21MasterImageToVideoInput',
      cesdk,
      headers: config.headers,
      middleware: config.middleware,
      quickActions,
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

function getQuickActions(
  cesdk: CreativeEditorSDK
): QuickAction<KlingVideoV21MasterImageToVideoInput, VideoOutput>[] {
  cesdk.i18n.setTranslations({
    en: {
      'ly.img.ai.quickAction.createVideoKling': 'Create Video (Kling)...'
    }
  });

  return [
    QuickActionBaseButton<KlingVideoV21MasterImageToVideoInput, VideoOutput>({
      quickAction: {
        id: 'createVideoKling',
        kind: 'image',
        version: '1',
        enable: enableQuickActionForImageFill()
      },
      buttonOptions: {
        icon: '@imgly/plugin-ai-generation/video'
      },
      onClick: async () => {
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
      }
    })
  ];
}

export default getProvider;
