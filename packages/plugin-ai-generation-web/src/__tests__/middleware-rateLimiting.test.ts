import {
  describe,
  expect,
  it,
  jest,
  beforeEach,
  beforeAll
} from '@jest/globals';
import { GenerationOptions, TextOutput } from '../core/provider';
import rateLimitMiddleware, {
  inMemoryStores
} from '../middleware/rateLimitMiddleware';
import { Middleware } from '../middleware/middleware';

// Mock for timing functions
jest.useFakeTimers();

const mockTransaction = {
  objectStore: jest.fn(),
  oncomplete: null as Function | null,
  onerror: null as Function | null
};

const mockObjectStore = {
  put: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  getAll: jest.fn()
};

const mockRequest = {
  result: null,
  error: null,
  onsuccess: null as Function | null,
  onerror: null as Function | null
};

// Mock IDBRequest result
beforeAll(() => {
  // Mock indexedDB globally
  Object.defineProperty(global, 'indexedDB', {
    value: undefined
  });

  // Initialize the mock IndexedDB
  mockTransaction.objectStore.mockReturnValue(mockObjectStore);
  mockObjectStore.put.mockImplementation(() => {
    setTimeout(() => {
      if (mockTransaction.oncomplete) {
        mockTransaction.oncomplete();
      }
    }, 0);
    return mockRequest;
  });
  mockObjectStore.get.mockImplementation(() => {
    setTimeout(() => {
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({ target: { result: mockRequest.result } });
      }
    }, 0);
    return mockRequest;
  });
});

// Define our test types
interface TestInput {
  prompt: string;
}

// Custom type for our mock options
interface MockOptions extends GenerationOptions {
  blockIds: number[];
  addDisposer: (disposer: () => Promise<void>) => void;
}

// Utility type for our test middleware
type TestMiddleware = Middleware<TestInput, TextOutput>;

