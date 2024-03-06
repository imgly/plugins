import { Context } from "./Context";
import { Subscribable } from './Subscribable';
type Plugin = any & {
    id: string;
    version: string;
};
export declare class Plugins extends Subscribable<"register" | "unregister", any> {
    #private;
    constructor(ctx: Context);
    registerPlugin(plugin: Plugin): Promise<() => Promise<void>>;
    unregisterPlugin(plugin: Plugin): Promise<void>;
    listPlugins(): void;
}
export {};
