import CreativeEditorSDK from '@cesdk/cesdk-js';
import { FillProcessingMetadata } from '..';
import {
  getCanvasBarComponentIds,
  getCanvasMenuComponentIds,
  getDockComponentIds,
  getFeatureId,
  getI18nCanvasBarLabel,
  getI18nCanvasMenuLabel,
  getI18nDockLabel,
  getI18nInspectorBarLabel,
  getI18nNavigationBarLabel,
  getInspectorBarComponentIds,
  getNavigationBarComponentIds
} from './constants';

export type Location =
  | 'inspectorBar'
  | 'navigationBar'
  | 'canvasBarTop'
  | 'canvasBarBottom'
  | 'canvasMenu'
  | 'dock';

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
    inspectorBarLabel: string;
    navigationBarLabel: string;
    canvasBarLabel: string;
    canvasMenuLabel: string;
    dockLabel: string;
  };
} {
  const { pluginId, locations } = options;
  const metadata = new FillProcessingMetadata(cesdk.engine, pluginId);

  const canvasMenuLabel = getI18nCanvasMenuLabel(pluginId);
  const canvasMenuComponentIds = getCanvasMenuComponentIds(pluginId);
  const canvasMenuComponentId = canvasMenuComponentIds[0];

  const dockLabel = getI18nDockLabel(pluginId);
  const dockComponentIds = getDockComponentIds(pluginId);
  const dockComponentId = dockComponentIds[0];

  const inspectorBarLabel = getI18nInspectorBarLabel(pluginId);
  const inspectorBarComponentIds = getInspectorBarComponentIds(pluginId);
  const inspectorBarComponentId = inspectorBarComponentIds[0];

  const navigationBarLabel = getI18nNavigationBarLabel(pluginId);
  const navigationBarComponentIds = getNavigationBarComponentIds(pluginId);
  const navigationBarComponentId = navigationBarComponentIds[0];

  const canvasBarLabel = getI18nCanvasBarLabel(pluginId);
  const canvasBarComponentIds = getCanvasBarComponentIds(pluginId);
  const canvasBarComponentId = canvasBarComponentIds[0];

  const featureId = getFeatureId(pluginId);

  if (locations?.includes('inspectorBar')) {
    cesdk.ui.setInspectorBarOrder([
      inspectorBarComponentId,
      ...cesdk.ui.getInspectorBarOrder()
    ]);
  }

  if (locations?.includes('navigationBar')) {
    cesdk.ui.setNavigationBarOrder([
      navigationBarComponentId,
      ...cesdk.ui.getNavigationBarOrder()
    ]);
  }

  if (locations?.includes('canvasBarTop')) {
    cesdk.ui.setCanvasBarOrder(
      [canvasBarComponentId, ...cesdk.ui.getCanvasBarOrder('top')],
      'top'
    );
  }

  if (locations?.includes('canvasBarBottom')) {
    cesdk.ui.setCanvasBarOrder(
      [canvasBarComponentId, ...cesdk.ui.getCanvasBarOrder('bottom')],
      'top'
    );
  }

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

  const buttonComponents: {
    componentIds: string[];
    label: string;
    variant: 'plain' | 'regular';
  }[] = [
    {
      componentIds: inspectorBarComponentIds,
      variant: 'plain',
      label: inspectorBarLabel
    },
    {
      componentIds: navigationBarComponentIds,
      variant: 'regular',
      label: navigationBarLabel
    },
    {
      componentIds: canvasBarComponentIds,
      variant: 'regular',
      label: canvasBarLabel
    },
    {
      componentIds: canvasMenuComponentIds,
      variant: 'plain',
      label: canvasMenuLabel
    }
  ];

  buttonComponents.forEach(({ componentIds, label, variant }) => {
    const componentId = componentIds[0];
    cesdk.ui.registerComponent(
      componentIds,
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

        const buttonId = `${componentId}.button`;
        Button(buttonId, {
          icon: options.icon,
          label,
          variant,
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
  });

  return {
    canvasMenuComponentId,
    dockComponentId,
    translationsKeys: {
      inspectorBarLabel,
      navigationBarLabel,
      canvasBarLabel,
      canvasMenuLabel,
      dockLabel
    }
  };
}
