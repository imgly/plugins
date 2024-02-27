import { PluginContext } from './PluginContext';
import { Subscribable } from './Subscribable';
export type CommandCallback = (ctx: PluginContext, params: any) => Promise<any> | any;
export type CommandArgs = {
    blockIds?: number[];
};
export type CommandEvents = "register" | "unregister";
export type CommandDescription = {
    group?: string;
    args?: any;
    returns?: any;
};
export declare class Commands extends Subscribable<CommandEvents, string> {
    #private;
    constructor(ctx: PluginContext);
    listCommands(): string[];
    registerCommand(label: string, callback: CommandCallback, description: CommandDescription): () => void;
    unregisterCommand(label: string): void;
    getCommandCallback(label: string): CommandCallback | undefined;
    getCommandDescription(label: string): CommandDescription | undefined;
    executeCommand<P = any, R = any>(cmd: string, params: P): Promise<R>;
}
