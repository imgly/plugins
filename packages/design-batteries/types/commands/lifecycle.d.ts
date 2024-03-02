import { PluginContext } from "@imgly/plugin-api-utils";
export declare const blockDelete: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const blockDuplicate: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const blockRename: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const blockBringForward: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const blockSendBackward: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const blockBringToFront: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const blockSendToBack: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
