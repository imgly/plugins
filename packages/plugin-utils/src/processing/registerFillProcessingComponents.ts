import CreativeEditorSDK from '@cesdk/cesdk-js';
import { FillProcessingMetadata } from '..';
import {
  getCanvasMenuComponentId,
  getFeatureId,
  getI18nCanvasMenuLabel
} from './constants';

export type Location = 'canvasMenu';

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

  translationsKeys: {
    canvasMenuLabel: string;
  };
} {
  const { pluginId, locations } = options;
  const metadata = new FillProcessingMetadata(cesdk, pluginId);

  const canvasMenuComponentId = getCanvasMenuComponentId(pluginId);
  const canvasMenuLabel = getI18nCanvasMenuLabel(pluginId);
  const featureId = getFeatureId(pluginId);

  if (locations?.includes('canvasMenu')) {
    cesdk.ui.setCanvasMenuOrder([
      canvasMenuComponentId,
      ...cesdk.ui.getCanvasMenuOrder()
    ]);
  }

  cesdk.ui.registerComponent(
    canvasMenuComponentId,
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
    translationsKeys: {
      canvasMenuLabel
    }
  };
}
