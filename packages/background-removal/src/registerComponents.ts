import type CreativeEditorSDK from '@cesdk/cesdk-js';

import {
  CANVAS_MENU_COMPONENT_BUTTON_ID,
  CANVAS_MENU_COMPONENT_ID,
  FEATURE_ID
} from './constants';
import {
  getBGRemovalMetadata,
  setBGRemovalMetadata,
  toggleBackgroundRemovalData
} from './utils';

/**
 * Registers the components that can be used to remove the background of
 * a block.
 */
export function registerComponents(cesdk: CreativeEditorSDK) {
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

      const metadata = getBGRemovalMetadata(cesdk, id);

      const isActive = metadata.status === 'PROCESSED_WITHOUT_BG';
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
        label: 'BG Removal',
        icon: '@imgly/icons/BGRemove',
        isActive,
        isLoading,
        isDisabled,
        loadingProgress,
        onClick: () => {
          switch (metadata.status) {
            case 'IDLE':
            case 'ERROR': {
              setBGRemovalMetadata(cesdk, id, {
                status: 'PENDING'
              });
              break;
            }

            case 'PROCESSED_WITHOUT_BG':
            case 'PROCESSED_WITH_BG': {
              toggleBackgroundRemovalData(cesdk, id);
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
