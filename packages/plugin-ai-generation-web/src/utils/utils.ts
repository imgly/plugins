import CreativeEditorSDK, { AssetResult } from '@cesdk/cesdk-js';
import { GenerationResult, Output } from '../core/provider';

export const AI_PANEL_ID_PREFIX = 'ly.img.ai';

const TEMP_ASSET_SOURCE_ID = 'ly.img.ai/temp';

/**
 * Adding asset to the scene.
 *
 * NOTE: Will use a temporary asset source so that
 * our asset source middleware trigger. This is necessary since there is
 * a lot of extra logic in the video middlewares regarding trim, position etc.
 *
 * These will only trigger via an asset source, not by calling
 * `defaultApplyAsset` directly.
 */
export async function addAssetToScene(
  cesdk: CreativeEditorSDK,
  assetResult: AssetResult
) {
  if (!cesdk.engine.asset.findAllSources().includes(TEMP_ASSET_SOURCE_ID)) {
    cesdk.engine.asset.addLocalSource(TEMP_ASSET_SOURCE_ID);
  }

  return cesdk.engine.asset.apply(TEMP_ASSET_SOURCE_ID, assetResult);
}

/**
 * Returns a consistent panel ID for a provider ID
 */
export function getPanelId(providerId: string): string {
  return `${AI_PANEL_ID_PREFIX}/${providerId}`;
}

export default getPanelId;
/**
 * Extracts a readable error message from an unknown error
 *
 * @param error The error caught in a try/catch block
 * @param fallbackMessage Optional fallback message if error is not an Error object
 * @returns A string representation of the error
 */
export function extractErrorMessage(
  error: unknown,
  fallbackMessage = 'We encountered an unknown error while generating the asset. Please try again.'
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
    if ('cause' in errorObj && typeof errorObj.cause === 'string') {
      return errorObj.cause;
    }

    /*
     * Elevenlabs for instance uses the following structure for errors:
     * {
     *   "detail": {
     *     "status": "error_code",
     *     "message": "Explanation of the rate limit issue."
     *   }
     * }
     */
    if (
      'detail' in errorObj &&
      typeof errorObj.detail === 'object' &&
      errorObj.detail !== null &&
      'message' in errorObj.detail &&
      typeof errorObj.detail.message === 'string'
    ) {
      return errorObj.detail.message;
    }

    /*
     * Used by e.g. Anthropic
     */
    if (
      'error' in errorObj &&
      typeof errorObj.error === 'object' &&
      errorObj.error !== null &&
      'message' in errorObj.error &&
      typeof errorObj.error.message === 'string'
    ) {
      return errorObj.error.message;
    }

    return fallbackMessage;
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

/**
 * Gets the duration of a video from a URL
 * @param url - The URL of the video
 * @returns A promise that resolves to the duration of the video in seconds
 */
export function getDurationForVideo(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video');
      video.style.display = 'none';

      // Set up event handlers
      video.addEventListener('loadedmetadata', () => {
        if (video.duration === Infinity) {
          // Some videos might initially report Infinity
          video.currentTime = 1e101;
          // Wait for currentTime to update
          setTimeout(() => {
            video.currentTime = 0;
            resolve(video.duration);
            document.body.removeChild(video);
          }, 50);
        } else {
          resolve(video.duration);
          document.body.removeChild(video);
        }
      });

      video.addEventListener('error', () => {
        document.body.removeChild(video);
        reject(new Error(`Failed to load video from ${url}`));
      });

      // Set source and begin loading
      video.src = url;
      document.body.appendChild(video);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Gets a thumbnail image from a video URL
 * @param url - The URL of the video
 * @param seekTime - Time in seconds to capture the thumbnail (default: 0)
 * @param format - Image format for the thumbnail (default: 'image/jpeg')
 * @param quality - Image quality between 0 and 1 (default: 0.8)
 * @returns A promise that resolves to the thumbnail data URL
 */
export function getThumbnailForVideo(
  url: string,
  seekTime = 0,
  format = 'image/jpeg',
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video');
      // Set crossOrigin to anonymous to prevent tainted canvas issues
      video.crossOrigin = 'anonymous';
      video.style.display = 'none';

      // Set up event handlers
      video.addEventListener('loadedmetadata', () => {
        // Seek to the specified time
        video.currentTime = Math.min(seekTime, video.duration);

        video.addEventListener(
          'seeked',
          () => {
            // Create a canvas to draw the video frame
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw the video frame to the canvas
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              document.body.removeChild(video);
              reject(new Error('Failed to create canvas context'));
              return;
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            try {
              // Convert canvas to data URL
              const dataURL = canvas.toDataURL(format, quality);
              // Clean up
              document.body.removeChild(video);
              resolve(dataURL);
            } catch (e) {
              document.body.removeChild(video);
              reject(
                new Error(
                  `Failed to create thumbnail: ${
                    e instanceof Error ? e.message : String(e)
                  }`
                )
              );
            }
          },
          { once: true }
        );
      });

      video.addEventListener('error', () => {
        document.body.removeChild(video);
        reject(new Error(`Failed to load video from ${url}`));
      });

      // Set source and begin loading
      video.src = url;
      document.body.appendChild(video);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Converts an ID string to a human-readable label
 * @param id - The ID string to convert
 * @returns A human-readable label derived from the ID
 *
 * Examples:
 * - snake_case_id → Snake Case Id
 * - kebab-case-id → Kebab Case Id
 * - camelCaseId → Camel Case Id
 * - PascalCaseId → Pascal Case Id
 */
export function getLabelFromId(id: string): string {
  if (!id) return '';

  // Handle snake_case, kebab-case, camelCase, and PascalCase
  return (
    id
      // Replace underscores and hyphens with spaces (for snake_case and kebab-case)
      .replace(/[_-]/g, ' ')
      // Add spaces before uppercase letters (for camelCase and PascalCase)
      .replace(/([A-Z])/g, ' $1')
      // Trim any extra spaces and ensure first letter is capitalized
      .trim()
      .split(' ')
      .filter((word) => word.length > 0) // Remove empty strings from multiple spaces
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  );
}

/**
 * Type guard to check if a value is an AsyncGenerator rather than a Promise
 *
 * @param value - Value of type Promise<O> | AsyncGenerator<O, C>
 * @returns Boolean indicating if the value is an AsyncGenerator
 */
export function isAsyncGenerator<O extends Output, C>(
  value: GenerationResult<O, C>
): value is AsyncGenerator<O, C> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'next' in value &&
    'return' in value &&
    'throw' in value &&
    typeof value.next === 'function' &&
    typeof value.return === 'function' &&
    typeof value.throw === 'function' &&
    Symbol.asyncIterator in value &&
    typeof value[Symbol.asyncIterator] === 'function'
  );
}

export function isAbortError(error: unknown): error is Error {
  return error instanceof Error && error.name === 'AbortError';
}

/**
 * Adds an icon set to the CreativeEditorSDK UI only once. Marks
 * it as added in the global state to prevent multiple additions.
 */
export function addIconSetOnce(
  cesdk: CreativeEditorSDK,
  id: string,
  icons: string
): void {
  const globalStateIconSetAddedId = `${id}.iconSetAdded`;
  if (!cesdk.ui.experimental.hasGlobalStateValue(globalStateIconSetAddedId)) {
    cesdk.ui.addIconSet(id, icons);
    cesdk.ui.experimental.setGlobalStateValue(globalStateIconSetAddedId, true);
  }
}
