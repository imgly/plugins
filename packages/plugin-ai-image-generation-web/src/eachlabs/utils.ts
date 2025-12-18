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
 * Used for multi-image inputs like image-to-image generation.
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

// Keep legacy functions for backward compatibility but mark them as deprecated

/**
 * @deprecated Use uploadImageInputToEachLabsIfNeeded instead
 * Converts a blob: or buffer: URL to a data URI that EachLabs can accept
 */
export async function convertImageUrlForEachLabs(
  imageUrl?: string,
  cesdk?: CreativeEditorSDK
): Promise<string | undefined> {
  if (imageUrl == null) return undefined;

  // For blob URLs, convert to data URI
  if (imageUrl.startsWith('blob:')) {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return blobToDataUri(blob);
  }

  // For buffer URLs, convert to data URI
  if (cesdk != null && imageUrl.startsWith('buffer:')) {
    const mimeType = await cesdk.engine.editor.getMimeType(imageUrl);
    const length = cesdk.engine.editor.getBufferLength(imageUrl);
    const data = cesdk.engine.editor.getBufferData(imageUrl, 0, length);
    const buffer = new Uint8Array(data);
    const blob = new Blob([buffer], { type: mimeType });
    return blobToDataUri(blob);
  }

  // For data URIs and regular URLs, pass through
  return imageUrl;
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * @deprecated Use uploadImageArrayToEachLabsIfNeeded instead
 * Converts an array of blob:/buffer: URLs to data URIs for EachLabs.
 * Used for multi-image inputs like image-to-image generation.
 */
export async function convertImageUrlArrayForEachLabs(
  imageUrls?: string[],
  cesdk?: CreativeEditorSDK
): Promise<string[] | undefined> {
  if (imageUrls == null || !Array.isArray(imageUrls)) return undefined;

  const convertedUrls = await Promise.all(
    imageUrls.map((url) => convertImageUrlForEachLabs(url, cesdk))
  );

  return convertedUrls.filter((url): url is string => url != null);
}
