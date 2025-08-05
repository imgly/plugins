import { OpenAPIV3 } from 'openapi-types';

export interface TranslationMap {
  [key: string]: string;
}

/**
 * Extracts translations from an OpenAPI schema document
 * @param modelKey - The model key/provider ID
 * @param schema - The OpenAPI schema document
 * @param inputReference - The reference to the input schema
 * @param genericTranslations - Generic property translations that override schema defaults
 * @returns Translation map with provider-specific keys
 */
export function extractTranslationsFromSchema(
  modelKey: string,
  schema: OpenAPIV3.Document,
  inputReference: string,
  genericTranslations: TranslationMap = {}
): TranslationMap {
  const translations: TranslationMap = {};
  const schemaName = inputReference.split('/').pop()!;
  const inputSchema = schema.components?.schemas?.[
    schemaName
  ] as OpenAPIV3.SchemaObject;

  if (!inputSchema?.properties) return translations;

  Object.entries(inputSchema.properties).forEach(
    ([propertyKey, propertyValue]) => {
      const property = propertyValue as OpenAPIV3.SchemaObject;
      const providerKey = `${modelKey}.${propertyKey}`;

      if (property.title) {
        translations[providerKey] = property.title;
      }

      const genericKey = `ai.property.${propertyKey}`;
      if (genericTranslations[genericKey]) {
        translations[providerKey] = genericTranslations[genericKey];
      }

      if (property.enum?.length) {
        const enumLabels = (property as any)['x-imgly-enum-labels'] as
          | Record<string, string>
          | undefined;

        property.enum.forEach((enumValue) => {
          const enumKey = String(enumValue);
          const enumTranslationKey = `${providerKey}.${enumKey}`;
          translations[enumTranslationKey] = enumLabels?.[enumKey] || enumKey;
        });
      }

      if (property.anyOf?.length) {
        const parentEnumLabels = (property as any)['x-imgly-enum-labels'] as
          | Record<string, string>
          | undefined;

        property.anyOf.forEach((subSchema) => {
          const anyOfSchema = subSchema as OpenAPIV3.SchemaObject;
          anyOfSchema.enum?.forEach((enumValue) => {
            const enumKey = String(enumValue);
            if (parentEnumLabels?.[enumKey]) {
              translations[`${providerKey}.${enumKey}`] =
                parentEnumLabels[enumKey];
            }
          });
        });
      }
    }
  );

  return translations;
}
