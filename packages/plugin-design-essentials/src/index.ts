import commands from "./commands"
import locale from "./locale"
import panels from "./panels"

import {
    Context,
    loadTranslation,
    loadCommands,
    loadPanels
} from '@imgly/plugin-core';
import { PluginManifest as manifest } from './PluginManifest';

export { manifest };

export const activate = async (ctx: Context) => {
    await loadTranslation(ctx, manifest, locale)
    await loadCommands(ctx, manifest, commands)
    await loadPanels(ctx, manifest, panels)
}
