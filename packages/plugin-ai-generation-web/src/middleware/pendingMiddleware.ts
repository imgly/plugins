import { Middleware } from './middleware';
import { Output } from '../core/provider';

/**
 * Sets the blocks to a pending state while the middleware is running.
 */
function pendingMiddleware<I, O extends Output>({
  enable = true
}: {
  /**
   * Should the blocks be set to a pending state?
   *
   * @default true
   */
  enable?: boolean;
}): Middleware<I, O> {
  const middleware: Middleware<I, O> = async (input, options, next) => {
    const blockIds = enable
      ? options.blockIds ?? options.engine.block.findAllSelected()
      : [];

    try {
      blockIds.forEach((blockId) => {
        if (options.engine.block.isValid(blockId))
          options.engine.block.setState(blockId, {
            type: 'Pending',
            progress: 0
          });
      });
      const result = await next(input, options);

      return result;
    } finally {
      blockIds.forEach((blockId) => {
        if (options.engine.block.isValid(blockId))
          options.engine.block.setState(blockId, { type: 'Ready' });
      });
    }
  };

  return middleware;
}

export default pendingMiddleware;
