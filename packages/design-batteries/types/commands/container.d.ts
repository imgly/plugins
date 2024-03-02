import { PluginContext } from "@imgly/plugin-api-utils";
export declare const groupBlocks: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const ungroupBlocks: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
