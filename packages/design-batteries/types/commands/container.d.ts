import { PluginContext } from "@imgly/plugin-api-utils";
export declare const groupBlocks: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const ungroupBlocks: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const groupLayoutHStack: (ctx: PluginContext, params: {
    blockIds?: number[];
    padding?: number;
}) => Promise<void>;
export declare const groupLayoutVStack: (ctx: PluginContext, params: {
    blockIds?: number[];
    padding?: number;
}) => Promise<void>;
export declare const groupLayoutMasonry: (ctx: PluginContext, params: {
    blockIds?: number[];
    cols?: number;
    paddingX?: number;
    paddingY?: number;
}) => Promise<void>;
export declare const groupLayoutCircle: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
