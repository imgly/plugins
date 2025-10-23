#!/usr/bin/env node
/**
 * Extract translations from OpenAPI schemas and TypeScript constants
 * This runs during build to populate translations.json with all provider-specific translations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.join(__dirname, '..');

const TRANSLATIONS_PATH = path.join(PACKAGE_ROOT, 'translations.json');
const PLUGIN_PREFIX = 'ly.img.plugin-ai-image-generation-web';

console.log('🔍 Extracting translations from schemas and constants...\n');

/**
 * Extract translations from OpenAPI schema files
 */
async function extractSchemaTranslations() {
  const schemaFiles = await glob('src/**/*.json', { cwd: PACKAGE_ROOT });
  const translations = {};

  for (const schemaFile of schemaFiles) {
    const schemaPath = path.join(PACKAGE_ROOT, schemaFile);
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

    // Determine provider ID from schema file
    const providerId = extractProviderIdFromSchema(schema, schemaFile);
    if (!providerId) continue;

    console.log(`📄 Processing schema: ${schemaFile} (${providerId})`);

    // Extract enum labels from schema properties
    if (schema.components?.schemas) {
      for (const [schemaName, schemaObj] of Object.entries(schema.components.schemas)) {
        if (schemaObj.properties) {
          extractEnumLabels(schemaObj.properties, providerId, translations);
        }
      }
    }
  }

  return translations;
}

/**
 * Extract provider ID from schema
 */
function extractProviderIdFromSchema(schema, filePath) {
  // Try to get from schema itself
  if (schema.info?.['x-imgly-provider-id']) {
    return schema.info['x-imgly-provider-id'];
  }

  // Extract from file name (e.g., RecraftV3.json -> fal-ai/recraft-v3)
  const fileName = path.basename(filePath, '.json');

  // Map known file names to provider IDs
  const providerMap = {
    'RecraftV3': 'fal-ai/recraft-v3',
    'Recraft20b': 'fal-ai/recraft/v2/text-to-image',
    'GeminiFlash25': 'fal-ai/gemini-25-flash-image',
    'Gemini25FlashImageEdit': 'fal-ai/gemini-25-flash-image/edit',
    'GeminiFlashEdit': 'fal-ai/gemini-flash-edit',
    'NanoBanana': 'fal-ai/nano-banana',
    'NanoBananaEdit': 'fal-ai/nano-banana/edit',
    'SeedreamV4Edit': 'fal-ai/bytedance/seedream/v4/edit',
    'QwenImageEdit': 'fal-ai/qwen-image-edit',
    'FluxProKontextEdit': 'fal-ai/flux-pro/kontext',
    'FluxProKontextMaxEdit': 'fal-ai/flux-pro/kontext/max',
    'Ideogram3': 'fal-ai/ideogram/v3',
    'Ideogram3Remix': 'fal-ai/ideogram/v3/remix',
    'GptImage1': 'open-ai/gpt-image-1/text2image',
    'GptImage1Image2Image': 'open-ai/gpt-image-1/image2image'
  };

  return providerMap[fileName] || null;
}

/**
 * Extract enum labels from schema properties
 */
function extractEnumLabels(properties, providerId, translations) {
  for (const [propName, propSchema] of Object.entries(properties)) {
    // Check for x-imgly-enum-labels
    if (propSchema['x-imgly-enum-labels']) {
      const labels = propSchema['x-imgly-enum-labels'];

      for (const [value, label] of Object.entries(labels)) {
        const key = `${PLUGIN_PREFIX}.${providerId}.property.${propName}.${value}`;
        translations[key] = label;
      }
    }

    // Handle nested objects
    if (propSchema.properties) {
      extractEnumLabels(propSchema.properties, providerId, translations);
    }

    // Handle allOf, anyOf, oneOf
    for (const combiner of ['allOf', 'anyOf', 'oneOf']) {
      if (propSchema[combiner]) {
        for (const subSchema of propSchema[combiner]) {
          if (subSchema.properties) {
            extractEnumLabels(subSchema.properties, providerId, translations);
          }
        }
      }
    }
  }
}

