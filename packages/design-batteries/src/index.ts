
import en from './locale/en.json';
import { PluginContext } from '@imgly/plugin-api-utils';


import { CommandImports, CommandContributions, PluginManifest } from './PluginManifest';

export interface PluginConfiguration { }

function registerTranslation(ctx: PluginContext, translations: { [key: string]: any } = {}) {
    ctx.i18n.setTranslations(translations)
}
function registerCommands(ctx: PluginContext, imports: CommandImports) {
    
type CommandDescription = {
    id?: string,
    group?: string
}

    for (const command in imports) {
        const callback = imports[command as CommandContributions]
        
        const desc: CommandDescription = PluginManifest.contributes.commands[command as CommandContributions];
        const id = desc?.id ?? `${PluginManifest.id}.commands.${command as string}`;
        ctx.commands.registerCommand(
            id,
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

