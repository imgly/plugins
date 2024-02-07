import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { FEATURE_ID } from './constants';
/**
 * Defines the feature that determines in which context (on which block)
 * background removal is allowed/enabled.
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
      return true

    }

    return false;
  });
}
