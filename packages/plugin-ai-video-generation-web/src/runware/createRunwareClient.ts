/**
 * Runware HTTP REST API client for video generation
 * Uses the REST API instead of the WebSocket SDK
 * API documentation: https://runware.ai/docs/en/getting-started/how-to-connect
 */

export interface RunwareVideoInferenceParams {
  model: string;
  positivePrompt?: string;
  width?: number;
  height?: number;
  negativePrompt?: string;
  numberResults?: number;
  outputType?: 'URL' | 'base64Data' | 'dataURI';
  outputFormat?: 'MP4' | 'WEBM' | 'GIF';
  duration?: number;
  fps?: number;
  seed?: number;
  seedImage?: string;
  lastFrameImage?: string;
  [key: string]: unknown;
}

/**
 * Partial params that can be spread together to form complete params.
 * Used when some params come from options and some from mapInput.
 */
export type RunwareVideoInferenceInput =
  Partial<RunwareVideoInferenceParams> & {
    [key: string]: unknown;
  };

export interface RunwareVideoResult {
  taskType: string;
  taskUUID: string;
  videoURL: string;
  videoUUID?: string;
  seed?: number;
  NSFWContent?: boolean;
  cost?: number;
}

export interface RunwareErrorResponse {
  errorId: number;
  errorMessage: string;
  taskUUID?: string;
}

export interface RunwareClient {
  videoInference: (
    params: RunwareVideoInferenceInput,
    abortSignal?: AbortSignal
  ) => Promise<RunwareVideoResult[]>;
}

function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers and Node.js)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    // eslint-disable-next-line no-bitwise
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createRunwareClient(proxyUrl: string): RunwareClient {
  return {
    videoInference: async (
      params: RunwareVideoInferenceInput,
      abortSignal?: AbortSignal
    ): Promise<RunwareVideoResult[]> => {
      const taskUUID = generateUUID();

      // Build the request body as a JSON array with the videoInference task
      const requestBody = [
        {
          taskType: 'videoInference',
          taskUUID,
          model: params.model,
          ...(params.positivePrompt != null && {
            positivePrompt: params.positivePrompt
          }),
          ...(params.width != null && { width: params.width }),
          ...(params.height != null && { height: params.height }),
          outputType: params.outputType ?? 'URL',
          outputFormat: params.outputFormat ?? 'MP4',
          numberResults: params.numberResults ?? 1,
          ...(params.negativePrompt != null && {
            negativePrompt: params.negativePrompt
          }),
          ...(params.duration != null && { duration: params.duration }),
          ...(params.fps != null && { fps: params.fps }),
          ...(params.seed != null && { seed: params.seed }),
          ...(params.seedImage != null && { seedImage: params.seedImage }),
          ...(params.lastFrameImage != null && {
            lastFrameImage: params.lastFrameImage
          })
        }
      ];

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: abortSignal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Runware API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      // Check for errors in the response
      if (result.errors != null && result.errors.length > 0) {
        const error = result.errors[0] as RunwareErrorResponse;
        throw new Error(`Runware API error: ${error.errorMessage}`);
      }

      // Check for error property directly
      if (result.error != null) {
        throw new Error(
          `Runware API error: ${result.error.errorMessage ?? result.error}`
        );
      }

      // The response contains a data array with video results
      const data = result.data;
      if (data == null || !Array.isArray(data)) {
        throw new Error(
          'Invalid response from Runware API: missing data array'
        );
      }

      // Filter for videoInference results that match our taskUUID
      const videoResults = data.filter(
        (item: any) =>
          item.taskType === 'videoInference' && item.taskUUID === taskUUID
      ) as RunwareVideoResult[];

      if (videoResults.length === 0) {
        // Fallback: if no exact match, try to get any videoInference results
        const anyVideoResults = data.filter(
          (item: any) => item.taskType === 'videoInference'
        ) as RunwareVideoResult[];

        if (anyVideoResults.length > 0) {
          return anyVideoResults;
        }

        throw new Error('No video results in Runware API response');
      }

      return videoResults;
    }
  };
}

export function getRunwareClient(): RunwareClient | null {
  // This is now managed per-provider initialization
  return null;
}
