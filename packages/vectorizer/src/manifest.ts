export const PLUGIN_ID = '@imgly/plugin-vectorizer-web';
export const PLUGIN_COMPONENT_BUTTON_ID = `component.${PLUGIN_ID}.button`;
export const PLUGIN_ACTION_VECTORIZE_LABEL = `plugin.${PLUGIN_ID}.vectorize`



export default {
    id: PLUGIN_ID,

    contributes: {
        ui: [ 
            {
                id: PLUGIN_COMPONENT_BUTTON_ID, // not sure will
            }
        ],
        commands: [
            {
                id: PLUGIN_ACTION_VECTORIZE_LABEL,
            }
        ]
    }
}