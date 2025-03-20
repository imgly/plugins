/**
 * Clamps a value between a minimum and maximum value
 * @param {number} value - The value to clamp
 * @param {number} min - The minimum allowed value
 * @param {number} max - The maximum allowed value
 * @returns {number} The clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
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

