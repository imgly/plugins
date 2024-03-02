

import { PluginContext, CommandDescription } from '@imgly/plugin-api-utils';


import { CommandImports, CommandContributions, PluginManifest } from './PluginManifest';

export interface PluginConfiguration { }

const registerTranslation = (ctx: PluginContext, translations: { [key: string]: any } = {}) => {
    ctx.i18n.setTranslations(translations)
}

const registerCommands = (ctx: PluginContext, imports: CommandImports) => {
    for (const command in imports) {
        const callback = imports[command as CommandContributions]

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

const loadTranslation = async (ctx: PluginContext, locales: readonly string[] = ctx.i18n.locales()) => {
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


const loadCommands = async (ctx: PluginContext) => {
    const commands = await import("./commands")
    await registerCommands(ctx, commands)
}


export const activate = async (ctx: PluginContext) => {
    const doValidateI18n = true;
    await loadTranslation(ctx)
    await loadCommands(ctx)
}


export default (ctx: PluginContext, _config: PluginConfiguration) => {
    return {
        async initializeUserInterface() {
            await activate(ctx)
        }
    };
};

