import { mimeTypeToExtension } from '@imgly/plugin-utils';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { EachLabsClient } from './createEachLabsClient';

/**
 * Uploads an image to EachLabs storage if needed.
 * Handles blob: and buffer: URLs by uploading them to EachLabs storage.
 * Regular URLs and data URIs are passed through unchanged.
 *
 * @param client - The EachLabs client instance
 * @param imageUrl - The image URL to process
 * @param cesdk - Optional CE.SDK instance for buffer URL handling
 * @returns The uploaded URL or the original URL if no upload was needed
 */
export async function uploadImageInputToEachLabsIfNeeded(
  client: EachLabsClient,
  imageUrl?: string,
  cesdk?: CreativeEditorSDK
): Promise<string | undefined> {
  if (imageUrl == null) return undefined;

  // For blob URLs, fetch the blob and upload to storage
  if (imageUrl.startsWith('blob:')) {
    const mimeType =
      cesdk != null
        ? await cesdk.engine.editor.getMimeType(imageUrl)
        : 'image/png';
    const imageUrlResponse = await fetch(imageUrl);
    const imageUrlBlob = await imageUrlResponse.blob();
    const imageUrlFile = new File(
      [imageUrlBlob],
      `image.${mimeTypeToExtension(mimeType)}`,
      {
        type: mimeType
      }
    );
    return client.storage.upload(imageUrlFile);
  }

  // For buffer URLs, extract data from CE.SDK and upload to storage
  if (cesdk != null && imageUrl.startsWith('buffer:')) {
    const mimeType = await cesdk.engine.editor.getMimeType(imageUrl);
    const length = cesdk.engine.editor.getBufferLength(imageUrl);
    const data = cesdk.engine.editor.getBufferData(imageUrl, 0, length);
    // Create a new Uint8Array with a proper ArrayBuffer to avoid SharedArrayBuffer issues
    const buffer = new Uint8Array(data);
    const imageUrlFile = new File(
      [buffer],
      `image.${mimeTypeToExtension(mimeType)}`,
      {
        type: mimeType
      }
    );
    return client.storage.upload(imageUrlFile);
  }

  // For data URIs and regular URLs, pass through unchanged
  return imageUrl;
}

/**
 * Uploads an array of images to EachLabs storage if needed.
 * Used for multi-image inputs like image-to-video generation.
 *
 * @param client - The EachLabs client instance
 * @param imageUrls - Array of image URLs to process
 * @param cesdk - Optional CE.SDK instance for buffer URL handling
 * @returns Array of uploaded URLs
 */
export async function uploadImageArrayToEachLabsIfNeeded(
  client: EachLabsClient,
  imageUrls?: string[],
  cesdk?: CreativeEditorSDK
): Promise<string[] | undefined> {
  if (imageUrls == null || !Array.isArray(imageUrls)) return undefined;

  const uploadedUrls = await Promise.all(
    imageUrls.map((url) =>
      uploadImageInputToEachLabsIfNeeded(client, url, cesdk)
    )
  );

  return uploadedUrls.filter((url): url is string => url != null);
}
