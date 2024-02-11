import {
    PLUGIN_COMPONENT_BUTTON_ID,
    PLUGIN_CANVAS_MENU_COMPONENT_ID,
    PLUGIN_ACTION_VECTORIZE_LABEL,
    PLUGIN_ICON
} from './utils/constants';

import {
    getPluginMetadata,
    isBlockSupported,
} from './utils/utils';
import { CreativeEngineWithPolyfills } from './utils/polyfills';

const button = (params: any) => {
    const engine = params.engine! as CreativeEngineWithPolyfills
    const builder = params.builder!

    const selected = engine.block.findAllSelected();
    const candidates = selected.filter(id => isBlockSupported(engine, id))
    if (candidates.length === 0) return;

    let isLoading = candidates.some(id => {
        const metadata = getPluginMetadata(engine, id);
        return metadata.status === 'PROCESSING'
    })
    
    const loadingProgress = undefined

    builder.Button(PLUGIN_COMPONENT_BUTTON_ID, {
        label: PLUGIN_ACTION_VECTORIZE_LABEL,
        icon: PLUGIN_ICON,
        isActive: false,
        isLoading: isLoading,
        isDisabled: isLoading,
        loadingProgress,
        onClick: () => candidates.forEach(id => engine.polyfill_commands?.executeCommand(PLUGIN_ACTION_VECTORIZE_LABEL, { blockId: id }))
    });
}

export default {
    [PLUGIN_CANVAS_MENU_COMPONENT_ID]: button
} // end of export default
