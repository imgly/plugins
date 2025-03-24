type CustomImageSize = {
  width: number;
  height: number;
};

export function isCustomImageSize(
  imageSize: any
): imageSize is CustomImageSize {
  return (
    imageSize != null &&
    typeof imageSize !== 'string' &&
    'width' in imageSize &&
    'height' in imageSize
  );
}
