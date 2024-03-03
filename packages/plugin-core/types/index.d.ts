import { PluginContext } from "./plugin/PluginContext";
export { Commands, type CommandCallback, type CommandDescription } from "./plugin/Commands";
export { I18N } from "./plugin/I18n";
export { type Logger } from "./plugin/Logger";
export { PluginContext } from "./plugin/PluginContext";
export declare function loadCommands<Manifest extends {
    id: string;
}>(ctx: PluginContext, imports: any, manifest: Manifest): Promise<void>;
