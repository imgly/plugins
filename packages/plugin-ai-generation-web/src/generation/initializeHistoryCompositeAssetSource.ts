import { AggregatedAssetSource } from '@imgly/plugin-utils';
import { OutputKind, Output } from './provider';
import { InitializationContext } from './types';

/**
 * Initializes the combined history asset source for the given asset sources.
 */
function initializeHistoryCompositeAssetSource<
  K extends OutputKind,
  I,
  O extends Output
>(
  context: InitializationContext<K, I, O>,
  historAssetSourceIds: string[]
): string | undefined {
  const {
    options: { cesdk }
  } = context;

  const aggregatedImageAssetSource = new AggregatedAssetSource(
    'ly.img.ai/image-generation.history',
    cesdk,
    historAssetSourceIds
  );
  cesdk.engine.asset.addSource(aggregatedImageAssetSource);

  return aggregatedImageAssetSource.id;
}

export default initializeHistoryCompositeAssetSource;
