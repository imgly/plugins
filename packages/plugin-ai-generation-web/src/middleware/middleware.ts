import { GenerationOptions, GenerationResult, Output } from '../core/provider';

/**
 * Result of the generation with a dispose function to clean up
 */
export interface DisposableGenerationResult<O extends Output> {
  /**
   * The actual generation result
   */
  result: GenerationResult<O>;

  /**
   * Function to dispose/clean up resources created during generation
   * This should be called when the generation is cancelled or completely
   * finished including the confirmation of the generation if applicable.
   */
  dispose: () => Promise<void>;
}

/**
 * Define the type for middleware functions
 */
export type Middleware<I, O extends Output> = (
  input: I,
  options: GenerationOptions & {
    /**
     * Adds a disposer function to this generation which is called
     * when the generation is cancelled or completely finished
     * including the confirmation of the generation if applicable.
     */
    addDisposer: (dispose: () => Promise<void>) => void;
  },
  next: (input: I, options: GenerationOptions) => Promise<GenerationResult<O>>
) => Promise<GenerationResult<O>>;

export function composeMiddlewares<I, O extends Output>(
  middlewares: (Middleware<I, O> | false | undefined | null)[]
) {
  // Filter out false, undefined, and null middlewares
  const validMiddlewares = middlewares.filter(
    (middleware): middleware is Middleware<I, O> => !!middleware
  );
  // Start with the base handler
  return (
    baseHandler: (
      input: I,
      options: GenerationOptions
    ) => Promise<GenerationResult<O>>
  ) => {
    // We need to build a chain where each step is a function with the signature:
    // (input, options) => Promise<Result>

    // The composed function that will be returned
    return async (
      input: I,
      options: GenerationOptions
    ): Promise<DisposableGenerationResult<O>> => {
      // Store disposer functions that will be called when dispose() is called
      const disposers: Array<() => Promise<void>> = [];

      // Function to add a disposer
      const addDisposer = (dispose: () => Promise<void>) => {
        disposers.push(dispose);
      };

      // Define a function to process each middleware in sequence
      const runMiddleware = async (
        index: number,
        currentInput: I,
        currentOptions: GenerationOptions
      ): Promise<GenerationResult<O>> => {
        // If we've processed all middlewares, call the base handler
        if (index >= validMiddlewares.length) {
          return baseHandler(currentInput, currentOptions);
        }

        // Get the current middleware
        const currentMiddleware = validMiddlewares[index];

        // Create a next function for this middleware that calls the next middleware in line
        const next = async (
          nextInput: I,
          nextOptions: GenerationOptions
        ): Promise<GenerationResult<O>> => {
          return runMiddleware(index + 1, nextInput, nextOptions);
        };

        // Enhanced options with addDisposer
        const enhancedOptions = {
          ...currentOptions,
          addDisposer
        };

        // Call the current middleware with the input, enhanced options, and next function
        return currentMiddleware(currentInput, enhancedOptions, next);
      };

      // Create enhanced options with addDisposer for base handler as well
      const enhancedOptions = {
        ...options,
        addDisposer
      };

      // Run the middleware chain
      const result = await runMiddleware(0, input, enhancedOptions);

      // Create the dispose function that will call all collected disposers in reverse order
      const dispose = async (): Promise<void> => {
        // Execute disposers in reverse order (last added, first disposed)
        /* eslint-disable no-await-in-loop */
        for (let i = disposers.length - 1; i >= 0; i--) {
          try {
            await disposers[i]();
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error in disposer:', error);
          }
        }
        // Clear the disposers array after all are executed
        disposers.length = 0;
      };

      // Return both the result and the dispose function
      return {
        result,
        dispose
      };
    };
  };
}
