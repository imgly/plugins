/* eslint-disable no-console */
import { describe, expect, it, jest } from '@jest/globals';
import { composeMiddlewares, Middleware } from '../middleware/middleware';
import {
  GenerationOptions,
  GenerationResult,
  TextOutput
} from '../core/provider';
import { isAsyncGenerator } from '../utils/utils';

// Define a simple input type for testing
interface TextInput {
  text: string;
}

// Type for the base handler function
type BaseHandler = (
  input: TextInput,
  options: GenerationOptions
) => Promise<GenerationResult<TextOutput>>;

function createOptions(): GenerationOptions {
  // Ignoring the implementation for brevity
  // We do not use the options in the tests
  // @ts-ignore
  return {};
}

describe('middleware', () => {
  describe('composeMiddlewares', () => {
    it('should call the base handler when no middlewares are provided', async () => {
      // Arrange
      const outputResult: TextOutput = { kind: 'text', text: 'success' };
      const baseHandler = jest
        .fn<BaseHandler>()
        .mockResolvedValue(outputResult);
      const input: TextInput = { text: 'test' };
      const options = createOptions();

      // Act
      const composed = composeMiddlewares<TextInput, TextOutput>([]);
      const handler = composed(baseHandler);
      const result = await handler(input, options);

      // Assert
      expect(baseHandler).toHaveBeenCalledWith(
        input,
        expect.objectContaining({
          addDisposer: expect.any(Function)
        })
      );
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('dispose');
      expect(result.result).toEqual(outputResult);
    });

    it('should apply a single middleware correctly', async () => {
      // Arrange
      const outputResult: TextOutput = { kind: 'text', text: 'original' };
      const baseHandler = jest
        .fn<BaseHandler>()
        .mockResolvedValue(outputResult);

      const middleware: Middleware<TextInput, TextOutput> = jest
        .fn<Middleware<TextInput, TextOutput>>()
        .mockImplementation(async (input, options, next) => {
          const modifiedInput = { text: `${input.text}-modified` };
          const result = await next(modifiedInput, options);
          return result;
        });

      const input: TextInput = { text: 'test' };
      const options: GenerationOptions = createOptions();

      // Act
      const composed = composeMiddlewares<TextInput, TextOutput>([middleware]);
      const handler = composed(baseHandler);
      const result = await handler(input, options);

      // Assert
      expect(middleware).toHaveBeenCalledWith(
        input,
        expect.objectContaining({
          addDisposer: expect.any(Function)
        }),
        expect.any(Function)
      );
      expect(baseHandler).toHaveBeenCalledWith(
        { text: 'test-modified' },
        expect.objectContaining({
          addDisposer: expect.any(Function)
        })
      );
      expect(result.result).toEqual(outputResult);
    });

    it('should apply multiple middlewares in the correct order', async () => {
      // Arrange
      const executionOrder: string[] = [];
      const baseHandler = jest
        .fn<BaseHandler>()
        .mockImplementation(async (input) => {
          executionOrder.push('baseHandler');
          return { kind: 'text', text: input.text };
        });

      const middleware1: Middleware<TextInput, TextOutput> = jest
        .fn<Middleware<TextInput, TextOutput>>()
        .mockImplementation(async (input, options, next) => {
          executionOrder.push('middleware1-before');
          const modifiedInput = { text: `${input.text}-1` };
          const result = await next(modifiedInput, options);
          executionOrder.push('middleware1-after');
          return result;
        });

      const middleware2: Middleware<TextInput, TextOutput> = jest
        .fn<Middleware<TextInput, TextOutput>>()
        .mockImplementation(async (input, options, next) => {
          executionOrder.push('middleware2-before');
          const modifiedInput = { text: `${input.text}-2` };
          const result = await next(modifiedInput, options);
          executionOrder.push('middleware2-after');
          return result;
        });

      const input: TextInput = { text: 'test' };
      const options: GenerationOptions = createOptions();

      // Act
      const composed = composeMiddlewares<TextInput, TextOutput>([
        middleware1,
        middleware2
      ]);
      const handler = composed(baseHandler);
      const result = await handler(input, options);

      // Assert
      expect(executionOrder).toEqual([
        'middleware1-before',
        'middleware2-before',
        'baseHandler',
        'middleware2-after',
        'middleware1-after'
      ]);
      expect(baseHandler).toHaveBeenCalledWith(
        { text: 'test-1-2' },
        expect.objectContaining({
          addDisposer: expect.any(Function)
        })
      );
      expect(result.result).toEqual({ kind: 'text', text: 'test-1-2' });
    });

    it('should allow middlewares to transform the output', async () => {
      // Arrange
      const baseHandler = jest
        .fn<BaseHandler>()
        .mockResolvedValue({ kind: 'text', text: 'original' });

      const middleware: Middleware<TextInput, TextOutput> = jest
        .fn<Middleware<TextInput, TextOutput>>()
        .mockImplementation(async (input, options, next) => {
          const result = await next(input, options);
          if (isAsyncGenerator(result)) {
            throw new Error('AsyncGenerator not supported');
          }
          return {
            kind: 'text',
            text: `${result.text}-transformed`
          };
        });

      const input: TextInput = { text: 'test' };
      const options: GenerationOptions = createOptions();

      // Act
      const composed = composeMiddlewares<TextInput, TextOutput>([middleware]);
      const handler = composed(baseHandler);
      const result = await handler(input, options);

      // Assert
      expect(result.result).toEqual({
        kind: 'text',
        text: 'original-transformed'
      });
    });

    it('should allow middlewares to short-circuit the chain', async () => {
      // Arrange
      const baseHandler = jest
        .fn<BaseHandler>()
        .mockResolvedValue({ kind: 'text', text: 'base' });

      const shortCircuitMiddleware: Middleware<TextInput, TextOutput> = jest
        .fn<Middleware<TextInput, TextOutput>>()
        .mockImplementation(async () => {
          return { kind: 'text', text: 'short-circuit' };
        });

      const secondMiddleware: Middleware<TextInput, TextOutput> = jest
        .fn<Middleware<TextInput, TextOutput>>()
        .mockImplementation(async (input, options, next) => {
          const result = await next(input, options);
          if (isAsyncGenerator(result)) {
            throw new Error('AsyncGenerator not supported');
          }
          return { kind: 'text', text: `${result.text}-second` };
        });

      const input: TextInput = { text: 'test' };
      const options: GenerationOptions = createOptions();

      // Act
      const composed = composeMiddlewares<TextInput, TextOutput>([
        shortCircuitMiddleware,
        secondMiddleware
      ]);
      const handler = composed(baseHandler);
      const result = await handler(input, options);

      // Assert
      expect(shortCircuitMiddleware).toHaveBeenCalled();
      expect(secondMiddleware).not.toHaveBeenCalled();
      expect(baseHandler).not.toHaveBeenCalled();
      expect(result.result).toEqual({ kind: 'text', text: 'short-circuit' });
    });

    it('should handle errors thrown by middlewares', async () => {
      // Arrange
      const baseHandler = jest
        .fn<BaseHandler>()
        .mockResolvedValue({ kind: 'text', text: 'base' });

      const errorMiddleware: Middleware<TextInput, TextOutput> = jest
        .fn<Middleware<TextInput, TextOutput>>()
        .mockImplementation(async () => {
          throw new Error('middleware error');
        });

      const input: TextInput = { text: 'test' };
      const options: GenerationOptions = createOptions();

      // Act
      const composed = composeMiddlewares<TextInput, TextOutput>([
        errorMiddleware
      ]);
      const handler = composed(baseHandler);

      // Assert
      await expect(handler(input, options)).rejects.toThrow('middleware error');
      expect(baseHandler).not.toHaveBeenCalled();
    });

    it('should handle falsy middleware values (false, undefined, null)', async () => {
      // Arrange
      const outputResult: TextOutput = { kind: 'text', text: 'success' };
      const baseHandler = jest
        .fn<BaseHandler>()
        .mockResolvedValue(outputResult);

      const executedMiddleware = jest
        .fn<Middleware<TextInput, TextOutput>>()
        .mockImplementation(async (input, options, next) => {
          return next(input, options);
        });

      // Create an array with falsy values mixed with a real middleware
      const middlewares = [false, executedMiddleware, undefined, null];

      const input: TextInput = { text: 'test' };
      const options: GenerationOptions = createOptions();

      // Act
      const composed = composeMiddlewares<TextInput, TextOutput>(
        middlewares as any
      );
      const handler = composed(baseHandler);
      await handler(input, options);

      // Assert - only the real middleware should be executed
      expect(executedMiddleware).toHaveBeenCalledTimes(1);
      expect(baseHandler).toHaveBeenCalledTimes(1);
    });
  });
});
