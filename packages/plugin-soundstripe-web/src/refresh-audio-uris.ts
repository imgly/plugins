import { CreativeEngine } from '@cesdk/cesdk-js';
import { SoundstripeSingleAssetResponse, SoundstripeAudioFile } from './types';

/**
 * Refreshes expired Soundstripe audio URIs in the current scene
 * @param apiKey - Your Soundstripe API key
 * @param engine - The CESDK engine instance
 */
export async function refreshSoundstripeAudioURIs(
  apiKey: string,
  engine: CreativeEngine
): Promise<void> {
  const fetchSoundstripeSong = async (
    songId: string
  ): Promise<SoundstripeSingleAssetResponse> => {
    const url = new URL(`https://api.soundstripe.com/v1/songs/${songId}`);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`
      }
    });

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
