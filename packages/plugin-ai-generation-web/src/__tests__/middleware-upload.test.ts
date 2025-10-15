import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
  GenerationOptions,
  ImageOutput,
  GenerationResult
} from '../core/provider';
import uploadMiddleware from '../middleware/uploadMiddleware';
import { isAsyncGenerator } from '../utils/utils';

// Define test types
interface TestInput {
  prompt: string;
}

// Test output type
type TestOutput = ImageOutput;

// Custom test options with required middleware options
interface TestOptions extends GenerationOptions {
  addDisposer: (dispose: () => Promise<void>) => void;
}

// Type for mock functions
type UploadFn = (output: TestOutput) => Promise<TestOutput>;
type NextFn = (
  input: TestInput,
  options: GenerationOptions
) => Promise<GenerationResult<TestOutput>>;

// Mock the isAsyncGenerator import
// Note: We need to use inline mock implementation here since jest.mock() is hoisted
jest.mock('../utils/utils', () => ({
  isAsyncGenerator: jest.fn()
}));

describe('uploadMiddleware', () => {
  // Common test objects
  let mockInput: TestInput;
  let mockOptions: TestOptions;
  let mockOutput: TestOutput;
  let mockAsyncGenerator: AsyncGenerator<TestOutput, TestOutput>;
  let mockNext: jest.Mock;
  let mockUpload: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup test data
    mockInput = { prompt: 'test prompt' };
    mockOptions = {
      abortSignal: new AbortController().signal,
      engine: {} as any,
      cesdk: {} as any,
      addDisposer: jest.fn()
    };
    mockOutput = { kind: 'image', url: 'https://example.com/image.jpg' };

    // Setup async generator mock
    mockAsyncGenerator = (async function* generateMockOutput() {
      yield mockOutput;
      return mockOutput;
    })();

    // Mock next function
    mockNext = jest.fn().mockImplementation(() => Promise.resolve(mockOutput));

    // Mock upload function
    mockUpload = jest.fn().mockImplementation((output: any) => {
      return Promise.resolve({
        kind: 'image',
        url: `${output.url}?uploaded=true`
      } as TestOutput);
    });
  });

  it('should pass through async generator results without uploading', async () => {
    // Setup isAsyncGenerator to return true for the test
    (isAsyncGenerator as unknown as jest.Mock).mockReturnValueOnce(true);

    // Override mockNext to return an async generator
    mockNext.mockImplementationOnce(() => Promise.resolve(mockAsyncGenerator));

    // Create middleware with type assertions
    const middleware = uploadMiddleware<TestInput, TestOutput>(
      mockUpload as any as UploadFn
    );

    // Test middleware
    const result = await middleware(
      mockInput,
      mockOptions,
      mockNext as any as NextFn
    );

    // Verify behavior
    expect(mockNext).toHaveBeenCalledWith(mockInput, mockOptions);
    expect(isAsyncGenerator).toHaveBeenCalledWith(mockAsyncGenerator);

    // Should return the async generator without modification
    expect(result).toBe(mockAsyncGenerator);

    // Upload function should not be called
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('should upload non-generator results', async () => {
    // Setup isAsyncGenerator to return false for the test
    (isAsyncGenerator as unknown as jest.Mock).mockReturnValueOnce(false);

    // Create middleware with type assertions
    const middleware = uploadMiddleware<TestInput, TestOutput>(
      mockUpload as any as UploadFn
    );

    // Test middleware
    const result = await middleware(
      mockInput,
      mockOptions,
      mockNext as any as NextFn
    );

    // Verify behavior
    expect(mockNext).toHaveBeenCalledWith(mockInput, mockOptions);
    expect(isAsyncGenerator).toHaveBeenCalledWith(mockOutput);
    expect(mockUpload).toHaveBeenCalledWith(mockOutput);

    // Should return the uploaded result
    expect(result).toEqual({
      kind: 'image',
      url: 'https://example.com/image.jpg?uploaded=true'
    });
  });

  it('should propagate errors from the next function', async () => {
    // Mock next to throw an error
    const error = new Error('Generation failed');
    mockNext.mockImplementationOnce(() => Promise.reject(error));

    // Create middleware with type assertions
    const middleware = uploadMiddleware<TestInput, TestOutput>(
      mockUpload as any as UploadFn
    );

    // Test middleware
    await expect(
      middleware(mockInput, mockOptions, mockNext as any as NextFn)
    ).rejects.toThrow('Generation failed');

    // Verify behavior
    expect(mockNext).toHaveBeenCalledWith(mockInput, mockOptions);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('should propagate errors from the upload function', async () => {
    // Setup isAsyncGenerator to return false for the test
    (isAsyncGenerator as unknown as jest.Mock).mockReturnValueOnce(false);

    // Mock upload to throw an error
    const error = new Error('Upload failed');
    mockUpload.mockImplementationOnce(() => Promise.reject(error));

    // Create middleware with type assertions
    const middleware = uploadMiddleware<TestInput, TestOutput>(
      mockUpload as any as UploadFn
    );

    // Test middleware
    await expect(
      middleware(mockInput, mockOptions, mockNext as any as NextFn)
    ).rejects.toThrow('Upload failed');

    // Verify behavior
    expect(mockNext).toHaveBeenCalledWith(mockInput, mockOptions);
    expect(isAsyncGenerator).toHaveBeenCalledWith(mockOutput);
    expect(mockUpload).toHaveBeenCalledWith(mockOutput);
  });
});
