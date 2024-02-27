import Manifest from './manifest.json';
import { CommandCallback } from '@imgly/plugin-api-utils';


export type Contributions = typeof Manifest;["contributes"]
export type CommandContributions = keyof typeof Manifest["contributes"]["commands"]
export type CommandImports = Record<CommandContributions, CommandCallback>

export const PluginManifest = Manifest

