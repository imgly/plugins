import type CreativeEditorSDK from '@cesdk/cesdk-js';

import { FillProcessingMetadata } from '..';
import { getFeatureId } from './constants';

export default function handleFillProcessing(
  cesdk: CreativeEditorSDK,
  {
    pluginId,
    process
  }: {
    pluginId: string;
    icon?: string;
    process: (blockId: number, metadata: FillProcessingMetadata) => void;
  }
): {
  featureId: string;
} {
  const featureId = getFeatureId(pluginId);

  const metadata = new FillProcessingMetadata(cesdk.engine, pluginId);

  enableFeatures(cesdk, metadata, featureId);

  cesdk.engine.event.subscribe([], async (events) => {
    events.forEach((e) => {
      const id = e.block;
      if (!cesdk.engine.block.isValid(id) || !metadata.hasData(id)) {
        return;
      }

      if (e.type === 'Created') {
        if (metadata.isDuplicate(id)) {
          metadata.fixDuplicate(id);
        }
      } else if (e.type === 'Updated') {
        switch (metadata.get(id).status) {
          case 'PENDING': {
            if (
              cesdk.feature.isEnabled(featureId, {
                engine: cesdk.engine
              }) &&
              cesdk.engine.block.isAllowedByScope(id, 'fill/change') &&
              cesdk.engine.block.getState(id).type !== 'Pending'
            ) {
              process(id, metadata);
            }
            break;
          }

          case 'PROCESSING':
          case 'PROCESSED': {
            if (!metadata.isConsistent(id)) {
              metadata.clear(id);
            }
            break;
          }

          default: {
            // We do not care about other states
          }
        }
      }
    });
  });

  return { featureId };
}

/**
 * Defines the feature that determines in which context (on which block)
 * fill processing is allowed/enabled.
 */
function enableFeatures(
  cesdk: CreativeEditorSDK,
  metadata: FillProcessingMetadata,
  featureId: string
) {
  cesdk.feature.enable(featureId, ({ engine }) => {
    const selectedIds = engine.block.findAllSelected();
    if (selectedIds.length !== 1) {
      return false;
    }
    const [selectedId] = selectedIds;

    if (!cesdk.engine.block.isVisible(selectedId)) return false;

    if (cesdk.engine.block.hasFill(selectedId)) {
      const kind = cesdk.engine.block.getKind(selectedId);
      if (kind === 'sticker') return false;

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
      return metadata.get(selectedId).status === 'PROCESSING';
    }

    return false;
  });
}
