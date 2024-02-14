import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';
import Manifest from './manifest';
export interface Logger {
    log: (message: string) => void;
    debug: (message: string) => void;
    error: (message: string) => void;
    trace: (message: string) => void;
}
export interface PluginConfiguration {
    logger?: Logger;
}
export { Manifest };
declare const _default: (pluginConfiguration?: PluginConfiguration) => {
    initialize(engine: CreativeEngine): void;
    initializeUserInterface({ cesdk }: {
        cesdk: CreativeEditorSDK;
    }): void;
    update(): void;
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
