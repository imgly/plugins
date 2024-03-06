import CreativeEditorSDK, { type CreativeEngine } from "@cesdk/cesdk-js";
import { Logger } from "./Logger";
import { Commands } from "./Commands";
import { I18N } from "./I18n";
import { Plugins } from "./Plugins";
type UserInterfaceAPI = typeof CreativeEditorSDK.prototype.ui;
type FeatureAPI = typeof CreativeEditorSDK.prototype.feature;
export declare class BaseContext<I18NKeys extends string = string, CommandKeys extends string = string> {
    plugins: Plugins;
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
export type Context = Register extends {
    context: infer TContext extends BaseContext;
} ? TContext : BaseContext;
export declare function createContext<I18NKeys extends string, CommandKeys extends string>(cesdk: CreativeEditorSDK): BaseContext<string | I18NKeys, string | CommandKeys>;
export {};
