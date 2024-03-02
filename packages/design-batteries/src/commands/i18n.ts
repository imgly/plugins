
import { downloadBlob } from "../utils/download";
import { PluginContext } from "@imgly/plugin-api-utils"; // Add this import statement

export const i18nDownloadMissingCommandTranslations = (ctx: PluginContext) => {
    const { i18n, commands } = ctx;
    
    const missingCommandTranslations = commands.listCommands().map((cmd) => {
        if (!i18n.hasTranslation(cmd)) {
            return [cmd, cmd.split(".").pop()]
        }
        else null
    }).filter(Boolean)
    
    if (missingCommandTranslations.length > 0) {
        const ob = Object.fromEntries(missingCommandTranslations)
        const json = JSON.stringify(ob, null, 2)
        const blob = new Blob([json], { type: "application/json" })
        downloadBlob(blob, `${i18n.locale()}.json`)
    }
}