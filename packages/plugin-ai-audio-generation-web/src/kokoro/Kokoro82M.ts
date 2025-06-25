import {
  type Provider,
  type AudioOutput,
  CommonProviderConfiguration
} from '@imgly/plugin-ai-generation-web';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import schema from './Kokoro82M.json';

type KokoroInput = {
  prompt: string;
  voice: string;
  speed: number;
};

interface ProviderConfiguration
  extends Omit<CommonProviderConfiguration<KokoroInput, AudioOutput>, 'proxyUrl'> {
  /**
   * Base URL used for the UI assets used in the plugin.
   *
   * By default, we load the assets from the IMG.LY CDN You can copy the assets.
   * from the `/assets` folder to your own server and set the base URL to your server.
   */
  baseURL?: string;
}

let cachedTTS: any = null;

export function Kokoro82M(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'audio', KokoroInput, AudioOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<'audio', KokoroInput, AudioOutput> {
  const modelKey = 'kokoro/82m/v1';

  cesdk.setTranslations({
    en: {
      [`panel.${modelKey}`]: 'Kokoro TTS'
    }
  });

  const provider: Provider<'audio', KokoroInput, AudioOutput> = {
    id: modelKey,
    kind: 'audio',
    initialize: async () => {
      // Initialize the Kokoro TTS if not already cached
      if (!cachedTTS) {
        try {
          // Dynamic import to avoid build issues
          // @ts-ignore
          const { KokoroTTS } = await import('kokoro-js');
          cachedTTS = await KokoroTTS.from_pretrained(
            'onnx-community/Kokoro-82M-v1.0-ONNX',
            {
              dtype: 'q8', // Optimized for performance
              device: 'wasm' // Browser compatibility
            }
          );
        } catch (error) {
          console.error('Failed to initialize Kokoro TTS:', error);
          throw error;
        }
      }
    },
    input: {
      panel: {
        type: 'schema',
        // @ts-ignore
        document: schema,
        inputReference: '#/components/schemas/KokoroInput',
        useFlow: 'generation-only',



        getBlockInput: async (input) => {
          return {
            audio: {
              label: truncate(input.prompt, 25)
            }
          };
        }
      }
    },
    output: {
      abortable: true,
      history: '@imgly/indexedDB',
      middleware: config.middleware,
      generate: async (
        input: KokoroInput,
        { abortSignal }: { abortSignal?: AbortSignal }
      ) => {
        if (!cachedTTS) {
          throw new Error('Kokoro TTS not initialized');
        }

        try {
          const audioResult = await generateSpeech(
            input.prompt,
            input.voice,
            cachedTTS,
            abortSignal
          );

          // Convert audio data to proper WAV format
          const audioBlob = createWavBlob(audioResult.audio, audioResult.sampling_rate);
          const audioUrl = URL.createObjectURL(audioBlob);

          // Create a simple waveform thumbnail
          const thumbnailBlob = await createSimpleThumbnail();
          const thumbnailUrl = URL.createObjectURL(thumbnailBlob);

          // Calculate duration based on sampling rate
          const duration = audioResult.audio.length / audioResult.sampling_rate;

          return {
            kind: 'audio',
            url: audioUrl,
            duration,
            thumbnailUrl
          };
        } catch (error) {
          console.error('Kokoro generation failed:', error);
          throw error;
        }
      }
    },
    config
  };

  return provider;
}

async function generateSpeech(
  text: string,
  voice: string,
  tts: any,
  abortSignal?: AbortSignal
): Promise<{ audio: Float32Array; sampling_rate: number }> {
  if (abortSignal?.aborted) {
    throw new Error('Generation aborted');
  }

  // Generate speech using the Kokoro TTS
  const result = await tts.generate(text, { voice });
  
  if (abortSignal?.aborted) {
    throw new Error('Generation aborted');
  }

  return result;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

function createWavBlob(audioData: Float32Array, sampleRate: number): Blob {
  // Convert Float32Array to 16-bit PCM
  const length = audioData.length;
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');                   // ChunkID
  view.setUint32(4, 36 + length * 2, true); // ChunkSize
  writeString(8, 'WAVE');                   // Format
  writeString(12, 'fmt ');                  // Subchunk1ID
  view.setUint32(16, 16, true);            // Subchunk1Size
  view.setUint16(20, 1, true);             // AudioFormat (PCM)
  view.setUint16(22, 1, true);             // NumChannels (mono)
  view.setUint32(24, sampleRate, true);    // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true);             // BlockAlign
  view.setUint16(34, 16, true);            // BitsPerSample
  writeString(36, 'data');                 // Subchunk2ID
  view.setUint32(40, length * 2, true);    // Subchunk2Size

  // Convert Float32 to Int16 and write to buffer
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i])); // Clamp to [-1, 1]
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

async function createSimpleThumbnail(): Promise<Blob> {
  // Create a simple canvas-based waveform thumbnail
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  
  // Dark background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw a simple waveform pattern
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  const centerY = canvas.height / 2;
  const segments = 100;
  const segmentWidth = canvas.width / segments;
  
  for (let i = 0; i < segments; i++) {
    const x = i * segmentWidth;
    const amplitude = Math.sin(i * 0.3) * Math.random() * 30 + 10;
    const y1 = centerY - amplitude;
    const y2 = centerY + amplitude;
    
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
  }
  
  ctx.stroke();
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png');
  });
} 