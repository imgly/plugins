import { type AssetResult } from '@cesdk/cesdk-js';
import {
  type GetInput,
  type OutputKind,
  ImageOutput,
  InputByKind,
  Output,
  VideoOutput
} from './provider';
import { getThumbnailForVideo } from '../utils';

async function getAssetResultForGenerated<K extends OutputKind, I>(
  id: string,
  kind: K,
  inputs: ReturnType<GetInput<K, I>>,
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
        inputs[kind] as InputByKind['image'],
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
        inputs[kind] as InputByKind['video'],
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
  const height = input.width;
  return {
    id,
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
    meta: {
      uri: output.url,
      thumbUri,

      mimeType: "video/mp4",
      kind: "video",
      fillType: "//ly.img.ubq/fill/video",

      duration: input.duration.toString(),

      width,
      height
    }
  };
}


export default getAssetResultForGenerated;
