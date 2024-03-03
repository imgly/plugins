import Manifest from '../manifest.json';
import { CommandCallback } from '../../plugin-core/types';


export type Contributions = typeof Manifest;["contributes"]
export type CommandContributions = keyof typeof Manifest["contributes"]["commands"]
export type CommandImports = Record<CommandContributions, CommandCallback>

export const PluginManifest = Manifest

