import {
  type Provider,
  type AudioOutput,
  CommonProviderConfiguration
} from '@imgly/plugin-ai-generation-web';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import schema from './ElevenSoundEffects.json';
import { getAudioDuration, createThumbnailFromAudio, truncate } from './utils';

type ElevenlabsInput = {
  text: string;
  duration_seconds: number;
};

interface ProviderConfiguration
  extends CommonProviderConfiguration<ElevenlabsInput, AudioOutput> {}

export function ElevenSoundEffects(
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
  const modelKey = 'elevenlabs/sound-generation';

  cesdk.setTranslations({
    en: {
      [`panel.${modelKey}`]: 'Generate Sound'
    }
  });

  const provider: Provider<'audio', ElevenlabsInput, AudioOutput> = {
    id: modelKey,
    kind: 'audio',
    initialize: async () => {},
    input: {
      panel: {
        type: 'schema',
        // @ts-ignore
        document: schema,
        inputReference: '#/components/schemas/TextToSoundInput',
        useFlow: 'generation-only',

        getBlockInput: async (input) => {
          // Thumbnail and duration needs to be determined from the
          // audio output.
          return {
            audio: {
              label: truncate(input.text, 25)
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
        const audioBlob = await generateSound(
          input.text,
          input.duration_seconds,
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
export async function generateSound(
  text: string,
  duration: number | null,
  config: ProviderConfiguration,
  abortSignal?: AbortSignal
) {
  const url = `${config.proxyUrl}/v1/sound-generation`;

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
      duration_seconds: duration
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`API error: ${response.status} - ${errorData}`);
  }

  return response.blob();
}

export default getProvider;
