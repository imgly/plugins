import { OpenAPIV3 } from 'openapi-types';

export interface TranslationMap {
  [key: string]: string;
}

/**
 * Extracts translations from an OpenAPI schema document
 * @param modelKey - The model key/provider ID (e.g., 'fal-ai/ideogram/v3')
 * @param schema - The OpenAPI schema document
 * @param inputReference - The reference to the input schema (e.g., '#/components/schemas/IdeogramV3Input')
 * @returns A map of translation keys to their English labels
 */
export function extractTranslationsFromSchema(
  modelKey: string,
  schema: OpenAPIV3.Document,
  inputReference: string
): TranslationMap {
  const translations: TranslationMap = {};

  // Extract the schema name from the reference
  const schemaPath = inputReference.split('/');
  const schemaName = schemaPath[schemaPath.length - 1];

  // Get the input schema
  const inputSchema = schema.components?.schemas?.[
    schemaName
  ] as OpenAPIV3.SchemaObject;
  if (!inputSchema || !inputSchema.properties) {
    return translations;
  }

  // Process each property in the schema
  Object.entries(inputSchema.properties).forEach(
    ([propertyKey, propertyValue]) => {
      const property = propertyValue as OpenAPIV3.SchemaObject;

      // Add translation for the property title
      if (property.title) {
        translations[`${modelKey}.${propertyKey}`] = property.title;
      }

      // Handle enum values
      if (property.enum && Array.isArray(property.enum)) {
        // Check for x-imgly-enum-labels extension
        const enumLabels = (property as any)['x-imgly-enum-labels'] as
          | Record<string, string>
          | undefined;

        property.enum.forEach((enumValue) => {
          const enumKey = String(enumValue);
          if (enumLabels && enumLabels[enumKey]) {
            translations[`${modelKey}.${propertyKey}.${enumKey}`] =
              enumLabels[enumKey];
          } else {
            // Fallback to the enum value itself if no label is provided
            translations[`${modelKey}.${propertyKey}.${enumKey}`] = enumKey;
          }
        });
      }

      // Handle anyOf with enum (like image_size in IdeogramV3)
      if (property.anyOf && Array.isArray(property.anyOf)) {
        property.anyOf.forEach((subSchema) => {
          const anyOfSchema = subSchema as OpenAPIV3.SchemaObject;
          if (anyOfSchema.enum && Array.isArray(anyOfSchema.enum)) {
            // Check for x-imgly-enum-labels at the parent level
            const parentEnumLabels = (property as any)[
              'x-imgly-enum-labels'
            ] as Record<string, string> | undefined;

            anyOfSchema.enum.forEach((enumValue) => {
              const enumKey = String(enumValue);
              if (parentEnumLabels && parentEnumLabels[enumKey]) {
                translations[`${modelKey}.${propertyKey}.${enumKey}`] =
                  parentEnumLabels[enumKey];
              }
            });
          }
        });
      }
    }
  );

  return translations;
}
