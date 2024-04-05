export const VERSION = PLUGIN_VERSION;
export const CANVAS_MENU_COMPONENT_ID = `${PLUGIN_NAME}.canvasMenu`;
export const CANVAS_MENU_COMPONENT_BUTTON_ID = `${CANVAS_MENU_COMPONENT_ID}.button`;
export const CANVAS_MENU_COMPONENT_BUTTON_LABEL = `${CANVAS_MENU_COMPONENT_BUTTON_ID}.label`;

export const FEATURE_ID = `${PLUGIN_NAME}.feature`;
export const ASSET_SOURCE_ID = 'ly.img.cutout';
export const ENTRY_ID = `${ASSET_SOURCE_ID}.entry`;

export const NOTIFICATION_SELECT_CUTOUT_BLOCK_ID = `${PLUGIN_NAME}.notifications.selectCutoutBlock`;
export const NOTIFICATION_CUTOUT_BLOCK_SELECTED_ID = `${PLUGIN_NAME}.notifications.cutoutBlockSelected`;
export const NOTIFICATION_DIFFERENT_PAGES_ID = `${PLUGIN_NAME}.notifications.differentPages`;

export const I18N = {
  en: {
    [`libraries.${ENTRY_ID}.label`]: 'Cutouts',
    [NOTIFICATION_SELECT_CUTOUT_BLOCK_ID]: 'Please select a block to cutout',
    [NOTIFICATION_CUTOUT_BLOCK_SELECTED_ID]:
      'Cutout blocks cannot be cutout from selection',
    [NOTIFICATION_DIFFERENT_PAGES_ID]:
      'Selected Blocks are from different pages. Please select blocks from the same page.',
    [CANVAS_MENU_COMPONENT_BUTTON_LABEL]: 'Cutout'
  },
  de: {
    [`libraries.${ENTRY_ID}.label`]: 'Schnittlinien',
    [NOTIFICATION_SELECT_CUTOUT_BLOCK_ID]:
      'Bitte wählen Sie einen Block zum Ausschneiden aus',
    [NOTIFICATION_CUTOUT_BLOCK_SELECTED_ID]:
      'Schnittlinienblöcke können nicht ausgeschnitten werden',
    [NOTIFICATION_DIFFERENT_PAGES_ID]:
      'Ausgewählte Blöcke stammen aus verschiedenen Seiten. Bitte wählen Sie Blöcke von derselben Seite aus.',
    [CANVAS_MENU_COMPONENT_BUTTON_LABEL]: 'Ausschneiden'
  }
} as const;
