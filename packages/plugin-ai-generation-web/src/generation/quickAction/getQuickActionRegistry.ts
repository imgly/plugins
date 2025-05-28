import CreativeEditorSDK from '@cesdk/cesdk-js';
import { QuickActionMenu, RegisteredQuickAction } from './types';
import { type Output, type QuickAction } from '../provider';

const QUICK_ACTION_REGISTRY_PREFIX = 'ly.img.ai.quickAction.actions';

/**
 * Returns an object representing the quick action registry. Can be called and
 * retrieved multiple times.
 *
 * It's backed up by the global state.
 */
function getQuickActionRegistry(cesdk: CreativeEditorSDK, id: string) {
  const quickActionMenu: QuickActionMenu = {
    id,
    registerQuickAction: <I, O extends Output>(
      quickAction: RegisteredQuickAction<I, O>
    ) => {
      if (
        !cesdk.ui.experimental.hasGlobalStateValue(
          `${QUICK_ACTION_REGISTRY_PREFIX}.${id}`
        )
      ) {
        cesdk.ui.experimental.setGlobalStateValue<{
          [key: string]: QuickAction<I, O>;
        }>(`${QUICK_ACTION_REGISTRY_PREFIX}.${id}`, {
          [quickAction.id]: quickAction
        });
      } else {
        const entries = cesdk.ui.experimental.getGlobalStateValue(
          `${QUICK_ACTION_REGISTRY_PREFIX}.${id}`,
          {}
        );
        cesdk.ui.experimental.setGlobalStateValue(
          `${QUICK_ACTION_REGISTRY_PREFIX}.${id}`,
          {
            ...entries,
            [quickAction.id]: quickAction
          }
        );
      }
    },

    getQuickAction: <I, O extends Output>(quickActionId: string) => {
      const entries = cesdk.ui.experimental.getGlobalStateValue<{
        [key: string]: RegisteredQuickAction<I, O>;
      }>(`${QUICK_ACTION_REGISTRY_PREFIX}.${id}`, {});

      return entries[quickActionId];
    }
  };
  return quickActionMenu;
}

export default getQuickActionRegistry;
