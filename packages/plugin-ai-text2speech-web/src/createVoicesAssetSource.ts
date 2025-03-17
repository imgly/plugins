import type CreativeEditorSDK from '@cesdk/cesdk-js';
import voices from './voices/content.json';

function createVoicesAssetSource(cesdk: CreativeEditorSDK): string {
  const { id, assets } = voices;
  cesdk.engine.asset.addLocalSource(id);
  assets.map(async (asset) => {
    cesdk.engine.asset.addAssetToSource(id, asset);
  });
  return id;
}

export default createVoicesAssetSource;
