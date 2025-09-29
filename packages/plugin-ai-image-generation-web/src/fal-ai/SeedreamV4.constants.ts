const IMAGE_SIZE_MAP: Record<string, { width: number; height: number }> = {
  square_hd: { width: 2048, height: 2048 },
  square: { width: 1024, height: 1024 },
  portrait_4_3: { width: 1536, height: 2048 },
  portrait_16_9: { width: 1152, height: 2048 },
  landscape_4_3: { width: 2048, height: 1536 },
  landscape_16_9: { width: 2048, height: 1152 }
};

export function getImageDimensions(id: string): {
  width: number;
  height: number;
} {
  return IMAGE_SIZE_MAP[id] || { width: 2048, height: 2048 };
}
