import { describe, expect, it, jest } from '@jest/globals';
import {
  composeMiddlewares,
  Middleware
} from '../generation/middleware/middleware';
import {
  GenerationOptions,
  GenerationResult,
  TextOutput
} from '../generation/provider';

// Define a simple input type for testing
interface TextInput {
  text: string;
}

// Type for the base handler function
type BaseHandler = (
  input: TextInput,
  options: GenerationOptions
) => Promise<GenerationResult<TextOutput>>;

type Disposer = () => Promise<void>;

describe('middleware disposer functionality', () => {
  it('should collect and execute disposers', async () => {
    // Arrange
    const outputResult: TextOutput = { kind: 'text', text: 'success' };
    const baseHandler = jest.fn<BaseHandler>().mockResolvedValue(outputResult);

    const disposer1 = jest.fn<Disposer>().mockResolvedValue(undefined);
    const disposer2 = jest.fn<Disposer>().mockResolvedValue(undefined);

    const middleware1: Middleware<TextInput, TextOutput> = jest
      .fn<Middleware<TextInput, TextOutput>>()
      .mockImplementation(async (input, options, next) => {
        options.addDisposer(disposer1);
        return next(input, options);
      });

    const middleware2: Middleware<TextInput, TextOutput> = jest
      .fn<Middleware<TextInput, TextOutput>>()
      .mockImplementation(async (input, options, next) => {
        options.addDisposer(disposer2);
        return next(input, options);
      });

    const input: TextInput = { text: 'test' };
    const options: GenerationOptions = {
      abortSignal: new AbortController().signal,
      // @ts-ignore
      engine: undefined
    };

    // Act
    const composed = composeMiddlewares<TextInput, TextOutput>([
      middleware1,
      middleware2
    ]);
    const handler = composed(baseHandler);
    const result = await handler(input, options);

    // Assert
    expect(result).toHaveProperty('result');
    expect(result).toHaveProperty('dispose');
    expect(result.result).toEqual(outputResult);

    // Verify disposers haven't been called yet
    expect(disposer1).not.toHaveBeenCalled();
    expect(disposer2).not.toHaveBeenCalled();

    // Call dispose and verify disposers are called in reverse order
    await result.dispose();

    // Check call order by inspecting mock calls
    const disposer1CallOrder = disposer1.mock.invocationCallOrder[0];
    const disposer2CallOrder = disposer2.mock.invocationCallOrder[0];
    expect(disposer2CallOrder).toBeLessThan(disposer1CallOrder);
    expect(disposer1).toHaveBeenCalledTimes(1);
    expect(disposer2).toHaveBeenCalledTimes(1);
  });

  it('should handle errors in disposers', async () => {
    // Arrange
    const outputResult: TextOutput = { kind: 'text', text: 'success' };
    const baseHandler = jest.fn<BaseHandler>().mockResolvedValue(outputResult);

    const failingDisposer = jest
      .fn<Disposer>()
      .mockRejectedValue(new Error('Dispose error'));
    const workingDisposer = jest.fn<Disposer>().mockResolvedValue(undefined);

    const middleware1: Middleware<TextInput, TextOutput> = jest
      .fn<Middleware<TextInput, TextOutput>>()
      .mockImplementation(async (input, options, next) => {
        options.addDisposer(failingDisposer);
        return next(input, options);
      });

    const middleware2: Middleware<TextInput, TextOutput> = jest
      .fn<Middleware<TextInput, TextOutput>>()
      .mockImplementation(async (input, options, next) => {
        options.addDisposer(workingDisposer);
        return next(input, options);
      });

    const input: TextInput = { text: 'test' };
    const options: GenerationOptions = {
      abortSignal: new AbortController().signal,
      // @ts-ignore
      engine: undefined
    };

    // Mock console.error to verify error handling
    const originalConsoleError = console.error;
    console.error = jest.fn();

    try {
      // Act
      const composed = composeMiddlewares<TextInput, TextOutput>([
        middleware1,
        middleware2
      ]);
      const handler = composed(baseHandler);
      const result = await handler(input, options);

      // Call dispose which should handle the error
      await result.dispose();

      // Assert
      expect(workingDisposer).toHaveBeenCalledTimes(1);
      expect(failingDisposer).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        'Error in disposer:',
        expect.any(Error)
      );
    } finally {
      // Restore console.error
      console.error = originalConsoleError;
    }
  });

  it('should call disposers after execution', async () => {
    // Arrange
    const outputResult: TextOutput = { kind: 'text', text: 'success' };
    const baseHandler = jest.fn<BaseHandler>().mockResolvedValue(outputResult);

    const disposer = jest.fn<Disposer>().mockResolvedValue(undefined);

    const middleware: Middleware<TextInput, TextOutput> = jest
      .fn<Middleware<TextInput, TextOutput>>()
      .mockImplementation(async (input, options, next) => {
        options.addDisposer(disposer);
        return next(input, options);
      });

    const input: TextInput = { text: 'test' };
    const options: GenerationOptions = {
      abortSignal: new AbortController().signal,
      // @ts-ignore
      engine: undefined
    };

    // Act
    const composed = composeMiddlewares<TextInput, TextOutput>([middleware]);
    const handler = composed(baseHandler);
    const result = await handler(input, options);

    // Call dispose
    await result.dispose();

    // Verify disposer was called
    expect(disposer).toHaveBeenCalledTimes(1);

    // Reset mock and call dispose again
    disposer.mockClear();
    await result.dispose();

    // Verify disposer was not called again (disposers were cleared)
    expect(disposer).not.toHaveBeenCalled();
  });
});
