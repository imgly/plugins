import Manifest from '../manifest.json';
import { CommandCallback } from '@imgly/plugin-api-utils';
export type Contributions = typeof Manifest;
export type CommandContributions = keyof typeof Manifest["contributes"]["commands"];
export type CommandImports = Record<CommandContributions, CommandCallback>;
export declare const PluginManifest: {
    id: string;
    version: string;
    publisher: string;
    icon: any;
    categories: any[];
    contributes: {
        commands: {
            blockDelete: {
                category: string;
            };
            blockDuplicate: {
                category: string;
            };
            exportPngToClipboard: {
                category: string;
            };
            exportPngToFile: {
                category: string;
            };
            exportJpegToFile: {
                category: string;
            };
            exportWebpToFile: {
                category: string;
            };
            exportRgba8ToFile: {
                category: string;
            };
            exportPdfToFile: {
                category: string;
            };
            exportSceneToFile: {
                category: string;
            };
            exportSceneToClipboard: {
                category: string;
            };
            exportJsonToClipboard: {
                category: string;
            };
            exportJsonToFile: {
                category: string;
            };
            exportComponentToFile: {
                category: string;
            };
            imageFitModeCrop: {
                category: string;
            };
            imageFitModeContain: {
                category: string;
            };
            imageFitModeCover: {
                category: string;
            };
            groupBlocks: {
                category: string;
            };
            ungroupBlocks: {
                category: string;
            };
            layoutHorizontally: {
                category: string;
            };
            layoutVertically: {
                category: string;
            };
            layoutMasonry: {
                category: string;
            };
            productSetInstagram: {
                category: string;
            };
            playground: {
                category: string;
            };
            syncBlocks: {
                category: string;
            };
        };
        i18n: {};
    };
};
