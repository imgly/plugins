import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { FEATURE_ID } from './constants';
import { getPluginMetadata } from './utils';

/**
 * Defines the feature that determines in which context (on which block)
 * vectorizer is allowed/enabled.
 */
export function enableFeatures(cesdk: CreativeEditorSDK) {
  cesdk.feature.unstable_enable(FEATURE_ID, ({ engine }) => {
    const selectedIds = engine.block.findAllSelected();
    if (selectedIds.length !== 1) {
      return false;
    }
    const [selectedId] = selectedIds;

    if (cesdk.engine.block.hasFill(selectedId)) {
      const fillId = cesdk.engine.block.getFill(selectedId);
      const fillType = cesdk.engine.block.getType(fillId);

      if (fillType !== '//ly.img.ubq/fill/image') {
        return false;
      }

      const fileUri = engine.block.getString(fillId, 'fill/image/imageFileURI');
      const sourceSet = engine.block.getSourceSet(
        fillId,
        'fill/image/sourceSet'
      );

      if (sourceSet.length > 0 || fileUri !== '') return true;

      // If we are in a processing state we do not have a imageFileURI or
      // source set set (to show the loading spinner), but the feature is still
      // enabled.
      const metadata = getPluginMetadata(cesdk, selectedId);
      return metadata.status === 'PROCESSING';
    }

    return false;
  });
}
