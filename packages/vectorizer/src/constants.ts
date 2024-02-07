export const PLUGIN_ID = '@imgly/plugin-vectorizer-web';
export const PLUGIN_CANVAS_MENU_COMPONENT_ID = `${PLUGIN_ID}.canvasMenu`;
export const PLUGIN_CANVAS_MENU_COMPONENT_BUTTON_ID = `${PLUGIN_CANVAS_MENU_COMPONENT_ID}.button`;
export const PLUGIN_FEATURE_ID = `${PLUGIN_ID}`;
export const PLUGIN_ACTION_VECTORIZE_LABEL = `plugin.${PLUGIN_ID}.vectorize`
export const PLUGIN_I18N_TRANSLATIONS = {
    en: { [PLUGIN_ACTION_VECTORIZE_LABEL]: 'Vectorize' },
    de: { [PLUGIN_ACTION_VECTORIZE_LABEL]: 'Vektorisieren' }
}
export const PLUGIN_ICON = '@imgly/icons/Vectorize'