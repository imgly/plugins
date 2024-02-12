import {
    PLUGIN_COMPONENT_BUTTON_ID,
    PLUGIN_ACTION_VECTORIZE_LABEL
} from './manifest';

import {
    getPluginMetadata,
    isBlockSupported,
} from './utils';
import { CreativeEngineWithPolyfills } from './utils/polyfills';

const button = (params: any) => {
    const engine = params.engine! as CreativeEngineWithPolyfills
    const builder = params.builder!

    // the button might need the ids it is shown for
    // the isSupported
    const selected = engine.block.findAllSelected();
    const candidates = selected.filter(id => isBlockSupported(engine, id))
    if (candidates.length === 0) return;

    let isLoading = candidates.some(id => getPluginMetadata(engine, id).status === 'PROCESSING')

    // @maerch: Why do we need the Button ID here? 
    builder.Button("DO I NEED THIS", {
        label: PLUGIN_ACTION_VECTORIZE_LABEL,
        icon: '@imgly/icons/Vectorize',
        isActive: false,
        isLoading: isLoading,
        isDisabled: isLoading,
        loadingProgress: undefined, // creates infinite spinner
        onClick: () => engine
            .polyfill_commands
            ?.executeCommand(PLUGIN_ACTION_VECTORIZE_LABEL, { blockIds: candidates })
    });
}

export default {
    [PLUGIN_COMPONENT_BUTTON_ID]: button
} // end of export default
