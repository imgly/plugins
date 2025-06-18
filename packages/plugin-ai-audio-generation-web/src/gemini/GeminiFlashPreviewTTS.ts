import CreativeEditorSDK from '@cesdk/cesdk-js';
import { type Provider, type AudioOutput, CommonProviderConfiguration } from '@imgly/plugin-ai-generation-web';
import schema from './GeminiFlashPreviewTTS.json';
import { truncate, createThumbnailFromAudio, getAudioDuration } from '../elevenlabs/utils';
import voices from './GeminiFlashPreviewTTS.voices.json';

export type GeminiTTSInput = {
  prompt: string;
  voice_name: string;
  speed?: number;
};

export interface ProviderConfiguration extends CommonProviderConfiguration<GeminiTTSInput, AudioOutput> {
  apiKey?: string;
  /**
   * Base URL used for the UI assets (voice thumbnails) used in the plugin.
   * When not provided we load the assets from the IMG.LY CDN.
   */
  baseURL?: string;
}

export function GeminiFlashPreviewTTS(config: ProviderConfiguration) {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<'audio', GeminiTTSInput, AudioOutput> {
  const modelKey = 'gemini/2.5-flash-preview-tts';

  // Base URL for thumbnails of the voice samples
  const baseURL =
    config.baseURL ??
    'https://cdn.img.ly/assets/plugins/plugin-ai-audio-generation-web/v1/gemini/';

  // Prefix used for UI translation keys
  const prefix = 'ly.img.ai/audio-generation/speech/gemini';
  const voiceSelectionPanelId = `${prefix}.voiceSelection`;
  const voiceAssetSourceId = createVoicesAssetSource(cesdk, baseURL);

  cesdk.setTranslations({
    en: {
      [`panel.${modelKey}`]: 'AI Voice (Gemini)',
      [`panel.${voiceSelectionPanelId}`]: 'Select a Voice'
    }
  });

  const provider: Provider<'audio', GeminiTTSInput, AudioOutput> = {
    id: modelKey,
    kind: 'audio',
    initialize: async () => {
      // Register asset library entry for voices
      cesdk.ui.addAssetLibraryEntry({
        id: voiceAssetSourceId,
        sourceIds: [voiceAssetSourceId],
        gridColumns: 3
      });

      // Register panel for selecting voices
      cesdk.ui.registerPanel<{
        id: string;
        onSelect: (voiceName: string, name: string, thumbnail?: string) => void;
      }>(voiceSelectionPanelId, ({ builder, payload }) => {
        builder.Library(`${prefix}.voiceSelection.library`, {
          searchable: true,
          entries: [voiceAssetSourceId],
          onSelect: async (entry) => {
            const { id, label } = entry;
            payload?.onSelect(
              id,
              label ?? id,
              entry.meta?.thumbUri as string | undefined
            );
            cesdk.ui.closePanel(voiceSelectionPanelId);
          }
        });
      });
    },
    input: {
      panel: {
        type: 'schema',
        document: schema as any,
        inputReference: '#/components/schemas/GeminiTTSInput',
        userFlow: 'generation-only',
        renderCustomProperty: {
          voice_name: (context) => {
            const voiceState = context.experimental.global<{
              voiceName: string;
              name: string;
              thumbnail?: string;
            }>('voice', {
              voiceName: 'Zephyr',
              name: 'Zephyr',
              thumbnail: `${baseURL}thumbnails/zephyr.webp`
            });

            context.builder.Button(`${prefix}.openVoiceSelection`, {
              inputLabel: 'Voice',
              icon: '@imgly/Appearance',
              trailingIcon: '@imgly/ChevronRight',
              labelAlignment: 'left',
              label: voiceState.value.name,
              onClick: () => {
                cesdk.ui.openPanel(voiceSelectionPanelId, {
                  payload: {
                    id: voiceState.value.voiceName,
                    onSelect: (
                      voiceName: string,
                      name: string,
                      thumbnail?: string
                    ) => {
                      voiceState.setValue({ voiceName, name, thumbnail });
                    }
                  }
                });
              }
            });

            return () => {
              return {
                id: 'voice_name',
                type: 'string',
                value: voiceState.value.voiceName
              };
            };
          }
        },
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
        input: GeminiTTSInput,
        { abortSignal }: { abortSignal?: AbortSignal }
      ) => {
        const audioBlob = await generateSpeech(input, config, abortSignal);

        const audioUrl = URL.createObjectURL(audioBlob);
        const [thumbnailBlob, duration] = await Promise.all([
          createThumbnailFromAudio(audioBlob, { width: 512, height: 128 }),
          getAudioDuration(audioUrl)
        ]);
        const thumbnailUrl = URL.createObjectURL(thumbnailBlob);

        return {
          kind: 'audio',
          url: audioUrl,
          duration,
          thumbnailUrl
        };
      }
    }
  };

  return provider;
}

async function generateSpeech(
  input: GeminiTTSInput,
  config: ProviderConfiguration,
  abortSignal?: AbortSignal
): Promise<Blob> {
  const model = 'gemini-2.5-flash-preview-tts';
  let url = `${config.proxyUrl}/models/${model}:generateContent`;
  if (config.apiKey) {
    url += `?key=${config.apiKey}`;
  }

  const body = {
    model,
    contents: [
      {
        parts: [{ text: input.prompt }]
      }
    ],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: input.voice_name
          }
        }
      }
    }
  } as any;

  const response = await fetch(url, {
    method: 'POST',
    signal: abortSignal,
    headers: {
      'Content-Type': 'application/json',
      ...(config.headers ?? {})
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini TTS API error: ${response.status} – ${errorText}`);
  }

  const json = await response.json();

  const parts: any[] | undefined = json?.candidates?.[0]?.content?.parts;
  const inlinePart = parts?.find((p) => p.inlineData || p.inline_data);
  const inlineData = inlinePart?.inlineData ?? inlinePart?.inline_data;

  if (!inlineData?.data) {
    const finishReason = json?.candidates?.[0]?.finishReason ?? 'unknown';
    throw new Error(
      `Gemini TTS: Missing audio data in response (finishReason=${finishReason})`
    );
  }

  const base64Data: string = inlineData.data;

  const mimeType: string = inlineData?.mimeType ?? 'audio/wav';
  const audioBuffer = base64ToArrayBuffer(base64Data);

  if (mimeType.includes('wav')) {
    return new Blob([audioBuffer], { type: mimeType });
  }

  if (mimeType.includes('pcm')) {
    return pcmToWav(audioBuffer, {
      channels: 1,
      sampleRate: 24000,
      bytesPerSample: 2
    });
  }

  return new Blob([audioBuffer], { type: mimeType });
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function pcmToWav(
  pcmData: ArrayBuffer,
  options: { channels: number; sampleRate: number; bytesPerSample: number }
): Blob {
  const { channels, sampleRate, bytesPerSample } = options;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const wavBuffer = new ArrayBuffer(44 + pcmData.byteLength);
  const view = new DataView(wavBuffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmData.byteLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(view, 36, 'data');
  view.setUint32(40, pcmData.byteLength, true);

  new Uint8Array(wavBuffer, 44).set(new Uint8Array(pcmData));

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function createVoicesAssetSource(
  cesdk: CreativeEditorSDK,
  baseURL: string
): string {
  const { id, assets } = voices as unknown as {
    id: string;
    assets: any[];
  };

  cesdk.engine.asset.addLocalSource(id);

  assets.map(async (asset) => {
    cesdk.engine.asset.addAssetToSource(id, {
      ...asset,
      meta: {
        ...asset.meta,
        thumbUri: asset.meta.thumbUri.replace(
          '{{base_url}}',
          `${baseURL}thumbnails/`
        )
      }
    });
  });

  return id;
}