import CreativeEditorSDK from '@cesdk/cesdk-js';

import AiPlugin from './AiPlugin';
import FalAiImage from '@imgly/plugin-ai-image-generation-web/fal-ai';
import FalAiVideo from '@imgly/plugin-ai-video-generation-web/fal-ai';
import Elevenlabs from '@imgly/plugin-ai-audio-generation-web/elevenlabs';
import Anthropic from '@imgly/plugin-ai-text-generation-web/anthropic';

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
              'ly.img.ai/apps.dock',
              ...instance.ui.getDockOrder().filter(({ key }) => {
                return (
                  key !== 'ly.img.video.template' && key !== 'ly.img.template'
                );
              })
            ]);

            instance.ui.setCanvasMenuOrder([
              'ly.img.ai.text.canvasMenu',
              `ly.img.ai.image.canvasMenu`,
              ...instance.ui.getCanvasMenuOrder()
            ]);

            instance.feature.enable('ly.img.preview', false);
            instance.feature.enable('ly.img.placeholder', false);

            await instance.createVideoScene();

            instance.addPlugin(
              AiPlugin({
                providers: {
                  text2text: Anthropic.AnthropicProvider({
                    proxyUrl: import.meta.env.VITE_ANTHROPIC_PROXY_URL
                  }),
                  text2sticker: FalAiImage.Recraft20b({
                    proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                  }),
                  text2image: FalAiImage.RecraftV3({
                    proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                  }),
                  image2image: FalAiImage.GeminiFlashEdit({
                    proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                  }),
                  text2video: FalAiVideo.MinimaxVideo01Live({
                    proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                  }),
                  image2video: FalAiVideo.MinimaxVideo01LiveImageToVideo({
                    proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                  }),
                  text2speech: Elevenlabs.ElevenMultilingualV2({
                    proxyUrl: import.meta.env.VITE_ELEVENLABS_PROXY_URL
                  }),
                  text2sound: Elevenlabs.ElevenSoundEffects({
                    proxyUrl: import.meta.env.VITE_ELEVENLABS_PROXY_URL
                  })
                }
              })
            );

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
          });
        } else if (cesdk.current != null) {
          cesdk.current.dispose();
        }
      }}
    ></div>
  );
}

export default App;
