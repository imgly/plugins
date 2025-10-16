import CreativeEditorSDK from '@cesdk/cesdk-js';

import AiApps from '@imgly/plugin-ai-apps-web';
import OpenAiImage from '@imgly/plugin-ai-image-generation-web/open-ai';
import FalAiImage from '@imgly/plugin-ai-image-generation-web/fal-ai';
import FalAiVideo from '@imgly/plugin-ai-video-generation-web/fal-ai';
import Elevenlabs from '@imgly/plugin-ai-audio-generation-web/elevenlabs';
import Anthropic from '@imgly/plugin-ai-text-generation-web/anthropic';
import OpenAIText from '@imgly/plugin-ai-text-generation-web/open-ai';
import FalAiSticker from '@imgly/plugin-ai-sticker-generation-web/fal-ai';
import PhotoEditorPlugin from './pages/PhotoEditorPlugin';

import { useRef } from 'react';
import { rateLimitMiddleware } from '@imgly/plugin-ai-generation-web';
import { Middleware } from '@imgly/plugin-ai-generation-web';
import { RateLimitOptions } from '@imgly/plugin-ai-generation-web';
import {
  testAllTranslations,
  resetTranslations
} from './utils/testTranslations';

function App() {
  const cesdk = useRef<CreativeEditorSDK>();
  console.log('App component rendering...');
  return (
    <div
      style={{ width: '100vw', height: '100vh' }}
      ref={(domElement) => {
        if (domElement != null) {
          console.log('Creating CreativeEditorSDK...');
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

            // Handle photo editor mode
            if (archiveType === 'photoeditor') {
              instance.ui.setDockOrder(['ly.img.ai.photoeditor']);
              await setupPhotoEditingScene(
                instance,
                'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&dl=dom-hill-nimElTcTNyY-unsplash.jpg&w=1920'
              );

              instance.addPlugin(
                PhotoEditorPlugin({
                  image2image: OpenAiImage.GptImage1.Image2Image({
                    proxyUrl: import.meta.env.VITE_OPENAI_PROXY_URL
                  })
                })
              );
            } else {
              // Original video/design mode
              const archiveUrl =
                archiveType === 'video'
                  ? 'https://img.ly/showcases/cesdk/cases/ai-editor/ai_editor_video.archive'
                  : 'https://img.ly/showcases/cesdk/cases/ai-editor/ai_editor_design.archive';

              await instance.engine.scene.loadFromArchiveURL(archiveUrl);
            }

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

            // Only add AI Apps plugin for non-photoeditor modes
            if (archiveType !== 'photoeditor') {
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
                    "Due to high demand, we're currently unable to process your request. Please try again shortly — we appreciate your patience!"
                });
                // Throw abort error to stop the generation without further
                // error notification.
                throw new DOMException(
                  'Operation aborted: Rate limit exceeded',
                  'AbortError'
                );
              });
            };

            // Persistent error middleware that shows non-dismissing notification and sets block error state
            const persistentErrorMiddleware: Middleware<any, any> = async (
              input,
              options,
              next
            ) => {
              try {
                return await next(input, options);
              } catch (error) {
                // Prevent all default behaviors (notifications, console logging, etc.)
                options.preventDefault();

                // Manually set blocks to error state
                options.blockIds?.forEach((blockId) => {
                  if (options.cesdk?.engine.block.isValid(blockId)) {
                    options.cesdk.engine.block.setState(blockId, {
                      type: 'Error',
                      error: 'Unknown'
                    });
                  }
                });

                // Show persistent (non-dismissing) custom notification
                options.cesdk?.ui.showNotification({
                  type: 'error',
                  message: 'Critical error occurred. Please contact support immediately.',
                  duration: 'infinite', // Non-dismissing - notification stays until manually closed
                  action: {
                    label: 'Contact Support',
                    onClick: () => {
                      window.open('mailto:support@img.ly?subject=RecraftV3%20Generation%20Error');
                    }
                  }
                });

                // Re-throw the error to maintain the error flow
                throw error;
              }
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
                      middleware: [persistentErrorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL,
                      properties: {
                        style: {
                          default: "realistic_image/b_and_w"
                        }
                      }
                    }),
                    FalAiImage.Recraft20b({
                      middleware: [imageRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    }),
                    FalAiImage.GeminiFlash25({
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
                    }),
                    FalAiImage.SeedreamV4({
                      middleware: [imageRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    })
                  ],
                  image2image: [
                    FalAiImage.Gemini25FlashImageEdit({
                      middleware: [imageRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    }),
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
                    FalAiImage.QwenImageEdit({
                      middleware: [imageRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    }),
                    FalAiImage.IdeogramV3Remix({
                      middleware: [imageRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    }),
                    FalAiImage.SeedreamV4Edit({
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
                    }),
                    FalAiVideo.ByteDanceSeedanceV1ProTextToVideo({
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
                    }),
                    FalAiVideo.MinimaxHailuo02StandardImageToVideo({
                      middleware: [videoRateLimitMiddleware, errorMiddleware],
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    }),
                    FalAiVideo.ByteDanceSeedanceV1ProImageToVideo({
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
            }

            instance.ui.setNavigationBarOrder([
              'sceneModeToggle',
              'testTranslations',
              'featureApiCustomizations',
              ...instance.ui.getNavigationBarOrder()
            ]);

            const gitBranch = import.meta.env.VITE_GIT_BRANCH;
            if (gitBranch) {
              instance.ui.registerComponent(
                'ly.img.title.navigationBar',
                ({ builder }) => {
                  builder.Heading('gitBranchDisplay', {
                    content: gitBranch
                  });
                }
              );
            }
            instance.ui.registerComponent('sceneModeToggle', ({ builder }) => {
              builder.Dropdown('sceneModeToggle', {
                label: archiveType === 'video' ? 'Video Mode' : (archiveType === 'photoeditor' ? 'Photo Editor' : 'Design Mode'),
                icon: '@imgly/Replace',
                variant: 'regular',
                children: () => {
                  builder.Button('designMode', {
                    label: 'Design Mode',
                    isSelected: archiveType === 'design',
                    onClick: () => {
                      window.location.search = '?archive=design';
                    }
                  });
                  builder.Button('videoMode', {
                    label: 'Video Mode',
                    isSelected: archiveType === 'video',
                    onClick: () => {
                      window.location.search = '?archive=video';
                    }
                  });
                  builder.Button('photoEditor', {
                    label: 'Photo Editor',
                    isSelected: archiveType === 'photoeditor',
                    onClick: () => {
                      window.location.search = '?archive=photoeditor';
                    }
                  });
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

            // Only show Feature API dropdown for non-photoeditor modes
            if (archiveType !== 'photoeditor') {
              instance.ui.registerComponent('featureApiCustomizations', ({ builder }) => {
              const isFeatureEnabled = (featureId: string) => {
                try {
                  return instance.feature.isEnabled(featureId, { engine: instance.engine });
                } catch {
                  return false;
                }
              };

              builder.Dropdown('featureApiCustomizations', {
                label: 'Feature API',
                icon: '@imgly/Settings',
                variant: 'regular',
                children: () => {
                  // Core Features
                  builder.Dropdown('coreFeatures', {
                    label: 'Core Features',
                    children: () => {
                      builder.Button('providerSelect', {
                        label: 'ly.img.plugin-ai-image-generation-web.providerSelect',
                        icon: isFeatureEnabled('ly.img.plugin-ai-image-generation-web.providerSelect') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-image-generation-web.providerSelect';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                      builder.Button('quickAction', {
                        label: 'ly.img.plugin-ai-image-generation-web.quickAction',
                        icon: isFeatureEnabled('ly.img.plugin-ai-image-generation-web.quickAction') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-image-generation-web.quickAction';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                      builder.Button('quickActionProviderSelect', {
                        label: 'ly.img.plugin-ai-image-generation-web.quickAction.providerSelect',
                        icon: isFeatureEnabled('ly.img.plugin-ai-image-generation-web.quickAction.providerSelect') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-image-generation-web.quickAction.providerSelect';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                      builder.Button('fromText', {
                        label: 'ly.img.plugin-ai-image-generation-web.fromText',
                        icon: isFeatureEnabled('ly.img.plugin-ai-image-generation-web.fromText') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-image-generation-web.fromText';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                      builder.Button('fromImage', {
                        label: 'ly.img.plugin-ai-image-generation-web.fromImage',
                        icon: isFeatureEnabled('ly.img.plugin-ai-image-generation-web.fromImage') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-image-generation-web.fromImage';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                    }
                  });

                  // Image Quick Actions
                  builder.Dropdown('imageQuickActions', {
                    label: 'Image Quick Actions',
                    children: () => {
                      builder.Button('editImage', {
                        label: 'ly.img.plugin-ai-image-generation-web.quickAction.editImage',
                        icon: isFeatureEnabled('ly.img.plugin-ai-image-generation-web.quickAction.editImage') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-image-generation-web.quickAction.editImage';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                      builder.Button('swapBackground', {
                        label: 'ly.img.plugin-ai-image-generation-web.quickAction.swapBackground',
                        icon: isFeatureEnabled('ly.img.plugin-ai-image-generation-web.quickAction.swapBackground') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-image-generation-web.quickAction.swapBackground';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                      builder.Button('styleTransfer', {
                        label: 'ly.img.plugin-ai-image-generation-web.quickAction.styleTransfer',
                        icon: isFeatureEnabled('ly.img.plugin-ai-image-generation-web.quickAction.styleTransfer') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-image-generation-web.quickAction.styleTransfer';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                      builder.Button('createVariant', {
                        label: 'ly.img.plugin-ai-image-generation-web.quickAction.createVariant',
                        icon: isFeatureEnabled('ly.img.plugin-ai-image-generation-web.quickAction.createVariant') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-image-generation-web.quickAction.createVariant';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                      builder.Button('artistTransfer', {
                        label: 'ly.img.plugin-ai-image-generation-web.quickAction.artistTransfer',
                        icon: isFeatureEnabled('ly.img.plugin-ai-image-generation-web.quickAction.artistTransfer') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-image-generation-web.quickAction.artistTransfer';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                      builder.Button('combineImages', {
                        label: 'ly.img.plugin-ai-image-generation-web.quickAction.combineImages',
                        icon: isFeatureEnabled('ly.img.plugin-ai-image-generation-web.quickAction.combineImages') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-image-generation-web.quickAction.combineImages';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                      builder.Button('remixPage', {
                        label: 'ly.img.plugin-ai-image-generation-web.quickAction.remixPage',
                        icon: isFeatureEnabled('ly.img.plugin-ai-image-generation-web.quickAction.remixPage') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-image-generation-web.quickAction.remixPage';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                      builder.Button('remixPageWithPrompt', {
                        label: 'ly.img.plugin-ai-image-generation-web.quickAction.remixPageWithPrompt',
                        icon: isFeatureEnabled('ly.img.plugin-ai-image-generation-web.quickAction.remixPageWithPrompt') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-image-generation-web.quickAction.remixPageWithPrompt';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                    }
                  });

                  // Text Quick Actions
                  builder.Dropdown('textQuickActions', {
                    label: 'Text Quick Actions',
                    children: () => {
                      builder.Button('translate', {
                        label: 'ly.img.plugin-ai-text-generation-web.quickAction.translate',
                        icon: isFeatureEnabled('ly.img.plugin-ai-text-generation-web.quickAction.translate') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-text-generation-web.quickAction.translate';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                      builder.Button('changeTone', {
                        label: 'ly.img.plugin-ai-text-generation-web.quickAction.changeTone',
                        icon: isFeatureEnabled('ly.img.plugin-ai-text-generation-web.quickAction.changeTone') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-text-generation-web.quickAction.changeTone';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                      builder.Button('changeTextTo', {
                        label: 'ly.img.plugin-ai-text-generation-web.quickAction.changeTextTo',
                        icon: isFeatureEnabled('ly.img.plugin-ai-text-generation-web.quickAction.changeTextTo') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-text-generation-web.quickAction.changeTextTo';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                      builder.Button('fix', {
                        label: 'ly.img.plugin-ai-text-generation-web.quickAction.fix',
                        icon: isFeatureEnabled('ly.img.plugin-ai-text-generation-web.quickAction.fix') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-text-generation-web.quickAction.fix';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                      builder.Button('improve', {
                        label: 'ly.img.plugin-ai-text-generation-web.quickAction.improve',
                        icon: isFeatureEnabled('ly.img.plugin-ai-text-generation-web.quickAction.improve') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-text-generation-web.quickAction.improve';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                      builder.Button('longer', {
                        label: 'ly.img.plugin-ai-text-generation-web.quickAction.longer',
                        icon: isFeatureEnabled('ly.img.plugin-ai-text-generation-web.quickAction.longer') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-text-generation-web.quickAction.longer';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                      builder.Button('shorter', {
                        label: 'ly.img.plugin-ai-text-generation-web.quickAction.shorter',
                        icon: isFeatureEnabled('ly.img.plugin-ai-text-generation-web.quickAction.shorter') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-text-generation-web.quickAction.shorter';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                    }
                  });

                  // Video Quick Actions
                  builder.Dropdown('videoQuickActions', {
                    label: 'Video Quick Actions',
                    children: () => {
                      builder.Button('createVideo', {
                        label: 'ly.img.plugin-ai-video-generation-web.quickAction.createVideo',
                        icon: isFeatureEnabled('ly.img.plugin-ai-video-generation-web.quickAction.createVideo') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-video-generation-web.quickAction.createVideo';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                    }
                  });

                  builder.Separator('providerSeparator');

                  // Provider-specific Features
                  builder.Dropdown('recraftV3Features', {
                    label: 'RecraftV3 Provider',
                    children: () => {
                      builder.Button('recraftV3ImageStyle', {
                        label: 'ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.style.image',
                        icon: isFeatureEnabled('ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.style.image') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.style.image';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                      builder.Button('recraftV3VectorStyle', {
                        label: 'ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.style.vector',
                        icon: isFeatureEnabled('ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.style.vector') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.style.vector';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                    }
                  });

                  builder.Dropdown('recraft20bFeatures', {
                    label: 'Recraft20b Provider',
                    children: () => {
                      builder.Button('recraft20bImageStyle', {
                        label: 'ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.style.image',
                        icon: isFeatureEnabled('ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.style.image') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.style.image';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                      builder.Button('recraft20bVectorStyle', {
                        label: 'ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.style.vector',
                        icon: isFeatureEnabled('ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.style.vector') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.style.vector';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                      builder.Button('recraft20bIconStyle', {
                        label: 'ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.style.icon',
                        icon: isFeatureEnabled('ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.style.icon') ? '@imgly/ToggleIconOn' : '@imgly/ToggleIconOff',
                        onClick: () => {
                          const key = 'ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.style.icon';
                          const enabled = !isFeatureEnabled(key);
                          instance.feature.enable(key, enabled);
                          console.log(`Feature ${key}: ${enabled ? 'ON' : 'OFF'}`);
                        }
                      });
                    }
                  });
                }
              });
            });
            }
          }).catch((error) => {
            console.error('Failed to create CreativeEditorSDK:', error);
            alert('Failed to initialize the editor. Please check the console for details.');
          });
        } else if (cesdk.current != null) {
          cesdk.current.dispose();
        }
      }}
    ></div>
  );
}

async function setupPhotoEditingScene(
  instance: CreativeEditorSDK,
  uri: string
) {
  const engine = instance.engine;
  const size = await getImageSize(uri);
  if (!size || !size.width || !size.height) {
    throw new Error('Could not get image size');
  }
  const { width, height } = size;
  // hide page title:
  engine.editor.setSettingBool('page/title/show', false);

  const scene = engine.scene.create('Free');
  engine.scene.setDesignUnit('Pixel');
  const page = engine.block.create('page');
  // Add page to scene:
  engine.block.appendChild(scene, page);
  // Set page size:
  engine.block.setWidth(page, width);
  engine.block.setHeight(page, height);
  // Create image fill"
  const fill = engine.block.createFill('image');
  // Set fill url:
  engine.block.setSourceSet(fill, 'fill/image/sourceSet', [
    { uri, width, height }
  ]);
  engine.block.setFill(page, fill);
  // Set content fill mode to cover:
  engine.block.setContentFillMode(page, 'Cover');
  // Disable changing fill of page, hides e.g also the "replace" button
  engine.block.setScopeEnabled(page, 'fill/change', false);
  engine.block.setScopeEnabled(page, 'fill/changeType', false);
  // Disable stroke of page, since it does not make sense with current wording and takes up to much space
  engine.block.setScopeEnabled(page, 'stroke/change', false);
  engine.editor.setSettingBool(
    'ubq://page/moveChildrenWhenCroppingFill' as any,
    true
  );
  engine.block.setClipped(page, true);

  // only allow resizing and moving of page in crop mode
  const unsubscribeStateChange = engine.editor.onStateChanged(() => {
    const editMode = engine.editor.getEditMode();
    const cropConstraint = getCropConstraintMetadata(engine);
    if (editMode !== 'Crop') {
      // close size preset panel
      instance.ui.closePanel('ly.img.page-crop');
      engine.editor.setSettingBool(
        'ubq://page/allowResizeInteraction' as any,
        false
      );
      return;
    }
    if (cropConstraint === 'none') {
      engine.editor.setSettingBool(
        'ubq://page/restrictResizeInteractionToFixedAspectRatio' as any,
        false
      );
      engine.editor.setSettingBool(
        'ubq://page/allowResizeInteraction' as any,
        true
      );
    } else if (cropConstraint === 'aspect-ratio') {
      engine.editor.setSettingBool(
        'ubq://page/restrictResizeInteractionToFixedAspectRatio' as any,
        true
      );
      engine.editor.setSettingBool(
        'ubq://page/allowResizeInteraction' as any,
        true
      );
    } else if (cropConstraint === 'resolution') {
      engine.editor.setSettingBool(
        'ubq://page/allowResizeInteraction' as any,
        false
      );
      engine.editor.setSettingBool(
        'ubq://page/restrictResizeInteractionToFixedAspectRatio' as any,
        false
      );
    }
  });

  // If nothing is selected: select page by listening to selection changes
  const unsubscribeSelectionChange = engine.block.onSelectionChanged(() => {
    const selection = engine.block.findAllSelected();
    if (selection.length === 0) {
      const page = engine.scene.getCurrentPage();
      engine.block.select(page!);
    }
  });

  // Initially select the page
  engine.block.select(page);
  return () => {
    unsubscribeSelectionChange();
    unsubscribeStateChange();
  };
}

function getImageSize(url: string): Promise<{ width: number; height: number }> {
  const img = document.createElement('img');

  const promise = new Promise<{ width: number; height: number }>(
    (resolve, reject) => {
      img.onload = () => {
        // Natural size is the actual image size regardless of rendering.
        // The 'normal' `width`/`height` are for the **rendered** size.
        const width = img.naturalWidth;
        const height = img.naturalHeight;

        // Resolve promise with the width and height
        resolve({ width, height });
      };

      // Reject promise on error
      img.onerror = reject;
    }
  );

  // Setting the source makes it start downloading and eventually call `onload`
  img.src = url;

  return promise;
}

const ALL_CROP_CONSTRAINTS = ['none', 'aspect-ratio', 'resolution'] as const;
type CropConstraint = (typeof ALL_CROP_CONSTRAINTS)[number];

export function getCropConstraintMetadata(
  engine: any
): CropConstraint {
  const page = engine.scene.getCurrentPage();
  if (!page || !engine.block.findAllMetadata(page).includes('cropConstraint')) {
    return 'none';
  }
  return engine.block.getMetadata(page, 'cropConstraint') as CropConstraint;
}

export default App;
