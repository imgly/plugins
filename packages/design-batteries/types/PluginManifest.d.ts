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
                group: string;
            };
            blockDuplicate: {
                group: string;
            };
            exportPngToClipboard: {
                group: string;
            };
            exportPngToFile: {
                group: string;
            };
            exportJpegToFile: {
                group: string;
            };
            exportWebpToFile: {
                group: string;
            };
            exportRgba8ToFile: {
                group: string;
            };
            exportPdfToFile: {
                group: string;
            };
            exportSceneToFile: {
                group: string;
            };
            exportSceneToClipboard: {
                group: string;
            };
            exportJsonToClipboard: {
                group: string;
            };
            exportJsonToFile: {
                group: string;
            };
            exportComponentToFile: {
                group: string;
            };
            imageFitModeCrop: {
                group: string;
            };
            imageFitModeContain: {
                group: string;
            };
            imageFitModeCover: {
                group: string;
            };
            groupBlocks: {
                group: string;
            };
            ungroupBlocks: {
                group: string;
            };
            groupLayoutHStack: {
                group: string;
            };
            groupLayoutVStack: {
                group: string;
            };
            groupLayoutMasonry: {
                group: string;
            };
            groupLayoutCircle: {
                group: string;
                when: {
                    blockType: string[];
                };
            };
            logCrop: {
                group: string;
            };
            productSetInstagram: {
                group: string;
            };
            playground: {
                group: string;
            };
            syncBlocks: {
                group: string;
            };
        };
        i18n: {};
    };
};
