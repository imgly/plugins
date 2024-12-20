import CreativeEditorSDK from '@cesdk/cesdk-js';
import { FillProcessingMetadata } from '..';
import {
  getCanvasMenuComponentIds,
  getDockComponentIds,
  getFeatureId,
  getI18nCanvasMenuLabel,
  getI18nDockLabel
} from './constants';

export type Location = 'canvasMenu' | 'dock';

/**
 * Registers the components that can be used to process the fill of
 * a block.
 */
export default function registerFillProcessingComponents(
  cesdk: CreativeEditorSDK,
  options: {
    pluginId: string;
    icon?: string;
    locations?: Location | Location[];
  }
): {
  canvasMenuComponentId: string;
  dockComponentId: string;

  translationsKeys: {
    canvasMenuLabel: string;
    dockLabel: string;
  };
} {
  const { pluginId, locations } = options;
  const metadata = new FillProcessingMetadata(cesdk.engine, pluginId);

  const canvasMenuComponentIds = getCanvasMenuComponentIds(pluginId);
  const canvasMenuComponentId = canvasMenuComponentIds[0];

  const dockComponentIds = getDockComponentIds(pluginId);
  const dockComponentId = dockComponentIds[0];

  const canvasMenuLabel = getI18nCanvasMenuLabel(pluginId);
  const dockLabel = getI18nDockLabel(pluginId);

  const featureId = getFeatureId(pluginId);

  if (locations?.includes('canvasMenu')) {
    cesdk.ui.setCanvasMenuOrder([
      canvasMenuComponentId,
      ...cesdk.ui.getCanvasMenuOrder()
    ]);
  }
  if (locations?.includes('dock')) {
    cesdk.ui.setDockOrder([...cesdk.ui.getDockOrder(), dockComponentId]);
  }

  cesdk.ui.registerComponent(
    dockComponentIds,
    ({ builder: { Button }, engine }) => {
      const [id] = engine.block.findAllSelected();

      let isDisabled = false;
      let isLoading = false;
      let loadingProgress: number | undefined;

      if (id == null) {
        isDisabled = true;
      }

      if (
        !isDisabled &&
        !cesdk.feature.isEnabled(featureId, {
          engine
        })
      ) {
        isDisabled = true;
      }

      if (
        !isDisabled &&
        !cesdk.engine.block.isAllowedByScope(id, 'fill/change')
      ) {
        isDisabled = true;
      }

      if (!isDisabled && engine.block.getState(id)?.type === 'Pending') {
        isDisabled = true;
      }

      if (!isDisabled) {
        const currentMetadata = metadata.get(id);

        isLoading = currentMetadata.status === 'PROCESSING';
        isDisabled =
          currentMetadata.status === 'PENDING' ||
          currentMetadata.status === 'PROCESSING';

        if (
          currentMetadata.status === 'PROCESSING' &&
          currentMetadata.progress
        ) {
          const { current, total } = currentMetadata.progress;
          loadingProgress = (current / total) * 100;
        }
      }

      const buttonId = `${dockComponentId}.button`;
      Button(buttonId, {
        label: dockLabel,
        icon: options.icon,
        isLoading,
        isDisabled,
        loadingProgress,
        onClick: () => {
          const currentMetadata = metadata.get(id);

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

  cesdk.ui.registerComponent(
    canvasMenuComponentIds,
    ({ builder: { Button }, engine }) => {
      if (
        !cesdk.feature.isEnabled(featureId, {
          engine
        })
      ) {
        return;
      }

      const [id] = engine.block.findAllSelected();

      if (!cesdk.engine.block.isAllowedByScope(id, 'fill/change')) return;

      const currentMetadata = metadata.get(id);

      const isLoading = currentMetadata.status === 'PROCESSING';
      const isDisabled =
        currentMetadata.status === 'PENDING' ||
        currentMetadata.status === 'PROCESSING' ||
        engine.block.getState(id)?.type === 'Pending';

      let loadingProgress: number | undefined;
      if (isLoading && currentMetadata.progress) {
        const { current, total } = currentMetadata.progress;
        loadingProgress = (current / total) * 100;
      }

      const buttonId = `${canvasMenuComponentId}.button`;
      Button(buttonId, {
        label: canvasMenuLabel,
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

  return {
    canvasMenuComponentId,
    dockComponentId,
    translationsKeys: {
      canvasMenuLabel,
      dockLabel
    }
  };
}
