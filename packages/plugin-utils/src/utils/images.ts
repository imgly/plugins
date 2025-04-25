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
