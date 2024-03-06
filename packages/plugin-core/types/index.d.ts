export { Commands, type CommandCallback, type CommandDescription } from "./plugin/Commands";
export { type Logger } from "./plugin/Logger";
export { I18N, type Translations, type Translation } from "./plugin/I18n";
export { type Context, BaseContext, createContext, type Register } from "./plugin/Context";
import { Context } from './plugin/Context';
import { Translations } from "./plugin/I18n";
type Manifest = any & {
    id: string;
};
export declare const loadTranslation: (ctx: Context, manifest: Manifest, locale: Translations) => Promise<void>;
export declare const loadCommands: (ctx: Context, manifest: Manifest, commands: Record<string, any>) => Promise<void>;
export type PanelCallback = any;
export declare const loadPanels: (ctx: Context, manifest: Manifest, panels: Record<string, PanelCallback>) => Promise<void>;
