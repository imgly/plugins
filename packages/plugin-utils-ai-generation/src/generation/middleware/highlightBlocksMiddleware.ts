import { Middleware } from './middleware';
import { Output } from '../provider';

/**
 * Highlights the blocks while the middleware is running.
 *
 * - Sets the blocks to always on top
 * - Disables clipping of the parent of the blocks so it is visible
 */
function highlightBlocksMiddleware<I, O extends Output>({
  alwaysOnTop = true,
  disableClipping = true
}: {
  /**
   * Until disposed, should the block be always on top to be visible?
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
}): Middleware<I, O> {
  const middleware: Middleware<I, O> = async (input, options, next) => {
    const wasAlwaysOnTop: Record<number, boolean> = {};
    const parentClipping: Record<number, boolean> = {};

    const blockIds =
      alwaysOnTop || disableClipping
        ? options.blockIds ?? options.engine.block.findAllSelected()
        : [];

    blockIds.forEach((blockId) => {
      if (options.engine.block.isValid(blockId))
        if (alwaysOnTop) {
          wasAlwaysOnTop[blockId] = options.engine.block.isAlwaysOnTop(blockId);
          options.engine.block.setAlwaysOnTop(blockId, true);
        }
      if (disableClipping) {
        const parent = options.engine.block.getParent(blockId);
        if (
          parent != null &&
          options.engine.block.getType(parent) != '//ly.img.ubq/scene'
        ) {
          parentClipping[parent] = options.engine.block.isClipped(parent);
          options.engine.block.setClipped(parent, false);
        }
      }
    });

    options.addDisposer(async () => {
      blockIds.forEach((blockId) => {
        if (options.engine.block.isValid(blockId))
          if (alwaysOnTop) {
            options.engine.block.setAlwaysOnTop(
              blockId,
              wasAlwaysOnTop[blockId]
            );
          }
        if (disableClipping) {
          const parent = options.engine.block.getParent(blockId);
          if (
            parent != null &&
            options.engine.block.getType(parent) != '//ly.img.ubq/scene'
          ) {
            if (parentClipping[parent] != null) {
              options.engine.block.setClipped(parent, parentClipping[parent]);
            }
          }
        }
      });
    });
    const result = await next(input, options);

    return result;
  };

  return middleware;
}

export default highlightBlocksMiddleware;
