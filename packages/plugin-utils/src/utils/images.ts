import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { bufferURIToObjectURL } from './upload';

/**
 * Get the dimensions of an image from its URL
 *
 * @param url - The URL of the image
 * @returns A promise that resolves to an object containing the width and height of the image
 */
export async function getImageDimensionsFromURL(
  url: string,
  cesdk: CreativeEditorSDK
): Promise<{ width: number; height: number }> {
  const resolvedUrl = await bufferURIToObjectURL(url, cesdk);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = resolvedUrl;
  });
}

/**
 * Get the URI of an image from a block ID, either the first source of a source set or
 * the image file URI. Will handle buffer URIs and convert them to object URLs.
 */
export async function getImageUri(
  blockId: number,
  cesdk: CreativeEditorSDK,
  options?: { throwErrorIfSvg?: boolean }
): Promise<string> {
  let uri;
  const fillBlock = cesdk.engine.block.getFill(blockId);
  const sourceSet = cesdk.engine.block.getSourceSet(
    fillBlock,
    'fill/image/sourceSet'
  );
  const [source] = sourceSet;
  if (source == null) {
    uri = cesdk.engine.block.getString(fillBlock, 'fill/image/imageFileURI');
    if (uri == null) throw new Error('No image source/uri found');
  } else {
    uri = source.uri;
  }

  // Check if the image is SVG (not supported)
  if (options?.throwErrorIfSvg) {
    const mimeType = await cesdk.engine.editor.getMimeType(uri);
    if (mimeType === 'image/svg+xml') {
      throw new Error('SVG images are not supported');
    }
  }

  return bufferURIToObjectURL(uri, cesdk);
}
