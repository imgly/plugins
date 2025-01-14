import CreativeEditorSDK from '@cesdk/cesdk-js';
import { useRef } from 'react';
import addPlugins from './addPlugins';

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
            featureFlags: {
              archiveSceneEnabled: true
            },

            callbacks: {
              onUpload: 'local',
              onLoadArchive: 'uploadArchive',
              onExport: 'download',
              onDownload: 'download'
            },
            ui: {
              elements: {
                navigation: {
                  action: {
                    download: true,
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

            // Do something with the instance of CreativeEditor SDK, for example:
            // Populate the asset library with default / demo asset sources.
            await Promise.all([
              instance.addDefaultAssetSources(),
              instance.addDemoAssetSources({ sceneMode: 'Design' })
            ]);
            await addPlugins(instance);

            instance.ui.setDockOrder([
              {
                id: 'ly.img.fal-ai/recraft-v3.dock'
              },
              {
                id: 'ly.img.fal-ai/recraft-v3/vector.dock'
              },
              {
                id: 'ly.img.fal-ai/recraft-v3/raster.dock'
              },
              {
                id: 'ly.img.separator'
              },
              {
                id: 'ly.img.assetLibrary.dock',
                key: 'ly.img.elements',
                icon: '@imgly/Library',
                label: 'component.library.elements',
                entries: [
                  'ly.img.upload',
                  'ly.img.video',
                  'ly.img.audio',
                  'ly.img.image',
                  'ly.img.text',
                  'ly.img.vectorpath',
                  'ly.img.sticker'
                ]
              },
              {
                id: 'ly.img.assetLibrary.dock',
                key: 'ly.img.upload',
                icon: '@imgly/Upload',
                label: 'libraries.ly.img.upload.label',
                entries: ['ly.img.upload']
              },
              {
                id: 'ly.img.assetLibrary.dock',
                key: 'ly.img.video',
                icon: '@imgly/Video',
                label: 'libraries.ly.img.video.label',
                entries: ['ly.img.video']
              },
              {
                id: 'ly.img.assetLibrary.dock',
                key: 'ly.img.audio',
                icon: '@imgly/Audio',
                label: 'libraries.ly.img.audio.label',
                entries: ['ly.img.audio']
              },
              {
                id: 'ly.img.assetLibrary.dock',
                key: 'ly.img.image',
                icon: '@imgly/Image',
                label: 'libraries.ly.img.image.label',
                entries: ['ly.img.image']
              },
              {
                id: 'ly.img.assetLibrary.dock',
                key: 'ly.img.text',
                icon: '@imgly/Text',
                label: 'libraries.ly.img.text.label',
                entries: ['ly.img.text']
              },
              {
                id: 'ly.img.assetLibrary.dock',
                key: 'ly.img.vectorpath',
                icon: '@imgly/Shapes',
                label: 'libraries.ly.img.vectorpath.label',
                entries: ['ly.img.vectorpath']
              },
              {
                id: 'ly.img.assetLibrary.dock',
                key: 'ly.img.sticker',
                icon: '@imgly/Sticker',
                label: 'libraries.ly.img.sticker.label',
                entries: ['ly.img.sticker']
              },
              {
                id: 'ly.img.separator'
              },
              {
                id: 'ly.img.generate-qr.dock'
              }
            ]);

            const imageEntry = instance.ui.getAssetLibraryEntry('ly.img.image');
            if (imageEntry != null) {
              instance.ui.updateAssetLibraryEntry('ly.img.image', {
                ...imageEntry,
                sourceIds: [
                  ...imageEntry.sourceIds,
                  'fal-ai/recraft-v3',
                  'fal-ai/recraft-v3/vector',
                  'fal-ai/recraft-v3/raster'
                ]
              });
            }

            await instance.createDesignScene();
          });
        } else if (cesdk.current != null) {
          cesdk.current.dispose();
        }
      }}
    ></div>
  );
}

export default App;
