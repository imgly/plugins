import { type MinimaxVideo01LiveImageToVideoInput } from '@fal-ai/client/endpoints';
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
import schema from './MinimaxVideo01LiveImageToVideo.json';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createVideoProvider from './createVideoProvider';

interface ProviderConfiguration
  extends CommonProviderConfiguration<
    MinimaxVideo01LiveImageToVideoInput,
    VideoOutput
  > {}

export function MinimaxVideo01LiveImageToVideo(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<
  Provider<'video', MinimaxVideo01LiveImageToVideoInput, VideoOutput>
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
  MinimaxVideo01LiveImageToVideoInput,
  { kind: 'video'; url: string }
> {
  const quickActions = getQuickActions(cesdk);
  const quickActionMenu = getQuickActionMenu(cesdk, 'image');

  quickActionMenu.setQuickActionMenuOrder([
    ...quickActionMenu.getQuickActionMenuOrder(),
    'ly.img.separator',
    'createVideo'
  ]);

  return createVideoProvider(
    {
      modelKey: 'fal-ai/minimax/video-01-live/image-to-video',
      // @ts-ignore
      schema,
      inputReference:
        '#/components/schemas/MinimaxVideo01LiveImageToVideoInput',
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
            duration: 5
          }
        });
      }
    },
    config
  );
}

function getQuickActions(
  cesdk: CreativeEditorSDK
): QuickAction<MinimaxVideo01LiveImageToVideoInput, VideoOutput>[] {
  cesdk.i18n.setTranslations({
    en: {
      'ly.img.ai.quickAction.createVideo': 'Create Video...'
    }
  });

  return [
    QuickActionBaseButton<MinimaxVideo01LiveImageToVideoInput, VideoOutput>({
      quickAction: {
        id: 'createVideo',
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
          'fal-ai/minimax/video-01-live/image-to-video.image_url',
          uri
        );
      }
    })
  ];
}

export default getProvider;
