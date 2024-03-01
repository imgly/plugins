import { PluginContext } from "@imgly/plugin-api-utils";
export declare const syncBlocks: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const registerAndOpenCustomPanel: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const productSetInstagram: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const playground: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
