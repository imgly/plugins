import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';
export type CreativeEngineWithPolyfills = CreativeEngine & {
    polyfill_commands?: Commands;
};
export type CommandType = (params: any) => Promise<void>;
export declare class Commands {
    #private;
    constructor(sdk: CreativeEditorSDK);
    registerCommand(label: string, callback: (params: any) => Promise<void>): void;
    executeCommand(label: string, params: any): Promise<void>;
}
export declare function polyfillWithCommands(sdk: CreativeEditorSDK): void;
