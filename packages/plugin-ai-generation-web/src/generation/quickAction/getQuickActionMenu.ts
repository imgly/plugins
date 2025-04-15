import CreativeEditorSDK from '@cesdk/cesdk-js';
import { QuickActionId, QuickActionMenu } from './types';
import { Output, QuickAction } from '../provider';

const QUICK_ACTION_ORDER_KEY_PREFIX = 'ly.img.ai.quickAction.order';

const QUICK_ACTION_REGISTRY_PREFIX = 'ly.img.ai.quickAction.actions';

/**
 * Returns an object representing the quick action menu. Can be called and
 * retrieved multiple times.
 *
 * It's backed up by the global state.
 */
function getQuickActionMenu(cesdk: CreativeEditorSDK, id: string) {
  const quickActionMenu: QuickActionMenu = {
    id,
    setQuickActionMenuOrder: (quickActionIds: string[]) => {
      cesdk.ui.experimental.setGlobalStateValue<QuickActionId[]>(
        `${QUICK_ACTION_ORDER_KEY_PREFIX}.${id}`,
        quickActionIds
      );
    },
    getQuickActionMenuOrder: () => {
      return cesdk.ui.experimental.getGlobalStateValue<QuickActionId[]>(
        `${QUICK_ACTION_ORDER_KEY_PREFIX}.${id}`,
        []
      );
    },
    registerQuickAction: <I, O extends Output>(
      quickAction: QuickAction<I, O>
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
        [key: string]: QuickAction<I, O>;
      }>(`${QUICK_ACTION_REGISTRY_PREFIX}.${id}`, {});

      return entries[quickActionId];
    }
  };
  return quickActionMenu;
}

export default getQuickActionMenu;
