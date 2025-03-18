import CreativeEditorSDK from '@cesdk/cesdk-js';
import { initProvider } from '@imgly/plugin-utils-ai-generation';
import { initFalProvider } from '@imgly/plugin-utils-fal-ai';
import { useRef } from 'react';
import CustomProvider from './provider/CustomProvider';
import SchemaProvider from './provider/SchemaProvider';

function TestGenerationProvider() {
  const cesdk = useRef<CreativeEditorSDK>();
  return (
    <div
      style={{ width: '100vw', height: '100vh' }}
      ref={(domElement) => {
        if (domElement != null) {
          CreativeEditorSDK.create(domElement, {
            theme: 'light',
            license: import.meta.env.VITE_CESDK_LICENSE_KEY,
            userId: 'plugins-vercel',
            callbacks: { onUpload: 'local' }
          }).then(async (instance) => {
            // @ts-ignore
            window.cesdk = instance;
            cesdk.current = instance;

            // Do something with the instance of CreativeEditor SDK, for example:
            // Populate the asset library with default / demo asset sources.
            await Promise.all([
              instance.addDefaultAssetSources(),
              instance.addDemoAssetSources({ sceneMode: 'Video' })
            ]);

            await instance.createVideoScene();

            const pixverse = await initFalProvider(
              'pixverse-v3.5-text-to-video',
              instance,
              {
                proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
              }
            );
            const recraftV3 = await initFalProvider('recraft-v3', instance, {
              proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
            });
            initFalProvider('recraft-20b', instance, {
              proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
            });
            initFalProvider('minimax/video-01-live/image-to-video', instance, {
              proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
            });

            instance.setTranslations({
              en: {
                'panel.@imgly/plugin-ai-media': 'AI Media',
                '@imgly/plugin-ai-media': 'AI Media',
                'libraries.ly.img.image.fal-ai/recraft-v3.history.label':
                  'AI Generated',
                'libraries.ly.img.video.fal-ai/pixverse/v3.5/text-to-video.history.label':
                  'AI Generated',

                'fal-ai/minimax/video-01-live/image-to-video': 'Image to Video',
                'panel.fal-ai/minimax/video-01-live/image-to-video.imageSelection': 'Select Image'
              }
            });

            instance.ui.registerPanel('@imgly/plugin-ai-media', (context) => {
              const tabState = context.experimental.global(
                'ai-generate.tabs',
                'image'
              );

              context.builder.Section('ai-generate.tabs.section', {
                children: () => {
                  context.builder.ButtonGroup('ai-generate.tabs', {
                    children: () => {
                      context.builder.Button('ai-generate.tabs.image', {
                        label: 'Image',
                        icon: '@imgly/plugin-ai-generation/image',
                        isActive: tabState.value === 'image',
                        onClick: () => {
                          tabState.setValue('image');
                        }
                      });
                      context.builder.Button('ai-generate.tabs.video', {
                        label: 'Video',
                        icon: '@imgly/plugin-ai-generation/video',
                        isActive: tabState.value === 'video',
                        onClick: () => {
                          tabState.setValue('video');
                        }
                      });
                    }
                  });
                }
              });

              switch (tabState.value) {
                case 'image': {
                  const render = recraftV3?.renderBuilderFunctions?.panel;
                  if (render) {
                    return render(context);
                  } else {
                    context.builder.Text('ai-generate.content.error', {
                      content: 'Failed to load the AI model.'
                    });
                  }
                  break;
                }
                case 'video': {
                  const render = pixverse?.renderBuilderFunctions?.panel;
                  if (render) {
                    return render(context);
                  } else {
                    context.builder.Text('ai-generate.content.error', {
                      content: 'Failed to load the AI model.'
                    });
                  }
                  break;
                }
              }
            });

            initProvider(
              CustomProvider,
              {
                engine: instance.engine,
                cesdk: instance
              },

              {
                debug: true
              }
            );

            initProvider(
              SchemaProvider,
              {
                engine: instance.engine,
                cesdk: instance
              },

              {
                debug: true
              }
            );

            function createDockButton(
              id: string,
              icon: string = '@imgly/Sparkle'
            ): string {
              instance.ui.registerComponent(id, ({ builder }) => {
                const isOpen = instance.ui.isPanelOpen(id);
                builder.Button(`${id}.generate`, {
                  label: id,
                  icon,
                  isSelected: isOpen,
                  onClick: () => {
                    if (isOpen) {
                      instance.ui.closePanel(id);
                    } else {
                      instance.ui.findAllPanels().forEach((panelId) => {
                        if (
                          panelId.startsWith('@imgly/plugin-ai-') ||
                          panelId.startsWith('fal-ai/')
                        ) {
                          instance.ui.closePanel(panelId);
                        }
                      });
                      instance.ui.openPanel(id);
                    }
                  }
                });
              });

              return id;
            }

            instance.ui.setDockOrder([
              // createDockButton('schema'),
              // createDockButton('custom'),
              // createDockButton('fal-ai/recraft-v3'),
              // createDockButton('fal-ai/recraft-20b'),
              // createDockButton('fal-ai/pixverse/v3.5/text-to-video'),
              createDockButton('@imgly/plugin-ai-media'),
              createDockButton(
                'fal-ai/minimax/video-01-live/image-to-video',
                '@imgly/plugin-ai-generation/video'
              ),

              ...instance.ui
                .getDockOrder()
                .filter(({ key }) => key !== 'ly.img.video.template')
            ]);

            const imageEntry = instance.ui.getAssetLibraryEntry('ly.img.image');
            if (imageEntry != null) {
              const historyId = 'fal-ai/recraft-v3.history';
              const sourceIds = [...imageEntry.sourceIds];
              if (!sourceIds.includes(historyId)) {
                const uploadIndex =
                  sourceIds.findIndex((id) =>
                    id.startsWith('ly.img.image.upload')
                  ) + 1;

                sourceIds.splice(uploadIndex, 0, historyId);
                instance.ui.updateAssetLibraryEntry('ly.img.image', {
                  sourceIds
                });
              }
            }

            const videoEntry = instance.ui.getAssetLibraryEntry('ly.img.video');
            if (videoEntry != null) {
              const historyId = 'fal-ai/pixverse/v3.5/text-to-video.history';
              const sourceIds = [...videoEntry.sourceIds];
              if (!sourceIds.includes(historyId)) {
                const uploadIndex =
                  sourceIds.findIndex((id) =>
                    id.startsWith('ly.img.video.upload')
                  ) + 1;

                sourceIds.splice(uploadIndex, 0, historyId);
                instance.ui.updateAssetLibraryEntry('ly.img.video', {
                  sourceIds
                });
              }
            }

            instance.ui.registerComponent(
              '@imgly/magic/image',
              ({ builder, engine, experimental }) => {
                const selectedIds = engine.block.findAllSelected();
                if (selectedIds.length === 0) {
                  return;
                }
                const [selectedId] = selectedIds;
                if (!engine.block.hasFill(selectedId)) {
                  return;
                }

                const fill = engine.block.getFill(selectedId);
                const fillType = engine.block.getType(fill);
                if (fillType !== '//ly.img.ubq/fill/image') {
                  return;
                }

                const [source] = engine.block.getSourceSet(fill, 'fill/image/sourceSet');
                if (source == null) {
                  return;
                }

                experimental.builder.Popover('@imgly/magic/image.popover', {
                  icon: '@imgly/Sparkle',
                  trailingIcon: null,
                  children: ({ close }) => {
                    builder.Section('@imgly/magic/image.section', {
                      children: () => {
                        experimental.builder.Menu('@imgly/magic/image.menu', {
                          children: () => {
                            builder.Button('@imgly/magic/image.button', {
                              label: 'Generate Video...',

                              icon: '@imgly/plugin-ai-generation/video',
                              labelAlignment: 'left',
                              variant: 'plain',

                              onClick: () => {
                                close();
                                instance.ui.experimental.setGlobalStateValue(
                                  'fal-ai/minimax/video-01-live/image-to-video.image_url',
                                  source.uri
                                );
                                instance.ui.openPanel(
                                  'fal-ai/minimax/video-01-live/image-to-video'
                                );
                              }
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            );

            instance.ui.setCanvasMenuOrder([
              '@imgly/magic/image',
              ...instance.ui.getCanvasMenuOrder()
            ]);

            setTimeout(() => {
               // instance.ui.openPanel(
               //   'fal-ai/minimax/video-01-live/image-to-video',
               //   {
               //     payload: {
               //       url: 'https://www.img.ly/static/imgly-ai/ai-media/ai-media-1.jpg'
               //     }
               //   }
               // );
            }, 500);
          });
        } else if (cesdk.current != null) {
          cesdk.current.dispose();
        }
      }}
    ></div>
  );
}

export default TestGenerationProvider;
