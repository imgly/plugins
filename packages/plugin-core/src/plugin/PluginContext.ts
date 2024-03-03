import { type CreativeEngine } from "@cesdk/cesdk-js";
import CreativeEditorSDK from "@cesdk/cesdk-js";
import { Logger } from "./Logger";

import { Commands } from "./Commands";
import { I18N } from "./I18n";

// this is not exposed yet
type UserInterfaceAPI = typeof CreativeEditorSDK.prototype.ui;
type FeatureAPI = typeof CreativeEditorSDK.prototype.feature;



type I18NContributions = {
    [key: string]: string
}
type ManifestContributions = {
    i18n?: I18NContributions
}
type Manifest = {
    contributes: ManifestContributions
}


export class PluginContext<I18NKeys extends string | symbol = string> {
    logger?: Logger;
    engine: CreativeEngine;
    ui?: UserInterfaceAPI;
    i18n: I18N<I18NKeys>;
    commands: Commands;
    feature: FeatureAPI;
    constructor(cesdk: CreativeEditorSDK) {
        this.engine = cesdk.engine;
        this.ui = cesdk.ui;
        this.i18n = new I18N<I18NKeys>(this as PluginContext<string>)
        this.commands = new Commands(this as PluginContext<string>)
        this.feature = cesdk.feature;
        const _unsubscribe = this.i18n.subscribe("register", (translations) => {
            cesdk.setTranslations(translations);
        } )
        
    }
    
};

