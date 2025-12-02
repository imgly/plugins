import type CreativeEditorSDK from '@cesdk/cesdk-js';

/**
 * Converts a blob: or buffer: URL to a data URI that Runware can accept
 */
export async function convertImageUrlForRunware(
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

export function isCustomImageSize(
  imageSize: any
): imageSize is { width: number; height: number } {
  return (
    imageSize != null &&
    typeof imageSize !== 'string' &&
    'width' in imageSize &&
    'height' in imageSize
  );
}

/**
 * Runware dimension constraints for image inference
 */
const RUNWARE_MIN_DIMENSION = 512;
const RUNWARE_MAX_DIMENSION = 2048;
const RUNWARE_DIMENSION_MULTIPLE = 16;

/**
 * Adjusts dimensions to meet Runware API constraints:
 * - Width and height must be between 512 and 2048
 * - Must be multiples of 16
 * - Preserves aspect ratio when scaling
 */
export function adjustDimensionsForRunware(
  width: number,
  height: number
): { width: number; height: number } {
  // First, scale down if either dimension exceeds max
  let scaledWidth = width;
  let scaledHeight = height;

  if (
    scaledWidth > RUNWARE_MAX_DIMENSION ||
    scaledHeight > RUNWARE_MAX_DIMENSION
  ) {
    const scale = Math.min(
      RUNWARE_MAX_DIMENSION / scaledWidth,
      RUNWARE_MAX_DIMENSION / scaledHeight
    );
    scaledWidth = Math.round(scaledWidth * scale);
    scaledHeight = Math.round(scaledHeight * scale);
  }

  // Scale up if either dimension is below min
  if (
    scaledWidth < RUNWARE_MIN_DIMENSION ||
    scaledHeight < RUNWARE_MIN_DIMENSION
  ) {
    const scale = Math.max(
      RUNWARE_MIN_DIMENSION / scaledWidth,
      RUNWARE_MIN_DIMENSION / scaledHeight
    );
    scaledWidth = Math.round(scaledWidth * scale);
    scaledHeight = Math.round(scaledHeight * scale);
  }

  // Round to nearest multiple of 16
  const roundedWidth =
    Math.round(scaledWidth / RUNWARE_DIMENSION_MULTIPLE) *
    RUNWARE_DIMENSION_MULTIPLE;
  const roundedHeight =
    Math.round(scaledHeight / RUNWARE_DIMENSION_MULTIPLE) *
    RUNWARE_DIMENSION_MULTIPLE;

  // Final clamp to ensure we're within bounds after rounding
  const finalWidth = Math.max(
    RUNWARE_MIN_DIMENSION,
    Math.min(RUNWARE_MAX_DIMENSION, roundedWidth)
  );
  const finalHeight = Math.max(
    RUNWARE_MIN_DIMENSION,
    Math.min(RUNWARE_MAX_DIMENSION, roundedHeight)
  );

  return { width: finalWidth, height: finalHeight };
}
