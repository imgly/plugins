import CreativeEditorSDK, {
  AssetLibraryDockComponent,
  EditorPlugin
} from '@cesdk/cesdk-js';

import ImageGeneration from '@imgly/plugin-ai-image-generation-web';
import FalAiImage from '@imgly/plugin-ai-image-generation-web/fal-ai';
import VideoGeneration from '@imgly/plugin-ai-video-generation-web';
import FalAiVideo from '@imgly/plugin-ai-video-generation-web/fal-ai';
import AudioGeneration from '@imgly/plugin-ai-audio-generation-web';
import Elevenlabs from '@imgly/plugin-ai-audio-generation-web/elevenlabs';

import TextGeneration from '@imgly/plugin-ai-text-generation-web';
import { useRef } from 'react';
import { createCustomAssetSource } from './ActiveAssetSource';
import { getPanelId, initProvider } from '@imgly/plugin-utils-ai-generation';
import { GenerationMiddleware } from '@imgly/plugin-utils-ai-generation';
import { AggregatedAssetSource } from '@imgly/plugin-utils';
import Anthropic from '@imgly/plugin-ai-text-generation-web/anthropic';

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

            instance.addPlugin(
              TextGeneration({
                provider: {
                  id: 'anthropic',
                  proxyUrl: import.meta.env.VITE_ANTHROPIC_PROXY_URL
                }
              })
            );

            const anthropicProvider = await Anthropic.AnthropicProvider({
              proxyUrl: import.meta.env.VITE_ANTHROPIC_PROXY_URL
            })({ cesdk: instance });

            initProvider(
              anthropicProvider,
              { cesdk: instance, engine: instance.engine },
              { debug: true }
            );

            instance.addPlugin(
              AiPlugin((getConfig) => ({
                image: ImageGeneration({
                  text2image: FalAiImage.RecraftV3({
                    proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                  }),
                  image2image: FalAiImage.GeminiFlashEdit({
                    proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                  }),
                  ...getConfig('image-generation'),
                  debug: true
                }),
                video: VideoGeneration({
                  text2video: FalAiVideo.MinimaxVideo01Live({
                    proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                  }),
                  image2video: FalAiVideo.MinimaxVideo01LiveImageToVideo({
                    proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                  }),
                  ...getConfig('video-generation')
                }),
                audio: AudioGeneration({
                  text2speech: Elevenlabs.ElevenMultilingualV2({
                    proxyUrl: import.meta.env.VITE_ELEVENLABS_PROXY_URL
                  }),
                  text2sound: Elevenlabs.ElevenSoundEffects({
                    proxyUrl: import.meta.env.VITE_ELEVENLABS_PROXY_URL
                  }),
                  ...getConfig('audio-generation')
                })
              }))
            );

            instance.ui.setDockOrder([
              `${AI_APP_ID}.dock`,
              ...instance.ui.getDockOrder().filter(({ key }) => {
                return key !== 'ly.img.video.template';
              })
            ]);

            instance.ui.setCanvasMenuOrder([
              'ly.img.ai.text.canvasMenu',
              `ly.img.ai.image.canvasMenu`,
              ...instance.ui.getCanvasMenuOrder()
            ]);

            instance.feature.enable('ly.img.preview', false);

            await instance.createVideoScene();
            const page = instance.engine.scene.getCurrentPage();
            if (page != null) {
              const pageFill = instance.engine.block.getFill(page);
              instance.engine.block.setColorRGBA(
                pageFill,
                'fill/color/value',
                1,
                1,
                1,
                1
              );
            }

            instance.i18n.setTranslations({
              en: {
                'panel.ly.img.ai/apps': 'AI',
                'panel.ly.img.ai/fal-ai/gemini-flash-edit.imageSelection':
                  'Select Image To Change',
                'panel.ly.img.ai/elevenlabs': 'AI Voice',
                'panel.ly.img.ai/demo.video': 'Generate Video',
                'panel.ly.img.ai/demo.image': 'Generate Image',
                'panel.fal-ai/minimax/video-01-live/image-to-video.imageSelection':
                  'Select Image To Generate',
                'panel.ly.img.ai/fal-ai/minimax/video-01-live/image-to-video.imageSelection':
                  'Select Image To Generate',
                'panel.fal-ai/gemini-flash-edit.imageSelection':
                  'Select Image To Generate',
                'libraries.ly.img.ai/fal-ai/recraft-v3.history.label':
                  'Generated From Text',
                'libraries.ly.img.ai/fal-ai/gemini-flash-edit.history.label':
                  'Generated From Image',
                'libraries.ly.img.ai/fal-ai/pixverse/v3.5/text-to-video.history.label':
                  'Generated From Text',
                'libraries.ly.img.ai/fal-ai/minimax/video-01-live/image-to-video.history.label':
                  'Generated From Image',
                'libraries.elevenlabs/monolingual/v1.history.label':
                  'Generated Speech',
                'libraries.elevenlabs/sound-generation.history.label':
                  'Generated Sound',

                'libraries.ly.img.ai/image-generation.history.label':
                  'AI Generated Images',
                'libraries.ly.img.ai/video-generation.history.label':
                  'AI Generated Videos'
              }
            });

            const aggregatedImageAssetSource = new AggregatedAssetSource(
              'ly.img.ai/image-generation.history',
              instance,
              ['fal-ai/recraft-v3.history', 'fal-ai/gemini-flash-edit.history']
            );
            instance.engine.asset.addSource(aggregatedImageAssetSource);

            const imageEntry = instance.ui.getAssetLibraryEntry('ly.img.image');
            if (imageEntry != null) {
              instance.ui.updateAssetLibraryEntry('ly.img.image', {
                sourceIds: [
                  ...imageEntry.sourceIds,
                  'ly.img.ai/image-generation.history'
                ]
              });
            }

            const aggregatedVideoAssetSource = new AggregatedAssetSource(
              'ly.img.ai/video-generation.history',
              instance,
              [
                'fal-ai/minimax/video-01-live.history',
                'fal-ai/minimax/video-01-live/image-to-video.history'
              ]
            );
            instance.engine.asset.addSource(aggregatedVideoAssetSource);

            const videoEntry = instance.ui.getAssetLibraryEntry('ly.img.video');
            if (videoEntry != null) {
              instance.ui.updateAssetLibraryEntry('ly.img.video', {
                sourceIds: [
                  ...videoEntry.sourceIds,
                  'ly.img.ai/video-generation.history'
                ]
              });
            }
            const audioEntry = instance.ui.getAssetLibraryEntry('ly.img.audio');
            if (audioEntry != null) {
              instance.ui.updateAssetLibraryEntry('ly.img.audio', {
                sourceIds: [
                  ...audioEntry.sourceIds,
                  'elevenlabs/monolingual/v1.history',
                  'elevenlabs/sound-generation.history'
                ]
              });
            }
          });
        } else if (cesdk.current != null) {
          cesdk.current.dispose();
        }
      }}
    ></div>
  );
}

