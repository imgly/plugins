import CreativeEditorSDK, { MimeType } from '@cesdk/cesdk-js';

import AiApps from '@imgly/plugin-ai-apps-web';
import OpenAiImage from '@imgly/plugin-ai-image-generation-web/open-ai';
import Anthropic from '@imgly/plugin-ai-text-generation-web/anthropic';

import { useRef } from 'react';
import {
  ImageOutput,
  rateLimitMiddleware
} from '@imgly/plugin-ai-generation-web';
import { Middleware } from '@imgly/plugin-ai-generation-web';
import { RateLimitOptions } from '@imgly/plugin-ai-generation-web';

function App() {
  const cesdk = useRef<CreativeEditorSDK>();
  return (
    <div
      style={{ width: '100vw', height: '100vh' }}
      ref={(domElement) => {
        if (domElement != null) {
          CreativeEditorSDK.create(domElement, {
            license: import.meta.env.VITE_CESDK_LICENSE_KEY,
            userId: 'plugins-vercel',
            callbacks: {
              onUpload: 'local',
              onExport: 'download',
              onLoadArchive: 'uploadArchive'
            },
            featureFlags: {
              singlePageMode: true,
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
            cesdk.current = instance;

            await Promise.all([
              instance.addDefaultAssetSources(),
              instance.addDemoAssetSources({ sceneMode: 'Video' })
            ]);

            instance.ui.setDockOrder([
              'ly.img.ai/apps.dock',
              ...instance.ui.getDockOrder().filter(({ key }) => {
                return (
                  key !== 'ly.img.video.template' && key !== 'ly.img.template'
                );
              })
            ]);

            instance.ui.setNavigationBarOrder([
              'ly.img.undoRedo.navigationBar',

              'ly.img.spacer',

              'ly.img.moodboard.switch',

              'ly.img.spacer',

              'ly.img.zoom.navigationBar',
              'ly.img.actions.navigationBar'
            ]);

            instance.ui.setCanvasMenuOrder([
              'ly.img.ai.text.canvasMenu',
              `ly.img.ai.image.canvasMenu`,
              ...instance.ui.getCanvasMenuOrder()
            ]);

            instance.feature.enable('ly.img.preview', false);
            instance.feature.enable('ly.img.placeholder', false);

            // await instance.engine.scene.loadFromArchiveURL(
            //   `https://img.ly/showcases/cesdk/cases/ai-editor/ai_editor_video.archive`
            // );
            // await instance.engine.scene.loadFromArchiveURL(
            //   `https://img.ly/showcases/cesdk/cases/ai-editor/ai_editor_design.archive`
            // );
            instance.createDesignScene();
            instance.engine.block.duplicate(
              instance.engine.scene.getCurrentPage() as number
            );

            const pages = instance.engine.block.findByType('//ly.img.ubq/page');
            const moodboardPage = pages[0];
            const resultPage = pages[1];

            instance.engine.block.setName(moodboardPage, 'Moodboard');
            instance.engine.block.setName(resultPage, 'Result');

            instance.engine.editor.setSettingBool(
              'page/title/showPageTitleTemplate',
              false
            );

            instance.engine.block.setScopeEnabled(
              moodboardPage,
              'lifecycle/duplicate',
              false
            );
            instance.engine.block.setScopeEnabled(
              resultPage,
              'lifecycle/duplicate',
              false
            );

            instance.feature.enable('ly.img.page.add', false);
            setTimeout(() => {
              instance.feature.enable(
                'ly.img.ai.quickAction.image.remixPage',
                false
              );
            }, 50);

            instance.feature.enable(
              ['ly.img.duplicate', 'ly.img.delete'],
              ({ engine, isPreviousEnable }) => {
                const hasPage = engine.block
                  .findAllSelected()
                  .some((blockId) => {
                    return (
                      engine.block.getType(blockId) === '//ly.img.ubq/page'
                    );
                  });
                if (hasPage) return false;
                return isPreviousEnable();
              }
            );

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
                maxRequests: 0,
                ...rateLimitMiddlewareConfig
              });

            const errorMiddleware: Middleware<any, any> = async (
              input,
              options,
              next
            ) => {
              return next(input, options).catch((error) => {
                console.error('Error:', error);
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
            const image2image = OpenAiImage.GptImage1.Image2Image({
              middleware: [imageRateLimitMiddleware, errorMiddleware],
              proxyUrl: import.meta.env.VITE_OPENAI_PROXY_URL
            });

            const image2imageProvider = await image2image({ cesdk: instance });
            instance.ui.registerComponent(
              'ly.img.moodboard.switch',
              ({ builder, engine, experimental: { global } }) => {
                const elementsOnMoodboard =
                  instance.engine.block.getChildren(moodboardPage);
                builder.ButtonGroup('moodboard.switch.group', {
                  children: () => {
                    builder.Button('moodboard.design', {
                      label: 'Moodboard',
                      variant: 'regular',
                      isActive: engine.scene.getCurrentPage() === moodboardPage,
                      onClick: () => {
                        instance.unstable_switchPage(moodboardPage);
                        instance.engine.block
                          .findAllSelected()
                          .forEach((blockId) => {
                            instance.engine.block.setSelected(blockId, false);
                          });
                      }
                    });
                    builder.Button('moodboard.result', {
                      label: 'Result',
                      variant: 'regular',
                      isActive: engine.scene.getCurrentPage() === resultPage,
                      onClick: () => {
                        instance.unstable_switchPage(resultPage);
                        instance.engine.block
                          .findAllSelected()
                          .forEach((blockId) => {
                            instance.engine.block.setSelected(blockId, false);
                          });
                      }
                    });
                  }
                });
                const isGenerating = global('moodboard.isGenerating', false);
                builder.Button('moodboard.generate', {
                  icon: '@imgly/Sparkle',
                  label: 'Generate',
                  variant: 'regular',
                  isDisabled: elementsOnMoodboard.length === 0,
                  isLoading: isGenerating.value,
                  color: 'accent',
                  onClick: async () => {
                    isGenerating.setValue(true);
                    try {
                      const exportedPageBlob = await engine.block.export(
                        moodboardPage,
                        MimeType.Jpeg
                      );
                      const exportedPageUrl =
                        URL.createObjectURL(exportedPageBlob);
                      const fillBlock = engine.block.createFill('image');
                      engine.block.setString(
                        fillBlock,
                        'fill/image/imageFileURI',
                        exportedPageUrl
                      );
                      engine.block.setFill(resultPage, fillBlock);

                      instance.unstable_switchPage(resultPage);
                      engine.block.findAllSelected().forEach((blockId) => {
                        engine.block.setSelected(blockId, false);
                      });

                      engine.block.setState(resultPage, {
                        type: 'Pending',
                        progress: 0
                      });
                      const result = (await image2imageProvider.output.generate(
                        {
                          prompt:
                            'follow the instructions on the image. if there is no text with instructions, combine the elements in the image',
                          image_url: exportedPageUrl
                        },
                        {
                          engine: instance.engine,
                          cesdk: instance,
                          abortSignal: new AbortController().signal
                        }
                      )) as ImageOutput;
                      console.log(result);

                      instance.engine.editor.addUndoStep();
                      instance.ui.showNotification({
                        type: 'success',
                        message: 'Image generation successful'
                      });
                      engine.block.setString(
                        fillBlock,
                        'fill/image/imageFileURI',
                        result.url
                      );
                    } catch (error) {
                      console.error('Error:', error);
                      instance.ui.showNotification({
                        type: 'success',
                        message: `${error}`
                      });
                    } finally {
                      engine.block.setState(resultPage, { type: 'Ready' });
                      isGenerating.setValue(false);
                    }
                  }
                });
              }
            );

            instance.addPlugin(
              AiApps({
                debug: true,
                dryRun: false,
                providers: {
                  text2text: Anthropic.AnthropicProvider({
                    middleware: [
                      errorMiddleware,
                      rateLimitMiddleware({
                        maxRequests: 50,
                        ...rateLimitMiddlewareConfig
                      })
                    ],
                    proxyUrl: import.meta.env.VITE_ANTHROPIC_PROXY_URL
                  }),
                  text2image: OpenAiImage.GptImage1.Text2Image({
                    middleware: [imageRateLimitMiddleware, errorMiddleware],
                    proxyUrl: import.meta.env.VITE_OPENAI_PROXY_URL
                  }),
                  image2image
                }
              })
            );
          });
        } else if (cesdk.current != null) {
          cesdk.current.dispose();
        }
      }}
    ></div>
  );
}

export default App;
