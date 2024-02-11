import { CreativeEngine } from '@cesdk/cesdk-js';

import {
    PLUGIN_CANVAS_MENU_COMPONENT_BUTTON_ID,
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
    const isAnyBlockSupported = selected
        .reduce((val, acc) => val || isBlockSupported(engine, acc), false)
    if (!isAnyBlockSupported) return;

    const actions: Array<() => void> = []

    let anyIsLoading = false

    let allCurrentProgress = 0
    let allTotalProgress = 1


    for (const id of selected) {
        if (!engine.block.hasFill(id)) return;
        const metadata = getPluginMetadata(engine, id);
        const isLoading = metadata.status === 'PROCESSING';
        anyIsLoading ||= isLoading;
        if (isLoading && metadata.progress) {
            const { current, total } = metadata.progress;
            allTotalProgress += total
            allCurrentProgress += current
        }

        actions.push(() => engine.polyfill_commands?.executeCommand(PLUGIN_ACTION_VECTORIZE_LABEL, { blockId: id }))
    }

    

    const loadingProgress = undefined
    // console.log((allCurrentProgress / allTotalProgress) * 100)

    builder.Button(PLUGIN_CANVAS_MENU_COMPONENT_BUTTON_ID, {
        label: PLUGIN_ACTION_VECTORIZE_LABEL,
        icon: PLUGIN_ICON,
        isActive: false,
        isLoading: anyIsLoading,
        isDisabled: anyIsLoading,
        loadingProgress,
        onClick: () => actions.map(action => action())
    });
}

export default {
    [PLUGIN_CANVAS_MENU_COMPONENT_ID]: button
} // end of export default
