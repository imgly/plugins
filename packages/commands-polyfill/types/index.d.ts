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
export type WithCommands<T> = T & {
    engine: CreativeEngine & {
        polyfill_commands: Commands;
    };
};
export type CommandType = (params: any) => Promise<void>;
export declare class Commands {
    #private;
    listCommands(): string[];
    registerCommand(label: string, callback: (params: any) => Promise<void>): void;
    executeCommand(label: string, params: any): Promise<void>;
}
export declare function polyfillWithCommands(sdk: CreativeEditorSDK): void;
