/* eslint-disable no-console */
import { getImageDimensionsFromURL, getImageUri } from '@imgly/plugin-utils';
import {
  type Output,
  type OutputKind,
  type GetBlockInputResult,
  VideoOutput,
  ImageOutput,
  TextOutput,
  AudioOutput,
  GenerationOptions,
  GenerationResult
} from '../core/provider';
import { Middleware } from './middleware';

interface DryRunOptions<K extends OutputKind> {
  enable?: boolean;
  kind: K;

  // Is only defined with generation from a panel where we create a complete new block
  blockInputs?: GetBlockInputResult<K>;

  // Is only defined with quick action generation on a given block(s).
  blockIds?: number[];
}

function dryRunMiddleware<I, K extends OutputKind, O extends Output>(
  options: DryRunOptions<K>
) {
  const middleware: Middleware<I, O> = async (
    generationInput,
    generationOptions,
    next
  ) => {
    if (!options.enable) {
      return next(generationInput, generationOptions);
    }
    console.log(
      `[DRY RUN]: Requesting dummy AI generation for kind '${options.kind}' with inputs: `,
      JSON.stringify(generationInput, undefined, 2)
    );
    await wait(2000);
    const output = await getDryRunOutput(
      generationInput,
      options,
      generationOptions
    );
    return output as O;
  };

  return middleware;
}

async function getDryRunOutput<K extends OutputKind, I>(
  generationInput: I,
  options: DryRunOptions<K>,
  generationOptions: GenerationOptions
): Promise<GenerationResult<Output>> {
  switch (options.kind) {
    case 'image': {
      return getImageDryRunOutput(
        generationInput,
        options as DryRunOptions<'image'>,
        generationOptions
      );
    }
    case 'video': {
      return getVideoDryRunOutput(
        generationInput,
        options as DryRunOptions<'video'>,
        generationOptions
      );
    }
    case 'text': {
      return getTextDryRunOutput(
        generationInput,
        options as DryRunOptions<'text'>,
        generationOptions
      );
    }
    case 'audio': {
      return getAudioDryRunOutput(
        generationInput,
        options as DryRunOptions<'audio'>,
        generationOptions
      );
    }

    default: {
      throw new Error(
        `Unsupported output kind for creating dry run output: ${options.kind}`
      );
    }
  }
}

async function getImageDryRunOutput<I>(
  generationInput: I,
  options: DryRunOptions<'image'>,
  { engine }: GenerationOptions
): Promise<ImageOutput> {
  let width;
  let height;

  const prompt: string =
    generationInput != null &&
    typeof generationInput === 'object' &&
    'prompt' in generationInput &&
    typeof generationInput.prompt === 'string'
      ? generationInput.prompt
      : 'AI Generated Image';

  // If prompt includes something that looks like a dimension
  // e.g. 512x512, 1024x768, etc. than we will use this as the
  // output image size for testing purposes.
  const promptDimension = prompt.match(/(\d+)x(\d+)/);
  if (promptDimension != null) {
    width = parseInt(promptDimension[1], 10);
    height = parseInt(promptDimension[2], 10);
  } else {
    if (options.blockInputs != null) {
      width = options.blockInputs.image.width;
      height = options.blockInputs.image.height;
    }
    if (
      options.blockIds != null &&
      Array.isArray(options.blockIds) &&
      options.blockIds.length > 0
    ) {
      const [blockId] = options.blockIds;
      const url = await getImageUri(blockId, engine);
      const dimension = await getImageDimensionsFromURL(url, engine);
      width = dimension.width;
      height = dimension.height;
    } else {
      width = 512;
      height = 512;
    }
  }

  const url = `https://placehold.co/${width}x${height}/000000/FFF?text=${prompt
    .replace(' ', '+')
    .replace('\n', '+')}`;

  return {
    kind: 'image',
    url
  };
}

async function getVideoDryRunOutput<I>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _generationInput: I,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: DryRunOptions<'video'>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _generationOptions: GenerationOptions
): Promise<VideoOutput> {
  return Promise.resolve({
    kind: 'video',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  });
}

async function getTextDryRunOutput<I>(
  generationInput: I,
  options: DryRunOptions<'text'>,
  generationOptions: GenerationOptions
): Promise<AsyncGenerator<TextOutput>> {
  // Extract original text from the blocks or prompt
  let originalText = '';

  // Try to get original text from blocks first
  if (options.blockIds && options.blockIds.length > 0) {
    const [blockId] = options.blockIds;
    if (generationOptions.engine.block.isValid(blockId)) {
      originalText = generationOptions.engine.block.getString(
        blockId,
        'text/text'
      );
    }
  }

  // If no original text from blocks, try to extract from prompt
  if (!originalText) {
    if (
      generationInput != null &&
      typeof generationInput === 'object' &&
      'prompt' in generationInput &&
      typeof generationInput.prompt === 'string'
    ) {
      // Try to extract original text from prompt patterns
      const promptStr = generationInput.prompt;
      const textMatch =
        promptStr.match(/text:\s*"([^"]+)"/i) ||
        promptStr.match(/content:\s*"([^"]+)"/i) ||
        promptStr.match(/"([^"]+)"/);
      if (textMatch && textMatch[1]) {
        originalText = textMatch[1];
      }
    }
  }

  // Generate dummy text with similar length
  const targetLength = originalText.length || 50; // Default to 50 chars if no original text
  let dryRunText = '';

  // Analyze input for specific text generation types and create appropriate dummy text
  if (generationInput != null && typeof generationInput === 'object') {
    if (
      'language' in generationInput &&
      typeof generationInput.language === 'string'
    ) {
      dryRunText = generateDummyText(targetLength, 'translation');
    } else if (
      'type' in generationInput &&
      typeof generationInput.type === 'string'
    ) {
      const tone = generationInput.type;
      dryRunText = generateDummyText(targetLength, tone);
    } else if ('customPrompt' in generationInput) {
      dryRunText = generateDummyText(targetLength, 'custom');
    } else {
      dryRunText = generateDummyText(targetLength, 'improved');
    }
  } else {
    dryRunText = generateDummyText(targetLength, 'generated');
  }

  // Return an async generator that streams the text in chunks
  return createStreamingTextGenerator(
    dryRunText,
    generationOptions.abortSignal
  );
}

