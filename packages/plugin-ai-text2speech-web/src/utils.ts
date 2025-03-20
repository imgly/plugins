const DEFAULT_OPTIONS = {
  width: 256,
  height: 256,
  backgroundColor: 'transparent',
  waveformColor: 'black',
  pixelsPerSecond: 100
};

export async function createThumbnailFromAudio(
  audio: Blob,
  options: Partial<typeof DEFAULT_OPTIONS> = {}
): Promise<Blob> {
  const { width, height, backgroundColor, waveformColor, pixelsPerSecond } = {
    ...DEFAULT_OPTIONS,
    ...options
  };

  // Create an AudioContext to decode the audio
  const audioContext = new AudioContext();
  const data = await audio.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(data);

  // Calculate effective width of the waveform
  const totalDuration = audioBuffer.duration;
  const effectiveWidth = Math.max(
    width,
    Math.ceil(totalDuration * pixelsPerSecond)
  );
  const sampleRate = audioBuffer.sampleRate;
  const samplesPerPixel = (sampleRate * totalDuration) / effectiveWidth;

  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = width; // Use the provided width for the canvas
  canvas.height = height;
  const context = canvas.getContext('2d')!;

  // Draw background
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, width, height);

  // Draw the waveform
  const dataArray = audioBuffer.getChannelData(0); // Use the first channel
  const amp = height / 2;
  const numSamples = audioBuffer.length;

  context.strokeStyle = waveformColor;
  context.beginPath();
  context.moveTo(0, amp);

  for (let i = 0; i < width; i++) {
    let min = 1.0;
    let max = -1.0;
    for (let j = 0; j < samplesPerPixel; j++) {
      const index = Math.floor(i * samplesPerPixel + j);
      if (index < numSamples) {
        const datum = dataArray[index];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
    }
    const yLow = amp - min * amp;
    const yHigh = amp - max * amp;
    context.lineTo(i, yHigh);
    context.lineTo(i, yLow);
  }

  context.stroke();

  // Convert canvas to a blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas to Blob conversion failed'));
      }
    });
  });
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
    // eslint-disable-next-line no-cond-assign
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

