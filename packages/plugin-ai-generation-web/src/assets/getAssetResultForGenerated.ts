import { type AssetResult } from '@cesdk/cesdk-js';
import {
  type OutputKind,
  AudioOutput,
  GetBlockInputResult,
  ImageOutput,
  InputByKind,
  Output,
  VideoOutput
} from '../core/provider';
import { getThumbnailForVideo } from '../utils/utils';

async function getAssetResultForGenerated<K extends OutputKind>(
  id: string,
  kind: K,
  blockInputs: GetBlockInputResult<K>,
  output: Output
): Promise<AssetResult> {
  switch (kind) {
    case 'image': {
      if (output.kind !== 'image') {
        throw new Error(
          `Output kind does not match the expected type: ${output.kind} (expected: image)`
        );
      }

      return getImageAssetResultForGenerated(
        id,
        blockInputs[kind] as InputByKind['image'],
        output
      );
    }

    case 'video': {
      if (output.kind !== 'video') {
        throw new Error(
          `Output kind does not match the expected type: ${output.kind} (expected: video)`
        );
      }

      return getVideoAssetResultForGenerated(
        id,
        blockInputs[kind] as InputByKind['video'],
        output
      );
    }

    case 'audio': {
      if (output.kind !== 'audio') {
        throw new Error(
          `Output kind does not match the expected type: ${output.kind} (expected: audio)`
        );
      }

      return getAudioAssetResultForGenerated(
        id,
        blockInputs[kind] as InputByKind['audio'],
        output
      );
    }

    default: {
      throw new Error(
        `Unsupported output kind for creating placeholder block: ${kind}`
      );
    }
  }
}

function getImageAssetResultForGenerated(
  id: string,
  input: InputByKind['image'],
  output: ImageOutput
): AssetResult {
  const width = input.width;
  const height = input.height;
  return {
    id,
    label: input.label,
    meta: {
      uri: output.url,
      thumbUri: output.url,
      fillType: '//ly.img.ubq/fill/image',
      kind: 'image',

      width,
      height
    },
    payload: {
      sourceSet: [
        {
          uri: output.url,
          width,
          height
        }
      ]
    }
  };
}

async function getVideoAssetResultForGenerated(
  id: string,
  input: InputByKind['video'],
  output: VideoOutput
): Promise<AssetResult> {
  const width = input.width;
  const height = input.height;

  const thumbUri = await getThumbnailForVideo(output.url, 0);

  return {
    id,
    label: input.label,
    meta: {
      uri: output.url,
      thumbUri,

      mimeType: 'video/mp4',
      kind: 'video',
      fillType: '//ly.img.ubq/fill/video',

      duration: input.duration.toString(),

      width,
      height
    }
  };
}

function getAudioAssetResultForGenerated(
  id: string,
  input: InputByKind['audio'],
  output: AudioOutput
): AssetResult {
  return {
    id,
    label: input.label,
    meta: {
      uri: output.url,
      thumbUri: output.thumbnailUrl,
      blockType: '//ly.img.ubq/audio',
      mimeType: 'audio/x-m4a',
      duration: output.duration.toString()
    }
  };
}

export default getAssetResultForGenerated;
