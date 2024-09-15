import type CreativeEditorSDK from '@cesdk/cesdk-js';
import type { Source } from '@cesdk/cesdk-js';



export function findOptimalSource(sourceSet: Source[], threshold: number) {
  if (sourceSet.length === 0) return undefined;

  const [over, below] = sourceSet.reduce(
    (acc: [Source[], Source[]], source) => {
      if (source.width >= threshold && source.height >= threshold) {
        acc[0].push(source);
      } else {
        acc[1].push(source);
      }
      return acc;
    },
    [[], []]
  );

  if (over.length > 0) {
    // Lowest resolution image that is over <THRESHOLD>x<THRESHOLD>
    return over.sort((a, b) => a.width * a.height - b.width * b.height)[0];
  } else {
    // Highest resolution image that is below <THRESHOLD>x<THRESHOLD>
    return below.sort((a, b) => b.width * b.height - a.width * a.height)[0];
  }
}

export async function convertBufferURI(
  uri: string,
  cesdk: CreativeEditorSDK
): Promise<Blob | string> {
  if (uri.startsWith('buffer:')) {
    const mimeType = await cesdk.engine.editor.getMimeType(uri);
    const length = cesdk.engine.editor.getBufferLength(uri);
    const data = cesdk.engine.editor.getBufferData(uri, 0, length);
    return new Blob([data], { type: mimeType });
  } else {
    return uri;
  }
}

export async function uploadBlob(
  blob: Blob,
  filename: string,
  cesdk: CreativeEditorSDK
) {
  
  const uploadedAssets = await cesdk.unstable_upload(
    new File([blob], filename, { type: blob.type }),
    () => {
      // TODO Delegate process to UI component
    }
  );

  const url = uploadedAssets.meta?.uri;
  if (url == null) {
    throw new Error('Could not upload processed fill');
  }
  return url;
}
