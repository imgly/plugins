import { CreativeEngine } from '@cesdk/cesdk-js';
import { SoundstripeSingleAssetResponse, SoundstripeAudioFile } from './types';

interface RefreshAudioConfig {
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Refreshes expired Soundstripe audio URIs in the current scene
 * @param engine - The CESDK engine instance
 * @param config - Configuration object with apiKey and baseUrl
 */
export async function refreshSoundstripeAudioURIs(
  engine: CreativeEngine,
  config: RefreshAudioConfig = {}
): Promise<void> {
  const { apiKey, baseUrl } = config;
  const fetchSoundstripeSong = async (
    songId: string
  ): Promise<SoundstripeSingleAssetResponse> => {
    const apiBaseUrl = baseUrl || 'https://api.soundstripe.com';
    const url = new URL(`${apiBaseUrl}/v1/songs/${songId}`);

    const headers: Record<string, string> = {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json'
    };

    // Only add Authorization header if apiKey is provided (not needed for proxy)
    if (apiKey) {
      console.warn(
        'Using direct Soundstripe API access for refresh, this is not recommended for production use. Instead, consider using a proxy server.'
      );
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(
        `Soundstripe API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  };

  try {
    const scene = engine.scene.get();
    if (scene === null) {
      return;
    }

    const audioBlocks = engine.block.findByType('audio');

    await Promise.allSettled(
      audioBlocks.map(async (blockId) => {
        const oldUri = engine.block.getString(blockId, 'audio/fileURI');
        const isSoundStripe = oldUri && oldUri.includes('soundstripe.com');
        if (!isSoundStripe) {
          return;
        }
        try {
          const metadata = engine.block.getMetadata(
            blockId,
            'ly.img.audio.soundstripe.songId'
          );
          if (!metadata) {
            console.warn(
              `No metadata found for Soundstripe audio block ${blockId}`
            );
            return;
          }

          const songId = metadata;
          const response = await fetchSoundstripeSong(songId);

          const audioFile = response.included.find(
            (item): item is SoundstripeAudioFile =>
              item.type === 'audio_files' &&
              item.id === response.data.relationships.audio_files.data[0]?.id
          );
          const newUri = audioFile?.attributes.versions?.mp3;

          if (newUri && newUri !== oldUri) {
            engine.block.setString(blockId, 'audio/fileURI', newUri);
          }
        } catch (error) {
          console.warn(
            `Failed to refresh URI for Soundstripe audio block ${blockId}:`,
            error
          );
        }
      })
    );
  } catch (error) {
    console.warn('Failed to refresh Soundstripe audio URIs:', error);
  }
}
