import { Middleware } from './middleware';
import { Output } from '../provider';
import { CreativeEngine } from '@cesdk/cesdk-js';
import { isAbortError } from '../../utils';

/**
 * For a given edit mode and block ids, this middleware will
 * ensure that as long as these blocks are selected, the edit mode is
 * set to the given edit mode and cannot be changed.
 *
 * The use-case is to show only the generation canvas menu during
 * the generation process.
 */
function editModeMiddleware<I, O extends Output>({
  editMode,
  automaticallyUnlock = false,
  showNotification = true
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

  /**
   * Should the blocks be set when the generation is done
   *
   * @default true
   */
  showNotification?: boolean;
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
      unlock = bindSelectionToEditMode(options.engine, blockIds, editMode);
      const result = await next(input, options);

      if (showNotification) {
        const currentlySelectedBlockIds =
          options.engine.block.findAllSelected();
        const blockIdsAreSelected = blockIds.some((blockId) => {
          return currentlySelectedBlockIds.includes(blockId);
        });

        if (!blockIdsAreSelected) {
          options.cesdk?.ui.showNotification({
            type: 'success',
            message: 'AI generation complete',
            action: {
              label: 'Select',
              onClick: () => {
                blockIds.forEach((blockId) => {
                  options.engine.block.select(blockId);
                });
              }
            }
          });
        }
      }
      return result;
    } catch (error) {
      if (isAbortError(error)) {
        unlock();
      }
      throw error;
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
function bindSelectionToEditMode(
  engine: CreativeEngine,
  blockIdsToBind: number[],
  editModeToBindTo: string
) {
  function isBoundBlockSelected() {
    const currentlySelectedBlockIds = engine.block.findAllSelected();
    return blockIdsToBind.some((blockId) => {
      return currentlySelectedBlockIds.includes(blockId);
    });
  }

  const stateChangeDisposer = engine.editor.onStateChanged(() => {
    const editMode = engine.editor.getEditMode();
    if (editMode !== editModeToBindTo && isBoundBlockSelected()) {
      engine.editor.setEditMode(editModeToBindTo);
    }
  });

  const selectionDisposer = engine.block.onSelectionChanged(() => {
    if (isBoundBlockSelected()) {
      engine.editor.setEditMode(editModeToBindTo);
    } else {
      engine.editor.setEditMode('Transform');
    }
  });

  if (isBoundBlockSelected()) {
    engine.editor.setEditMode(editModeToBindTo);
  }

  const dispose = () => {
    selectionDisposer();
    stateChangeDisposer();

    engine.editor.setEditMode('Transform');
  };

  return dispose;
}

export default editModeMiddleware;
