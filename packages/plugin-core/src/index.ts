export { Commands, type CommandCallback, type CommandDescription } from "./plugin/Commands"
export { type Logger } from "./plugin/Logger"
export { I18N, type Translations, type Translation } from "./plugin/I18n"
export { type Context, BaseContext, createContext, type Register } from "./plugin/Context"




import { Context } from './plugin/Context';
import { Translations } from "./plugin/I18n";
import { CommandCallback, CommandDescription } from "./plugin/Commands";

type Manifest = any & {id: string}
export const loadTranslation = async (ctx: Context, manifest: Manifest, locale: Translations) => {
    ctx.i18n.registerTranslations(locale)
}

export const loadCommands = async (ctx: Context, manifest: Manifest, commands: Record<string, any>) => {
    for (const command in commands) {
        const callback: CommandCallback = commands[command as string]
        let desc: CommandDescription = manifest.contributes?.commands?.[command as string]?? {};
        
        desc.id ??= `${manifest.id}.commands.${command as string}`;
        const [category, name] = (command as string).split("_")
        desc.category ??= name ? category : "Commands";

        ctx.commands.registerCommand(
            desc.id,
            async (params: any) => await callback(ctx, params),
            desc
        );
    }
}

export type PanelCallback = any
export const loadPanels = async (ctx: Context, manifest: Manifest, panels: Record<string, PanelCallback>) => {
    for (const panel in panels) {
        const id = `${manifest.id}.panels.${panel}`
        // ctx.ui?.unstable_registerCustomPanel(panel,  ()  => {
        //     // return panels[panel](ctx, builder)
        // })
    }
}