import CreativeEditorSDK from '@cesdk/cesdk-js';
import {
    PLUGIN_COMPONENT_BUTTON_ID,
    PLUGIN_ACTION_VECTORIZE_LABEL
} from './manifest';

import {
    getPluginMetadata,
    isBlockSupported,
} from './utils';


// I need cesdk atm
export default (cesdk: CreativeEditorSDK) => {
    // @maerch: Shouldn't the params include "cesdk" and not engine? 
    const button = (params: any) => {
        const builder = params.builder!

        // the button might need the ids it is shown for
        // the isSupported
        const selected = cesdk.engine.block.findAllSelected();
        const candidates = selected.filter((id: number) => isBlockSupported(cesdk.engine, id))
        if (candidates.length === 0) return;

        let isLoading = candidates.some((id: number) => getPluginMetadata(cesdk.engine, id).status === 'PROCESSING')

        // @maerch: Why do we need the Button ID here? 
        builder.Button("DO I NEED THIS", {
            label: PLUGIN_ACTION_VECTORIZE_LABEL,
            icon: '@imgly/icons/Vectorize',
            isActive: false,
            isLoading: isLoading,
            isDisabled: isLoading,
            loadingProgress: undefined, // creates infinite spinner
            onClick: () => cesdk
                // @ts-ignore
                .engine.polyfill_commands
                ?.executeCommand(PLUGIN_ACTION_VECTORIZE_LABEL, { blockIds: candidates })
        });
    }

    return { [PLUGIN_COMPONENT_BUTTON_ID]: button }
} // end of export default
