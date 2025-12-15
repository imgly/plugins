/**
 * Runware HTTP REST API client for video generation
 * Uses the REST API instead of the WebSocket SDK
 * API documentation: https://runware.ai/docs/en/video-inference/api-reference
 *
 * Video generation uses async delivery with polling:
 * 1. Submit task with deliveryMethod: "async"
 * 2. Receive taskUUID in response
 * 3. Poll with getResponse until status is "success" or "failed"
 */

export interface FrameImage {
  inputImage: string;
  frame?: 'first' | 'last' | number;
}

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
  frameImages?: FrameImage[];
  providerSettings?: Record<string, unknown>;
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
  status?: 'processing' | 'success' | 'failed';
  videoURL?: string;
  videoUUID?: string;
  seed?: number;
  NSFWContent?: boolean;
  cost?: number;
  errorMessage?: string;
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

// Polling configuration
const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds
const MAX_POLL_TIME_MS = 10 * 60 * 1000; // Maximum 10 minutes

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function createRunwareClient(
  proxyUrl: string,
  headers?: Record<string, string>
): RunwareClient {
  /**
   * Poll for video generation results using getResponse task
   */
  // eslint-disable-next-line no-await-in-loop
  async function pollForResult(
    taskUUID: string,
    abortSignal?: AbortSignal
  ): Promise<RunwareVideoResult> {
    const startTime = Date.now();

    // Polling must be sequential - each request depends on the previous result
    /* eslint-disable no-await-in-loop */
    while (Date.now() - startTime < MAX_POLL_TIME_MS) {
      // Check if aborted
      if (abortSignal?.aborted) {
        throw new Error('Video generation aborted');
      }

      // Poll for results
      const pollBody = [
        {
          taskType: 'getResponse',
          taskUUID
        }
      ];

      const pollResponse = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(pollBody),
        signal: abortSignal
      });

      if (!pollResponse.ok) {
        const errorText = await pollResponse.text();
        throw new Error(
          `Runware API polling error: ${pollResponse.status} - ${errorText}`
        );
      }

      const pollResult = await pollResponse.json();

      // Check for errors
      if (pollResult.errors != null && pollResult.errors.length > 0) {
        const error = pollResult.errors[0] as RunwareErrorResponse;
        throw new Error(`Runware API error: ${error.errorMessage}`);
      }

      if (pollResult.error != null) {
        throw new Error(
          `Runware API error: ${
            pollResult.error.errorMessage ?? pollResult.error
          }`
        );
      }

      const data = pollResult.data;
      if (data != null && Array.isArray(data) && data.length > 0) {
        const videoResult = data.find(
          (item: any) =>
            item.taskType === 'videoInference' && item.taskUUID === taskUUID
        ) as RunwareVideoResult | undefined;

        if (videoResult != null) {
          // Check status
          if (videoResult.status === 'success' && videoResult.videoURL) {
            return videoResult;
          }

          if (videoResult.status === 'failed') {
            throw new Error(
              videoResult.errorMessage ?? 'Video generation failed'
            );
          }

          // Still processing, continue polling
        }
      }

      // Wait before next poll
      await sleep(POLL_INTERVAL_MS);
    }
    /* eslint-enable no-await-in-loop */

    throw new Error('Video generation timed out');
  }

  return {
    videoInference: async (
      params: RunwareVideoInferenceInput,
      abortSignal?: AbortSignal
    ): Promise<RunwareVideoResult[]> => {
      const taskUUID = generateUUID();

      // Build the request body with async delivery for video tasks
      const requestBody = [
        {
          taskType: 'videoInference',
          taskUUID,
          model: params.model,
          deliveryMethod: 'async', // Required for video to avoid timeouts
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
          ...(params.frameImages != null && {
            frameImages: params.frameImages
          }),
          ...(params.providerSettings != null && {
            providerSettings: params.providerSettings
          })
        }
      ];

      // Submit the video generation task
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
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

      if (result.error != null) {
        throw new Error(
          `Runware API error: ${result.error.errorMessage ?? result.error}`
        );
      }

      // Verify we got the task acknowledgment
      const data = result.data;
      if (data == null || !Array.isArray(data)) {
        throw new Error(
          'Invalid response from Runware API: missing data array'
        );
      }

      const taskAck = data.find(
        (item: any) =>
          item.taskType === 'videoInference' && item.taskUUID === taskUUID
      );

      if (taskAck == null) {
        throw new Error('Video generation task was not acknowledged');
      }

      // Poll for the result
      const videoResult = await pollForResult(taskUUID, abortSignal);

      return [videoResult];
    }
  };
}
