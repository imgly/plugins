import CreativeEditorSDK, { ObjectTypeLonghand } from '@cesdk/cesdk-js';
import { DEFAULT_ASSET_BASE_URI } from '.';
import {
  CANVAS_MENU_COMPONENT_BUTTON_ID,
  CANVAS_MENU_COMPONENT_ID
} from './constants';
import { generateCutoutFromSelection } from './plugin';

export function registerComponents(cesdk: CreativeEditorSDK) {
  cesdk.ui.unstable_setCanvasMenuOrder([
    CANVAS_MENU_COMPONENT_ID,
    ...cesdk.ui.unstable_getCanvasMenuOrder()
  ]);
  // }
  const CANVAS_MENU_COMPONENT_BUTTON_I18N_ID = `${CANVAS_MENU_COMPONENT_BUTTON_ID}.label`;

  cesdk.setTranslations({
    en: {
      [CANVAS_MENU_COMPONENT_BUTTON_I18N_ID]: 'Cutout'
    }
  });

  cesdk.ui.unstable_registerComponent(
    CANVAS_MENU_COMPONENT_ID,
    ({ builder: { Button }, engine }) => {
      // only show canvas menu button for type=graphic, type=text
      const allowedTypes: ObjectTypeLonghand[] = [
        '//ly.img.ubq/graphic',
        '//ly.img.ubq/text'
      ] as const;
      const selectedBlockIds = engine.block.findAllSelected();
      if (
        selectedBlockIds.length !== 1 ||
        !allowedTypes.includes(engine.block.getType(selectedBlockIds[0]))
      ) {
        return null;
      }
      Button(CANVAS_MENU_COMPONENT_BUTTON_ID, {
        label: CANVAS_MENU_COMPONENT_BUTTON_I18N_ID,
        icon: `${DEFAULT_ASSET_BASE_URI}/dock-light.svg`,
        onClick: () => {
          generateCutoutFromSelection(cesdk);
        }
      });
    }
  );
}