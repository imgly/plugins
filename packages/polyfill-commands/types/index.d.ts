import CreativeEditorSDK from '@cesdk/cesdk-js';
import Manifest from './manifest';
import { CreativeEngineWithPolyfills } from './utils/polyfills';
export interface PluginConfiguration {
}
export { Manifest };
declare const _default: (pluginConfiguration?: PluginConfiguration) => {
    initialize(engine: CreativeEngineWithPolyfills): void;
    initializeUserInterface({ cesdk }: {
        cesdk: CreativeEditorSDK;
    }): void;
    update(): void;
};
export default _default;
