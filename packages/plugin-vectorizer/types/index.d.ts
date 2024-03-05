import Manifest from '../manifest.json';
import { PluginContext } from "./deps";
export interface PluginConfiguration {
}
export { Manifest };
declare const _default: (ctx: PluginContext, pluginConfiguration: PluginConfiguration) => {
    initializeUserInterface(): Promise<void>;
    id: string;
    version: string;
    publisher: string;
    icon: string;
    license: string;
    pricing: string;
    payment: {
        oneTime: number;
        subscription: number;
        usage: number;
    };
    engines: {
        imgly: string;
    };
    categories: string[];
    contributes: {
        ui: {
            button: {
                id: string;
                label: string;
            };
        };
        commands: {
            vectorize: {
                id: string;
                label: string;
                group: string;
                args: {
                    type: string;
                    format: string;
                    ui: string;
                }[];
                returns: {};
            };
        };
        i18n: {
            "vectorizer.commands.vectorize": string;
            "vectorizer.commands.category": string;
            "vectorizer.config.title": string;
            "vectorizer.config.enabled": string;
            "vectorizer.config.enabled.description": string;
        };
        errors: {
            validationError: {
                id: string;
                message: string;
            };
        };
        config: {
            type: string;
            title: string;
            settings: {
                enabled: {
                    type: string;
                    default: boolean;
                    description: string;
                };
            };
        };
    };
};
export default _default;
