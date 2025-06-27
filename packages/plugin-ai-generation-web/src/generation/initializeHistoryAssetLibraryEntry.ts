import { IndexedDBAssetSource } from '@imgly/plugin-utils';
import { OutputKind, Output } from './provider';
import { InitializationContext } from './types';

/**
 * Initializes the history asset source for the given provider.
 */
function initializeHistoryAssetLibraryEntry<
  K extends OutputKind,
  I,
  O extends Output
>(
  context: InitializationContext<K, I, O>,
  historyAssetSourceId?: string
): string | undefined {
  if (historyAssetSourceId == null || !historyAssetSourceId) return;

  const historyAssetLibraryEntryId = `${context.provider.id}.history.entry`;

  context.options.cesdk.ui.addAssetLibraryEntry({
    id: historyAssetLibraryEntryId,
    sourceIds: [historyAssetSourceId],
    sortBy: {
      sortKey: 'insertedAt',
      sortingOrder: 'Descending'
    },
    canRemove: true,
    gridItemHeight: 'square',
    gridBackgroundType: 'cover'
  });

  return historyAssetLibraryEntryId;
}

export default initializeHistoryAssetLibraryEntry;
