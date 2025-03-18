import CreativeEditorSDK from '@cesdk/cesdk-js';
import { initProvider } from '@imgly/plugin-utils-ai-generation';
import {
  recraftV3Provider,
  pixverseV35TextToVideo,
  minimaxVideo01LiveImageToVideo
} from '@imgly/plugin-utils-fal-ai';
import { useRef } from 'react';

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
            callbacks: { onUpload: 'local' }
          }).then(async (instance) => {
            // @ts-ignore
            window.cesdk = instance;
            cesdk.current = instance;

            await Promise.all([
              instance.addDefaultAssetSources(),
              instance.addDemoAssetSources({ sceneMode: 'Design' })
            ]);

            function createDockItem(
              modelKey: string,
              title: string,
              icon: string
            ) {
              const componentId = `${modelKey}.dock`;
              instance.ui.registerComponent(componentId, ({ builder }) => {
                const isOpen = instance.ui.isPanelOpen(modelKey);

                builder.Button(`${modelKey}.dock.button`, {
                  label: title,
                  icon: icon,
                  isSelected: isOpen,
                  onClick: () => {
                    instance.ui.findAllPanels().forEach((panel) => {
                      if (panel.startsWith('fal-ai/')) {
                        instance.ui.closePanel(panel);
                      }
                    });

                    if (!isOpen) {
                      instance.ui.openPanel(modelKey);
                    } else {
                      instance.ui.closePanel(modelKey);
                    }
                  }
                });
              });

              return componentId;
            }
            const options = { cesdk: instance, engine: instance.engine };
            const config = { debug: true };

            const recraftInstance = recraftV3Provider(instance, {
              proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
            });

            const pixverseInstance = pixverseV35TextToVideo(instance, {
              proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
            });

            const minimaxInstance = minimaxVideo01LiveImageToVideo(instance, {
              proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
            });

            initProvider(recraftInstance, options, config);
            initProvider(pixverseInstance, options, config);
            initProvider(minimaxInstance, options, config);

            const AI_APP_ID = 'ly.img.ai-generation.apps';
            const THUMBNAIL_WIDTH = 256;
            const THUMBNAIL_HEIGHT = 96;

            instance.engine.asset.addLocalSource(AI_APP_ID);
            instance.engine.asset.addAssetToSource(AI_APP_ID, {
              id: recraftInstance.id,
              label: {
                en: 'Generate Image'
              },
              meta: {
                thumbUri:
                  'https://v3.fal.media/files/rabbit/x_CsMJ7tsfGIIEMh00vqv_image.webp',
                width: THUMBNAIL_WIDTH,
                height: THUMBNAIL_HEIGHT
              }
            });
            instance.engine.asset.addAssetToSource(AI_APP_ID, {
              id: pixverseInstance.id,
              label: {
                en: 'Generate Video'
              },
              meta: {
                thumbUri:
                  'https://v3.fal.media/files/koala/VC2NXBHSQ5gA1LUp64JxI_image.webp',
                width: THUMBNAIL_WIDTH,
                height: THUMBNAIL_HEIGHT
              }
            });
            instance.engine.asset.addAssetToSource(AI_APP_ID, {
              id: 'audio-v3',
              label: {
                en: 'Generate Speech'
              },
              meta: {
                thumbUri:
                  'https://v3.fal.media/files/penguin/b5BkFs7IpZ6aIS851bi3H_image.webp',
                width: THUMBNAIL_WIDTH,
                height: THUMBNAIL_HEIGHT
              }
            });

            instance.ui.registerPanel(AI_APP_ID, ({ builder }) => {
              builder.Library(AI_APP_ID, {
                entries: [AI_APP_ID],
                onSelect: async (asset) => {
                  instance.ui.closePanel(AI_APP_ID);
                  instance.ui.openPanel(asset.id);
                }
              });
            });

            instance.ui.addAssetLibraryEntry({
              id: AI_APP_ID,
              sourceIds: [AI_APP_ID],
              gridColumns: 1,
              gridItemHeight: 'auto',
              gridBackgroundType: 'cover',
              cardLabel: ({ label }) => label,
              cardLabelPosition: () => 'inside'
            });

            instance.ui.setDockOrder([
              createDockItem(AI_APP_ID, 'AI', '@imgly/Sparkle'),
              // createDockItem(
              //   'fal-ai/recraft-v3',
              //   'Recraft V3',
              //   '@imgly/Sparkle'
              // ),
              // createDockItem(
              //   'fal-ai/pixverse/v3.5/text-to-video',
              //   'Pixverse V3.5 Text to Video',
              //   '@imgly/Sparkle'
              // ),
              // createDockItem(
              //   'fal-ai/minimax/video-01-live/image-to-video',
              //   'Minimax Video 01 Live Image to Video',
              //   '@imgly/Sparkle'
              // ),
              ...instance.ui.getDockOrder().filter(({ key }) => {
                return key !== 'ly.img.video.template';
              })
            ]);

            instance.i18n.setTranslations({
              en: {
                'panel.ly.img.ai-generation.apps': 'AI'
              }
            });

            await instance.createVideoScene();

          });
        } else if (cesdk.current != null) {
          cesdk.current.dispose();
        }
      }}
    ></div>
  );
}

export default App;
