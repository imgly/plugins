import { isAsyncGenerator } from '../../utils';
import { GenerationResult, Output } from '../provider';
import { Middleware } from './middleware';

/**
 * Middleware to upload the output of a generation process.
 *
 * Sometimes it is not possible to use the result of a provider or
 * not even allowed to use it directly. This middleware allows you to upload
 * the result of a generation process to a server or a cloud storage.
 *
 * @param upload The function to upload the output. It should return a promise
 */
function uploadMiddleware<I, O extends Output>(
  upload: (output: O) => Promise<O>
) {
  const middleware: Middleware<I, O> = async (input, options, next) => {
    const result: GenerationResult<O> | undefined = await next(input, options);
    if (isAsyncGenerator(result)) {
      // No reupload needed, just return the async generator
      return result;
    }

    const uploaded = await upload(result);
    return uploaded;
  };

  return middleware;
}

export default uploadMiddleware;
