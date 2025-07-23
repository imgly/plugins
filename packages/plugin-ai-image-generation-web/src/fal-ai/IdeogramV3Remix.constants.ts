export const IMAGE_SIZE_MAP: Record<string, { width: number; height: number }> =
  {
    square_hd: { width: 1024, height: 1024 },
    square: { width: 512, height: 512 },
    portrait_4_3: { width: 768, height: 1024 },
    portrait_16_9: { width: 576, height: 1024 },
    landscape_4_3: { width: 1024, height: 768 },
    landscape_16_9: { width: 1024, height: 576 }
  };

export function getImageDimensions(imageSize: string): {
  width: number;
  height: number;
} {
  return IMAGE_SIZE_MAP[imageSize] ?? IMAGE_SIZE_MAP.square_hd;
}
