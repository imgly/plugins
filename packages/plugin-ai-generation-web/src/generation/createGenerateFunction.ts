import Provider, {
  GenerationOptions,
  Output,
  OutputKind
} from '../core/provider';
import { composeMiddlewares, Middleware } from '../middleware/middleware';
import loggingMiddleware from '../middleware/loggingMiddleware';
import dryRunMiddleware from '../middleware/dryRunMiddleware';
import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';
import { isAbortError, isAsyncGenerator } from '../utils/utils';
import { ABORT_REASON_USER_CANCEL } from '../core/constants';

export type ResultSuccess<O> =
  | {
      status: 'success';
      type: 'async';
      output: AsyncGenerator<O>;
      middlewareOptions?: GenerationOptions;
    }
  | {
      status: 'success';
      type: 'sync';
      output: O;
      middlewareOptions?: GenerationOptions;
    };

export type Result<O> =
  | ResultSuccess<O>
  | { status: 'error'; message: string; middlewareOptions?: GenerationOptions }
  | { status: 'aborted'; middlewareOptions?: GenerationOptions };

export type Generate<I, O extends Output> = (
  input: I,
  options?: {
    /**
     * The block IDs that this generation is operating on.
     * - undefined: Middleware will fall back to selected blocks
     * - []: Explicitly target no blocks
     * - [1, 2, 3]: Target specific blocks (e.g., placeholder block)
     */
    blockIds?: number[];
    abortSignal?: AbortSignal;
    middlewares?: Middleware<I, O>[];
    debug?: boolean;
    dryRun?: boolean;
  }
) => Promise<Result<O>>;

function createGenerateFunction<
  K extends OutputKind,
  I,
  O extends Output
>(context: {
  provider: Provider<K, I, O>;
  cesdk: CreativeEditorSDK;
  engine: CreativeEngine;
}): Generate<I, O> {
  return async (input: I, options) => {
    if (options?.abortSignal?.aborted) return { status: 'aborted' };

    const composedMiddlewares = composeMiddlewares<I, O>([
      ...(context.provider.output.middleware ?? []),
      ...(options?.middlewares ?? []),
      loggingMiddleware({ enable: options?.debug }),
      dryRunMiddleware({
        enable: options?.dryRun,
        kind: context.provider.kind
      })
    ]);

    // Create middleware options with preventDefault implementation
    // Using closure instead of 'this' to ensure state is shared across middleware chain
    const preventDefaultState = { prevented: false };
    const middlewareOptions: GenerationOptions = {
      blockIds: options?.blockIds,
      abortSignal: options?.abortSignal,
      engine: context.engine,
      cesdk: context.cesdk,
      preventDefault: () => {
        preventDefaultState.prevented = true;
      },
      defaultPrevented: () => {
        return preventDefaultState.prevented;
      }
    };

    // Trigger the generation
    try {
      const { result: output } = await composedMiddlewares(
        context.provider.output.generate
      )(input, middlewareOptions);
      if (options?.abortSignal?.aborted)
        return { status: 'aborted', middlewareOptions };
      if (output instanceof Error)
        return {
          status: 'error',
          message: output.message,
          middlewareOptions
        };
      if (output == null)
        return {
          status: 'error',
          message: 'No output generated',
          middlewareOptions
        };

      if (isAsyncGenerator(output)) {
        return { status: 'success', type: 'async', output, middlewareOptions };
      } else {
        return { status: 'success', type: 'sync', output, middlewareOptions };
      }
    } catch (error) {
      if (isAbortError(error)) {
        return {
          status: 'aborted',
          message: error.message,
          middlewareOptions
        };
      }
      if (error === ABORT_REASON_USER_CANCEL) {
        return { status: 'aborted', message: error, middlewareOptions };
      }
      return {
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
        middlewareOptions
      };
    }
  };
}

export default createGenerateFunction;