async function* createStreamingTextGenerator(
  finalText: string,
  abortSignal?: AbortSignal
): AsyncGenerator<TextOutput> {
  const chunkSize = Math.max(1, Math.ceil(finalText.length / 20)); // Split into ~20 chunks

  // Generate and yield text progressively
  let currentLength = 0;

  while (currentLength < finalText.length) {
    if (abortSignal?.aborted) {
      return;
    }

    // Calculate next chunk end
    const nextLength = Math.min(currentLength + chunkSize, finalText.length);
    const currentText = finalText.substring(0, nextLength);

    yield {
      kind: 'text',
      text: currentText
    };

    currentLength = nextLength;

    // Only add delay if there are more chunks to come
    if (currentLength < finalText.length) {
      // eslint-disable-next-line no-await-in-loop
      await wait(100);
    }
  }

  // Return the final complete text
  return {
    kind: 'text',
    text: finalText
  };
}

function generateDummyText(targetLength: number, style: string): string {
  const prefix = '[DRY RUN - Dummy Text] ';
  const prefixLength = prefix.length;

  // If target length is shorter than the prefix, just return truncated prefix
  if (targetLength <= prefixLength) {
    return prefix.substring(0, targetLength);
  }

  const remainingLength = targetLength - prefixLength;

  const baseTexts = {
    translation:
      'Ceci est un texte fictif traduit qui maintient la longueur approximative.',
    professional:
      'Enhanced professional content with improved clarity and structure.',
    casual: 'Relaxed, friendly text that keeps things simple and approachable.',
    formal: 'Refined formal documentation that preserves original structure.',
    humorous: 'Amusing content that brings lighthearted fun to the text.',
    improved: 'Enhanced text that demonstrates better clarity and readability.',
    custom: 'Customized content reflecting the requested modifications.',
    generated: 'AI-generated content maintaining original length and structure.'
  };

  const baseText =
    baseTexts[style as keyof typeof baseTexts] || baseTexts.generated;

  let contentText = '';
  if (remainingLength <= baseText.length) {
    contentText = baseText.substring(0, remainingLength);
  } else {
    // For longer text, repeat and vary the content
    contentText = baseText;
    const variations = [
      ' Additional content continues with similar phrasing.',
      ' Further elaboration maintains the established tone.',
      ' Extended content preserves the original style.',
      ' Continued text follows the same pattern.'
    ];

    let variationIndex = 0;
    while (contentText.length < remainingLength) {
      const nextVariation = variations[variationIndex % variations.length];
      if (contentText.length + nextVariation.length <= remainingLength) {
        contentText += nextVariation;
      } else {
        contentText += nextVariation.substring(
          0,
          remainingLength - contentText.length
        );
        break;
      }
      variationIndex++;
    }
  }

  return prefix + contentText;
}

async function getAudioDryRunOutput<I>(
  generationInput: I,
  options: DryRunOptions<'audio'>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generationOptions: GenerationOptions
): Promise<AudioOutput> {
  // Extract duration from generation input or use default
  let duration = 3; // Default to 3 seconds

  // Try to extract duration from input
  if (generationInput != null && typeof generationInput === 'object') {
    if (
      'duration' in generationInput &&
      typeof generationInput.duration === 'number'
    ) {
      duration = generationInput.duration;
    } else if (
      'prompt' in generationInput &&
      typeof generationInput.prompt === 'string'
    ) {
      // Try to extract duration from prompt (e.g., "5 seconds", "10s", etc.)
      const promptStr = generationInput.prompt;
      const durationMatch = promptStr.match(/(\d+)\s*(?:seconds?|secs?|s)\b/i);
      if (durationMatch) {
        duration = parseInt(durationMatch[1], 10);
      }
    }
  }

  // Try to get duration from block inputs
  if (options.blockInputs?.audio?.duration) {
    duration = options.blockInputs.audio.duration;
  }

  // Generate tone audio data
  const audioUrl = generateTone(220, duration); // 220Hz tone (A3 - deeper, more pleasant)

  return {
    kind: 'audio',
    url: audioUrl,
    duration,
    thumbnailUrl: undefined
  };
}

function generateTone(frequency: number, duration: number): string {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * duration);

  // Generate sine wave PCM data
  const pcmData = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    pcmData[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  }

  return createWAVDataURI(pcmData, sampleRate);
}

function createWAVDataURI(pcmData: Float32Array, sampleRate: number): string {
  const numSamples = pcmData.length;
  const bytesPerSample = 2; // 16-bit
  const numChannels = 1; // Mono
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * bytesPerSample;
  const fileSize = 44 + dataSize; // 44 bytes for WAV header

  // Create WAV file buffer
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, fileSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // Bits per sample
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Convert float32 PCM to int16 and write to buffer
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.max(-1, Math.min(1, pcmData[i]));
    const intSample = Math.round(sample * 32767);
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  // Convert to base64
  const uint8Array = new Uint8Array(buffer);
  let binaryString = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }
  const base64 = btoa(binaryString);

  return `data:audio/wav;base64,${base64}`;
}

async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default dryRunMiddleware;
