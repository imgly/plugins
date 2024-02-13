import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';
import Manifest from './manifest';
export interface PluginConfiguration {
}
export { Manifest };
declare const _default: (pluginConfiguration?: PluginConfiguration) => {
    manifest: {
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
    initialize(engine: CreativeEngine): void;
    initializeUserInterface({ cesdk }: {
        cesdk: CreativeEditorSDK;
    }): void;
    update(): void;
};
export default _default;
