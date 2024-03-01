import { PluginContext } from "@imgly/plugin-api-utils";
export declare const blockDelete: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const blockDuplicate: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
