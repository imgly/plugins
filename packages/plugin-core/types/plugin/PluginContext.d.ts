import { type CreativeEngine } from "@cesdk/cesdk-js";
import CreativeEditorSDK from "@cesdk/cesdk-js";
import { Logger } from "./Logger";
import { Commands } from "./Commands";
import { I18N } from "./I18n";
type UserInterfaceAPI = typeof CreativeEditorSDK.prototype.ui;
type FeatureAPI = typeof CreativeEditorSDK.prototype.feature;
export declare class PluginContext<I18NKeys extends string | symbol = string> {
    logger?: Logger;
    engine: CreativeEngine;
    ui?: UserInterfaceAPI;
    i18n: I18N<I18NKeys>;
    commands: Commands;
    feature: FeatureAPI;
    constructor(cesdk: CreativeEditorSDK);
}
export {};
