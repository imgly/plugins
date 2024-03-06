// These constants here are added by the base esbuild config

declare const PLUGIN_VERSION: string;
declare const PLUGIN_NAME: string;


// Typescript MAGIC Section
// Modify the following types to match your plugin's commands and i18n keys

// somehow this influences every other plugin availble
// type I18NKeys = keyof typeof locale["en"]
// type CommandKeys = `${typeof PLUGIN_NAME}.${keyof typeof commands}`

// declare module '@imgly/plugin-core' {
//     interface Register {
//         context: BasePluginContext<I18NKeys, CommandKeys>;
    // }
// }
