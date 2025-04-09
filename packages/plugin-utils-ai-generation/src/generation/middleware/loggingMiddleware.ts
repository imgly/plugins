/* eslint-disable no-console */
import { GenerationResult, Output } from '../provider';
import { Middleware } from './middleware';

function loggingMiddleware<I, O extends Output>() {
  const middleware: Middleware<I, O> = async (input, options, next) => {
    console.group('[GENERATION]');
    console.log(`Generating with input:`, JSON.stringify(input, null, 2));
    let result: GenerationResult<O> | undefined = undefined;
    let start = Date.now();
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
