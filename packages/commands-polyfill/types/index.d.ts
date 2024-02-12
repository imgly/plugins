import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';
import Manifest from './manifest';
export interface PluginConfiguration {
}
export { Manifest };
declare const _default: () => {
    initializeUserInterface({ cesdk }: {
        cesdk: CreativeEditorSDK;
    }): void;
};
export default _default;
export type CreativeEngineWithPolyfills = CreativeEngine & {
    polyfill_commands?: Commands;
};
export type CommandType = (params: any) => Promise<void>;
export declare class Commands {
    #private;
    registerCommand(label: string, callback: (params: any) => Promise<void>): void;
    executeCommand(label: string, params: any): Promise<void>;
}
export declare function polyfillWithCommands(sdk: CreativeEditorSDK): void;
