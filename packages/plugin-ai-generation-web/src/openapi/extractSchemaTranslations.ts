import { Property } from './types';
import Provider, { Output, OutputKind } from '../core/provider';
import { UIOptions } from '../types';
import { defaultTranslations } from './defaultTranslations';

function formatEnumLabel(enumValue: string): string {
  return (
    enumValue
      // Replace underscores with spaces
      .replace(/_/g, ' ')
      // Handle specific cases first
      .replace(/\b3d\b/gi, '3D')
      .replace(/\b2d\b/gi, '2D')
      // Capitalize each word
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

/**
 * Extracts translations from OpenAPI schema properties and sets them via cesdk.i18n
 * This includes:
 * - Schema property titles as `ly.img.ai.defaults.property.${provider.id}.${property.id}`
 * - Enum value labels as `ly.img.ai.defaults.property.${provider.id}.${property.id}.${valueId}`
 * - AnyOf enum value labels with the same pattern
 */
export function extractAndSetSchemaTranslations<
  K extends OutputKind,
  I,
  O extends Output
>(
  properties: Property[],
  provider: Provider<K, I, O>,
  options: UIOptions
): void {
  const translations: Record<string, string> = {};

  properties.forEach((property) => {
    // Add schema title translations
    if (property.schema?.title) {
      translations[
        `ly.img.ai.defaults.property.${provider.id}.${property.id}`
      ] = property.schema.title;
    }

    // Add enum labels translations
    if (property.schema?.enum) {
      const enumLabels: Record<string, string> =
        'x-imgly-enum-labels' in property.schema &&
        typeof property.schema['x-imgly-enum-labels'] === 'object'
          ? (property.schema['x-imgly-enum-labels'] as Record<string, string>)
          : {};

      property.schema.enum.forEach((enumValue) => {
        const valueId = String(enumValue);
        // Set translation either from enumLabels or fallback to formatted valueId
        const labelValue = enumLabels[valueId] || formatEnumLabel(valueId);
        translations[
          `ly.img.ai.defaults.property.${provider.id}.${property.id}.${valueId}`
        ] = labelValue;
      });
    }

    // Add anyOf enum labels translations
    if (property.schema?.anyOf && Array.isArray(property.schema.anyOf)) {
      const enumLabels: Record<string, string> =
        'x-imgly-enum-labels' in property.schema &&
        typeof property.schema['x-imgly-enum-labels'] === 'object'
          ? (property.schema['x-imgly-enum-labels'] as Record<string, string>)
          : {};

      property.schema.anyOf.forEach((anySchema) => {
        const schema = anySchema as any;
        if (schema.enum && Array.isArray(schema.enum)) {
          schema.enum.forEach((enumValue: any) => {
            const valueId = String(enumValue);
            // Set translation either from enumLabels or fallback to formatted valueId
            const labelValue = enumLabels[valueId] || formatEnumLabel(valueId);
            translations[
              `ly.img.ai.schema.${provider.id}.${property.id}.${valueId}`
            ] = labelValue;
          });
        }
      });
    }
  });

  // Merge schema translations with default translations (schema translations take precedence)
  const allTranslations = { ...defaultTranslations, ...translations };

  // Set translations if any were found
  if (Object.keys(allTranslations).length > 0) {
    options.cesdk.i18n.setTranslations({
      en: allTranslations
    });
  }
}
