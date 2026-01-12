import { OutputKind } from '../core/provider';
import CreativeEditorSDK from '@cesdk/cesdk-js';

/**
 * Integrates the asset sources into the default asset library entry for the
 * given kind.
 */
function integrateIntoDefaultAssetLibraryEntry<K extends OutputKind>(
  kind: K,
  historAssetSourceIds: string[],
  cesdk: CreativeEditorSDK
): string | undefined {
  const entryId = `ly.img.${kind}`;
  const entry = cesdk.ui.getAssetLibraryEntry(entryId);
  if (entry != null) {
    // Resolve sourceIds - it can be a function in CESDK >= 1.62.0
    const currentSourceIds =
      typeof entry.sourceIds === 'function'
        ? entry.sourceIds({ cesdk, engine: cesdk.engine })
        : entry.sourceIds;
    cesdk.ui.updateAssetLibraryEntry(entryId, {
      sourceIds: [...currentSourceIds, ...historAssetSourceIds]
    });
    return entry.id;
  }
}

export default integrateIntoDefaultAssetLibraryEntry;
