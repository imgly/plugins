import { type AssetResult } from '@cesdk/cesdk-js';
import { type GetInput, type OutputKind, InputByKind } from './provider';
import previewUri from './previewUri';

function getAssetResultForPlaceholder<K extends OutputKind, I>(
  id: string,
  kind: K,
  input: ReturnType<GetInput<K, I>>
): AssetResult {
  switch (kind) {
    case 'image': {
      return getImageAssetResultForPlaceholder(
        id,
        input[kind] as InputByKind['image']
      );
    }

    default: {
      throw new Error(
        `Unsupported output kind for creating placeholder block: ${kind}`
      );
    }
  }
}

function getImageAssetResultForPlaceholder(
  id: string,
  input: InputByKind['image']
): AssetResult {
  const width = input.width;
  const height = input.width;
  return {
    id,
    meta: {
      // previewUri,
      fillType: '//ly.img.ubq/fill/image',
      kind: 'image',

      width,
      height
    },
    payload: {
      sourceSet: [
        {
          // Adding a previewUri to the source set for now. The engine
          // has a bug where the replaced image will be distorted if the
          // aspect ratio is different from the preview image.
          // This will be fixed in a future release and we can use
          // `meta.previewUri` again.
          uri: previewUri,
          width,
          height
        }
      ]
    }
  };
}

export default getAssetResultForPlaceholder;
