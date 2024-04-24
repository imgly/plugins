import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { CreativeEngine } from '@cesdk/cesdk-js';
import BackgroundRemovalPlugin from '@imgly/plugin-background-removal-web';
import CutoutLibraryPlugin from '@imgly/plugin-cutout-library-web';
import RemoteAssetSourcePlugin from '@imgly/plugin-remote-asset-source-web';

const ENABLE_DEMO_ASSET_SOURCES = false;

async function addPlugins(cesdk: CreativeEditorSDK): Promise<void> {
  console.log('Adding plugins', RemoteAssetSourcePlugin);
  try {
    await Promise.all([
      cesdk.unstable_addPlugin(
        CutoutLibraryPlugin({
          ui: { locations: ['canvasMenu'] }
        })
      ),
      cesdk.unstable_addPlugin(
        BackgroundRemovalPlugin({ ui: { locations: 'canvasMenu' } })
      ),
      ...addDemoRemoteAssetSourcesPlugins(cesdk)
    ]);
  } catch (error) {
    console.error('Could not add all plugins: ', error);
  }
}

// The host of the remote asset source server.
// The server must be running and accessible from the client.
const ASSET_SOURCE_HOST = 'http://localhost:3000';

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
    await cesdk.unstable_addPlugin(
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

export default addPlugins;
