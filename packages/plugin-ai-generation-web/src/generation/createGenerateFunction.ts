import Provider, { Output, OutputKind } from '../core/provider';
import { composeMiddlewares, Middleware } from '../middleware/middleware';
import loggingMiddleware from '../middleware/loggingMiddleware';
import dryRunMiddleware from '../middleware/dryRunMiddleware';
import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';
import { isAbortError, isAsyncGenerator } from '../utils/utils';
import { ABORT_REASON_USER_CANCEL } from '../core/constants';

export type ResultSuccess<O> =
  | { status: 'success'; type: 'async'; output: AsyncGenerator<O> }
  | { status: 'success'; type: 'sync'; output: O };

export type Result<O> =
  | ResultSuccess<O>
  | { status: 'error'; message: string }
  | { status: 'aborted' };

export type Generate<I, O extends Output> = (
  input: I,
  options?: {
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

    // Trigger the generation
    try {
      const { result: output } = await composedMiddlewares(
        context.provider.output.generate
      )(input, {
        abortSignal: options?.abortSignal,
        engine: context.engine,
        cesdk: context.cesdk
      });
      if (options?.abortSignal?.aborted) return { status: 'aborted' };
      if (output instanceof Error)
        return { status: 'error', message: output.message };
      if (output == null)
        return { status: 'error', message: 'No output generated' };

      if (isAsyncGenerator(output)) {
        return { status: 'success', type: 'async', output };
      } else {
        return { status: 'success', type: 'sync', output };
      }
    } catch (error) {
      if (isAbortError(error)) {
        return { status: 'aborted', message: error.message };
      }
      if (error === ABORT_REASON_USER_CANCEL) {
        return { status: 'aborted', message: error };
      }
      return {
        status: 'error',
        message: error instanceof Error ? error.message : String(error)
      };
    }
  };
}

export default createGenerateFunction;
