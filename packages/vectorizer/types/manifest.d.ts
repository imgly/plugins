export declare const PLUGIN_ID = "imgly/plugin-vectorizer-web";
export declare const PLUGIN_COMPONENT_BUTTON_ID = "component.imgly/plugin-vectorizer-web.button";
export declare const PLUGIN_ACTION_VECTORIZE_LABEL = "plugin.imgly/plugin-vectorizer-web.vectorize";
declare const _default: {
    id: string;
    publisher: string;
    contributes: {
        ui: {
            id: string;
        }[];
        commands: {
            "plugin.imgly/plugin-vectorizer-web.vectorize": {
                title: string;
            };
        };
        i18n: {
            en: {
                "plugin.imgly/plugin-vectorizer-web.vectorize": string;
            };
            de: {
                "plugin.imgly/plugin-vectorizer-web.vectorize": string;
            };
        };
    };
};
export default _default;
