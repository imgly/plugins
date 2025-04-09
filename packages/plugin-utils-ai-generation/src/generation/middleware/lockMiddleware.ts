import { Middleware } from './middleware';
import { Output } from '../provider';
import { CreativeEngine } from '@cesdk/cesdk-js';

/**
 * Highlights the blocks while the middleware is running.
 */
function lockMiddleware<I, O extends Output>({
  editMode,
  automaticallyUnlock = false
}: {
  /**
   * The edit mode to lock the selection to.
   */
  editMode: string;

  /**
   * Should the selection be automatically unlocked after the function completes?
   * Otherwise the returned unlock function must be called manually.
   *
   * @default false
   */
  automaticallyUnlock?: boolean;
}): Middleware<I, O> {
  const middleware: Middleware<I, O> = async (input, options, next) => {
    const blockIds = options.blockIds ?? options.engine.block.findAllSelected();

    let unlock: () => void = () => {};
    if (!automaticallyUnlock) {
      options.addDisposer(async () => {
        if (unlock != null) {
          unlock();
        }
      });
    }
    try {
      unlock = lockSelectionInEditMode(options.engine, blockIds, editMode);
      const result = await next(input, options);
      return result;
    } finally {
      if (automaticallyUnlock) {
        unlock();
      }
    }
  };

  return middleware;
}

/**
 * Locks the selection to the given block ids with the given edit mode.
 *
 * @returns A function to unlock the selection. Will set the edit mode back to what it was before the lock.
 */
function lockSelectionInEditMode(
  engine: CreativeEngine,
  blockIdsToLockOn: number[],
  editModeToLock: string
) {
  const globalScopeBeforeLock = engine.editor.getGlobalScope('editor/select');
  const editModeBeforeLock = engine.editor.getEditMode();
  selectOnlyBlockIds();
  engine.editor.setGlobalScope('editor/select', 'Deny');
  engine.editor.setEditMode(editModeToLock);
  const lockedHistory = engine.editor.createHistory();
  const historyBeforeLock = engine.editor.getActiveHistory();
  engine.editor.setActiveHistory(lockedHistory);

  function selectOnlyBlockIds() {
    engine.block.findAllSelected().forEach((currentlySelectedBlockId) => {
      if (!blockIdsToLockOn.includes(currentlySelectedBlockId)) {
        engine.block.setSelected(currentlySelectedBlockId, false);
      }
    });

    blockIdsToLockOn.forEach((blockId) => {
      engine.block.setSelected(blockId, true);
    });
  }

  const stateChangeDisposer = engine.editor.onStateChanged(() => {
    const editMode = engine.editor.getEditMode();
    if (editMode !== editModeToLock) {
      engine.editor.setEditMode(editModeToLock);
    }
  });

  const selectionDisposer = engine.block.onSelectionChanged(selectOnlyBlockIds);

  const dispose = () => {
    if (globalScopeBeforeLock != null) {
      engine.editor.setGlobalScope('editor/select', globalScopeBeforeLock);
    }

    engine.editor.setEditMode(editModeBeforeLock);
    engine.editor.setActiveHistory(historyBeforeLock);
    engine.editor.destroyHistory(lockedHistory);

    selectionDisposer();
    stateChangeDisposer();
  };

  return dispose;
}

export default lockMiddleware;
