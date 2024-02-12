export const PLUGIN_ID = '@imgly/plugin-vectorizer-web';
export const PLUGIN_COMPONENT_BUTTON_ID = `component.${PLUGIN_ID}.button`;
export const PLUGIN_ACTION_VECTORIZE_LABEL = `plugin.${PLUGIN_ID}.vectorize`


export default {
    id: PLUGIN_ID,
    titel: "",
    contributes: {
        ui: [ 
            {
                id: PLUGIN_COMPONENT_BUTTON_ID, // not sure will
            }
        ],
        commands: [
            {
                id: PLUGIN_ACTION_VECTORIZE_LABEL,
                titel: "Turn into Vectorpath", // default titel, use i18n ti
            }
        ],
        i18n: {
            en: {
                [PLUGIN_ACTION_VECTORIZE_LABEL]: 'Turn into Vectorpaths'
            },
            de: {
                [PLUGIN_ACTION_VECTORIZE_LABEL]: 'Wandle in Vectorpfade'
            }
        }
    }
}