
import { downloadBlob } from "@imgly/plugin-utils";
import { PluginContext } from "../../../plugin-core/types"; // Add this import statement

export const i18nDownloadMissingCommandTranslations = (ctx: PluginContext) => {
    const { i18n, commands } = ctx;

    const missingCommandTranslations: [string, string][] = commands
        .listCommands()
        .map((cmd: string): [string, string] | null => {
            return i18n.hasTranslation(cmd) ? null : [cmd, cmd.split(".").pop()];
        })
        .filter(Boolean) as [string, string][];

    if (missingCommandTranslations.length > 0) {
        const ob = Object.fromEntries(missingCommandTranslations);
        const json = JSON.stringify(ob, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        downloadBlob(blob, `${i18n.locale()}.json`);
    }
}