import { PluginContext } from "@imgly/plugin-api-utils";
export declare const exportPngToClipboard: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const exportSceneToClipboard: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const exportJsonToClipboard: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const exportPngToFile: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const exportJpegToFile: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const exportWebpToFile: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const exportPdfToFile: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const exportRgba8ToFile: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const exportSceneToFile: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
export declare const exportJsonToFile: (ctx: PluginContext, params: {
    blockIds?: number[];
}) => Promise<void>;
