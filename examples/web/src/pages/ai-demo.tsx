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
                    }
                  }
                });
              });

              return componentId;
            }

            initProvider(
              recraftV3Provider(
                instance,
                {
                  proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                }
              ),
              {
                cesdk: instance,
                engine: instance.engine
              },
              {
                debug: true
              }
            );
            initProvider(
              pixverseV35TextToVideo(
                instance,
                {
                  proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                }
              ),
              {
                cesdk: instance,
                engine: instance.engine
              },
              {
                debug: true
              }
            );
            initProvider(
              minimaxVideo01LiveImageToVideo(
                instance,
                {
                  proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                }
              ),
              {
                cesdk: instance,
                engine: instance.engine
              },
              {
                debug: true
              }
            );

            instance.ui.setDockOrder([
              createDockItem(
                'fal-ai/recraft-v3',
                'Recraft V3',
                '@imgly/Sparkle'
              ),
              createDockItem(
                'fal-ai/pixverse/v3.5/text-to-video',
                'Pixverse V3.5 Text to Video',
                '@imgly/Sparkle'
              ),
              createDockItem(
                'fal-ai/minimax/video-01-live/image-to-video',
                'Minimax Video 01 Live Image to Video',
                '@imgly/Sparkle'
              ),
              ...instance.ui.getDockOrder()
            ]);

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
