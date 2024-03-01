import { PluginContext } from "@imgly/plugin-api-utils";
export declare const imageFitModeCrop: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const imageFitModeCover: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const imageFitModeContain: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
