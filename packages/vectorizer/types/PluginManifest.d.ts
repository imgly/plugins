import Manifest from '../manifest.json';
type ManifestType = typeof Manifest;
export type I18NKeys = keyof ManifestType["contributes"]["i18n"];
export type CommandContributions = keyof ManifestType["contributes"]["commands"];
export type ErrorKeys = keyof ManifestType["contributes"]["errors"];
export type UIComponentKeys = keyof ManifestType["contributes"]["ui"];
export type ConfigKeys = keyof ManifestType["contributes"]["config"];
export declare const PluginManifest: {
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
export {};
