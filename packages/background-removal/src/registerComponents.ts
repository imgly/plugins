import type CreativeEditorSDK from '@cesdk/cesdk-js';

import {
  CANVAS_MENU_COMPONENT_BUTTON_ID,
  CANVAS_MENU_COMPONENT_ID,
  FEATURE_ID,
  I18N_ID,
  I18N_TRANSLATIONS,
  ICON
} from './constants';
import {
  getBGRemovalMetadata as getPluginMetadata,
  setBGRemovalMetadata as setPluginMetadata,
  toggleBackgroundRemovalData as toggleProcessedData
} from './utils';

/**
 * Registers the components that can be used to remove the background of
 * a block.
 */
export function registerComponents(cesdk: CreativeEditorSDK) {
  cesdk.setTranslations(I18N_TRANSLATIONS);
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

      // Why is that needed. The feature enable should already handle that
      const [id] = engine.block.findAllSelected();
      if (!cesdk.engine.block.hasFill(id)) return;

      const fillId = cesdk.engine.block.getFill(id);
      const fileUri = engine.block.getString(fillId, 'fill/image/imageFileURI');
      const sourceSet = engine.block.getSourceSet(
        fillId,
        'fill/image/sourceSet'
      );

      const hasNoValidFill = !(sourceSet.length > 0 || fileUri !== '')

      const metadata = getPluginMetadata(cesdk, id);

      const isActive = false //metadata.status === 'PROCESSED_WITHOUT_BG';
      const isLoading = metadata.status === 'PROCESSING';

      const isPendingOrProcessing = metadata.status === 'PENDING' || metadata.status === 'PROCESSING';
      const isDisabled = hasNoValidFill || isPendingOrProcessing


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
        label: I18N_ID,
        icon: ICON,
        isActive,
        isLoading,
        isDisabled,
        loadingProgress,
        onClick: () => {
          setPluginMetadata(cesdk, id, {
            status: 'PENDING'
          });
        }
      });
    }

  );
}
