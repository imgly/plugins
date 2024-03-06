
import { Context, CommandDescription } from '@imgly/plugin-core';
import { CommandImports, CommandContributions, PluginManifest } from './PluginManifest';

export interface PluginConfiguration { }

const registerTranslation = (ctx: Context, translations: { [key: string]: any } = {}) => {
    ctx.i18n.registerTranslations(translations)
}

const registerCommands = (ctx: Context, imports: CommandImports) => {
    for (const command in imports) {
        const callback = imports[command as string]

        let desc: CommandDescription = PluginManifest.contributes.commands[command as CommandContributions];
        desc ??= {};
        desc.id ??= `${PluginManifest.id}.commands.${command as string}`;
        const [category, name] = (command as string).split("_")
        desc.category ??= name ? category : "Commands";
        ctx.commands.registerCommand(
            desc.id,
            async (params: any) => await callback(ctx, params),
            desc
        );
    }
}

const loadTranslation = async (ctx: Context, locales: readonly string[] = ctx.i18n.locales()) => {
    const translations = await Promise.all(locales.map(async (locale) => {
        try {
            const translations = await import(`./locale/${locale}.json`)
            return { [locale]: translations.default }
        } catch (e) {
            // when loading of the file fails
            return { [locale]: {} }
        }
    }))

    translations.forEach((t) => registerTranslation(ctx, t))
}


const loadCommands = async (ctx: Context) => {
    const commands = await import("./commands")
    await registerCommands(ctx, commands)
}


const registerPanels = async (ctx: Context, panels: any) => {
    for (const panel in panels) {
        const id = `${PluginManifest.id}.panels.${panel}`
        // ctx.ui?.unstable_registerPanel(panel,  ({ builder: any  })  => {
        //     return panels[panel](ctx, builder)
        
        // })
    }

}

const loadPanels = async (ctx: Context) => {
    // const panels = await import("./panels/layers")
    // await registerPanels(ctx, panels)
}



export const activate = async (ctx: Context) => {
    await loadTranslation(ctx)
    await loadCommands(ctx)
    await loadPanels(ctx)
}



export default (ctx: Context, _config: PluginConfiguration) => {
    return {
        async initializeUserInterface() {
            await activate(ctx)
        }
    };
};

