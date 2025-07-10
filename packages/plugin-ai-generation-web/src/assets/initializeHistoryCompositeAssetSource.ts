import { AggregatedAssetSource } from '@imgly/plugin-utils';
import { OutputKind } from '../core/provider';
import CreativeEditorSDK from '@cesdk/cesdk-js';

/**
 * Initializes the combined history asset source for the given asset sources.
 */
function initializeHistoryCompositeAssetSource<K extends OutputKind>(options: {
  kind: K;
  cesdk: CreativeEditorSDK;
  historAssetSourceIds: string[];
}): string | undefined {
  const { kind, cesdk, historAssetSourceIds } = options;
  const compositeAssetSourceId = `ly.img.ai.${kind}-generation.history`;

  if (cesdk.engine.asset.findAllSources().includes(compositeAssetSourceId)) {
    return compositeAssetSourceId;
  }

  const aggregatedImageAssetSource = new AggregatedAssetSource(
    compositeAssetSourceId,
    cesdk,
    historAssetSourceIds
  );
  cesdk.engine.asset.addSource(aggregatedImageAssetSource);

  return aggregatedImageAssetSource.id;
}

export default initializeHistoryCompositeAssetSource;
