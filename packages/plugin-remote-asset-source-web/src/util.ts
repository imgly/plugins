import {
  AssetResult,
  BlockAPI,
  CompleteAssetResult,
  CreativeEngine
} from '@cesdk/cesdk-js';

const METADATA_KEYS = {
  SOURCE_ID: 'source/id',
  ASSET_EXTERNAL_ID: 'source/externalId'
};

// This will be handled by the engine in the future
export function ensureMetadataKeys(
  engine: {
    block: BlockAPI;
  },
  block: number,
  asset: AssetResult,
  sourceId: string
) {
  engine.block.setMetadata(block, METADATA_KEYS.SOURCE_ID, sourceId);
  engine.block.setMetadata(block, METADATA_KEYS.ASSET_EXTERNAL_ID, asset.id);
}

export const isBlockFromSource = (
  block: number,
  sourceId: string,
  engine: CreativeEngine
) => {
  try {
    return (
      engine.block.getMetadata(block, METADATA_KEYS.SOURCE_ID) === sourceId
    );
  } catch (e) {
    return false;
  }
};
export const getSourceIdFromBlock = (block: number, engine: CreativeEngine) => {
  try {
    return engine.block.getMetadata(block, METADATA_KEYS.SOURCE_ID);
  } catch (e) {
    return null;
  }
};
export const getExternalIdFromBlock = (
  block: number,
  engine: CreativeEngine
) => {
  try {
    return engine.block.getMetadata(block, METADATA_KEYS.ASSET_EXTERNAL_ID);
  } catch (e) {
    return null;
  }
};

// Some asset sources (Giphy) do not provide the duration of the asset.
// This function ensures that the duration is set correctly on the asset.
export async function ensureAssetDuration(
  engine: {
    block: BlockAPI;
  },
  asset: CompleteAssetResult,
  block: number
) {
  if (asset.meta?.duration) return;

  if (!engine.block.hasFill(block)) return;

  const videoFill = engine.block.getFill(block);

  if (engine.block.getType(videoFill) !== '//ly.img.ubq/fill/video') return;

  await engine.block.forceLoadAVResource(videoFill);

  const duration = engine.block.getAVResourceTotalDuration(videoFill);
  engine.block.setDuration(block, duration);
}
