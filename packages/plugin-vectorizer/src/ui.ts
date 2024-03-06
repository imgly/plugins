import { Context } from './deps';

import { PluginManifest } from './PluginManifest';

import {
    getPluginMetadata,
    isBlockSupported,
} from './utils/common';


export const button = (ctx: Context, params: any) => {
    const builder = params.builder

    const selected = ctx.engine.block.findAllSelected();
    const candidates = selected.filter((id: number) => isBlockSupported(ctx.engine, id))
    if (candidates.length === 0) return;
    const isLoading = candidates.some((id: number) => getPluginMetadata(ctx.engine, id).status === 'PROCESSING')

    // @maerch: Why do we need the Button ID here? 
    builder.Button(PluginManifest.contributes.ui.button.id, {
        label: ctx.i18n.translate("vectorizer.commands.vectorize"),
        icon: '@imgly/icons/Vectorize',
        isActive: false,
        isLoading,
        isDisabled: isLoading,
        loadingProgress: undefined, // creates infinite spinner
        onClick: () => ctx.commands.executeCommand(PluginManifest.contributes.commands.vectorize.id, { blockIds: candidates })
    });
}
