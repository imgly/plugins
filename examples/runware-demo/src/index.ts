import CreativeEditorSDK from '@cesdk/cesdk-js';
import AiApps from '@imgly/plugin-ai-apps-web';
import RunwareImage from '@imgly/plugin-ai-image-generation-web/runware';
import RunwareVideo from '@imgly/plugin-ai-video-generation-web/runware';
import Anthropic from '@imgly/plugin-ai-text-generation-web/anthropic';
import { Middleware } from '@imgly/plugin-ai-generation-web';

function initialize(
  selector: string,
  options?: {
    archiveUrl?: string;
    license?: string;
  }
) {
  document.addEventListener('DOMContentLoaded', function () {
    const domElement = document.querySelector<HTMLDivElement>(selector);
    if (domElement != null) {
      CreativeEditorSDK.create(domElement, {
        license: options?.license ?? process.env.CESDK_LICENSE ?? '',
        userId: 'plugins-vercel',
        callbacks: {
          onUpload: 'local',
          onExport: 'download',
          onLoadArchive: 'uploadArchive'
        },
        featureFlags: {
          archiveSceneEnabled: true,
          dangerouslyDisableVideoSupportCheck: false
        },
        ui: {
          elements: {
            navigation: {
              action: {
                load: true,
                export: true
              }
            }
          }
        }
      }).then(async (instance) => {
        // @ts-ignore
        window.cesdk = instance;

        await Promise.all([
          instance.addDefaultAssetSources(),
          instance.addDemoAssetSources({ sceneMode: 'Design' })
        ]);

        instance.ui.setDockOrder([
          'ly.img.ai.apps.dock',
          ...instance.ui.getDockOrder().filter(({ key }) => {
            return key !== 'ly.img.video.template' && key !== 'ly.img.template';
          }),
          'ly.img.spacer',
          'byok.dock'
        ]);

        instance.ui.setCanvasMenuOrder([
          {
            id: 'ly.img.ai.text.canvasMenu'
          },
          {
            id: 'ly.img.ai.image.canvasMenu'
          },
          {
            id: 'ly.img.separator'
          },
          ...instance.ui.getCanvasMenuOrder()
        ]);

        instance.feature.enable('ly.img.preview', false);
        instance.feature.enable('ly.img.placeholder', false);

        await instance.engine.scene.loadFromArchiveURL(
          options?.archiveUrl ??
            'https://img.ly/showcases/cesdk/cases/ai-editor/ai_editor_design.archive'
        );
        const [page] = instance.engine.scene.getPages();
        instance.engine.scene.enableZoomAutoFit(page, 'Both');

        instance.i18n.setTranslations({
          en: {}
        });

        const errorMiddleware: Middleware<any, any> = async (
          input,
          options,
          next
        ) => {
          return next(input, options).catch((error) => {
            console.error('Error:', error);
            if (error.name === 'AbortError') {
              // Ignore abort errors
              return;
            }
            instance.ui.showDialog({
              type: 'warning',
              size: 'large',
              content:
                'Due to high demand, we are currently unable to process your request. Please try again shortly - we appreciate your patience!'
            });
            // Throw abort error to stop the generation without further
            // error notification.
            throw new DOMException(
              'Operation aborted: Rate limit exceeded',
              'AbortError'
            );
          });
        };

        instance.engine.scene.setDesignUnit('Pixel');
        instance.addPlugin(
          AiApps({
            debug: true,
            dryRun: false,
            providers: {
              text2text: Anthropic.AnthropicProvider({
                middleware: [errorMiddleware],
                proxyUrl: process.env.ANTHROPIC_PROXY_URL
              }),
              text2image: [
                RunwareImage.NanoBanana2Pro.Text2Image({
                  middlewares: [errorMiddleware],
                  proxyUrl: process.env.RUNWARE_PROXY_URL
                }),
                RunwareImage.Flux2Pro.Text2Image({
                  middlewares: [errorMiddleware],
                  proxyUrl: process.env.RUNWARE_PROXY_URL
                }),
                RunwareImage.Flux2Dev.Text2Image({
                  middlewares: [errorMiddleware],
                  proxyUrl: process.env.RUNWARE_PROXY_URL
                }),
                RunwareImage.GptImage1.Text2Image({
                  middlewares: [errorMiddleware],
                  proxyUrl: process.env.RUNWARE_PROXY_URL
                }),
                RunwareImage.Seedream45.Text2Image({
                  middlewares: [errorMiddleware],
                  proxyUrl: process.env.RUNWARE_PROXY_URL
                }),
                RunwareImage.Flux2Flex.Text2Image({
                  middlewares: [errorMiddleware],
                  proxyUrl: process.env.RUNWARE_PROXY_URL
                })
              ],
              image2image: [
                RunwareImage.NanoBanana2Pro.Image2Image({
                  middlewares: [errorMiddleware],
                  proxyUrl: process.env.RUNWARE_PROXY_URL
                }),
                RunwareImage.Flux2Pro.Image2Image({
                  middlewares: [errorMiddleware],
                  proxyUrl: process.env.RUNWARE_PROXY_URL
                }),
                RunwareImage.Flux2Dev.Image2Image({
                  middlewares: [errorMiddleware],
                  proxyUrl: process.env.RUNWARE_PROXY_URL
                }),
                RunwareImage.GptImage1.Image2Image({
                  middlewares: [errorMiddleware],
                  proxyUrl: process.env.RUNWARE_PROXY_URL
                }),
                RunwareImage.Seedream45.Image2Image({
                  middlewares: [errorMiddleware],
                  proxyUrl: process.env.RUNWARE_PROXY_URL
                }),
                RunwareImage.Flux2Flex.Image2Image({
                  middlewares: [errorMiddleware],
                  proxyUrl: process.env.RUNWARE_PROXY_URL
                })
              ],
              text2video: [
                RunwareVideo.Sora2.Text2Video({
                  middlewares: [errorMiddleware],
                  proxyUrl: process.env.RUNWARE_PROXY_URL
                }),
                RunwareVideo.Veo31.Text2Video({
                  middlewares: [errorMiddleware],
                  proxyUrl: process.env.RUNWARE_PROXY_URL
                })
              ],
              image2video: [
                RunwareVideo.Sora2.Image2Video({
                  middlewares: [errorMiddleware],
                  proxyUrl: process.env.RUNWARE_PROXY_URL
                }),
                RunwareVideo.Sora2Pro.Image2Video({
                  middlewares: [errorMiddleware],
                  proxyUrl: process.env.RUNWARE_PROXY_URL
                }),
                RunwareVideo.Veo31.Image2Video({
                  middlewares: [errorMiddleware],
                  proxyUrl: process.env.RUNWARE_PROXY_URL
                })
              ]
            }
          })
        );
      });
    }
  });
}

export default initialize;
