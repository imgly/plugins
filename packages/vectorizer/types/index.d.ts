import { type PluginConfiguration } from './plugin';
declare const Plugin: (pluginConfiguration?: PluginConfiguration) => {
    initialize(engine: import("@cesdk/cesdk-js").CreativeEngine): void;
    initializeUserInterface({ cesdk }: {
        cesdk: import("@cesdk/cesdk-js").default;
    }): void;
    update(): void;
    name: string;
    version: string;
};
export default Plugin;
