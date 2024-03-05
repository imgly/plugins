import Manifest from '../manifest.json';
type ManifestType = typeof Manifest;

// TODO: Extend this with the builtin commands from other packages 

// Contributions

export type I18NKeys = keyof ManifestType["contributes"]["i18n"]
export type CommandContributions = keyof ManifestType["contributes"]["commands"]
export type ErrorKeys = keyof ManifestType["contributes"]["errors"]

export type UIComponentKeys = keyof ManifestType["contributes"]["ui"]
export type ConfigKeys = keyof ManifestType["contributes"]["config"]

export const PluginManifest = Manifest

