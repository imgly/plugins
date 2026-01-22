/**
 * Runware HTTP REST API client
 * Uses the REST API instead of the WebSocket SDK
 * API documentation: https://runware.ai/docs/en/getting-started/how-to-connect
 *
 * Image generation uses async delivery with polling:
 * 1. Submit task with deliveryMethod: "async"
 * 2. Receive taskUUID in response
 * 3. Poll with getResponse until status is "success" or "failed"
 */

// Polling configuration
const POLL_INTERVAL_MS = 1000; // Poll every 1 second
const MAX_POLL_TIME_MS = 5 * 60 * 1000; // Maximum 5 minutes

export interface RunwareImageInferenceParams {
  model: string;
  positivePrompt: string;
  width?: number;
  height?: number;
  negativePrompt?: string;
  numberResults?: number;
  outputType?: 'URL' | 'base64Data' | 'dataURI';
  outputFormat?: 'PNG' | 'JPG' | 'WEBP';
  outputQuality?: number;
  steps?: number;
  CFGScale?: number;
  seed?: number;
  scheduler?: string;
  seedImage?: string;
  maskImage?: string;
  strength?: number;
  /** Model-specific inputs (e.g., referenceImages for FLUX.2 [dev]) */
  inputs?: {
    referenceImages?: string[];
    [key: string]: unknown;
  };
  /** Root-level reference images (for models like GPT Image 1 that don't use nested inputs) */
  referenceImages?: string[];
  [key: string]: unknown;
}

/**
 * Partial params that can be spread together to form complete params.
 * Used when some params come from options and some from mapInput.
 */
export type RunwareImageInferenceInput =
  Partial<RunwareImageInferenceParams> & {
    [key: string]: unknown;
  };

export interface RunwareImageResult {
  taskType: string;
  taskUUID: string;
  status?: 'processing' | 'success' | 'failed';
  imageURL?: string;
  imageUUID?: string;
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
  imageInference: (
    params: RunwareImageInferenceInput,
    abortSignal?: AbortSignal
  ) => Promise<RunwareImageResult[]>;
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
   * Poll for image generation results using getResponse task
   */
  // eslint-disable-next-line no-await-in-loop
  async function pollForResult(
    taskUUID: string,
    abortSignal?: AbortSignal
  ): Promise<RunwareImageResult> {
    const startTime = Date.now();

    // Polling must be sequential - each request depends on the previous result
    /* eslint-disable no-await-in-loop */
    while (Date.now() - startTime < MAX_POLL_TIME_MS) {
      // Check if aborted
      if (abortSignal?.aborted) {
        throw new Error('Image generation aborted');
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
        const imageResult = data.find(
          (item: any) =>
            item.taskType === 'imageInference' && item.taskUUID === taskUUID
        ) as RunwareImageResult | undefined;

        if (imageResult != null) {
          // Check status
          if (imageResult.status === 'success' && imageResult.imageURL) {
            return imageResult;
          }

          if (imageResult.status === 'failed') {
            throw new Error(
              imageResult.errorMessage ?? 'Image generation failed'
            );
          }

          // Still processing, continue polling
        }
      }

      // Wait before next poll
      await sleep(POLL_INTERVAL_MS);
    }
    /* eslint-enable no-await-in-loop */

    throw new Error('Image generation timed out');
  }

  return {
    imageInference: async (
      params: RunwareImageInferenceInput,
      abortSignal?: AbortSignal
    ): Promise<RunwareImageResult[]> => {
      const taskUUID = generateUUID();

      // Build the request body with async delivery to avoid timeouts
      const requestBody = [
        {
          taskType: 'imageInference',
          taskUUID,
          model: params.model,
          positivePrompt: params.positivePrompt,
          deliveryMethod: 'async', // Required to avoid timeouts
          outputType: params.outputType ?? 'URL',
          outputFormat: params.outputFormat ?? 'PNG',
          numberResults: params.numberResults ?? 1,
          ...(params.width != null && { width: params.width }),
          ...(params.height != null && { height: params.height }),
          ...(params.negativePrompt != null && {
            negativePrompt: params.negativePrompt
          }),
          ...(params.outputQuality != null && {
            outputQuality: params.outputQuality
          }),
          ...(params.steps != null && { steps: params.steps }),
          ...(params.CFGScale != null && { CFGScale: params.CFGScale }),
          ...(params.seed != null && { seed: params.seed }),
          ...(params.scheduler != null && { scheduler: params.scheduler }),
          ...(params.seedImage != null && { seedImage: params.seedImage }),
          ...(params.maskImage != null && { maskImage: params.maskImage }),
          ...(params.strength != null && { strength: params.strength }),
          ...(params.inputs != null && { inputs: params.inputs }),
          ...(params.referenceImages != null && {
            referenceImages: params.referenceImages
          })
        }
      ];

      // Submit the image generation task
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

      // Check for error property directly
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
          item.taskType === 'imageInference' && item.taskUUID === taskUUID
      );

      if (taskAck == null) {
        throw new Error('Image generation task was not acknowledged');
      }

      // Poll for the result
      const imageResult = await pollForResult(taskUUID, abortSignal);

      return [imageResult];
    }
  };
}
