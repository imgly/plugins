/* eslint-disable no-console */
import { GenerationResult, Output } from '../core/provider';
import { Middleware } from './middleware';

function loggingMiddleware<I, O extends Output>({
  enable = true
}: {
  enable: boolean | undefined;
}) {
  const middleware: Middleware<I, O> = async (input, options, next) => {
    if (!enable) return next(input, options);

    console.group('[GENERATION]');
    console.log(`Generating with input:`, JSON.stringify(input, null, 2));
    let result: GenerationResult<O> | undefined;
    const start = Date.now();
    try {
      result = await next(input, options);
      return result;
    } finally {
      if (result != null) {
        console.log(`Generation took ${Date.now() - start}ms`);
        console.log(`Generation result:`, JSON.stringify(result, null, 2));
      }
      console.groupEnd();
    }
  };

  return middleware;
}

export default loggingMiddleware;
