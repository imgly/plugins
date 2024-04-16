import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { FillProcessingMetadata } from '..';

const createIds = (pluginId: string): Ids => ({
  featureId: `${pluginId}.fillProcessing.feature`,
  canvasMenuComponentId: `${pluginId}.fillProcessing.canvasMenu`,

  translationsKeys: {
    canvasMenuLabel: `plugin.${pluginId}.fillProcessing.canvasMenu.button.label`
  }
});

export type Location = 'canvasMenu';

export interface Ids {
  featureId: string;
  canvasMenuComponentId: string;

  translationsKeys: {
    canvasMenuLabel: string;
  };
}

export default function handleFillProcessing(
  cesdk: CreativeEditorSDK,
  {
    pluginId,
    icon,
    featureId: featureIdFromArgs,
    locations,
    process
  }: {
    pluginId: string;
    featureId?: string;
    icon?: string;
    locations?: Location | Location[];
    process: (blockId: number, metadata: FillProcessingMetadata) => void;
  }
): Ids {
  const ids = createIds(pluginId);
  if (featureIdFromArgs != null) {
    ids.featureId = featureIdFromArgs;
  }
  const metadata = new FillProcessingMetadata(cesdk, pluginId);

  enableFeatures(cesdk, metadata, ids.featureId);
  registerComponents(cesdk, metadata, ids, { icon });

  if (locations?.includes('canvasMenu')) {
    cesdk.ui.unstable_setCanvasMenuOrder([
      ids.canvasMenuComponentId,
      ...cesdk.ui.unstable_getCanvasMenuOrder()
    ]);
  }

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
              cesdk.feature.unstable_isEnabled(ids.featureId, {
                engine: cesdk.engine
              })
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

  return ids;
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
  cesdk.feature.unstable_enable(featureId, ({ engine }) => {
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
      return metadata.get(selectedId).status === 'PROCESSING';
    }

    return false;
  });
}

/**
 * Registers the components that can be used to process the fill of
 * a block.
 */
export function registerComponents(
  cesdk: CreativeEditorSDK,
  metadata: FillProcessingMetadata,
  ids: Ids,
  options: {
    icon?: string;
  }
) {
  cesdk.ui.unstable_registerComponent(
    ids.canvasMenuComponentId,
    ({ builder: { Button }, engine }) => {
      if (
        !cesdk.feature.unstable_isEnabled(ids.featureId, {
          engine
        })
      ) {
        return;
      }

      const [id] = engine.block.findAllSelected();

      const currentMetadata = metadata.get(id);

      const isLoading = currentMetadata.status === 'PROCESSING';
      const isDisabled =
        currentMetadata.status === 'PENDING' ||
        currentMetadata.status === 'PROCESSING';

      let loadingProgress: number | undefined;
      if (isLoading && currentMetadata.progress) {
        const { current, total } = currentMetadata.progress;
        loadingProgress = (current / total) * 100;
      }

      const buttonId = `${ids.canvasMenuComponentId}.button`;
      Button(buttonId, {
        label: ids.translationsKeys.canvasMenuLabel,
        icon: options.icon,
        isLoading,
        isDisabled,
        loadingProgress,
        onClick: () => {
          if (
            currentMetadata.status === 'IDLE' ||
            currentMetadata.status === 'ERROR' ||
            currentMetadata.status === 'PROCESSED'
          ) {
            metadata.set(id, {
              status: 'PENDING'
            });
          }
        }
      });
    }
  );
}
