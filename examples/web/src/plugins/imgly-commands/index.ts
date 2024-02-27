
import en from './locale/en.json';
import { PluginContext } from '@imgly/plugin-api-utils';


import { CommandImports, CommandContributions, PluginManifest } from './PluginManifest';

export interface PluginConfiguration { }

function registerTranslation(ctx: PluginContext, translations: { [key: string]: any } = {}) {
    ctx.i18n.setTranslations(translations)
}
function registerCommands(ctx: PluginContext, imports: CommandImports) {
    for (const command in imports) {
        const callback = imports[command as CommandContributions]
        const desc = PluginManifest.contributes.commands[command as CommandContributions];
        ctx.commands.registerCommand(
            desc.id,
            async (params: any) => await callback(ctx, params),
            desc
        );
    }
}

import * as commands from './commands'

export default (ctx: PluginContext, _config: PluginConfiguration) => {
    return {
        async initializeUserInterface() {
            //we should give manifest to the context 
            registerTranslation(ctx, { en })
            registerCommands(ctx, commands)

        }
    };
};

