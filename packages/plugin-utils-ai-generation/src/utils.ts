/**
 * Extracts a readable error message from an unknown error
 *
 * @param error The error caught in a try/catch block
 * @param fallbackMessage Optional fallback message if error is not an Error object
 * @returns A string representation of the error
 */
export function extractErrorMessage(
  error: unknown,
  fallbackMessage = 'An unknown error occurred'
): string {
  if (error === null) {
    return fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object') {
    // Try to get message property if it exists
    const errorObj = error as Record<string, unknown>;
    if ('message' in errorObj && typeof errorObj.message === 'string') {
      return errorObj.message;
    }

    // Try to convert to string
    try {
      return JSON.stringify(error);
    } catch {
      // If can't stringify, return the fallback
      return fallbackMessage;
    }
  }

  if (typeof error === 'string') {
    return error;
  }

  // For any other type, convert to string
  return String(error) || fallbackMessage;
}

/**
 * Generates a random UUID v4
 */
export function uuid4() {
  /* eslint-disable no-bitwise */
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
    /* eslint-enable no-bitwise */
  });
}
