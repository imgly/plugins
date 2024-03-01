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
                id: string;
                group: string;
            };
            blockDuplicate: {
                id: string;
                group: string;
            };
            exportPngToClipboard: {
                id: string;
                group: string;
            };
            exportPngToFile: {
                id: string;
                group: string;
            };
            exportJpegToFile: {
                id: string;
                group: string;
            };
            exportWebpToFile: {
                id: string;
                group: string;
            };
            exportRgba8ToFile: {
                id: string;
                group: string;
            };
            exportPdfToFile: {
                id: string;
                group: string;
            };
            exportSceneToFile: {
                id: string;
                group: string;
            };
            exportSceneToClipboard: {
                id: string;
                group: string;
            };
            exportJsonToClipboard: {
                id: string;
                group: string;
            };
            exportJsonToFile: {
                id: string;
                group: string;
            };
            exportComponentToFile: {
                id: string;
                group: string;
            };
            imageFitModeCrop: {
                id: string;
                group: string;
            };
            imageFitModeContain: {
                id: string;
                group: string;
            };
            imageFitModeCover: {
                id: string;
                group: string;
            };
            groupBlocks: {
                id: string;
                group: string;
            };
            ungroupBlocks: {
                id: string;
                group: string;
            };
            groupLayoutHStack: {
                id: string;
                group: string;
            };
            groupLayoutVStack: {
                id: string;
                group: string;
            };
            groupLayoutMasonry: {
                id: string;
                group: string;
            };
            groupLayoutCircle: {
                id: string;
                group: string;
                when: {
                    blockType: string[];
                };
            };
            logCrop: {
                id: string;
                group: string;
            };
            productSetInstagram: {
                id: string;
                group: string;
            };
            playground: {
                id: string;
                group: string;
            };
            syncBlocks: {
                id: string;
                group: string;
            };
        };
        i18n: {};
    };
};