/**
 * Extract translations from TypeScript constant files
 */
async function extractConstantTranslations() {
  const constantFiles = await glob('src/**/*.constants.ts', { cwd: PACKAGE_ROOT });
  const translations = {};

  for (const constantFile of constantFiles) {
    const filePath = path.join(PACKAGE_ROOT, constantFile);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Determine provider ID from file name
    const providerId = extractProviderIdFromConstantFile(constantFile);
    if (!providerId) continue;

    console.log(`📄 Processing constants: ${constantFile} (${providerId})`);

    // Extract style constants (STYLES_IMAGE, STYLES_VECTOR, STYLES_ICON, etc.)
    const styleArrays = extractStyleArrays(content);

    for (const [arrayName, styles] of Object.entries(styleArrays)) {
      for (const style of styles) {
        const key = `${PLUGIN_PREFIX}.${providerId}.property.style.${style.id}`;
        translations[key] = style.label;
      }
    }
  }

  return translations;
}

/**
 * Extract provider ID from constant file name
 */
function extractProviderIdFromConstantFile(filePath) {
  const fileName = path.basename(filePath, '.constants.ts');

  const providerMap = {
    'RecraftV3': 'fal-ai/recraft-v3',
    'Recraft20b': 'fal-ai/recraft/v2/text-to-image',
    'GptImage1': 'open-ai/gpt-image-1/text2image'
  };

  return providerMap[fileName] || null;
}

/**
 * Extract style arrays from TypeScript content
 */
function extractStyleArrays(content) {
  const styleArrays = {};

  // Match patterns like: export const STYLES_IMAGE: ... = [ ... ];
  // Need to handle multiline with type annotations
  const arrayRegex = /export\s+const\s+(STYLES_\w+)(?::\s*[^=]+)?\s*=\s*\[([\s\S]*?)\];/g;
  const matches = [...content.matchAll(arrayRegex)];

  for (const match of matches) {
    const arrayName = match[1];
    const arrayContent = match[2];

    // Extract { id: 'value', label: 'Label' } objects, handling both quote types and slashes
    const objectRegex = /\{\s*id:\s*['"]([^'"]+)['"]\s*,\s*label:\s*['"]([^'"]+)['"]\s*\}/g;
    const objects = [...arrayContent.matchAll(objectRegex)];

    styleArrays[arrayName] = objects.map(obj => ({
      id: obj[1],
      label: obj[2]
    }));
  }

  return styleArrays;
}

/**
 * Main extraction function
 */
async function main() {
  // Extract translations from different sources
  const schemaTranslations = await extractSchemaTranslations();
  const constantTranslations = await extractConstantTranslations();

  // Load existing translations
  let existingTranslations = { en: {} };
  if (fs.existsSync(TRANSLATIONS_PATH)) {
    existingTranslations = JSON.parse(fs.readFileSync(TRANSLATIONS_PATH, 'utf-8'));
  }

  // Separate flat keys (manually maintained) from property keys (extracted)
  const flatKeys = {};
  const propertyKeys = {};

  for (const [key, value] of Object.entries(existingTranslations.en || {})) {
    if (key.includes('.property.')) {
      propertyKeys[key] = value;
    } else {
      flatKeys[key] = value;
    }
  }

  console.log(`\n📊 Statistics:`);
  console.log(`   Flat keys (manual): ${Object.keys(flatKeys).length}`);
  console.log(`   Schema translations: ${Object.keys(schemaTranslations).length}`);
  console.log(`   Constant translations: ${Object.keys(constantTranslations).length}`);

  // Merge: flat keys (priority) + extracted translations
  const mergedTranslations = {
    en: {
      ...flatKeys,
      ...schemaTranslations,
      ...constantTranslations
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
}

main().catch(console.error);
