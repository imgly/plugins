import { type CreativeEngine } from "@cesdk/cesdk-js";
import CreativeEditorSDK from "@cesdk/cesdk-js";
import { Logger } from "./Logger";
import { Commands } from "./Commands";
import { I18N } from "./I18n";
type UserInterfaceAPI = typeof CreativeEditorSDK.prototype.ui;
type FeatureAPI = typeof CreativeEditorSDK.prototype.feature;
export declare class BasePluginContext<I18NKeys extends string = string, CommandKeys extends string = string> {
    logger?: Logger;
    engine: CreativeEngine;
    ui?: UserInterfaceAPI;
    i18n: I18N<I18NKeys>;
    commands: Commands<CommandKeys>;
    feature: FeatureAPI;
    constructor(cesdk: CreativeEditorSDK);
}
export interface Register {
}
export type PluginContext = Register extends {
    context: infer TContext extends BasePluginContext;
} ? TContext : BasePluginContext;
export {};
