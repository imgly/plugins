import type CreativeEditorSDK from '@cesdk/cesdk-js';

import { ImageProcessingMetadata } from '@imgly/plugin-utils';

import {
  CANVAS_MENU_COMPONENT_BUTTON_ID,
  CANVAS_MENU_COMPONENT_ID,
  FEATURE_ID,
  PLUGIN_ID
} from './constants';
import { Location, UserInterfaceConfiguration } from './types';

const REMOVE_BACKGROUND_ACTION_I18N_KEY = `plugin.${PLUGIN_ID}.action.removeBackground`;

/**
 * Registers the components that can be used to remove the background of
 * a block.
 */
export function registerComponents(
  cesdk: CreativeEditorSDK,
  metadata: ImageProcessingMetadata,
  configuration: UserInterfaceConfiguration = {}
) {
  if (hasDefaultLocation('canvasMenu', configuration)) {
    // Always prepend the registered component to the canvas menu order.
    cesdk.ui.unstable_setCanvasMenuOrder([
      CANVAS_MENU_COMPONENT_ID,
      ...cesdk.ui.unstable_getCanvasMenuOrder()
    ]);
  }

  cesdk.setTranslations({
    en: {
      [REMOVE_BACKGROUND_ACTION_I18N_KEY]: 'BG Removal'
    }
  });

  cesdk.ui.unstable_registerComponent(
    CANVAS_MENU_COMPONENT_ID,
    ({ builder: { Button }, engine }) => {
      if (
        !cesdk.feature.unstable_isEnabled(FEATURE_ID, {
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
        const { key, current, total } = currentMetadata.progress;

        if (key === 'compute:inference') {
          loadingProgress = undefined;
        } else if (key.startsWith('fetch:/models/')) {
          loadingProgress = (current / total) * 50;
        } else if (key.startsWith('fetch:/onnxruntime-web/')) {
          loadingProgress = 50 + (current / total) * 50;
        } else {
          loadingProgress = undefined;
        }
      }

      Button(CANVAS_MENU_COMPONENT_BUTTON_ID, {
        label: REMOVE_BACKGROUND_ACTION_I18N_KEY,
        icon: '@imgly/icons/BGRemove',
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

function hasDefaultLocation(
  location: Location,
  configuration: UserInterfaceConfiguration
) {
  return (
    configuration.locations &&
    (Array.isArray(configuration.locations)
      ? configuration.locations
      : [configuration.locations]
    ).includes(location)
  );
}
