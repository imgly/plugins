import { Middleware } from './middleware';
import { Output } from '../core/provider';
import lockSelectionToEditMode from '../utils/lockSelectionToEditMode';

/**
 * For a given edit mode and block ids, this middleware will
 * ensure that as long as these blocks are selected, the edit mode is
 * set to the given edit mode and cannot be changed.
 *
 * The use-case is to show only the generation canvas menu during
 * the generation process.
 */
function lockEditModeMiddleware<I, O extends Output>({
  editMode
}: {
  /**
   * The edit mode to lock the selection to.
   */
  editMode: string;
}): Middleware<I, O> {
  const middleware: Middleware<I, O> = async (input, options, next) => {
    const blockIds = options.blockIds ?? options.engine.block.findAllSelected();

    let unlock: () => void = () => {};
    try {
      unlock = lockSelectionToEditMode({
        engine: options.engine,
        blockIdsToLock: blockIds,
        editModeToLockTo: editMode
      });
      const result = await next(input, options);
      return result;
    } finally {
      unlock();
    }
  };

  return middleware;
}

export default lockEditModeMiddleware;
