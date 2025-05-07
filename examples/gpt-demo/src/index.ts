import CreativeEditorSDK from '@cesdk/cesdk-js';
import AiApps from '@imgly/plugin-ai-apps-web';
// @ts-ignore
import OpenAiImage from '@imgly/plugin-ai-image-generation-web/open-ai';
// @ts-ignore
import Anthropic from '@imgly/plugin-ai-text-generation-web/anthropic';

import { rateLimitMiddleware } from '@imgly/plugin-ai-generation-web';
import { Middleware } from '@imgly/plugin-ai-generation-web';
import { RateLimitOptions } from '@imgly/plugin-ai-generation-web';

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
          'ly.img.ai/apps.dock',
          ...instance.ui.getDockOrder().filter(({ key }) => {
            return key !== 'ly.img.video.template' && key !== 'ly.img.template';
          }),
          'ly.img.spacer',
          'byok.dock'
        ]);

        instance.ui.setCanvasMenuOrder([
          'ly.img.ai.text.canvasMenu',
          `ly.img.ai.image.canvasMenu`,
          'ly.img.separator',
          ...instance.ui.getCanvasMenuOrder()
        ]);

        instance.feature.enable('ly.img.preview', false);
        instance.feature.enable('ly.img.placeholder', false);

        await instance.engine.scene.loadFromArchiveURL(
          options?.archiveUrl ??
            'https://ubique.img.ly/static/gpt-demo/gpt-template-v1.zip'
        );

        instance.i18n.setTranslations({
          en: {
            'panel.byok': 'Enter Your Own API Key'
          }
        });
        instance.ui.registerPanel(
          'byok',
          ({ builder, state, experimental }) => {
            const apiKey = state('byok.apiKey', '');
            builder.Section('byok.section', {
              children: () => {
                builder.TextArea('byok.apiKey', {
                  inputLabel: 'OpenAI API Key',
                  ...apiKey
                });

                builder.Button('byok.save', {
                  label: 'Save',
                  color: 'accent',
                  onClick: () => {
                    const apiKey = state('byok.apiKey', '').value;
                    experimental.global('OPENAI_API_KEY', '').setValue(apiKey);

                    instance.ui.closePanel('byok');
                    instance.ui.showNotification({
                      type: 'success',
                      message:
                        'Your API key has been saved successfully. You can continue exploring the demo.'
                    });
                  }
                });
                builder.Text('byok.text', {
                  content:
                    'Your key will only be sent to the OpenAI API and will not be stored anywhere outside your browser.'
                });
              }
            });
          }
        );
        instance.ui.registerComponent('byok.dock', ({ builder }) => {
          const isOpen = instance.ui.isPanelOpen('byok');
          builder.Button('byok.dock', {
            icon: '@imgly/SettingsCog',
            label: 'API Key',
            isSelected: isOpen,
            onClick: () => {
              if (isOpen) {
                instance.ui.closePanel('byok');
              } else {
                instance.ui.openPanel('byok');
              }
            }
          });
        });

        const onRateLimitExceeded: RateLimitOptions<any>['onRateLimitExceeded'] =
          () => {
            instance.ui.showDialog({
              type: 'warning',

              size: 'large',
              content:
                'You’ve reached the generation limit for this demo. To continue exploring, you can add your own OpenAI API key in the settings. Your key will only be sent to the OpenAI API and will not be stored anywhere outside your browser.',
              cancel: {
                label: 'Close',
                variant: 'regular',
                onClick: ({ id }) => {
                  instance.ui.closeDialog(id);
                }
              },
              actions: {
                label: 'Bring Your Own API Key',
                variant: 'regular',
                color: 'accent',
                onClick: ({ id }) => {
                  instance.ui.closeDialog(id);
                  instance.ui.openPanel('byok');
                }
              }
            });

            return false;
          };

        const rateLimitMiddlewareConfig = {
          timeWindowMs: 24 * 60 * 60 * 1000,
          onRateLimitExceeded,
          disable: true
        };

        const imageRateLimitMiddleware: Middleware<any, any> =
          rateLimitMiddleware({
            maxRequests: 5,
            ...rateLimitMiddlewareConfig,
            disable: () => {
              return instance.ui.experimental.hasGlobalStateValue(
                'OPENAI_API_KEY'
              );
            }
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
                'Due to high demand, we’re currently unable to process your request. Please try again shortly — we appreciate your patience!'
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
                middleware: [
                  errorMiddleware,
                  rateLimitMiddleware({
                    maxRequests: 500,
                    ...rateLimitMiddlewareConfig
                  })
                ],
                proxyUrl: 'https://imgly-proxy.vercel.app/api/proxy/anthropic'
              }),
              text2image: OpenAiImage.GptImage1.Text2Image({
                middleware: [imageRateLimitMiddleware, errorMiddleware],
                proxyUrl: 'https://proxy.img.ly/api/proxy/openai'
              }),
              image2image: OpenAiImage.GptImage1.Image2Image({
                middleware: [imageRateLimitMiddleware, errorMiddleware],
                proxyUrl: 'https://proxy.img.ly/api/proxy/openai'
              })
            }
          })
        );
      });
    }
  });
}

export default initialize;
