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
 * Constraints for a single dimension (width or height)
 */
export interface DimensionRange {
  min: number;
  max: number;
}

/**
 * Model-specific dimension constraints for image generation.
 * Allows separate constraints for width and height.
 */
export interface DimensionConstraints {
  width: DimensionRange;
  height: DimensionRange;
  /** Round dimensions to this multiple (e.g., 16). Defaults to 1 if not specified. */
  multiple?: number;
}

/**
 * Adjusts dimensions to meet API constraints:
 * - Width and height are constrained to their respective min/max ranges
 * - Optionally rounds to a multiple (e.g., 16)
 * - Preserves aspect ratio when scaling
 *
 * @param width - Original width
 * @param height - Original height
 * @param constraints - Model-specific dimension constraints
 */
export function adjustDimensions(
  width: number,
  height: number,
  constraints: DimensionConstraints
): { width: number; height: number } {
  const multiple = constraints.multiple ?? 1;

  // First, scale down if either dimension exceeds its max
  let scaledWidth = width;
  let scaledHeight = height;

  if (
    scaledWidth > constraints.width.max ||
    scaledHeight > constraints.height.max
  ) {
    const scale = Math.min(
      constraints.width.max / scaledWidth,
      constraints.height.max / scaledHeight
    );
    scaledWidth = Math.round(scaledWidth * scale);
    scaledHeight = Math.round(scaledHeight * scale);
  }

  // Scale up if either dimension is below its min
  if (
    scaledWidth < constraints.width.min ||
    scaledHeight < constraints.height.min
  ) {
    const scale = Math.max(
      constraints.width.min / scaledWidth,
      constraints.height.min / scaledHeight
    );
    scaledWidth = Math.round(scaledWidth * scale);
    scaledHeight = Math.round(scaledHeight * scale);
  }

  // Round to nearest multiple (if specified)
  const roundedWidth = Math.round(scaledWidth / multiple) * multiple;
  const roundedHeight = Math.round(scaledHeight / multiple) * multiple;

  // Final clamp to ensure we're within bounds after rounding
  const finalWidth = Math.max(
    constraints.width.min,
    Math.min(constraints.width.max, roundedWidth)
  );
  const finalHeight = Math.max(
    constraints.height.min,
    Math.min(constraints.height.max, roundedHeight)
  );

  return { width: finalWidth, height: finalHeight };
}
