import type CreativeEditorSDK from '@cesdk/cesdk-js';

/**
 * Executes the given function with a lock on the selection and edit mode.
 * Until the function completes no other selection or edit mode changes are
 * possible.
 */
async function withLock<R>(
  fn: () => Promise<R>,
  options: {
    /**
     * The block ids to lock the selection to.
     */
    blockIds: number[];

    /**
     * The edit mode to lock the selection to.
     */
    editMode: string;

    /**
     * Should the blocks be set to a pending state?
     *
     * @default true
     */
    pending?: boolean;

    /**
     * Should the selection be automatically unlocked after the function completes?
     * Otherwise the returned unlock function must be called manually.
     *
     * @default false
     */
    automaticallyUnlock?: boolean;

    /**
     * It false, it will not lock the selection and just call the function.
     */
    locked?: boolean;

    /**
     * While locked, should the block be always on top to be visible?
     *
     * @default true
     */
    alwaysOnTop?: boolean;

    /**
     * If true, the clipping of the parent of the affected blocks will be
     * temporarily disabled until unlocked.
     *
     * @default true
     */
    disableClipping?: boolean;

    cesdk: CreativeEditorSDK;
  }
): Promise<{ unlock: () => void; returnValue: R }> {
  const {
    cesdk,
    blockIds,
    editMode,
    automaticallyUnlock = false,
    alwaysOnTop = true,
    disableClipping = true,
    pending = true,
    locked = true
  } = options;

  let unlock: () => void = () => {};
  try {
    if (pending) {
      blockIds.forEach((blockId) => {
        cesdk.engine.block.setState(blockId, { type: 'Pending', progress: 0 });
      });
    }
    const wasAlwaysOnTop: Record<number, boolean> = {};
    const parentClipping: Record<number, boolean> = {};
    if (alwaysOnTop) {
      blockIds.forEach((blockId) => {
        wasAlwaysOnTop[blockId] = cesdk.engine.block.isAlwaysOnTop(blockId);
        cesdk.engine.block.setAlwaysOnTop(blockId, true);
      });
    }
    if (disableClipping) {
      blockIds.forEach((blockId) => {
        const parent = cesdk.engine.block.getParent(blockId);
        if (
          parent != null &&
          cesdk.engine.block.getType(parent) != '//ly.img.ubq/scene'
        ) {
          parentClipping[parent] = cesdk.engine.block.isClipped(parent);
          cesdk.engine.block.setClipped(parent, false);
        }
      });
    }

    const unlockSelectionLock = locked
      ? lockSelectionInEditMode(cesdk, blockIds, editMode)
      : () => {};
    unlock = () => {
      unlockSelectionLock();
      if (alwaysOnTop) {
        blockIds.forEach((blockId) => {
          if (wasAlwaysOnTop[blockId] != null) {
            cesdk.engine.block.setAlwaysOnTop(blockId, wasAlwaysOnTop[blockId]);
          }
        });
      }
      if (disableClipping) {
        blockIds.forEach((blockId) => {
          const parent = cesdk.engine.block.getParent(blockId);
          if (
            parent != null &&
            cesdk.engine.block.getType(parent) != '//ly.img.ubq/scene'
          ) {
            if (parentClipping[parent] != null) {
              cesdk.engine.block.setClipped(parent, parentClipping[parent]);
            }
          }
        });
      }
    };

    const returnValue = await fn();

    return {
      returnValue,
      unlock: automaticallyUnlock
        ? () => {
            // noop
          }
        : unlock
    };
  } catch (error) {
    // Ensure that the blocks are unlocked on error
    unlock();
    throw error;
  } finally {
    if (pending) {
      blockIds.forEach((blockId) => {
        cesdk.engine.block.setState(blockId, { type: 'Ready' });
      });
    }
    if (locked) {
      if (automaticallyUnlock) {
        unlock();
      }
    }
  }
}

/**
 * Locks the selection to the given block ids with the given edit mode.
 *
 * @returns A function to unlock the selection. Will set the edit mode back to what it was before the lock.
 */
function lockSelectionInEditMode(
  cesdk: CreativeEditorSDK,
  blockIdsToLockOn: number[],
  editModeToLock: string
) {
  const globalScopeBeforeLock =
    cesdk.engine.editor.getGlobalScope('editor/select');
  const editModeBeforeLock = cesdk.engine.editor.getEditMode();
  selectOnlyBlockIds();
  cesdk.engine.editor.setGlobalScope('editor/select', 'Deny');
  cesdk.engine.editor.setEditMode(editModeToLock);
  const lockedHistory = cesdk.engine.editor.createHistory();
  const historyBeforeLock = cesdk.engine.editor.getActiveHistory();
  cesdk.engine.editor.setActiveHistory(lockedHistory);

  function selectOnlyBlockIds() {
    cesdk.engine.block.findAllSelected().forEach((currentlySelectedBlockId) => {
      if (!blockIdsToLockOn.includes(currentlySelectedBlockId)) {
        cesdk.engine.block.setSelected(currentlySelectedBlockId, false);
      }
    });

    blockIdsToLockOn.forEach((blockId) => {
      cesdk.engine.block.setSelected(blockId, true);
    });
  }

  const stateChangeDisposer = cesdk.engine.editor.onStateChanged(() => {
    const editMode = cesdk.engine.editor.getEditMode();
    if (editMode !== editModeToLock) {
      cesdk.engine.editor.setEditMode(editModeToLock);
    }
  });

  const selectionDisposer =
    cesdk.engine.block.onSelectionChanged(selectOnlyBlockIds);

  const dispose = () => {
    if (globalScopeBeforeLock != null) {
      cesdk.engine.editor.setGlobalScope(
        'editor/select',
        globalScopeBeforeLock
      );
    }

    cesdk.engine.editor.setEditMode(editModeBeforeLock);
    console.log('history is now', cesdk.engine.editor.getActiveHistory());
    console.log('resetting history to', historyBeforeLock);
    cesdk.engine.editor.setActiveHistory(historyBeforeLock);
    console.log('now history is', cesdk.engine.editor.getActiveHistory());
    cesdk.engine.editor.destroyHistory(lockedHistory);

    selectionDisposer();
    stateChangeDisposer();
  };

  return dispose;
}

export default withLock;
