import { OutputKind } from './provider';
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
    cesdk.ui.updateAssetLibraryEntry(entryId, {
      sourceIds: [...entry.sourceIds, ...historAssetSourceIds]
    });
    return entry.id;
  }
}

export default integrateIntoDefaultAssetLibraryEntry;
