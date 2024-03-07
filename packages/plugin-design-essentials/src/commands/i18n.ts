
import { downloadBlob } from "@imgly/plugin-utils";
import { Context } from "@imgly/plugin-core"; // Add this import statement

export const i18nDownloadMissingCommandTranslations = (ctx: Context) => {
    const { i18n, commands } = ctx;
 
    const missingCommandTranslations: [string?, string?][] = commands
        .listCommands()
        .map((cmd: string): [string?, string?] | undefined => {
            return i18n.hasTranslation(cmd) ? undefined : [cmd, cmd.split(".").pop()];
        })
        .filter(Boolean) as [string, string][];

    if (missingCommandTranslations.length > 0) {
        const ob = Object.fromEntries(missingCommandTranslations);
        const json = JSON.stringify(ob, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        downloadBlob(blob, `${i18n.locale()}.json`);
    }
}