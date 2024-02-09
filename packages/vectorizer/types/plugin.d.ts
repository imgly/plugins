import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';
export interface PluginConfiguration {
}
declare const _default: (pluginConfiguration?: PluginConfiguration) => {
    initialize(engine: CreativeEngine): void;
    initializeUserInterface({ cesdk }: {
        cesdk: CreativeEditorSDK;
    }): void;
    update(): void;
};
export default _default;
export declare function enableFeatures(cesdk: CreativeEditorSDK): void;
