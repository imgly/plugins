// EachLabs API client for image generation

/**
 * Parameters for EachLabs image inference
 */
export interface EachLabsImageInferenceParams {
  /** Model slug (e.g., 'nano-banana-pro') */
  model: string;
  /** Model version */
  version: string;
  /** Input parameters for the model */
  input: Record<string, unknown>;
}

/**
 * EachLabs prediction status
 */
type PredictionStatus =
  | 'success'
  | 'processing'
  | 'starting'
  | 'failed'
  | 'cancelled';

/**
 * EachLabs prediction response (from GET /v1/prediction/{id})
 * Output can be: string (single URL), array (multiple URLs), or object
 */
interface PredictionResponse {
  id: string;
  status: PredictionStatus;
  input?: Record<string, unknown>;
  output?: string | string[] | Record<string, unknown>;
  error?: string;
  logs?: string | null;
  metrics?: {
    predict_time?: number;
    cost?: number;
  };
  urls?: {
    cancel?: string;
    get?: string;
  };
}

/**
 * Result from EachLabs image inference
 */
export interface EachLabsImageResult {
  imageURL: string;
}

/**
 * Upload response from EachLabs storage API
 */
interface UploadResponse {
  url: string;
}

/**
 * EachLabs storage interface for file uploads
 */
export interface EachLabsStorage {
  /**
   * Upload a file to EachLabs storage
   * @param file - The file to upload
   * @returns The URL of the uploaded file
   */
  upload: (file: File) => Promise<string>;
}

/**
 * EachLabs API client interface
 */
export interface EachLabsClient {
  imageInference: (
    params: EachLabsImageInferenceParams,
    abortSignal?: AbortSignal
  ) => Promise<EachLabsImageResult[]>;
  /**
   * Storage API for uploading files
   */
  storage: EachLabsStorage;
}

/**
 * Poll interval in milliseconds
 */
const POLL_INTERVAL = 2000;

/**
 * Maximum poll attempts (5 minutes total with 2s interval)
 */
const MAX_POLL_ATTEMPTS = 150;

/**
 * Creates an EachLabs API client
 *
 * @param proxyUrl - The proxy URL to use for API requests
 * @param headers - Optional additional headers
 * @returns EachLabs client instance
 */
export function createEachLabsClient(
  proxyUrl: string,
  headers?: Record<string, string>
): EachLabsClient {
  const baseHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  /**
   * Create a prediction
   */
  async function createPrediction(
    params: EachLabsImageInferenceParams,
    abortSignal?: AbortSignal
  ): Promise<string> {
    const response = await fetch(`${proxyUrl}/v1/prediction`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({
        model: params.model,
        version: params.version,
        input: params.input
      }),
      signal: abortSignal
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`EachLabs API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as { predictionID?: string };
    if (!data.predictionID) {
      throw new Error('EachLabs API did not return a prediction ID');
    }

    return data.predictionID;
  }

  /**
   * Get prediction status
   */
  async function getPrediction(
    predictionId: string,
    abortSignal?: AbortSignal
  ): Promise<PredictionResponse> {
    const response = await fetch(`${proxyUrl}/v1/prediction/${predictionId}`, {
      method: 'GET',
      headers: baseHeaders,
      signal: abortSignal
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`EachLabs API error: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<PredictionResponse>;
  }

  /**
   * Poll for prediction completion
   */
  async function pollPrediction(
    predictionId: string,
    abortSignal?: AbortSignal
  ): Promise<PredictionResponse> {
    let attempts = 0;

    // eslint-disable-next-line no-await-in-loop -- Polling requires sequential awaits
    while (attempts < MAX_POLL_ATTEMPTS) {
      if (abortSignal?.aborted) {
        throw new Error('Request aborted');
      }

      // eslint-disable-next-line no-await-in-loop -- Polling requires sequential awaits
      const prediction = await getPrediction(predictionId, abortSignal);

      if (prediction.status === 'success') {
        return prediction;
      }

      if (prediction.status === 'failed') {
        throw new Error(prediction.error ?? 'Prediction failed');
      }

      if (prediction.status === 'cancelled') {
        throw new Error('Prediction was cancelled');
      }

      // Wait before polling again
      // eslint-disable-next-line no-await-in-loop -- Polling requires sequential awaits
      await new Promise((resolve) => {
        setTimeout(resolve, POLL_INTERVAL);
      });
      attempts++;
    }

    throw new Error('Prediction timed out');
  }

  /**
   * Extract image URLs from prediction output
   * Output can be: string (single URL), array (multiple URLs), or object with image keys
   */
  function extractImageUrls(output: PredictionResponse['output']): string[] {
    if (!output) {
      return [];
    }

    // Output is a single URL string
    if (typeof output === 'string') {
      if (output.startsWith('http')) {
        return [output];
      }
      return [];
    }

    // Output is an array of URLs
    if (Array.isArray(output)) {
      return output.filter(
        (item): item is string =>
          typeof item === 'string' && item.startsWith('http')
      );
    }

    // Output is an object - check common keys
    const obj = output as Record<string, unknown>;

    // Try images array first
    if (Array.isArray(obj.images) && obj.images.length > 0) {
      return obj.images.filter(
        (item): item is string =>
          typeof item === 'string' && item.startsWith('http')
      );
    }

    // Try single image
    if (typeof obj.image === 'string' && obj.image.startsWith('http')) {
      return [obj.image];
    }

    // Check for other common output formats
    const possibleKeys = ['url', 'image_url', 'result', 'output'];
    for (const key of possibleKeys) {
      const value = obj[key];
      if (typeof value === 'string' && value.startsWith('http')) {
        return [value];
      }
      if (Array.isArray(value)) {
        const urls = value.filter(
          (v): v is string => typeof v === 'string' && v.startsWith('http')
        );
        if (urls.length > 0) {
          return urls;
        }
      }
    }

    return [];
  }

  /**
   * Upload a file to EachLabs storage
   */
  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    // Use the storage upload endpoint via proxy
    const uploadUrl = `${proxyUrl}/api/v1/upload`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        // Don't set Content-Type header - let the browser set it with the boundary
        ...Object.fromEntries(
          Object.entries(baseHeaders).filter(
            ([key]) => key.toLowerCase() !== 'content-type'
          )
        )
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `EachLabs storage upload error: ${response.status} - ${errorText}`
      );
    }

    const data = (await response.json()) as UploadResponse;
    if (!data.url) {
      throw new Error('EachLabs storage did not return a URL');
    }

    return data.url;
  }

  return {
    storage: {
      upload: uploadFile
    },
    imageInference: async (
      params: EachLabsImageInferenceParams,
      abortSignal?: AbortSignal
    ): Promise<EachLabsImageResult[]> => {
      // Create prediction
      const predictionId = await createPrediction(params, abortSignal);

      // Poll for completion
      const prediction = await pollPrediction(predictionId, abortSignal);

      // Extract image URLs
      const imageUrls = extractImageUrls(prediction.output);

      if (imageUrls.length === 0) {
        // eslint-disable-next-line no-console
        console.error('EachLabs response:', prediction);
        throw new Error('No images found in EachLabs response');
      }

      return imageUrls.map((url) => ({ imageURL: url }));
    }
  };
}
