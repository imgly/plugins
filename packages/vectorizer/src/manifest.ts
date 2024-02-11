import { PLUGIN_ID, PLUGIN_ACTION_VECTORIZE_LABEL } from './utils/constants';

export default {
    id: PLUGIN_ID,
    contributes: {
        actions: [
            {
                id: PLUGIN_ACTION_VECTORIZE_LABEL,
            }
        ]
    }
}