describe('rateLimitMiddleware', () => {
  // Common test objects
  let mockInput: TestInput;
  let mockOutput: TextOutput;
  let mockOptions: MockOptions;
  let mockNext: (
    input: TestInput,
    options: GenerationOptions
  ) => Promise<TextOutput>;

  // Reset everything before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Explicitly clear the inMemoryStores between tests
    inMemoryStores.clear();

    // Re-initialize test objects for each test
    mockInput = { prompt: 'test prompt' };
    mockOutput = { kind: 'text', text: 'generated text' };
    mockOptions = {
      abortSignal: new AbortController().signal,
      engine: {} as any,
      cesdk: {} as any,
      blockIds: [],
      addDisposer: jest.fn()
    };

    // Create a next function that's properly typed for our tests
    mockNext = jest
      .fn<
        (input: TestInput, options: GenerationOptions) => Promise<TextOutput>
      >()
      .mockResolvedValue(mockOutput);
  });

  it('should allow requests within rate limit', async () => {
    // Create middleware with a limit of 3 requests in a 1000ms window
    const middleware = rateLimitMiddleware<TestInput, TextOutput>({
      maxRequests: 3,
      timeWindowMs: 1000
    }) as TestMiddleware;

    // Make 3 requests which should all succeed
    await expect(
      middleware(mockInput, mockOptions, mockNext as any)
    ).resolves.toEqual(mockOutput);
    await expect(
      middleware(mockInput, mockOptions, mockNext as any)
    ).resolves.toEqual(mockOutput);
    await expect(
      middleware(mockInput, mockOptions, mockNext as any)
    ).resolves.toEqual(mockOutput);

    // Verify next was called 3 times
    expect(mockNext).toHaveBeenCalledTimes(3);
  });

  it('should reject requests that exceed rate limit', async () => {
    // Create middleware with a limit of 2 requests in a 1000ms window
    const middleware = rateLimitMiddleware<TestInput, TextOutput>({
      maxRequests: 2,
      timeWindowMs: 1000
    }) as TestMiddleware;

    // Make 2 requests which should succeed
    await expect(
      middleware(mockInput, mockOptions, mockNext as any)
    ).resolves.toEqual(mockOutput);
    await expect(
      middleware(mockInput, mockOptions, mockNext as any)
    ).resolves.toEqual(mockOutput);

    // The 3rd request should be rejected
    await expect(middleware(mockInput, mockOptions, mockNext)).rejects.toThrow(
      'Rate limit exceeded'
    );

    // Verify next was called only 2 times
    expect(mockNext).toHaveBeenCalledTimes(2);
  });

  it('should allow requests after time window passes', async () => {
    // Create middleware with a limit of 1 request in a 1000ms window
    const middleware = rateLimitMiddleware<TestInput, TextOutput>({
      maxRequests: 1,
      timeWindowMs: 1000
    }) as TestMiddleware;

    // Make first request which should succeed
    await expect(
      middleware(mockInput, mockOptions, mockNext as any)
    ).resolves.toEqual(mockOutput);

    // The 2nd request should be rejected (rate limit exceeded)
    await expect(middleware(mockInput, mockOptions, mockNext)).rejects.toThrow(
      'Rate limit exceeded'
    );

    // Advance time by 1001ms to exceed the time window
    jest.advanceTimersByTime(1001);

    // After time has passed, the next request should work with the same middleware instance
    await expect(
      middleware(mockInput, mockOptions, mockNext as any)
    ).resolves.toEqual(mockOutput);

    // Verify next was called 2 times in total
    expect(mockNext).toHaveBeenCalledTimes(2);
  });

  it('should use different rate limits for different keys with a key function', async () => {
    // Create middleware with custom key function
    const middleware = rateLimitMiddleware<TestInput, TextOutput>({
      maxRequests: 1,
      timeWindowMs: 1000,
      keyFn: (input) => input.prompt
    });

    // First input with prompt "test1"
    const input1: TestInput = { prompt: 'test1' };
    // Second input with prompt "test2"
    const input2: TestInput = { prompt: 'test2' };

    // Both first requests should succeed since they have different keys
    await expect(middleware(input1, mockOptions, mockNext)).resolves.toEqual(
      mockOutput
    );
    await expect(middleware(input2, mockOptions, mockNext)).resolves.toEqual(
      mockOutput
    );

    // Second request with same prompt "test1" should be rejected
    await expect(middleware(input1, mockOptions, mockNext)).rejects.toThrow(
      'Rate limit exceeded'
    );

    // Second request with prompt "test2" should also be rejected
    await expect(middleware(input2, mockOptions, mockNext)).rejects.toThrow(
      'Rate limit exceeded'
    );

    // Verify next was called 2 times in total
    expect(mockNext).toHaveBeenCalledTimes(2);
  });

  it('should call onRateLimitExceeded callback when rate limit is exceeded', async () => {
    // Create a simple callback mock
    const onRateLimitExceeded = jest.fn();

    // Create middleware with the callback
    const middleware = rateLimitMiddleware<TestInput, TextOutput>({
      maxRequests: 2,
      timeWindowMs: 1000,
      onRateLimitExceeded: onRateLimitExceeded as any
    }) as TestMiddleware;

    // Make 2 requests which should succeed
    await expect(
      middleware(mockInput, mockOptions, mockNext as any)
    ).resolves.toEqual(mockOutput);
    await expect(
      middleware(mockInput, mockOptions, mockNext as any)
    ).resolves.toEqual(mockOutput);

    // The 3rd request should trigger the callback
    await expect(middleware(mockInput, mockOptions, mockNext)).rejects.toThrow(
      'Operation aborted: Rate limit exceeded'
    );

    // Verify the callback was called with correct parameters
    expect(onRateLimitExceeded).toHaveBeenCalledTimes(1);
    expect(onRateLimitExceeded).toHaveBeenCalledWith(
      mockInput,
      mockOptions,
      expect.objectContaining({
        key: 'global',
        currentCount: 2,
        maxRequests: 2,
        timeWindowMs: 1000,
        remainingTimeMs: expect.any(Number)
      })
    );
  });

  it('should allow operation to proceed when callback returns true', async () => {
    // Create a callback mock that returns true
    const onRateLimitExceeded = jest.fn().mockReturnValue(true);

    // Create middleware with the callback
    const middleware = rateLimitMiddleware<TestInput, TextOutput>({
      maxRequests: 1,
      timeWindowMs: 1000,
      onRateLimitExceeded: onRateLimitExceeded as any
    }) as TestMiddleware;

    // Make first request which should succeed
    await expect(
      middleware(mockInput, mockOptions, mockNext as any)
    ).resolves.toEqual(mockOutput);

    // The 2nd request should trigger the callback but still proceed
    await expect(
      middleware(mockInput, mockOptions, mockNext as any)
    ).resolves.toEqual(mockOutput);

    // Verify the callback was called
    expect(onRateLimitExceeded).toHaveBeenCalledTimes(1);

    // Verify next was called for both requests
    expect(mockNext).toHaveBeenCalledTimes(2);
  });

  it('should support async callback', async () => {
    // Create a callback mock that returns a Promise<true>
    const onRateLimitExceeded = jest
      .fn<() => Promise<boolean>>()
      .mockResolvedValue(true);

    // Create middleware with the callback
    const middleware = rateLimitMiddleware<TestInput, TextOutput>({
      maxRequests: 1,
      timeWindowMs: 1000,
      onRateLimitExceeded: onRateLimitExceeded as any
    }) as TestMiddleware;

    // Make first request which should succeed
    await expect(
      middleware(mockInput, mockOptions, mockNext as any)
    ).resolves.toEqual(mockOutput);

    // The 2nd request should trigger the async callback and wait for it
    await expect(
      middleware(mockInput, mockOptions, mockNext as any)
    ).resolves.toEqual(mockOutput);

    // Verify the callback was called
    expect(onRateLimitExceeded).toHaveBeenCalledTimes(1);

    // Verify next was called for both requests
    expect(mockNext).toHaveBeenCalledTimes(2);
  });

  it('should allow custom database name', async () => {
    // Create middleware with custom database name
    const middleware = rateLimitMiddleware<TestInput, TextOutput>({
      maxRequests: 2,
      timeWindowMs: 1000,
      dbName: 'custom-rate-limit-db'
    });

    // Make requests - should work with in-memory fallback
    await expect(
      middleware(mockInput, mockOptions, mockNext as any)
    ).resolves.toEqual(mockOutput);

    // Verify next was called
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should isolate rate limits between different middleware instances with different configurations', async () => {
    // Create middleware with limit of 1 request in a 1000ms window
    const middleware1 = rateLimitMiddleware<TestInput, TextOutput>({
      maxRequests: 1,
      timeWindowMs: 1000
    }) as TestMiddleware;

    // Create a second middleware with different configuration
    const middleware2 = rateLimitMiddleware<TestInput, TextOutput>({
      maxRequests: 2,
      timeWindowMs: 1000
    }) as TestMiddleware;

    // First request to middleware1 should succeed
    await expect(
      middleware1(mockInput, mockOptions, mockNext as any)
    ).resolves.toEqual(mockOutput);

    // First request to middleware2 should also succeed (separate rate limit)
    await expect(
      middleware2(mockInput, mockOptions, mockNext as any)
    ).resolves.toEqual(mockOutput);

    // Second request to middleware1 should be rejected (rate limit exceeded)
    await expect(middleware1(mockInput, mockOptions, mockNext)).rejects.toThrow(
      'Rate limit exceeded. Please try again later.'
    );

    // Second request to middleware2 should still succeed (limit of 2)
    await expect(
      middleware2(mockInput, mockOptions, mockNext as any)
    ).resolves.toEqual(mockOutput);

    // Verify next was called 3 times total
    expect(mockNext).toHaveBeenCalledTimes(3);
  });

  it('should isolate rate limits using different keyFn strings', async () => {
    // Create two middlewares with identical configurations but different keyFn strings
    const middleware1 = rateLimitMiddleware<TestInput, TextOutput>({
      maxRequests: 1,
      timeWindowMs: 1000,
      keyFn: 'service1' // Using a string directly as keyFn
    }) as TestMiddleware;

    const middleware2 = rateLimitMiddleware<TestInput, TextOutput>({
      maxRequests: 1,
      timeWindowMs: 1000,
      keyFn: 'service2' // Using a different string directly as keyFn
    }) as TestMiddleware;

    // First request to middleware1 should succeed
    await expect(
      middleware1(mockInput, mockOptions, mockNext as any)
    ).resolves.toEqual(mockOutput);

    // First request to middleware2 should also succeed (separate rate limit)
    await expect(
      middleware2(mockInput, mockOptions, mockNext as any)
    ).resolves.toEqual(mockOutput);

    // Second request to middleware1 should be rejected (rate limit exceeded)
    await expect(middleware1(mockInput, mockOptions, mockNext)).rejects.toThrow(
      'Rate limit exceeded. Please try again later.'
    );

    // Second request to middleware2 should also be rejected (separate but identical rate limit)
    await expect(middleware2(mockInput, mockOptions, mockNext)).rejects.toThrow(
      'Rate limit exceeded. Please try again later.'
    );

    // Verify next was called only 2 times total (one for each middleware's first request)
    expect(mockNext).toHaveBeenCalledTimes(2);
  });

  it('should share rate limits between middleware instances with identical configurations and no prefix', async () => {
    // Create two middlewares with identical configurations and no prefix
    const middleware1 = rateLimitMiddleware<TestInput, TextOutput>({
      maxRequests: 1,
      timeWindowMs: 1000
    }) as TestMiddleware;

    const middleware2 = rateLimitMiddleware<TestInput, TextOutput>({
      maxRequests: 1,
      timeWindowMs: 1000
    }) as TestMiddleware;

    // First request to middleware1 should succeed
    await expect(
      middleware1(mockInput, mockOptions, mockNext as any)
    ).resolves.toEqual(mockOutput);

    // First request to middleware2 should fail because they share the same rate limit
    // since they have identical configuration and no prefix
    await expect(middleware2(mockInput, mockOptions, mockNext)).rejects.toThrow(
      'Rate limit exceeded. Please try again later.'
    );

    // Verify next was called only once
    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
