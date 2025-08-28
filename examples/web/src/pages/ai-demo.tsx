import CreativeEditorSDK from '@cesdk/cesdk-js';

import AiApps from '@imgly/plugin-ai-apps-web';
import OpenAiImage from '@imgly/plugin-ai-image-generation-web/open-ai';
import FalAiImage from '@imgly/plugin-ai-image-generation-web/fal-ai';
import FalAiVideo from '@imgly/plugin-ai-video-generation-web/fal-ai';
import Elevenlabs from '@imgly/plugin-ai-audio-generation-web/elevenlabs';
import Anthropic from '@imgly/plugin-ai-text-generation-web/anthropic';
import OpenAIText from '@imgly/plugin-ai-text-generation-web/open-ai';
import FalAiSticker from '@imgly/plugin-ai-sticker-generation-web/fal-ai';

import { useRef } from 'react';
import { rateLimitMiddleware } from '@imgly/plugin-ai-generation-web';
import { Middleware } from '@imgly/plugin-ai-generation-web';
import { RateLimitOptions } from '@imgly/plugin-ai-generation-web';
import { testAllTranslations, resetTranslations } from '../utils/testTranslations';

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
              'ly.img.ai.apps.dock',
              ...instance.ui.getDockOrder().filter(({ key }) => {
                return (
                  key !== 'ly.img.video.template' && key !== 'ly.img.template'
                );
              })
            ]);

            instance.ui.setCanvasMenuOrder([
              {
                id: 'ly.img.ai.text.canvasMenu'
              },
              {
                id: `ly.img.ai.image.canvasMenu`
              },
              ...instance.ui.getCanvasMenuOrder()
            ]);

            instance.feature.enable('ly.img.preview', false);
            instance.feature.enable('ly.img.placeholder', false);

            const urlParams = new URLSearchParams(window.location.search);
            let archiveType = urlParams.get('archive');

            // If no archive parameter, add default to URL
            if (!archiveType) {
              archiveType = 'design';
              urlParams.set('archive', 'design');
              const newUrl = `${
                window.location.pathname
              }?${urlParams.toString()}`;
              window.history.replaceState({}, '', newUrl);
            }

            const archiveUrl =
              archiveType === 'video'
                ? 'https://img.ly/showcases/cesdk/cases/ai-editor/ai_editor_video.archive'
                : 'https://img.ly/showcases/cesdk/cases/ai-editor/ai_editor_design.archive';

            await instance.engine.scene.loadFromArchiveURL(archiveUrl);

            const onRateLimitExceeded: RateLimitOptions<any>['onRateLimitExceeded'] =
              () => {
                instance.ui.showDialog({
                  type: 'warning',

                  size: 'large',
                  content:
                    'You’ve reached the generation limit for this demo. To explore further or request extended access, please contact us at ai@img.ly.'
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
                ...rateLimitMiddlewareConfig
              });

            const videoRateLimitMiddleware: Middleware<any, any> =
              rateLimitMiddleware({
                maxRequests: 2,
                ...rateLimitMiddlewareConfig
              });

            const soundRateLimitMiddleware: Middleware<any, any> =
              rateLimitMiddleware({
                maxRequests: 5,
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

            instance.addPlugin(
              AiApps({
                debug: true,
                dryRun: false,
                providers: {
                  text2text: [
                    Anthropic.AnthropicProvider({
                      middlewares: [
                        errorMiddleware,
                        rateLimitMiddleware({
                          maxRequests: 50,
                          ...rateLimitMiddlewareConfig
                        })
                      ],
                      model: 'claude-3-5-sonnet-20240620',
                      proxyUrl: import.meta.env.VITE_ANTHROPIC_PROXY_URL
                    }),
                    OpenAIText.OpenAIProvider({
                      middlewares: [errorMiddleware],
                      model: 'gpt-4.1-nano-2025-04-14',
                      proxyUrl: import.meta.env.VITE_OPENAI_PROXY_URL
                    })
                  ],
                  text2image: [
                    FalAiImage.RecraftV3({
                      middleware: [imageRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    }),
                    FalAiImage.Recraft20b({
                      middleware: [imageRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    }),
                    FalAiImage.NanoBanana({
                      middleware: [imageRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    }),
                    OpenAiImage.GptImage1.Text2Image({
                      middleware: [imageRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_OPENAI_PROXY_URL
                    }),
                    FalAiImage.IdeogramV3({
                      middleware: [imageRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    })
                  ],
                  image2image: [
                    FalAiImage.GeminiFlashEdit({
                      middleware: [imageRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    }),
                    FalAiImage.NanoBananaEdit({
                      middleware: [imageRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    }),
                    OpenAiImage.GptImage1.Image2Image({
                      middleware: [imageRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_OPENAI_PROXY_URL
                    }),
                    FalAiImage.FluxProKontextEdit({
                      middleware: [imageRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    }),
                    FalAiImage.FluxProKontextMaxEdit({
                      middleware: [imageRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    }),
                    FalAiImage.IdeogramV3Remix({
                      middleware: [imageRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    })
                  ],
                  text2video: [
                    FalAiVideo.MinimaxVideo01Live({
                      middleware: [videoRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    }),
                    FalAiVideo.Veo3TextToVideo({
                      middleware: [videoRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    }),
                    FalAiVideo.KlingVideoV21MasterTextToVideo({
                      middleware: [videoRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    }),
                    FalAiVideo.PixverseV35TextToVideo({
                      middleware: [videoRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    })
                  ],
                  image2video: [
                    FalAiVideo.MinimaxVideo01LiveImageToVideo({
                      middleware: [videoRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    }),
                    FalAiVideo.KlingVideoV21MasterImageToVideo({
                      middleware: [videoRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    })
                  ],
                  text2speech: Elevenlabs.ElevenMultilingualV2({
                    middleware: [soundRateLimitMiddleware, errorMiddleware],
                    proxyUrl: import.meta.env.VITE_ELEVENLABS_PROXY_URL
                  }),
                  text2sound: [
                    Elevenlabs.ElevenSoundEffects({
                      middleware: [soundRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_ELEVENLABS_PROXY_URL
                    })
                  ],
                  text2sticker: FalAiSticker.Recraft20b({
                    middleware: [imageRateLimitMiddleware, errorMiddleware],
                    proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                  })
                }
              })
            );

            instance.ui.setNavigationBarOrder([
              'sceneModeToggle',
              'testTranslations',
              ...instance.ui.getNavigationBarOrder()
            ]);

            instance.ui.registerComponent('sceneModeToggle', ({ builder }) => {
              builder.Button('sceneModeToggle', {
                label: archiveType === 'video' ? 'Video Mode' : 'Design Mode',
                icon: '@imgly/Replace',
                variant: 'regular',
                onClick: () => {
                  if (archiveType === 'video') {
                    window.location.search = '?archive=design';
                  } else {
                    window.location.search = '?archive=video';
                  }
                }
              });
            });
            instance.ui.registerComponent('testTranslations', ({ builder }) => {
              builder.Button('testTranslations', {
                label: 'Test Translations',
                icon: '@imgly/Text',
                variant: 'regular',
                onClick: () => {
                  testAllTranslations(instance);
                  // Expose reset function for debugging
                  // @ts-ignore
                  window.resetTranslations = () => resetTranslations(instance);
                }
              });
            });
          });
        } else if (cesdk.current != null) {
          cesdk.current.dispose();
        }
      }}
    ></div>
  );
}

export default App;
