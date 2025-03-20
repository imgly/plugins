import { type Provider } from '@imgly/plugin-utils-ai-generation';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import createVoicesAssetSource from './createVoicesAssetSource';
import { PluginConfiguration } from '../../types';
import { type AudioOutput } from '@imgly/plugin-utils-ai-generation';
import elevenlabs from './elevenlabs.json';
import { clamp, getAudioDuration } from './utils';
import { createThumbnailFromAudio, truncate } from '../../utils';

type ElevenlabsInput = {
  prompt: string;
  voice_id: string;
  speed: number;
};

function getProvider(
  cesdk: CreativeEditorSDK,
  config: PluginConfiguration
): Provider<'audio', ElevenlabsInput, AudioOutput> {
  const prefix = 'ly.img.ai.text2speech.elevenlabs';
  const voiceSelectionPanelId = `${prefix}.voiceSelection`;
  const voiceAssetSourceId = createVoicesAssetSource(cesdk);

  cesdk.setTranslations({
    en: {
      'panel.elevenlabs': 'Generate Speech',
      [`panel.${voiceSelectionPanelId}`]: 'Select a Voice'
    }
  });

  const provider: Provider<'audio', ElevenlabsInput, AudioOutput> = {
    id: 'elevenlabs',
    kind: 'audio',
    initialize: async () => {
      cesdk.ui.addAssetLibraryEntry({
        id: voiceAssetSourceId,
        sourceIds: [voiceAssetSourceId],
        gridColumns: 3
      });

      cesdk.ui.registerPanel<{
        id: string;
        onSelect: (voiceId: string, name: string, thumbnail?: string) => void;
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
        // @ts-ignore
        document: elevenlabs,
        inputReference: '#/components/schemas/ElevenlabsInput',
        useFlow: 'generation-only',

        renderCustomProperty: {
          voice_id: (context, property) => {
            const voiceState = context.experimental.global<{
              voiceId: string;
              name: string;
              thumbnail?: string;
            }>('voice', {
              voiceId: 'JBFqnCBsd6RMkjVDRZzb',
              name: 'George',
              thumbnail: 'https://ubique.img.ly/static/voices/george.webp'
            });

            // TODO: Render voice asset source selection
            context.builder.Button(`${prefix}.openVoiceSelection`, {
              inputLabel: 'Voice',
              icon: '@imgly/Appearance',
              trailingIcon: '@imgly/ChevronRight',
              labelAlignment: 'left',
              label: voiceState.value.name,
              onClick: () => {
                cesdk.ui.openPanel(voiceSelectionPanelId, {
                  payload: {
                    id: voiceState.value.voiceId,
                    onSelect: (
                      voiceId: string,
                      name: string,
                      thumbnail?: string
                    ) => {
                      voiceState.setValue({ voiceId, name, thumbnail });
                    }
                  }
                });
              }
            });

            return () => {
              return {
                id: 'voice_id',
                type: 'string',
                value: voiceState.value.voiceId
              };
            };
          }
        },

        getBlockInput: async (input) => {
          // Thumbnail and duration needs to be determined from the
          // audio output.
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
      generate: async (
        input: ElevenlabsInput,
        { abortSignal }: { abortSignal?: AbortSignal }
      ) => {
        const audioBlob = await generateSpeech(
          input.prompt,
          input.voice_id,
          {
            speed: parseFloat(input.speed.toFixed(10))
          },
          abortSignal
        );

        // TODO: Use upload!
        const audioUrl = URL.createObjectURL(audioBlob);

        const [thumbnailBlob, audioDuration] = await Promise.all([
          createThumbnailFromAudio(audioBlob, { width: 512, height: 128 }),
          getAudioDuration(audioUrl)
        ]);

        const thumbnailUrl = URL.createObjectURL(thumbnailBlob);

        return {
          kind: 'audio',
          url: audioUrl,
          duration: audioDuration,
          thumbnailUrl,
        };
      }
    }
  };

  return provider;
}

// Function to generate speech using ElevenLabs API
export async function generateSpeech(
  text: string,
  voiceId: string = 'bIHbv24MWmeRgasZH58o',
  options?: {
    modelId?: string;
    stability?: number;
    speed?: number;
    similarityBoost?: number;
  },
  abortSignal?: AbortSignal
) {
  const url = `https://proxy.img.ly/api/proxy/elevenlabs/v1/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    signal: abortSignal,
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      model_id: options?.modelId ?? 'eleven_monolingual_v1',
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

export default getProvider;
