import CreativeEditorSDK from '@cesdk/cesdk-js';
import { useRef } from 'react';
import { CreativeEngine } from '@cesdk/cesdk-js';
import BackgroundRemovalPlugin from '@imgly/plugin-background-removal-web';
import CutoutLibraryPlugin from '@imgly/plugin-cutout-library-web';
import QrCodePlugin from '@imgly/plugin-qr-code-web';
import RemoteAssetSourcePlugin from '@imgly/plugin-remote-asset-source-web';
import VectorizerPlugin from '@imgly/plugin-vectorizer-web';

// The host of the remote asset source server.
// The server must be running and accessible from the client.
const ASSET_SOURCE_HOST = 'http://localhost:3000';

const ENABLE_DEMO_ASSET_SOURCES = false;

function Root() {
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

            // Do something with the instance of CreativeEditor SDK, for example:
            // Populate the asset library with default / demo asset sources.
            await Promise.all([
              instance.addDefaultAssetSources(),
              instance.addDemoAssetSources({ sceneMode: 'Design' })
            ]);
            await addPlugins(instance);
            const cutoutAssetEntry = instance.ui.getAssetLibraryEntry(
              'ly.img.cutout.entry'
            );

            instance.ui.setInspectorBarOrder([
              '@imgly/plugin-vectorizer-web.inspectorBar',
              '@imgly/plugin-background-removal-web.inspectorBar',
              'ly.img.separator',
              ...instance.ui.getInspectorBarOrder()
            ]);

            instance.ui.setDockOrder([
              'fal-ai/recraft-v3.dock',
              'custom.dock',
              'fal-ai/pixverse/v3.5/text-to-video.dock',
              'ly.img.separator',
              ...instance.ui.getDockOrder(),
              {
                id: 'ly.img.assetLibrary.dock',
                label: 'Cutout',
                key: 'ly.img.assetLibrary.dock',
                icon: cutoutAssetEntry?.icon,
                entries: ['ly.img.cutout.entry']
              },
              'ly.img.spacer',
              '@imgly/plugin-vectorizer-web.dock',
              '@imgly/plugin-background-removal-web.dock',
              'ly.img.generate-qr.dock'
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

async function addPlugins(cesdk: CreativeEditorSDK): Promise<void> {
  console.log('Adding plugins...');
  try {
    await Promise.all([
      cesdk.addPlugin(
        CutoutLibraryPlugin({
          ui: { locations: ['canvasMenu'] }
        })
      ),
      cesdk.addPlugin(
        BackgroundRemovalPlugin({ ui: { locations: 'canvasMenu' } })
      ),
      cesdk.addPlugin(VectorizerPlugin({ ui: { locations: 'canvasMenu' } })),

      cesdk.addPlugin(QrCodePlugin()),

      ...addDemoRemoteAssetSourcesPlugins(cesdk)
    ]);
  } catch (error) {
    console.error('Could not add all plugins: ', error);
  }
}

function addDemoRemoteAssetSourcesPlugins(
  cesdk: CreativeEditorSDK
): Promise<void>[] {
  if (!ENABLE_DEMO_ASSET_SOURCES) return [];
  return [
    '/api/assets/v1/image-pexels',
    '/api/assets/v1/image-unsplash',
    '/api/assets/v1/video-pexels',
    '/api/assets/v1/video-giphy'
  ].map(async (baseUrl) => {
    cesdk.addPlugin(
      RemoteAssetSourcePlugin({
        baseUrl: ASSET_SOURCE_HOST + baseUrl
      })
    );
  });
}

// Helper function that automatically adds asset sources to the respective asset source panels:
// If the source starts with 'ly.img.audio', 'ly.img.image', or 'ly.img.video', it will be added to the respective panel.
// Should be used as a callback for the `entries` property of the `libraries.insert`/`libraries.replace` element in the UI configuration.

export const prepareAssetEntries = (
  defaultEntries: any,
  engine: CreativeEngine
) => {
  if (!engine) return defaultEntries;

  const assetSourceIds = engine.asset.findAllSources() ?? [];
  ['ly.img.audio', 'ly.img.image', 'ly.img.video'].forEach((entryId) => {
    const entry = defaultEntries.find((entry: any) => {
      return entry.id === entryId;
    });
    if (entry) {
      const assetSources = assetSourceIds
        .filter((sourceId: any) => sourceId.startsWith(entryId + '.'))
        .filter((sourceId: any) => !entry.sourceIds.includes(sourceId));
      entry.sourceIds = [...entry.sourceIds, ...assetSources];
    }
  });
  return defaultEntries;
};

export default Root;
