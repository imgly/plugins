import { type AssetResult } from '@cesdk/cesdk-js';
import {
  type GetInput,
  type OutputKind,
  ImageOutput,
  InputByKind,
  Output
} from './provider';

function getAssetResultForGenerated<K extends OutputKind, I>(
  id: string,
  kind: K,
  inputs: ReturnType<GetInput<K, I>>,
  output: Output
): AssetResult {
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

export default getAssetResultForGenerated;
