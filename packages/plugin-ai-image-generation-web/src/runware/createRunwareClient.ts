/**
 * Runware HTTP REST API client
 * Uses the REST API instead of the WebSocket SDK
 * API documentation: https://runware.ai/docs/en/getting-started/how-to-connect
 */

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
  imageURL: string;
  imageUUID?: string;
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

export function createRunwareClient(
  proxyUrl: string,
  headers?: Record<string, string>
): RunwareClient {
  return {
    imageInference: async (
      params: RunwareImageInferenceInput,
      abortSignal?: AbortSignal
    ): Promise<RunwareImageResult[]> => {
      const taskUUID = generateUUID();

      // Build the request body as a JSON array with the imageInference task
      const requestBody = [
        {
          taskType: 'imageInference',
          taskUUID,
          model: params.model,
          positivePrompt: params.positivePrompt,
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

      // The response contains a data array with image results
      const data = result.data;
      if (data == null || !Array.isArray(data)) {
        throw new Error(
          'Invalid response from Runware API: missing data array'
        );
      }

      // Filter for imageInference results that match our taskUUID
      const imageResults = data.filter(
        (item: any) =>
          item.taskType === 'imageInference' && item.taskUUID === taskUUID
      ) as RunwareImageResult[];

      if (imageResults.length === 0) {
        // Fallback: if no exact match, try to get any imageInference results
        const anyImageResults = data.filter(
          (item: any) => item.taskType === 'imageInference'
        ) as RunwareImageResult[];

        if (anyImageResults.length > 0) {
          return anyImageResults;
        }

        throw new Error('No image results in Runware API response');
      }

      return imageResults;
    }
  };
}
