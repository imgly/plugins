import CreativeEditorSDK, { type CreativeEngine } from "@cesdk/cesdk-js";

import { Logger } from "./Logger";

import { Commands } from "./Commands";
import { I18N } from "./I18n";
import { Plugins } from "./Plugins";

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

export class BaseContext<I18NKeys extends string = string, CommandKeys extends string = string> {
    plugins: Plugins;
    logger?: Logger;
    engine: CreativeEngine;
    ui?: UserInterfaceAPI;
    i18n: I18N<I18NKeys>;
    commands: Commands<CommandKeys>;
    feature: FeatureAPI;

    constructor(cesdk: CreativeEditorSDK) {
        const self = this
        this.engine = cesdk.engine;
        this.ui = cesdk.ui;
        this.i18n = new I18N<I18NKeys>(this as BaseContext)
        this.commands = new Commands<CommandKeys>(this as BaseContext)
        this.feature = cesdk.feature;
        this.plugins = new Plugins(this as BaseContext)

        // subscribe to the new style api to update the old style api
        this.i18n.subscribe("register", (translations) => {
            cesdk.setTranslations(translations);
        })
        this.plugins.subscribe("register", (plugin) => {
            return new Promise((resolve, reject) => {
                cesdk.unstable_addPlugin({
                    async initializeUserInterface() {
                        plugin.activate(self as BaseContext)
                        Promise.resolve(); 
                    }
                })
            })
        })
    }
}




export interface Register {
    // context: BasePluginContext
}

// that's the context beeing passed to all apps 
export type Context = Register extends {
    context: infer TContext extends BaseContext
} ? TContext : BaseContext




export function createContext<I18NKeys extends string, CommandKeys extends string>(cesdk: CreativeEditorSDK) {
    return new BaseContext<I18NKeys | string, CommandKeys | string>(cesdk)
}

