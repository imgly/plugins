import { CreativeEngine } from '@cesdk/cesdk-js';

/**
 * Locks the selection to the given block ids with the given edit mode.
 *
 * @returns A function to unlock the selection. Will set the edit mode back to what it was before the lock.
 */
function lockSelectionToEditMode(options: {
  engine: CreativeEngine;
  blockIdsToLock: number[];
  editModeToLockTo: string;
}) {
  const { engine, blockIdsToLock, editModeToLockTo } = options;

  function isBoundBlockSelected() {
    const currentlySelectedBlockIds = engine.block.findAllSelected();
    return blockIdsToLock.some((blockId) => {
      return currentlySelectedBlockIds.includes(blockId);
    });
  }

  const stateChangeDisposer = engine.editor.onStateChanged(() => {
    const editMode = engine.editor.getEditMode();
    if (editMode !== editModeToLockTo && isBoundBlockSelected()) {
      engine.editor.setEditMode(editModeToLockTo);
    }
  });

  const selectionDisposer = engine.block.onSelectionChanged(() => {
    if (isBoundBlockSelected()) {
      engine.editor.setEditMode(editModeToLockTo);
    } else {
      engine.editor.setEditMode('Transform');
    }
  });

  if (isBoundBlockSelected()) {
    engine.editor.setEditMode(editModeToLockTo);
  }

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    selectionDisposer();
    stateChangeDisposer();

    engine.editor.setEditMode('Transform');
    disposed = true;
  };

  return dispose;
}

export default lockSelectionToEditMode;
