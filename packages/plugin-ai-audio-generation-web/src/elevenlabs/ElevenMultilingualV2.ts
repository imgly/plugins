import {
  type Provider,
  type AudioOutput,
  CommonProviderConfiguration
} from '@imgly/plugin-ai-generation-web';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import schema from './ElevenMultilingualV2.json';
import voices from './ElevenMultilingualV2.voices.json';
import {
  clamp,
  getAudioDuration,
  createThumbnailFromAudio,
  truncate
} from './utils';

type ElevenlabsInput = {
  prompt: string;
  voice_id: string;
  speed: number;
};

interface ProviderConfiguration
  extends CommonProviderConfiguration<ElevenlabsInput, AudioOutput> {
  /**
   * Base URL used for the UI assets used in the plugin.
   *
   * By default, we load the assets from the IMG.LY CDN You can copy the assets.
   * from the `/assets` folder to your own server and set the base URL to your server.
   */
  baseURL?: string;
}

export function ElevenMultilingualV2(
  config: ProviderConfiguration
): (context: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<'audio', ElevenlabsInput, AudioOutput>> {
  return async ({ cesdk }: { cesdk: CreativeEditorSDK }) => {
    return getProvider(cesdk, config);
  };
}

function getProvider(
  cesdk: CreativeEditorSDK,
  config: ProviderConfiguration
): Provider<'audio', ElevenlabsInput, AudioOutput> {
  const baseURL =
    config.baseURL ??
    'https://cdn.img.ly/assets/plugins/plugin-ai-audio-generation-web/v1/elevenlabs/';

  const prefix = 'ly.img.ai.audio-generation.speech.elevenlabs';
  const voiceSelectionPanelId = `${prefix}.voiceSelection`;
  const voiceAssetSourceId = createVoicesAssetSource(cesdk, baseURL);
  const modelKey = 'elevenlabs/monolingual/v1';

  cesdk.setTranslations({
    en: {
      [`panel.${modelKey}`]: 'AI Voice',
      [`panel.${voiceSelectionPanelId}`]: 'Select a Voice'
    }
  });

  const provider: Provider<'audio', ElevenlabsInput, AudioOutput> = {
    id: modelKey,
    name: 'Elevenlabs Multilingual V2',
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
        document: schema,
        inputReference: '#/components/schemas/ElevenlabsInput',
        useFlow: 'generation-only',

        renderCustomProperty: {
          voice_id: (context) => {
            const voiceState = context.experimental.global<{
              voiceId: string;
              name: string;
              thumbnail?: string;
            }>('voice', {
              voiceId: 'JBFqnCBsd6RMkjVDRZzb',
              name: 'George',
              thumbnail: `${baseURL}george.webp`
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
      middleware: config.middlewares,
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
          config,
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
          thumbnailUrl
        };
      }
    },
    config
  };

  return provider;
}

// Function to generate speech using ElevenLabs API
export async function generateSpeech(
  text: string,
  voiceId: string,
  options: {
    stability?: number;
    speed?: number;
    similarityBoost?: number;
  },
  config: ProviderConfiguration,
  abortSignal?: AbortSignal
) {
  const url = `${config.proxyUrl}/v1/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    signal: abortSignal,
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      ...(config.headers ?? {})
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
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

function createVoicesAssetSource(
  cesdk: CreativeEditorSDK,
  baseURL: string
): string {
  const { id, assets } = voices;
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
export default getProvider;
