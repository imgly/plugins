import CreativeEditorSDK, { ObjectTypeLonghand } from '@cesdk/cesdk-js';
import {
  CreateCutoutFromBlocks,
  DEFAULT_ASSET_BASE_URI,
  generateCutoutFromSelection
} from '.';
import {
  CANVAS_MENU_COMPONENT_BUTTON_ID,
  CANVAS_MENU_COMPONENT_BUTTON_LABEL,
  CANVAS_MENU_COMPONENT_ID
} from './constants';

export function registerComponents(
  cesdk: CreativeEditorSDK,
  {
    createCutoutFromBlocks
  }: {
    createCutoutFromBlocks: CreateCutoutFromBlocks;
  }
) {
  cesdk.ui.registerComponent(
    CANVAS_MENU_COMPONENT_ID,
    ({ builder: { Button }, engine }) => {
      // only show canvas menu button for type=graphic, type=text, type=group
      const allowedTypes: ObjectTypeLonghand[] = [
        '//ly.img.ubq/group',
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
        label: CANVAS_MENU_COMPONENT_BUTTON_LABEL,
        icon: ({ theme }) => `${DEFAULT_ASSET_BASE_URI}/dock-${theme}.svg`,
        onClick: () => {
          generateCutoutFromSelection(cesdk, createCutoutFromBlocks);
        }
      });
    }
  );
}
