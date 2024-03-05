import { I18NKeys } from "./PluginManifest";
import { type PluginContext as IPluginContext, CommandCallback } from '@imgly/plugin-core';
type PluginContext = IPluginContext<I18NKeys>;

export { CreativeEngine } from '@cesdk/cesdk-js';
export { type PluginContext, type CommandCallback }