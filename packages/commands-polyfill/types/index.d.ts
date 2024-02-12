import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';
import Manifest from './manifest';
export interface PluginConfiguration {
}
export { Manifest };
declare const _default: (pluginConfiguration?: PluginConfiguration) => {
    initialize(engine: CreativeEngine): void;
    initializeUserInterface({ cesdk }: {
        cesdk: CreativeEditorSDK;
    }): void;
    update(): void;
};
export default _default;
