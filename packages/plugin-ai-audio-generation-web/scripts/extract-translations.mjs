#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRANSLATIONS_PATH = path.join(__dirname, '../translations.json');
const VOICES_PATH = path.join(__dirname, '../src/elevenlabs/ElevenMultilingualV2.voices.json');

console.log('🔍 Extracting translations from voices...\n');

// Load voices.json
const voicesData = JSON.parse(fs.readFileSync(VOICES_PATH, 'utf-8'));
const voiceTranslations = {};

// Extract voice name translations
console.log(`📄 Processing voices: ${VOICES_PATH} (${voicesData.id})`);

for (const voice of voicesData.assets) {
  const translationKey = `libraries.${voicesData.id}.${voice.id}`;
  const voiceName = voice.label.en;
  voiceTranslations[translationKey] = voiceName;
}

// Load existing translations
let existingTranslations = { en: {} };
if (fs.existsSync(TRANSLATIONS_PATH)) {
  existingTranslations = JSON.parse(fs.readFileSync(TRANSLATIONS_PATH, 'utf-8'));
}

// Separate flat keys (manually maintained) from voice keys (extracted)
const flatKeys = {};
const voiceKeys = {};

for (const [key, value] of Object.entries(existingTranslations.en || {})) {
  if (key.startsWith('libraries.ly.img.voices.')) {
    voiceKeys[key] = value;
  } else {
    flatKeys[key] = value;
  }
}

console.log(`\n📊 Statistics:`);
console.log(`   Flat keys (manual): ${Object.keys(flatKeys).length}`);
console.log(`   Voice translations: ${Object.keys(voiceTranslations).length}`);

// Merge: flat keys (priority) + extracted voice translations
const mergedTranslations = {
  en: {
    ...flatKeys,
    ...voiceTranslations
  }
};

// Sort keys alphabetically
const sortedTranslations = {
  en: Object.keys(mergedTranslations.en)
    .sort()
    .reduce((acc, key) => {
      acc[key] = mergedTranslations.en[key];
      return acc;
    }, {})
};

// Write back to translations.json
fs.writeFileSync(
  TRANSLATIONS_PATH,
  JSON.stringify(sortedTranslations, null, 2) + '\n'
);

console.log(`\n✅ Translations written to translations.json`);
console.log(`📊 Total keys: ${Object.keys(sortedTranslations.en).length}\n`);
