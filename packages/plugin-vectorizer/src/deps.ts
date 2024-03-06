import { I18NKeys } from "./PluginManifest";
import { type BaseContext as IPluginContext, CommandCallback } from '@imgly/plugin-core';

type Context = IPluginContext<I18NKeys>;

export { CreativeEngine } from '@cesdk/cesdk-js';
export { type Context, type CommandCallback }
