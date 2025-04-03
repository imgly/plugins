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
     * Should the blocks be set to a pending state while locked?
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

    cesdk: CreativeEditorSDK;
  }
): Promise<{ unlock: () => void; returnValue: R }> {
  const {
    cesdk,
    blockIds,
    editMode,
    automaticallyUnlock = false,
    alwaysOnTop = true,
    pending = true,
    locked = true
  } = options;

  if (!locked) {
    const returnValue = await fn();
    return {
      unlock: () => {},
      returnValue
    };
  }

  let unlock: () => void = () => {};
  try {
    if (pending && locked) {
      blockIds.forEach((blockId) => {
        cesdk.engine.block.setState(blockId, { type: 'Pending', progress: 0 });
      });
    }
    const wasAlwaysOnTop: Record<number, boolean> = {};
    if (alwaysOnTop) {
      blockIds.forEach((blockId) => {
        wasAlwaysOnTop[blockId] = cesdk.engine.block.isAlwaysOnTop(blockId);
        cesdk.engine.block.setAlwaysOnTop(blockId, true);
      });
    }

    unlock = lockSelectionInEditMode(cesdk, blockIds, editMode);

    const returnValue = await fn();

    return {
      returnValue,
      unlock: automaticallyUnlock
        ? () => {
            // noop
          }
        : unlock
    };
  } finally {
    if (locked) {
      if (pending) {
        blockIds.forEach((blockId) => {
          cesdk.engine.block.setState(blockId, { type: 'Ready' });
        });
      }
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

    selectionDisposer();
    stateChangeDisposer();
  };

  return dispose;
}

export default withLock;
