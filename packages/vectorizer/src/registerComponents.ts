import type CreativeEditorSDK from '@cesdk/cesdk-js';

import {
  CANVAS_MENU_COMPONENT_BUTTON_ID,
  CANVAS_MENU_COMPONENT_ID,
  FEATURE_ID
} from './constants';
import {
  getPluginMetadata,
  setPluginMetadata,
  toggleProcessedData
} from './utils';

/**
 * Registers the components that can be used to vectorize a block.
 */
export function registerComponents(cesdk: CreativeEditorSDK) {
  cesdk.setTranslations({
    en: { 'plugin.vectorizer.vectorize': 'Vectorize' },
    de: { 'plugin.vectorizer.vectorize': 'Vektorisieren' }
  });
  // Always prepend the registered component to the canvas menu order.
  cesdk.ui.unstable_setCanvasMenuOrder([
    CANVAS_MENU_COMPONENT_ID,
    ...cesdk.ui.unstable_getCanvasMenuOrder()
  ]);
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

      const isActive = metadata.status === 'PROCESSED_TOGGLE_ON';
      const isLoading = metadata.status === 'PROCESSING';
      const isDisabled =
        metadata.status === 'PENDING' || metadata.status === 'PROCESSING';

      let loadingProgress: number | undefined;
      if (isLoading && metadata.progress) {
        const { current, total } = metadata.progress;
        loadingProgress = (current / total) * 100;
      }

      Button(CANVAS_MENU_COMPONENT_BUTTON_ID, {
        label: 'plugin.vectorizer.vectorize',
        icon: '@imgly/icons/Vectorize',
        isActive,
        isLoading,
        isDisabled,
        loadingProgress,
        onClick: () => {
          switch (metadata.status) {
            case 'IDLE':
            case 'ERROR': {
              setPluginMetadata(cesdk, id, {
                status: 'PENDING'
              });
              break;
            }

            case 'PROCESSED_TOGGLE_ON':
            case 'PROCESSED_TOGGLE_OFF': {
              toggleProcessedData(cesdk, id);
              break;
            }

            default: {
              // We do not care about the other states in the button
            }
          }
        }
      });
    }
  );
}
