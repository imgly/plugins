#!/usr/bin/env node
/**
 * EachLabs Model Discovery Script
 *
 * Fetches models from EachLabs API and outputs a minimal JSON array
 * for easy comparison with providers.md by the LLM.
 *
 * Usage: node discover-models.mjs
 *
 * Output: JSON array with essential fields only:
 *   - slug: unique identifier
 *   - title: display name
 *   - output_type: image/video/audio/text/array/object/code
 */

const API_URL = 'https://api.eachlabs.ai/v1/models?limit=500';

async function fetchModels() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
}

async function main() {
  const models = await fetchModels();

  // Extract only essential fields for discovery
  const minimal = models.map(({ slug, title, output_type }) => ({
    slug,
    title,
    output_type
  }));

  // Sort by output_type then slug for easier reading
  minimal.sort((a, b) => {
    if (a.output_type !== b.output_type) {
      return a.output_type.localeCompare(b.output_type);
    }
    return a.slug.localeCompare(b.slug);
  });

  console.log(JSON.stringify(minimal, null, 2));
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