interface AiPluginConfiguration {
  image: ReturnType<typeof ImageGeneration>;
  video: ReturnType<typeof VideoGeneration>;
  audio: ReturnType<typeof AudioGeneration>;
}

const AI_APP_ID = getPanelId('apps');
const THUMBNAIL_WIDTH = 512;
const THUMBNAIL_HEIGHT = 128;

const AiPlugin = (
  getConfig: (
    getOptions: (type: string) => {
      middleware: GenerationMiddleware;
    }
  ) => AiPluginConfiguration
): EditorPlugin => {
  return {
    name: 'AI Plugin',
    version: '1.0.0',
    initialize: (context: { cesdk?: CreativeEditorSDK }) => {
      const { cesdk } = context;
      if (cesdk == null) return;

      const markWithProgress = async (
        appAssetId: string,
        callback: () => Promise<void>
      ) => {
        cesdk.ui.experimental.setGlobalStateValue(
          `${AI_APP_ID}.isGenerating`,
          true
        );
        // activeAssetSource.setAssetActive(appAssetId);
        activeAssetSource.setAssetLoading(appAssetId, true);
        cesdk.engine.asset.assetSourceContentsChanged(AI_APP_ID);

        await callback();

        cesdk.engine.asset.assetSourceContentsChanged(AI_APP_ID);
        activeAssetSource.setAssetLoading(appAssetId, false);
        // activeAssetSource.setAssetInactive(appAssetId);
        cesdk.ui.experimental.setGlobalStateValue(
          `${AI_APP_ID}.isGenerating`,
          false
        );
      };

      const middleware: (type: string) => GenerationMiddleware =
        (type: string) => async (generate, context) => {
          let assetId = type;
          if (type === 'audio-generation') {
            if (context.provider.id.includes('sound')) {
              assetId = 'audio-generation/sound';
            } else if (context.provider.id.includes('speech')) {
              assetId = 'audio-generation/speech';
            }
          }
          await markWithProgress(assetId, generate);
        };

      const config = getConfig((type) => ({ middleware: middleware(type) }));

      cesdk.addPlugin(config.image);
      cesdk.addPlugin(config.video);
      cesdk.addPlugin(config.audio);

      const activeAssetSource = createCustomAssetSource(AI_APP_ID, cesdk, [
        {
          id: 'image-generation',
          label: {
            en: 'Generate Image'
          },
          meta: {
            label: 'Generate Image',
            thumbUri: 'https://ubique.img.ly/static/ai-demo/GenerateImage.png',
            width: THUMBNAIL_WIDTH,
            height: THUMBNAIL_HEIGHT
          }
        },
        {
          id: 'video-generation',
          label: {
            en: 'Generate Video'
          },
          meta: {
            label: 'Generate Video',
            thumbUri: 'https://ubique.img.ly/static/ai-demo/GenerateVideo.png',
            width: THUMBNAIL_WIDTH,
            height: THUMBNAIL_HEIGHT
          }
        },
        {
          id: 'audio-generation/sound',
          label: {
            en: 'Generate Sound'
          },
          meta: {
            label: 'Generate Sound',
            thumbUri: 'https://ubique.img.ly/static/ai-demo/GenerateSound.png',
            width: THUMBNAIL_WIDTH,
            height: THUMBNAIL_HEIGHT
          }
        },
        {
          id: 'audio-generation/speech',
          label: {
            en: 'AI Voice'
          },
          meta: {
            label: 'AI Voice',
            thumbUri: 'https://ubique.img.ly/static/ai-demo/AIVoicev2.png',
            width: THUMBNAIL_WIDTH,
            height: THUMBNAIL_HEIGHT
          }
        }
      ]);

      cesdk.engine.asset.addSource(activeAssetSource);

      cesdk.ui.registerPanel(AI_APP_ID, ({ builder }) => {
        builder.Library(AI_APP_ID, {
          entries: [AI_APP_ID],
          onSelect: async (asset) => {
            cesdk.ui.openPanel(getPanelId(asset.id));
            // activeAssetSource.setAssetActive(asset.id, true);
          }
        });
      });

      cesdk.ui.addAssetLibraryEntry({
        id: AI_APP_ID,
        sourceIds: [AI_APP_ID],
        gridColumns: 1,
        gridItemHeight: 'auto',
        gridBackgroundType: 'cover',
        cardLabel: ({ label }) => label,
        cardLabelPosition: () => 'inside'
      });

      const componentId = `${AI_APP_ID}.dock`;
      cesdk.ui.registerComponent(componentId, ({ builder, experimental }) => {
        const isOpen = cesdk.ui.isPanelOpen(AI_APP_ID);
        const isGeneratingState = experimental.global<boolean>(
          `${AI_APP_ID}.isGenerating`,
          false
        );

        builder.Button(`${AI_APP_ID}.dock.button`, {
          label: 'AI',
          isSelected: isOpen,
          icon: isGeneratingState.value
            ? '@imgly/LoadingSpinner'
            : '@imgly/Sparkle',
          onClick: () => {
            cesdk.ui.findAllPanels().forEach((panel) => {
              if (panel.startsWith('ly.img.ai/')) {
                cesdk.ui.closePanel(panel);
              }
              if (!isOpen && panel === '//ly.img.panel/assetLibrary') {
                cesdk.ui.closePanel(panel);
              }
            });

            if (!isOpen) {
              cesdk.ui.openPanel(AI_APP_ID);
            } else {
              cesdk.ui.closePanel(AI_APP_ID);
            }
          }
        });
      });

      // Override `ly.img.assetLibrary.dock` to close the AI panel when opening another asset library panel
      cesdk.ui.registerComponent<AssetLibraryDockComponent>(
        'ly.img.assetLibrary.dock',
        ({ builder: { Button }, engine, payload }) => {
          const usage = `\n\nPlease provide a payload with entries, e.g. \n\`\`\`\n{ id: 'ly.img.assetLibrary.dock', entries: ['ly.img.image', 'ly.img.video'] }\n\`\`\``;

          if (!payload || payload.id !== 'ly.img.assetLibrary.dock') {
            // eslint-disable-next-line no-console
            console.warn(
              `No payload found for 'ly.img.assetLibrary.dock'${usage}`
            );
            return;
          }
          const {
            id,
            key,
            label: payloadLabel,
            icon: payloadIcon,
            entries: payloadEntryIds
          } = payload;
          if (payloadEntryIds == null || !Array.isArray(payloadEntryIds)) {
            // eslint-disable-next-line no-console
            console.warn(
              `No valid entries value found for 'ly.img.assetLibrary.dock'${usage}`
            );
            return;
          }

          if (payloadEntryIds.some((entryId) => typeof entryId !== 'string')) {
            // eslint-disable-next-line no-console
            console.warn(
              `Entries value for 'ly.img.assetLibrary.dock' need to be all strings referring to asset library entries${usage}`
            );
            return;
          }

          if (payloadLabel != null && typeof payloadLabel !== 'string') {
            // eslint-disable-next-line no-console
            console.warn(
              `Label for 'ly.img.assetLibrary.dock' must be a string if provided`
            );
          }

          const sceneMode = engine.scene.getMode();

          const entryIds = payloadEntryIds.filter((entryId) => {
            const entry = cesdk.ui.getAssetLibraryEntry(entryId);
            if (entry == null) return false;

            if (entry.sceneMode != null) {
              return entry.sceneMode === sceneMode;
            }

            return true;
          });

          if (entryIds.length === 0) return;

          let label: string | string[] | undefined = payloadLabel;
          if (label == null) {
            label = `libraries.${id}.label`;
          }
          const assetLibraryOpen = cesdk.ui.isPanelOpen(
            '//ly.img.panel/assetLibrary',
            {
              payload: {
                entries: entryIds,
                title: label
              }
            }
          );
          const replaceLibraryOpen = cesdk.ui.isPanelOpen(
            '//ly.img.panel/assetLibrary.replace'
          );

          let icon: string | undefined = payloadIcon;
          if (icon == null && entryIds.length === 1) {
            const entry = cesdk.ui.getAssetLibraryEntry(entryIds[0]);
            icon = entry?.icon as string;
          }

          Button(key ?? id, {
            label,
            icon,
            isDisabled: replaceLibraryOpen,
            isSelected: assetLibraryOpen,
            onClick: () => {
              if (assetLibraryOpen) {
                cesdk.ui.closePanel('//ly.img.panel/assetLibrary');
              } else {
                cesdk.ui.findAllPanels().forEach((panel) => {
                  if (panel === AI_APP_ID || panel.startsWith('ly.img.ai/')) {
                    cesdk.ui.closePanel(panel);
                  }
                });
                cesdk.ui.openPanel('//ly.img.panel/assetLibrary', {
                  payload: {
                    entries: entryIds,
                    title: label
                  }
                });
              }
            }
          });
        }
      );
    }
  };
};

export default App;
