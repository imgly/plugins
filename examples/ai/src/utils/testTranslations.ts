import CreativeEditorSDK from '@cesdk/cesdk-js';

// Import translation files using symlinks
import baseTranslations from '../translations/base.json';
import imageTranslations from '../translations/image.json';
import videoTranslations from '../translations/video.json';
import audioTranslations from '../translations/audio.json';
import textTranslations from '../translations/text.json';
import stickerTranslations from '../translations/sticker.json';

/**
 * Helper function to determine if a key is provider-specific
 */
function isProviderSpecificKey(key: string): boolean {
  return (
    key.includes('.fal-ai/') ||
    key.includes('.open-ai/') ||
    key.includes('.runware/') ||
    key.includes('.elevenlabs/') ||
    key.includes('.anthropic.') ||
    key.includes('.openai.')
  );
}

/**
 * Helper function to add prefix based on key type
 */
function addPrefix(key: string, value: string): string {
  return isProviderSpecificKey(key) ? `@${value}` : `&${value}`;
}

/**
 * Get translations for a specific locale from a translation object,
 * falling back to 'en' if the locale doesn't exist
 */
function getLocaleTranslations(
  translationObj: { en: Record<string, string>; de?: Record<string, string> },
  locale: 'en' | 'de'
): Record<string, string> {
  if (locale === 'de' && translationObj.de) {
    return translationObj.de;
  }
  return translationObj.en;
}

/**
 * Process translations for a specific locale
 */
function processTranslationsForLocale(
  locale: 'en' | 'de'
): Record<string, string> {
  const translations: Record<string, string> = {};

  // Process base translations
  const baseLocale = getLocaleTranslations(
    baseTranslations as { en: Record<string, string>; de?: Record<string, string> },
    locale
  );
  Object.entries(baseLocale).forEach(([key, value]) => {
    translations[key] = addPrefix(key, value);
  });

  // Process image translations
  const imageLocale = getLocaleTranslations(
    imageTranslations as { en: Record<string, string>; de?: Record<string, string> },
    locale
  );
  Object.entries(imageLocale).forEach(([key, value]) => {
    translations[key] = addPrefix(key, value);
  });

  // Process video translations
  const videoLocale = getLocaleTranslations(
    videoTranslations as { en: Record<string, string>; de?: Record<string, string> },
    locale
  );
  Object.entries(videoLocale).forEach(([key, value]) => {
    translations[key] = addPrefix(key, value);
  });

  // Process audio translations
  const audioLocale = getLocaleTranslations(
    audioTranslations as { en: Record<string, string>; de?: Record<string, string> },
    locale
  );
  Object.entries(audioLocale).forEach(([key, value]) => {
    translations[key] = addPrefix(key, value);
  });

  // Process text translations
  const textLocale = getLocaleTranslations(
    textTranslations as { en: Record<string, string>; de?: Record<string, string> },
    locale
  );
  Object.entries(textLocale).forEach(([key, value]) => {
    translations[key] = addPrefix(key, value);
  });

  // Process sticker translations
  const stickerLocale = getLocaleTranslations(
    stickerTranslations as { en: Record<string, string>; de?: Record<string, string> },
    locale
  );
  Object.entries(stickerLocale).forEach(([key, value]) => {
    translations[key] = addPrefix(key, value);
  });

  return translations;
}

/**
 * Test all translation keys by setting them with prefixes:
 * - & for generic/base translations
 * - @ for provider-specific translations
 */
export function testAllTranslations(cesdk: CreativeEditorSDK) {
  const enTranslations = processTranslationsForLocale('en');
  const deTranslations = processTranslationsForLocale('de');

  // Set translations for both locales with their respective language values
  cesdk.setTranslations({
    en: enTranslations,
    de: deTranslations
  });

  // Log summary for debugging (use English translations for counting)
  const genericCount = Object.values(enTranslations).filter(v => v.startsWith('&')).length;
  const providerCount = Object.values(enTranslations).filter(v => v.startsWith('@')).length;

  console.log('🔧 Translation Test Applied:');
  console.log(`📋 Total translations (per locale): ${Object.keys(enTranslations).length}`);
  console.log(`🔄 Generic translations (& prefix): ${genericCount}`);
  console.log(`🎯 Provider-specific translations (@ prefix): ${providerCount}`);
  console.log('💡 Look for & and @ prefixes in the UI to verify translation loading');
  console.log('🇩🇪 German locale will show German translations with prefixes');

  return { en: enTranslations, de: deTranslations };
}

/**
 * Reset translations to original values (remove prefixes)
 */
export function resetTranslations(cesdk: CreativeEditorSDK) {
  const allTranslations: Record<string, string> = {};

  // Merge all original translations without prefixes
  Object.assign(allTranslations, baseTranslations.en);
  Object.assign(allTranslations, imageTranslations.en);
  Object.assign(allTranslations, videoTranslations.en);
  Object.assign(allTranslations, audioTranslations.en);
  Object.assign(allTranslations, textTranslations.en);
  Object.assign(allTranslations, stickerTranslations.en);

  cesdk.setTranslations({
    en: allTranslations
  });

  console.log('✅ Translations reset to original values');
}
