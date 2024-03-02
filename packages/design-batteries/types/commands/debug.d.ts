import { PluginContext } from "@imgly/plugin-api-utils";
export declare const debugLogBlockProperties: (ctx: PluginContext, params: {
    blockIds: number[];
}) => Promise<void>;
export declare const debugLogBlockCrop: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => void;
export declare const debugLogBlockMetadata: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
