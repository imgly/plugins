import { GenerationOptions, Output } from '../provider';
import { Middleware } from './middleware';

export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;

  /**
   * Time window in milliseconds
   */
  timeWindowMs: number;

  /**
   * Optional key function to create different rate limits for different inputs
   * If not provided, all requests share the same rate limit
   */
  keyFn?: <I>(input: I, options: GenerationOptions) => string;

  /**
   * Callback function that is called when rate limit is exceeded
   * Return value determines if the operation should be rejected (throw error) or allowed
   * If true is returned, the operation will proceed despite exceeding the rate limit
   * If false or undefined is returned, the operation will be rejected with a default error
   */
  onRateLimitExceeded?: <I>(
    input: I,
    options: GenerationOptions,
    rateLimitInfo: {
      key: string;
      currentCount: number;
      maxRequests: number;
      timeWindowMs: number;
      remainingTimeMs: number;
    }
  ) => boolean | Promise<boolean> | void;
}

// Store for tracking requests per key
interface RequestTracker {
  timestamps: number[];
  lastCleanup: number;
}

// In-memory store for rate limits
// Export for testing purposes
export const requestsStore: Record<string, RequestTracker> = {};

/**
 * Middleware that implements rate limiting for AI generation requests
 */
function rateLimitMiddleware<I, O extends Output>(
  middlewareOptions: RateLimitOptions
) {
  const {
    maxRequests,
    timeWindowMs,
    keyFn = () => 'global',
    onRateLimitExceeded
  } = middlewareOptions;

  const middleware: Middleware<I, O> = async (input, options, next) => {
    // Get rate limit key based on input or use default
    const key = keyFn(input, options);

    // Initialize tracker if it doesn't exist
    if (!requestsStore[key]) {
      requestsStore[key] = {
        timestamps: [],
        lastCleanup: Date.now()
      };
    }

    const tracker = requestsStore[key];
    const now = Date.now();

    // Clean up old timestamps that are outside the time window
    if (now - tracker.lastCleanup > timeWindowMs) {
      tracker.timestamps = tracker.timestamps.filter(
        (timestamp) => now - timestamp < timeWindowMs
      );
      tracker.lastCleanup = now;
    }

    // Check if rate limit is exceeded
    if (tracker.timestamps.length >= maxRequests) {
      // Calculate the time until the oldest request expires
      const oldestTimestamp = Math.min(...tracker.timestamps);
      const remainingTimeMs = Math.max(
        0,
        timeWindowMs - (now - oldestTimestamp)
      );

      // Call the rate limit exceeded callback if provided
      if (onRateLimitExceeded) {
        const rateLimitInfo = {
          key,
          currentCount: tracker.timestamps.length,
          maxRequests,
          timeWindowMs,
          remainingTimeMs
        };

        // If callback returns true, allow the request to proceed
        const shouldProceed = await onRateLimitExceeded(
          input,
          options,
          rateLimitInfo
        );
        if (!shouldProceed) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
      } else {
        // Default behavior: throw an error
        throw new Error('Rate limit exceeded. Please try again later.');
      }
    }

    // Add current timestamp to the tracker
    tracker.timestamps.push(now);

    // Continue with the next middleware
    return next(input, options);
  };

  return middleware;
}

export default rateLimitMiddleware;
