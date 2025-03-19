import CreativeEditorSDK from '@cesdk/cesdk-js';
import { MagicEntry, MagicId, MagicMenu } from './types';

const MAGIC_ORDER_KEY_PREFIX = 'ly.img.ai.magic.order';

const MAGIC_ENTRIES_KEY_PREFIX = 'ly.img.ai.magic.entries';

function getMagicMenu(cesdk: CreativeEditorSDK, id: string) {
  const magicMenu: MagicMenu = {
    id,
    setMagicOrder: (magicIds: string[]) => {
      cesdk.ui.experimental.setGlobalStateValue<MagicId[]>(
        `${MAGIC_ORDER_KEY_PREFIX}.${id}`,
        magicIds
      );
    },
    getMagicOrder: () => {
      return cesdk.ui.experimental.getGlobalStateValue<MagicId[]>(
        `${MAGIC_ORDER_KEY_PREFIX}.${id}`,
        []
      );
    },
    registerMagicEntry: (magicEntry: MagicEntry) => {
      if (
        !cesdk.ui.experimental.hasGlobalStateValue(
          `${MAGIC_ENTRIES_KEY_PREFIX}.${id}`
        )
      ) {
        cesdk.ui.experimental.setGlobalStateValue<{
          [key: string]: MagicEntry;
        }>(`${MAGIC_ENTRIES_KEY_PREFIX}.${id}`, {
          [magicEntry.id]: magicEntry
        });
      } else {
        const entries = cesdk.ui.experimental.getGlobalStateValue(
          `${MAGIC_ENTRIES_KEY_PREFIX}.${id}`,
          {}
        );
        cesdk.ui.experimental.setGlobalStateValue(
          `${MAGIC_ENTRIES_KEY_PREFIX}.${id}`,
          {
            ...entries,
            [magicEntry.id]: magicEntry
          }
        );
      }
    },

    getMagicEntry: (magicId: string) => {
      const entries = cesdk.ui.experimental.getGlobalStateValue<{
        [key: string]: MagicEntry;
      }>(`${MAGIC_ENTRIES_KEY_PREFIX}.${id}`, {});

      return entries[magicId];
    }
  };
  return magicMenu;
}

export default getMagicMenu;
