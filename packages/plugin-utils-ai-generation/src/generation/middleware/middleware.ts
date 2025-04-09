import CreativeEditorSDK, { CreativeEngine } from '@cesdk/cesdk-js';
import { GenerationOptions, GenerationResult, Output } from '../provider';

/**
 * Define the type for middleware functions
 */
export type Middleware<I, O extends Output> = (
  input: I,
  options: GenerationOptions & {
    /**
     * The block ids the generation is applied on
     * If this value is undefined, the selected blocks will be used.
     * Setting this value to null will explicitly tell every
     * middleware that no block shall be used.
     */
    blockIds?: number[] | null;

    /**
      * Adds a disposer function to this genereation which is called
    * when the generation is cancelled or completely finished.
      */
    addDisposer: (dispose: () => Promise<void>) => void;
  },
  next: (input: I, options: GenerationOptions) => Promise<GenerationResult<O>>
) => Promise<GenerationResult<O>>;

export function composeMiddlewares<I, O extends Output>(
  middlewares: Middleware<I, O>[]
) {
  // Start with the base handler
  return function (
    baseHandler: (
      input: I,
      options: GenerationOptions
    ) => Promise<GenerationResult<O>>
  ) {
    // We need to build a chain where each step is a function with the signature:
    // (input, options) => Promise<Result>

    // The composed function that will be returned
    return async function (
      input: I,
      options: GenerationOptions
    ): Promise<GenerationResult<O>> {
      // Define a function to process each middleware in sequence
      const runMiddleware = async (
        index: number,
        currentInput: I,
        currentOptions: GenerationOptions
      ): Promise<GenerationResult<O>> => {
        // If we've processed all middlewares, call the base handler
        if (index >= middlewares.length) {
          return baseHandler(currentInput, currentOptions);
        }

        // Get the current middleware
        const currentMiddleware = middlewares[index];

        // Create a next function for this middleware that calls the next middleware in line
        const next = async (
          nextInput: I,
          nextOptions: GenerationOptions
        ): Promise<GenerationResult<O>> => {
          return runMiddleware(index + 1, nextInput, nextOptions);
        };

        // Call the current middleware with the input, options, and next function
        return currentMiddleware(currentInput, currentOptions, next);
      };

      // Start processing with the first middleware
      return runMiddleware(0, input, options);
    };
  };
}
