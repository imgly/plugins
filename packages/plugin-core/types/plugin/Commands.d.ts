import { Context } from './Context';
import { Subscribable } from './Subscribable';
export type CommandCallback = (ctx: Context, params: any) => Promise<any> | any;
export type CommandArgs = {
    blockIds?: number[];
};
export type CommandEvents = "register" | "unregister";
export type CommandDescription = {
    id?: string;
    category?: string;
    args?: any;
    returns?: any;
};
export declare class Commands<K extends string = string> extends Subscribable<CommandEvents, string> {
    #private;
    constructor(ctx: Context);
    listCommands(): K[];
    registerCommand(label: K, callback: CommandCallback, description: CommandDescription): Promise<() => void>;
    unregisterCommand(label: K): void;
    getCommandCallback(label: K): CommandCallback | undefined;
    getCommandDescription(label: K): CommandDescription | undefined;
    executeCommand<P = any, R = any>(cmd: K, params: P): Promise<R | undefined>;
}
