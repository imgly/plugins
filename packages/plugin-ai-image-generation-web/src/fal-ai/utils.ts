import { fal } from '@fal-ai/client';
import { mimeTypeToExtension } from '@imgly/plugin-utils';
import CreativeEditorSDK from '@cesdk/cesdk-js';

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

export async function uploadImageInputToFalIfNeeded(
  imageUrl?: string,
  cesdk?: CreativeEditorSDK
): Promise<string | undefined> {
  if (imageUrl == null) return undefined;
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
    return fal.storage.upload(imageUrlFile);
  }
  if (cesdk != null && imageUrl.startsWith('buffer:')) {
    const mimeType = await cesdk.engine.editor.getMimeType(imageUrl);
    const length = cesdk.engine.editor.getBufferLength(imageUrl);
    const data = cesdk.engine.editor.getBufferData(imageUrl, 0, length);
    const imageUrlFile = new File(
      [data],
      `image.${mimeTypeToExtension(mimeType)}`,
      {
        type: mimeType
      }
    );
    return fal.storage.upload(imageUrlFile);
  }

  return imageUrl;
}

/**
 * Initializes style translation system with priority hierarchy
 */
export function initializeStyleTranslations(cesdk: CreativeEditorSDK, modelKey: string) {
  const cache: Record<string, string> = {};
  const callbacks: (() => void)[] = [];
  
  // Intercept translation loading
  const original = cesdk.i18n.setTranslations.bind(cesdk.i18n);
  cesdk.i18n.setTranslations = (translations: any) => {
    if (translations.en) {
      Object.assign(cache, translations.en);
      callbacks.forEach(fn => fn());
    }
    return original(translations);
  };

  const resolve = (styleId: string): string => {
    const keys = [
      `ly.img.plugin-ai-image-generation-web.${modelKey}.property.style.${styleId}`,
      `ly.img.plugin-ai-image-generation-web.property.style.${styleId}`,
      `ly.img.plugin-ai-image-generation-web.${modelKey}.defaults.property.style.${styleId}`,
      `ly.img.plugin-ai-generation-web.defaults.property.style.${styleId}`
    ];
    
    const found = keys.find(key => cache[key]);
    return found ? cache[found] : keys[keys.length - 1];
  };

  return {
    resolve,
    cardLabel: ({ label }: { label?: string }) => 
      label?.includes('ly.img.plugin-ai-') ? resolve(label.split('.').pop() || '') : label || '',
    onUpdate: (fn: () => void) => callbacks.push(fn),
    createAssets: <T>(ids: readonly string[], factory: (id: string, label: string) => T): T[] =>
      ids.map(id => factory(id, resolve(id)))
  };
}
