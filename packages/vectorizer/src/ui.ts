import type CreativeEditorSDK from '@cesdk/cesdk-js';

import {
  PLUGIN_CANVAS_MENU_COMPONENT_BUTTON_ID,
  PLUGIN_CANVAS_MENU_COMPONENT_ID,
  PLUGIN_FEATURE_ID,
  PLUGIN_ACTION_VECTORIZE_LABEL,
  PLUGIN_I18N_TRANSLATIONS,
  PLUGIN_ICON
} from './manifest';
import {
  executeAction,
  getPluginMetadata,
} from './utils';

/**
 * Registers the components that can be used to vectorize a block.
 */
export function registerUIComponents(cesdk: CreativeEditorSDK) {
  cesdk.setTranslations(PLUGIN_I18N_TRANSLATIONS);
  // Always prepend the registered component to the canvas menu order.
  cesdk.ui.unstable_setCanvasMenuOrder([
    PLUGIN_CANVAS_MENU_COMPONENT_ID,
    ...cesdk.ui.unstable_getCanvasMenuOrder()
  ]);
  cesdk.ui.unstable_registerComponent(
    PLUGIN_CANVAS_MENU_COMPONENT_ID,
    ({ builder: { Button }, engine }) => {
      
      // @DanielHauschildt This should better have [blockIds] as a parameter
      if (!cesdk.feature.unstable_isEnabled(PLUGIN_FEATURE_ID, { engine })) { return; }

      const selected = engine.block.findAllSelected();

      const actions: Array<() => void> = []

      let anyIsLoading = false
      let anyHasValidFill = false
      let allCurrentProgress = 0
      let allTotalProgress = 0
      for (const id of selected) {
        if (!cesdk.engine.block.hasFill(id)) return;
        const fillId = cesdk.engine.block.getFill(id);
        const fileUri = engine.block.getString(fillId, 'fill/image/imageFileURI');
        const sourceSet = engine.block.getSourceSet(
          fillId,
          'fill/image/sourceSet'
        );

        const metadata = getPluginMetadata(cesdk.engine, id);


        const isLoading = metadata.status === 'PROCESSING';
        anyIsLoading ||= isLoading;
        if (isLoading && metadata.progress) {
          const { current, total } = metadata.progress;
          allTotalProgress += total
          allCurrentProgress += current
        }
        const hasValidFill = (sourceSet.length > 0 || fileUri !== '')// const isPendingOrProcessing = metadata.status === 'PENDING' || metadata.status === 'PROCESSING';
        anyHasValidFill ||= hasValidFill;
        actions.push(() => executeAction(PLUGIN_ACTION_VECTORIZE_LABEL, { blockId: id }))
        
      }

      const isDisabled = anyIsLoading || !anyHasValidFill;

      const loadingProgress = 0 // (allCurrentProgress / allTotalProgress) * 100;
      console.log('actions', actions)
      console.log('anyIsLoading', anyIsLoading)
      console.log('isDisabled', isDisabled)

      Button(PLUGIN_CANVAS_MENU_COMPONENT_BUTTON_ID, {
        label: PLUGIN_ACTION_VECTORIZE_LABEL,
        icon: PLUGIN_ICON,
        isActive: false,
        isLoading: anyIsLoading,
        isDisabled,
        loadingProgress,
        onClick: () => actions.map(action => action())
      });
    }
  );
}
