// Function to generate speech using ElevenLabs API
export async function generateSpeech(
  text: string,
  voiceId: string = 'bIHbv24MWmeRgasZH58o',
  options?: {
    stability?: number;
    speed?: number;
    similarityBoost?: number;
  }
) {
  const url = `https://proxy.img.ly/api/proxy/elevenlabs/v1/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        speed: clamp(options?.speed || 1, 0.7, 1.2),
        stability: options?.stability || 0.5,
        similarity_boost: options?.similarityBoost || 0.5
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`API error: ${response.status} - ${errorData}`);
  }

  return response.blob();
}

/**
 * Returns the duration of an audio blob in seconds
 * @param audioBlob - The audio blob to get the duration from
 * @returns A promise that resolves to the duration in seconds
 */
export async function getAudioDuration(audioUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    // Create an audio element
    const audio = new Audio();

    // Set the audio source to the blob URL
    audio.src = audioUrl;

    // Listen for the metadata to load
    audio.addEventListener('loadedmetadata', () => {
      // Get the duration
      const duration = audio.duration;

      // Revoke the URL to free memory

      // Resolve with the duration
      resolve(duration);
    });

    // Handle errors
    audio.addEventListener('error', (error) => {
      // Revoke the URL to free memory

      // Reject with the error
      reject(new Error(`Failed to load audio metadata: ${error.message}`));
    });
  });
}

/**
 * Clamps a value between a minimum and maximum value
 * @param {number} value - The value to clamp
 * @param {number} min - The minimum allowed value
 * @param {number} max - The maximum allowed value
 * @returns {number} The clamped value
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Smartly truncates text to a specified length while preserving word boundaries
 * and adding an ellipsis to indicate truncation.
 *
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length of the truncated text (including ellipsis)
 * @param {Object} options - Optional configuration
 * @param {string} options.ellipsis - The ellipsis string (default: '...')
 * @param {boolean} options.preserveSentences - Try to truncate at sentence boundaries (default: false)
 * @param {number} options.minLength - Minimum length before truncation (default: 0)
 * @return {string} The truncated text with ellipsis if truncated
 */
export function truncate(
  text: string,
  maxLength: number,
  options: {
    ellipsis?: string;
    preserveSentences?: boolean;
    minLength?: number;
  } = {}
): string {
  // Default options
  const {
    ellipsis = '...',
    preserveSentences = false,
    minLength = 0
  } = options;

  // Return original text if it's shorter than minLength or maxLength
  if (!text || text.length <= minLength || text.length <= maxLength) {
    return text;
  }

  // Calculate maximum content length (accounting for ellipsis)
  const maxContentLength = maxLength - ellipsis.length;

  // If preserving sentences is enabled, try to find a sentence boundary
  if (preserveSentences) {
    // Common sentence ending patterns
    const sentenceEndings = /[.!?](?:\s|$)/g;
    let match;
    let lastValidEnd = 0;

    // Find the last sentence ending within maxContentLength
    while ((match = sentenceEndings.exec(text)) !== null) {
      if (match.index > maxContentLength) break;
      lastValidEnd = match.index + 1; // Include the punctuation
    }

    // If we found a sentence ending, use it
    if (lastValidEnd > 0) {
      return text.substring(0, lastValidEnd) + ellipsis;
    }
  }

  // Otherwise, truncate at word boundary
  let truncatedText = text.substring(0, maxContentLength);

  // Find the last space to avoid cutting words in half
  const lastSpace = truncatedText.lastIndexOf(' ');

  if (lastSpace > 0) {
    truncatedText = truncatedText.substring(0, lastSpace);
  }

  return truncatedText + ellipsis;
}
