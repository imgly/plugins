import type CreativeEditorSDK from '@cesdk/cesdk-js';

import {
  CANVAS_MENU_COMPONENT_BUTTON_ID,
  CANVAS_MENU_COMPONENT_ID,
  FEATURE_ID,
  PLUGIN_ID
} from './constants';
import { DefaultLocation, UserInterfaceConfiguration } from './types';
import { getPluginMetadata, setPluginMetadata } from './utils';

const REMOVE_BACKGROUND_ACTION_I18N_KEY = `plugin.${PLUGIN_ID}.action.removeBackground`;

/**
 * Registers the components that can be used to remove the background of
 * a block.
 */
export function registerComponents(
  cesdk: CreativeEditorSDK,
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

      const metadata = getPluginMetadata(cesdk, id);

      const isLoading = metadata.status === 'PROCESSING';
      const isDisabled =
        metadata.status === 'PENDING' || metadata.status === 'PROCESSING';

      let loadingProgress: number | undefined;
      if (isLoading && metadata.progress) {
        const { key, current, total } = metadata.progress;

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
            metadata.status === 'IDLE' ||
            metadata.status === 'ERROR' ||
            metadata.status === 'PROCESSED'
          ) {
            setPluginMetadata(cesdk, id, {
              status: 'PENDING'
            });
          }
        }
      });
    }
  );
}

function hasDefaultLocation(
  location: DefaultLocation,
  configuration: UserInterfaceConfiguration
) {
  return (
    configuration.defaultLocations &&
    (Array.isArray(configuration.defaultLocations)
      ? configuration.defaultLocations
      : [configuration.defaultLocations]
    ).includes(location)
  );
}
