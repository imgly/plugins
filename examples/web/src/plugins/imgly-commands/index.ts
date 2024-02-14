import type CreativeEditorSDK from '@cesdk/cesdk-js';
import Translations from './translations/translations';

import { type CommandsType } from "@imgly/plugin-commands-polyfill"


// IMGLY Commands
import { registerLifecycleCommands } from "./commands/lifecycle";
import { registerDebugCommands } from "./commands/debug";
import { registerDownloadCommands } from "./commands/export";
import { registerClipboardCommands } from "./commands/clipboard";


const Manifest = {
    id: 'plugin.imgly/plugin-commands-polyfill',
    publisher: 'img.ly GmbH',
    contributes: {
        commands: {
            "lifecycle.destroy": {
                title: "Destroy"
            },
            "lifecycle.duplicate": {
                title: "Duplicate"
            }
        },
        i18n: Translations
    }
};


export interface PluginConfiguration {
    // uploader ? 
}

export { Manifest };

export default () => {
    return {
        ...Manifest,
        initializeUserInterface({ cesdk }: { cesdk: CreativeEditorSDK }) {
            const _cesdk = cesdk as CreativeEditorSDK & CommandsType
            cesdk.setTranslations(Translations);
            registerLifecycleCommands(_cesdk)
            registerDebugCommands(_cesdk)
            registerDownloadCommands(_cesdk)
            registerClipboardCommands(_cesdk)
        }
    };
};

