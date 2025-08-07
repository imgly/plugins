import CreativeEditorSDK from '@cesdk/cesdk-js';

// Import translation files using symlinks
import baseTranslations from '../translations/base.json';
import imageTranslations from '../translations/image.json';
import videoTranslations from '../translations/video.json';
import audioTranslations from '../translations/audio.json';
import textTranslations from '../translations/text.json';
import stickerTranslations from '../translations/sticker.json';

/**
 * Test all translation keys by setting them with prefixes:
 * - & for generic/base translations
 * - @ for provider-specific translations
 */
export function testAllTranslations(cesdk: CreativeEditorSDK) {
  const allTranslations: Record<string, string> = {};

  // Process base translations (generic) with & prefix
  Object.entries(baseTranslations.en).forEach(([key, value]) => {
    allTranslations[key] = `&${value}`;
  });

  // Process image generation translations (provider-specific) with @ prefix
  Object.entries(imageTranslations.en).forEach(([key, value]) => {
    // Check if it's a provider-specific translation
    if (key.includes('.fal-ai/') || key.includes('.open-ai/') || key.includes('quickAction')) {
      allTranslations[key] = `@${value}`;
    } else {
      // Generic property that might be redefined
      allTranslations[key] = `&${value}`;
    }
  });

  // Process video generation translations (provider-specific) with @ prefix
  Object.entries(videoTranslations.en).forEach(([key, value]) => {
    if (key.includes('.fal-ai/') || key.includes('quickAction')) {
      allTranslations[key] = `@${value}`;
    } else {
      allTranslations[key] = `&${value}`;
    }
  });

  // Process audio generation translations (provider-specific) with @ prefix
  Object.entries(audioTranslations.en).forEach(([key, value]) => {
    if (key.includes('.elevenlabs/')) {
      allTranslations[key] = `@${value}`;
    } else {
      allTranslations[key] = `&${value}`;
    }
  });

  // Process text generation translations (provider-specific) with @ prefix
  Object.entries(textTranslations.en).forEach(([key, value]) => {
    if (key.includes('.anthropic.') || key.includes('.openai.') || key.includes('quickAction')) {
      allTranslations[key] = `@${value}`;
    } else {
      allTranslations[key] = `&${value}`;
    }
  });

  // Process sticker generation translations (provider-specific) with @ prefix
  Object.entries(stickerTranslations.en).forEach(([key, value]) => {
    if (key.includes('.fal-ai/') || key.includes('quickAction')) {
      allTranslations[key] = `@${value}`;
    } else {
      allTranslations[key] = `&${value}`;
    }
  });

  // Set all translations at once
  cesdk.setTranslations({
    en: allTranslations
  });

  // Log summary for debugging
  const genericCount = Object.values(allTranslations).filter(v => v.startsWith('&')).length;
  const providerCount = Object.values(allTranslations).filter(v => v.startsWith('@')).length;
  
  console.log('🔧 Translation Test Applied:');
  console.log(`📋 Total translations: ${Object.keys(allTranslations).length}`);
  console.log(`🔄 Generic translations (& prefix): ${genericCount}`);
  console.log(`🎯 Provider-specific translations (@ prefix): ${providerCount}`);
  console.log('💡 Look for & and @ prefixes in the UI to verify translation loading');

  return allTranslations;
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